import { prisma } from '../../../config/database';
import { profileAuditService } from './profile-audit.service';
import { emailVerificationService } from './email-verification.service';
import { passwordService } from './password.service';

export class ProfileService {
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
      roles: usuario.roles.map(ur => ur.rol.nombre),
    };
  }

  async updateContactInfo(userId: string, data: { email?: string; telefono?: string }) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const updates: string[] = [];

    if (data.email && data.email !== usuario.email) {
      const exists = await prisma.usuario.findUnique({ where: { email: data.email } });
      if (exists) {
        throw new Error('El correo ya está registrado');
      }

      await profileAuditService.logChange(userId, 'email', usuario.email, data.email);

      await prisma.usuario.update({
        where: { id: userId },
        data: { email: data.email }
      });

      updates.push('email');
    }

    if (data.telefono !== undefined && data.telefono !== usuario.telefono) {
      await profileAuditService.logChange(userId, 'telefono', usuario.telefono, data.telefono);

      await prisma.usuario.update({
        where: { id: userId },
        data: { telefono: data.telefono }
      });

      updates.push('telefono');
    }

    return { message: 'Perfil actualizado', updates };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const isValid = await passwordService.comparePassword(currentPassword, usuario.passwordHash);

    if (!isValid) {
      throw new Error('La contraseña actual es incorrecta');
    }

    const validation = passwordService.validatePasswordStrength(newPassword);

    if (!validation.valid) {
      throw new Error(`Contraseña débil: ${validation.errors.join(', ')}`);
    }

    const hashedPassword = await passwordService.hashPassword(newPassword);

    await prisma.usuario.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async uploadAvatar(userId: string, imageUrl: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    await profileAuditService.logChange(userId, 'avatar', usuario.avatarUrl, imageUrl);

    await prisma.usuario.update({
      where: { id: userId },
      data: { avatarUrl: imageUrl }
    });

    return { message: 'Avatar actualizado', avatarUrl: imageUrl };
  }

  async requestEmailChange(userId: string, newEmail: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if (newEmail === usuario.email) {
      throw new Error('El nuevo correo es igual al actual');
    }

    const exists = await prisma.usuario.findUnique({ where: { email: newEmail } });
    if (exists) {
      throw new Error('El correo ya está registrado');
    }

    const code = await emailVerificationService.generateCode(userId, newEmail);

    return { message: 'Código de verificación enviado al nuevo correo' };
  }

  async confirmEmailChange(userId: string, code: string) {
    const verification = await emailVerificationService.verifyCode(userId, code);

    if (!verification.valid) {
      throw new Error(verification.message);
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: { email: verification.emailNuevo! }
    });

    return { message: 'Correo actualizado exitosamente' };
  }
}

export const profileService = new ProfileService();
