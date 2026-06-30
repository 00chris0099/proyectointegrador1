import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../config/database';
import { redisClient } from '../../../config/redis';

const TOKEN_EXPIRATION_MINUTES = 30;
const REDIS_PREFIX = 'recovery_token:';

export class RecoveryTokenService {
  async generateToken(usuarioId: string): Promise<string> {
    await this.invalidateUserTokens(usuarioId);

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRATION_MINUTES);

    await prisma.tokenRecuperacion.create({
      data: {
        usuarioId,
        token,
        expiresAt,
      },
    });

    await redisClient.set(
      `${REDIS_PREFIX}${token}`,
      usuarioId,
      'EX',
      TOKEN_EXPIRATION_MINUTES * 60
    );

    return token;
  }

  async validateToken(token: string): Promise<{ valid: boolean; usuarioId?: string }> {
    const usuarioIdRedis = await redisClient.get(`${REDIS_PREFIX}${token}`);
    
    if (usuarioIdRedis) {
      return { valid: true, usuarioId: usuarioIdRedis };
    }

    const tokenRecord = await prisma.tokenRecuperacion.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return { valid: false };
    }

    if (tokenRecord.used) {
      return { valid: false };
    }

    if (new Date() > tokenRecord.expiresAt) {
      return { valid: false };
    }

    await redisClient.set(
      `${REDIS_PREFIX}${token}`,
      tokenRecord.usuarioId,
      'EX',
      TOKEN_EXPIRATION_MINUTES * 60
    );

    return { valid: true, usuarioId: tokenRecord.usuarioId };
  }

  async markAsUsed(token: string): Promise<void> {
    await prisma.tokenRecuperacion.update({
      where: { token },
      data: { used: true },
    });

    await redisClient.del(`${REDIS_PREFIX}${token}`);
  }

  async invalidateUserTokens(usuarioId: string): Promise<void> {
    const tokens = await prisma.tokenRecuperacion.findMany({
      where: {
        usuarioId,
        used: false,
      },
    });

    for (const token of tokens) {
      await redisClient.del(`${REDIS_PREFIX}${token.token}`);
    }

    await prisma.tokenRecuperacion.updateMany({
      where: {
        usuarioId,
        used: false,
      },
      data: { used: true },
    });
  }
}

export const recoveryTokenService = new RecoveryTokenService();
