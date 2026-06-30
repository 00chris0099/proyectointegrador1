import { prisma } from '../../../config/database';
import { emailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

const CODE_EXPIRATION_MINUTES = 15;
const CODE_LENGTH = 6;

export class EmailVerificationService {
  async generateCode(usuarioId: string, emailNuevo: string): Promise<string> {
    await this.invalidateUserCodes(usuarioId);

    const codigo = this.generateRandomCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRATION_MINUTES);

    await prisma.emailVerification.create({
      data: {
        usuarioId,
        codigo,
        emailNuevo,
        expiresAt,
      },
    });

    await this.sendCodeEmail(emailNuevo, codigo);

    return codigo;
  }

  async verifyCode(
    usuarioId: string,
    code: string
  ): Promise<{ valid: boolean; message: string; emailNuevo?: string }> {
    const record = await prisma.emailVerification.findFirst({
      where: {
        usuarioId,
        codigo: code,
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { valid: false, message: 'Código inválido' };
    }

    if (new Date() > record.expiresAt) {
      return { valid: false, message: 'Código expirado. Solicita uno nuevo.' };
    }

    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    return { valid: true, message: 'Código verificado', emailNuevo: record.emailNuevo };
  }

  async invalidateUserCodes(usuarioId: string): Promise<void> {
    await prisma.emailVerification.updateMany({
      where: {
        usuarioId,
        used: false,
      },
      data: { used: true },
    });
  }

  private generateRandomCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  private async sendCodeEmail(email: string, code: string): Promise<void> {
    const subject = 'Código de verificación - Mini-ERP La Asunción';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
              <tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;">I.E.P. La Asunción</h1>
                <p style="color:#bfdbfe;margin:5px 0 0 0;font-size:14px;">Panel Administrativo</p>
              </td></tr>
              <tr><td style="padding:40px 30px;text-align:center;">
                <h2 style="color:#1f2937;margin:0 0 20px 0;">Código de Verificación</h2>
                <p style="color:#4b5563;margin:0 0 30px 0;line-height:1.6;">Usa el siguiente código para confirmar tu nuevo correo:</p>
                <div style="background-color:#f9fafb;border:2px dashed #d1d5db;border-radius:12px;padding:20px;margin:20px 0;">
                  <span style="font-size:32px;font-weight:bold;color:#2563eb;letter-spacing:8px;">${code}</span>
                </div>
                <p style="color:#6b7280;margin:20px 0 0 0;font-size:14px;"><strong>Este código expira en 15 minutos.</strong></p>
                <p style="color:#6b7280;margin:10px 0 0 0;font-size:14px;">Si no solicitaste este cambio, ignora este mensaje.</p>
              </td></tr>
              <tr><td style="background-color:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb;">
                <p style="color:#9ca3af;margin:0;font-size:12px;text-align:center;">© 2024 Mini-ERP I.E.P. La Asunción.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    await emailService.sendEmail({ to: email, subject, html });
  }
}

export const emailVerificationService = new EmailVerificationService();
