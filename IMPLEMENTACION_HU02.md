# 🔑 IMPLEMENTACIÓN HU-02: Recuperación de Contraseña

## Mini-ERP I.E.P. La Asunción — Guía de Implementación

---

## 📋 Resumen de Decisiones Técnicas

| Componente | Decisión | Justificación |
|------------|----------|---------------|
| Email | Nodemailer + Gmail SMTP | Gratis, fácil configuración |
| Almacenamiento | PostgreSQL + Redis | Persistencia + caché rápida |
| Formulario | apps/admin/route | Mismo dominio, SPA |
| Token | UUID v4 aleatorio | Simple, seguro, 36 caracteres |
| Expiración | 30 minutos | Estándar de seguridad |
| Modelo DB | TokenRecuperacion (ya existe) | No requiere migración |
| Validación | Zod | Type-safe, consistente con HU-01 |

---

## 🗂️ FASE 1: Backend Core

### Paso 1.1: Variables de Entorno
**Estado:** ✅ Completado
**Archivo:** `apps/backend/.env`

**Acciones:**
- [ ] Agregar configuración de email
- [ ] Agregar URL del frontend

**Variables a agregar:**
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
EMAIL_FROM="Mini-ERP La Asunción <noreply@laasuncion.edu.pe>"

# Frontend URL
FRONTEND_URL=http://localhost:3002
```

> **Nota:** Para Gmail, usa una "App Password" no tu contraseña normal.
> Genera en: https://myaccount.google.com/apppasswords

---

### Paso 1.2: Email Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/email.service.ts`

**Acciones:**
- [ ] Instalar nodemailer: `npm install nodemailer @types/nodemailer`
- [ ] Configurar transporter con Gmail SMTP
- [ ] Implementar sendPasswordResetEmail
- [ ] Crear template HTML profesional

**Código:**
```typescript
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
      secure: false, // true para 465, false para otros puertos
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
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">I.E.P. La Asunción</h1>
                    <p style="color: #bfdbfe; margin: 5px 0 0 0; font-size: 14px;">Panel Administrativo</p>
                  </td>
                </tr>
                
                <!-- Content -->
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
                
                <!-- Footer -->
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
```

---

### Paso 1.3: Recovery Token Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/recovery-token.service.ts`

**Acciones:**
- [ ] Crear servicio de generación de tokens
- [ ] Implementar guardado en PostgreSQL + Redis
- [ ] Implementar verificación de validez
- [ ] Implementar invalidación de tokens anteriores

**Código:**
```typescript
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../config/database';
import { redisClient } from '../../../config/redis';

const TOKEN_EXPIRATION_MINUTES = 30;
const REDIS_PREFIX = 'recovery_token:';

export class RecoveryTokenService {
  async generateToken(usuarioId: string): Promise<string> {
    // Invalidar tokens anteriores del usuario
    await this.invalidateUserTokens(usuarioId);

    // Generar nuevo token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRATION_MINUTES);

    // Guardar en PostgreSQL
    await prisma.tokenRecuperacion.create({
      data: {
        usuarioId,
        token,
        expiresAt,
      },
    });

    // Guardar en Redis para caché rápida (con TTL)
    await redisClient.set(
      `${REDIS_PREFIX}${token}`,
      usuarioId,
      'EX',
      TOKEN_EXPIRATION_MINUTES * 60
    );

    return token;
  }

  async validateToken(token: string): Promise<{ valid: boolean; usuarioId?: string }> {
    // Verificar en Redis primero (más rápido)
    const usuarioIdRedis = await redisClient.get(`${REDIS_PREFIX}${token}`);
    
    if (usuarioIdRedis) {
      return { valid: true, usuarioId: usuarioIdRedis };
    }

    // Verificar en PostgreSQL
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

    // Guardar en Redis para próximas verificaciones
    await redisClient.set(
      `${REDIS_PREFIX}${token}`,
      tokenRecord.usuarioId,
      'EX',
      TOKEN_EXPIRATION_MINUTES * 60
    );

    return { valid: true, usuarioId: tokenRecord.usuarioId };
  }

  async markAsUsed(token: string): Promise<void> {
    // Marcar en PostgreSQL
    await prisma.tokenRecuperacion.update({
      where: { token },
      data: { used: true },
    });

    // Eliminar de Redis
    await redisClient.del(`${REDIS_PREFIX}${token}`);
  }

  async invalidateUserTokens(usuarioId: string): Promise<void> {
    // Obtener tokens activos del usuario
    const tokens = await prisma.tokenRecuperacion.findMany({
      where: {
        usuarioId,
        used: false,
      },
    });

    // Invalidar cada token en Redis
    for (const token of tokens) {
      await redisClient.del(`${REDIS_PREFIX}${token.token}`);
    }

    // Marcar como usados en PostgreSQL
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
```

---

### Paso 1.4: Password Recovery Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/password-recovery.service.ts`

**Acciones:**
- [ ] Implementar requestRecovery
- [ ] Implementar resetPassword
- [ ] Integrar con email y token services

**Código:**
```typescript
import { prisma } from '../../../config/database';
import { emailService } from './email.service';
import { recoveryTokenService } from './recovery-token.service';
import { passwordService } from './password.service';

export class PasswordRecoveryService {
  async requestRecovery(email: string): Promise<{ success: boolean; message: string }> {
    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    // Respuesta genérica para prevenir enumeración
    const genericResponse = {
      success: true,
      message: 'Si el correo existe, recibirás un enlace de recuperación.',
    };

    if (!usuario) {
      // Retornar respuesta genérica (no revelar si el usuario existe)
      return genericResponse;
    }

    if (!usuario.estado) {
      // Cuenta desactivada, pero no revelar
      return genericResponse;
    }

    // Generar token
    const token = await recoveryTokenService.generateToken(usuario.id);

    // Construir URL de restablecimiento
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Enviar email (no await, enviar asíncronamente)
    emailService.sendPasswordResetEmail(email, resetUrl).catch((err) => {
      console.error('Error enviando email de recuperación:', err);
    });

    return genericResponse;
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    // Validar token
    const tokenValidation = await recoveryTokenService.validateToken(token);

    if (!tokenValidation.valid || !tokenValidation.usuarioId) {
      return {
        success: false,
        message: 'Token inválido o expirado. Solicita uno nuevo.',
      };
    }

    // Hashear nueva contraseña
    const hashedPassword = await passwordService.hashPassword(newPassword);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: tokenValidation.usuarioId },
      data: { passwordHash: hashedPassword },
    });

    // Marcar token como usado
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
```

---

### Paso 1.5: Recovery Validator (Zod)
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/validators/recovery.validator.ts`

**Acciones:**
- [ ] Crear esquema de validación para requestRecovery
- [ ] Crear esquema de validación para resetPassword
- [ ] Validar fortaleza de contraseña

**Código:**
```typescript
import { z } from 'zod';

export const requestRecoverySchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .uuid('Token inválido'),
    password: z
      .string()
      .min(10, 'Mínimo 10 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos 1 mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos 1 número')
      .regex(/[!@#$%^&*]/, 'Debe contener al menos 1 carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const validateTokenSchema = z.object({
  token: z
    .string()
    .uuid('Token inválido'),
});

export type RequestRecoveryInput = z.infer<typeof requestRecoverySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ValidateTokenInput = z.infer<typeof validateTokenSchema>;
```

---

### Paso 1.6: Recovery Routes
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/routes/recovery.routes.ts`

**Acciones:**
- [ ] Crear router con Express
- [ ] Implementar POST /api/auth/recover
- [ ] Implementar POST /api/auth/validate-token
- [ ] Implementar POST /api/auth/reset-password
- [ ] Agregar rate limiting a recover

**Código:**
```typescript
import { Router, Request, Response } from 'express';
import { passwordRecoveryService } from '../domains/identity/services/password-recovery.service';
import {
  requestRecoverySchema,
  resetPasswordSchema,
  validateTokenSchema,
} from '../domains/identity/validators/recovery.validator';
import { rateLimiter } from '../middleware/rate-limiter';

const router = Router();

// POST /api/auth/recover
router.post('/recover', rateLimiter, async (req: Request, res: Response) => {
  try {
    const validated = requestRecoverySchema.parse(req.body);
    
    const result = await passwordRecoveryService.requestRecovery(validated.email);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error procesando la solicitud',
    });
  }
});

// POST /api/auth/validate-token
router.post('/validate-token', async (req: Request, res: Response) => {
  try {
    const validated = validateTokenSchema.parse(req.body);
    
    const result = await passwordRecoveryService.validateToken(validated.token);

    res.json({
      success: true,
      data: { valid: result.valid },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error validando token',
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    
    const result = await passwordRecoveryService.resetPassword(
      validated.token,
      validated.password
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error restableciendo contraseña',
    });
  }
});

export default router;
```

---

### Paso 1.7: Actualizar Server.ts
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/server.ts`

**Acciones:**
- [ ] Importar recovery routes
- [ ] Agregar rutas al servidor

**Cambios:**
```typescript
// Agregar import
import recoveryRoutes from './routes/recovery.routes';

// Agregar antes de app.listen
app.use('/api/auth', recoveryRoutes);
```

---

### Paso 1.8: Actualizar Environment
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/config/environment.ts`

**Acciones:**
- [ ] Agregar variables de email al config

**Cambios:**
```typescript
export const config = {
  // ... existente
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASS: process.env.EMAIL_PASS!,
  EMAIL_FROM: process.env.EMAIL_FROM || 'Mini-ERP <noreply@laasuncion.edu.pe>',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3002',
};
```

---

## 🗂️ FASE 2: Frontend Admin (Next.js)

### Paso 2.1: Página Olvidé mi Contraseña
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/(auth)/forgot-password/page.tsx`

**Acciones:**
- [ ] Crear formulario con React Hook Form + Zod
- [ ] Diseño institucional (mismo estilo login)
- [ ] Manejar estado de carga
- [ ] Mostrar mensaje de confirmación
- [ ] Link "Volver al login"

**Código:**
```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, CheckCircle, ArrowLeft, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/recover`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.message || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        <div className="w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Correo enviado
            </h1>
            <p className="text-gray-600 mb-6">
              Si el correo existe en nuestro sistema, recibirás un enlace para
              restablecer tu contraseña.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Revisa tu bandeja de entrada y carpeta de spam.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft size={18} />
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-gray-500 mt-2">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correo electrónico
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              <ArrowLeft size={16} />
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Paso 2.2: Página Restablecer Contraseña
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/(auth)/reset-password/page.tsx`

**Acciones:**
- [ ] Crear formulario con React Hook Form + Zod
- [ ] Validar token al cargar la página
- [ ] Mostrar indicador de fortaleza de contraseña
- [ ] Manejar errores de token expirado/inválido
- [ ] Redirigir a login tras exitoso

**Código:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'Mínimo 10 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos 1 mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos 1 número')
      .regex(/[!@#$%^&*]/, 'Debe contener al menos 1 carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password', '');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate-token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          }
        );

        const result = await response.json();
        setIsTokenValid(result.data?.valid ?? false);
      } catch (err) {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: data.password }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.message || 'Error al restablecer contraseña');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Débil', 'Regular', 'Buena', 'Fuerte'];

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-white mx-auto" />
          <p className="text-white mt-4">Validando enlace...</p>
        </div>
      </div>
    );
  }

  if (!token || !isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        <div className="w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Enlace inválido
            </h1>
            <p className="text-gray-600 mb-6">
              El enlace de recuperación es inválido o ha expirado.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        <div className="w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Contraseña actualizada
            </h1>
            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido restablecida exitosamente.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Nueva contraseña
            </h1>
            <p className="text-gray-500 mt-2">
              Ingresa tu nueva contraseña a continuación.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}

              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < strength ? strengthColors[strength - 1] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Fortaleza: {strength > 0 ? strengthLabels[strength - 1] : 'Muy débil'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Restablecer contraseña'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              <ArrowLeft size={16} />
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Paso 2.3: Actualizar Login Page
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/(auth)/login/page.tsx`

**Acciones:**
- [ ] Agregar link "¿Olvidaste tu contraseña?"

**Agregar antes del botón de submit:**
```tsx
<div className="text-right">
  <Link
    href="/forgot-password"
    className="text-sm text-blue-600 hover:text-blue-700"
  >
    ¿Olvidaste tu contraseña?
  </Link>
</div>
```

---

## 🗂️ FASE 3: Frontend Móvil (Flutter)

### Paso 3.1: Olvidé mi Contraseña
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/auth/screens/forgot_password_screen.dart`

**Acciones:**
- [ ] Crear formulario con TextFormField
- [ ] Llamada a POST /api/auth/recover
- [ ] Mostrar mensaje de confirmación
- [ ] Botón "Volver al login"

**Código:**
```dart
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/config/api_config.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _isSuccess = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/recover'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': _emailController.text.trim()}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        setState(() => _isSuccess = true);
      }
    } catch (e) {
      // Mostrar error
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
            ),
          ),
          child: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.check_circle_outline,
                            size: 64, color: Colors.green),
                        const SizedBox(height: 16),
                        const Text('Correo enviado',
                            style: TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        const Text(
                          'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Volver al login'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recuperar contraseña'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.mail_outline,
                            size: 64, color: Color(0xFF2563EB)),
                        const SizedBox(height: 16),
                        const Text('¿Olvidaste tu contraseña?',
                            style: TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        const Text(
                          'Ingresa tu correo y te enviaremos un enlace para restablecerla.',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            labelText: 'Correo electrónico',
                            prefixIcon: const Icon(Icons.email_outlined),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Ingresa tu correo';
                            }
                            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                                .hasMatch(value)) {
                              return 'Correo inválido';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleSubmit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: _isLoading
                                ? const CircularProgressIndicator(
                                    color: Colors.white)
                                : const Text('Enviar enlace'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

---

### Paso 3.2: Restablecer Contraseña
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/auth/screens/reset_password_screen.dart`

**Acciones:**
- [ ] Recibir token como parámetro
- [ ] Validar token al cargar
- [ ] Formulario nueva contraseña
- [ ] Indicador de fortaleza
- [ ] Navegar a login tras exitoso

---

## 🗂️ FASE 4: Documentación

### Paso 4.1: Documentación AUTH.md
**Estado:** ✅ Completado
**Archivo:** `docs/AUTH.md`

**Acciones:**
- [ ] Agregar sección de Recuperación de Contraseña
- [ ] Documentar endpoints
- [ ] Documentar flujo completo

---

## ✅ Checklist de Verificación

### Backend
- [ ] Endpoint POST /api/auth/recover funcionando
- [ ] Endpoint POST /api/auth/validate-token funcionando
- [ ] Endpoint POST /api/auth/reset-password funcionando
- [ ] Rate limiting activo en /recover
- [ ] Tokens expiran en 30 minutos
- [ ] Tokens se invalidan después de usar
- [ ] Emails se envían correctamente

### Frontend Admin
- [ ] Página /forgot-password funcional
- [ ] Página /reset-password funcional
- [ ] Link en login page
- [ ] Validación de contraseña en tiempo real
- [ ] Redirección tras exitoso

### Frontend Móvil
- [ ] Forgot password screen funcional
- [ ] Reset password screen funcional
- [ ] Navegación correcta

### Seguridad
- [ ] Respuesta genérica en /recover
- [ ] Tokens UUID v4 aleatorios
- [ ] Expiración de 30 minutos
- [ ] Invalidación de tokens anteriores
- [ ] Rate limiting

---

## 🚀 Comandos Útiles

```bash
# Backend
cd apps/backend
npm install nodemailer @types/nodemailer
npm run dev

# Frontend Admin
cd apps/admin
npm run dev

# Frontend Móvil
cd apps/mobile
flutter run
```

---

**Última actualización:** 2024
