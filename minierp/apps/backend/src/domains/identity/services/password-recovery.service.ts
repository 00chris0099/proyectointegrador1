import { prisma } from '../../../config/database';
import { emailService } from './email.service';
import { recoveryTokenService } from './recovery-token.service';
import { passwordService } from './password.service';

export class PasswordRecoveryService {
  async requestRecovery(email: string): Promise<{ success: boolean; message: string }> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    const genericResponse = {
      success: true,
      message: 'Si el correo existe, recibirás un enlace de recuperación.',
    };

    if (!usuario) {
      return genericResponse;
    }

    if (!usuario.estado) {
      return genericResponse;
    }

    const token = await recoveryTokenService.generateToken(usuario.id);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password?token=${token}`;

    emailService.sendPasswordResetEmail(email, resetUrl).catch((err) => {
      console.error('Error enviando email de recuperación:', err);
    });

    return genericResponse;
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const tokenValidation = await recoveryTokenService.validateToken(token);

    if (!tokenValidation.valid || !tokenValidation.usuarioId) {
      return {
        success: false,
        message: 'Token inválido o expirado. Solicita uno nuevo.',
      };
    }

    const hashedPassword = await passwordService.hashPassword(newPassword);

    await prisma.usuario.update({
      where: { id: tokenValidation.usuarioId },
      data: { passwordHash: hashedPassword },
    });

    await recoveryTokenService.markAsUsed(token);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente.',
    };
  }

  async validateToken(token: string): Promise<{ valid: boolean }> {
    const result = await recoveryTokenService.validateToken(token);
    return { valid: result.valid };
  }
}

export const passwordRecoveryService = new PasswordRecoveryService();
