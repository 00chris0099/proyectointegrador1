import { prisma } from '../../../config/database';
import { redisClient } from '../../../config/redis';
import { passwordService } from './password.service';
import { tokenService } from './token.service';
import { loginSchema, type LoginInput } from '../validators/auth.validator';

export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 900; // 15 minutos en segundos

  async login(data: LoginInput, ip?: string, userAgent?: string) {
    // Validar entrada
    const validated = loginSchema.parse(data);

    // Verificar rate limiting
    const attemptsKey = `login_attempts:${validated.email}`;
    const attempts = await redisClient.get(attemptsKey);
    
    if (attempts && parseInt(attempts) >= this.MAX_LOGIN_ATTEMPTS) {
      await this.logLogin(null, validated.email, false, ip, userAgent, 'Cuenta bloqueada temporalmente');
      throw new Error('Cuenta bloqueada. Intenta de nuevo en 15 minutos.');
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: validated.email },
      include: {
        roles: {
          include: { rol: true }
        }
      }
    });

    if (!usuario) {
      await this.incrementAttempts(attemptsKey);
      await this.logLogin(null, validated.email, false, ip, userAgent, 'Usuario no encontrado');
      // Mensaje genérico para prevenir enumeración
      throw new Error('Credenciales inválidas');
    }

    if (!usuario.estado) {
      await this.logLogin(usuario.id, validated.email, false, ip, userAgent, 'Cuenta desactivada');
      throw new Error('Cuenta desactivada. Contacta al administrador.');
    }

    // Verificar contraseña
    const passwordValid = await passwordService.comparePassword(validated.password, usuario.passwordHash);
    
    if (!passwordValid) {
      await this.incrementAttempts(attemptsKey);
      await this.logLogin(usuario.id, validated.email, false, ip, userAgent, 'Contraseña incorrecta');
      throw new Error('Credenciales inválidas');
    }

    // Login exitoso - limpiar intentos
    await redisClient.del(attemptsKey);

    // Extraer roles
    const roles = usuario.roles.map(ur => ur.rol.nombre);

    // Generar tokens
    const accessToken = tokenService.generateAccessToken(usuario.id, usuario.email, roles);
    const refreshToken = tokenService.generateRefreshToken(usuario.id);

    // Guardar refresh token en Redis
    await redisClient.set(
      `refresh_token:${usuario.id}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60 // 7 días
    );

    // Registrar login exitoso
    await this.logLogin(usuario.id, validated.email, true, ip, userAgent);

    return {
      user: {
        id: usuario.id,
        email: usuario.email,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        roles
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken: string) {
    try {
      // Verificar refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      
      // Verificar en Redis
      const storedToken = await redisClient.get(`refresh_token:${decoded.sub}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Refresh token inválido');
      }

      // Buscar usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.sub },
        include: {
          roles: {
            include: { rol: true }
          }
        }
      });

      if (!usuario || !usuario.estado) {
        throw new Error('Usuario no válido');
      }

      const roles = usuario.roles.map(ur => ur.rol.nombre);

      // Generar nuevos tokens (rotación)
      const newAccessToken = tokenService.generateAccessToken(usuario.id, usuario.email, roles);
      const newRefreshToken = tokenService.generateRefreshToken(usuario.id);

      // Actualizar refresh token en Redis
      await redisClient.set(
        `refresh_token:${usuario.id}`,
        newRefreshToken,
        'EX',
        7 * 24 * 60 * 60
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }

  async logout(userId: string) {
    // Eliminar refresh token de Redis
    await redisClient.del(`refresh_token:${userId}`);
  }

  async getProfile(userId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { rol: true }
        }
      }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      dni: usuario.dni,
      telefono: usuario.telefono,
      avatarUrl: usuario.avatarUrl,
      roles: usuario.roles.map(ur => ur.rol.nombre)
    };
  }

  private async incrementAttempts(key: string) {
    const attempts = await redisClient.incr(key);
    if (attempts === 1) {
      await redisClient.expire(key, this.LOCKOUT_DURATION);
    }
  }

  private async logLogin(
    userId: string | null,
    email: string,
    exitoso: boolean,
    ip?: string,
    userAgent?: string,
    razonFallo?: string
  ) {
    await prisma.loginLog.create({
      data: {
        usuarioId: userId,
        email,
        exitoso,
        ipAddress: ip,
        userAgent,
        razonFallo
      }
    });
  }
}

export const authService = new AuthService();
