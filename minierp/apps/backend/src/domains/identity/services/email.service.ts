import nodemailer from 'nodemailer';
import { config } from '../../../config/environment';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: false,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: config.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    const subject = 'Restablece tu contraseña - Mini-ERP La Asunción';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">I.E.P. La Asunción</h1>
                    <p style="color: #bfdbfe; margin: 5px 0 0 0; font-size: 14px;">Panel Administrativo</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Restablece tu contraseña</h2>
                    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">
                      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
                    </p>
                    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
                      Haz clic en el botón de abajo para crear una nueva contraseña:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
                      <strong>Este enlace expira en 30 minutos.</strong>
                    </p>
                    <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px; line-height: 1.6;">
                      Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px; text-align: center;">
                      © 2024 Mini-ERP I.E.P. La Asunción. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }
}

export const emailService = new EmailService();
