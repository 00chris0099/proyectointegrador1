# 🔐 IMPLEMENTACIÓN HU-01: Inicio de Sesión Basado en Roles

## Mini-ERP I.E.P. La Asunción — Guía de Implementación

---

## 📋 Resumen de Decisiones Técnicas

| Componente | Decisión | Justificación |
|------------|----------|---------------|
| JWT | Simplificado (sin Gateway) | Rapidez de implementación |
| Almacenamiento | httpOnly cookies | Seguridad XSS |
| Refresh Token | Redis | Rotación segura |
| Rate Limiting | Redis (5/min) | Prevenir fuerza bruta |
| Validación | Zod | Type-safe |
| Admin Auth | NextAuth.js | Ecosistema Next.js |
| Flutter Auth | flutter_secure_storage | Seguridad nativa |
| Contraseña | 10+ chars, mayúscula, número, especial | Estándar ERP |
| Login Design | Institucional | Branding colegio |
| Sesiones | Ilimitadas | Flexibilidad |
| Logs | Redis + PostgreSQL | Auditoría completa |

---

## 🗂️ FASE 1: Backend Core

### Paso 1.1: Migraciones de BD
**Estado:** ✅ Completado
**Archivos:** `prisma/schema.prisma`, migrations

**Acciones:**
- [ ] Agregar modelo `LoginLog` a schema.prisma
- [ ] Agregar modelo `RefreshToken` a schema.prisma
- [ ] Ejecutar `npx prisma migrate dev --name add_auth_tables`
- [ ] Verificar que las tablas se crearon correctamente

**Schema a agregar:**
```prisma
model LoginLog {
  id          Int      @id @default(autoincrement())
  usuarioId   String?  @map("usuario_id") @db.Uuid
  email       String   @db.VarChar(255)
  exitoso     Boolean  @default(false)
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  userAgent   String?  @map("user_agent") @db.Text
  razonFallo  String?  @map("razon_fallo") @db.VarChar(100)
  createdAt   DateTime @default(now()) @map("created_at")

  usuario Usuario? @relation(fields: [usuarioId], references: [id])

  @@index([email])
  @@index([createdAt(sort: Desc)])
  @@map("login_logs")
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  usuarioId String   @map("usuario_id") @db.Uuid
  token     String   @unique @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@index([usuarioId])
  @@index([token])
  @@map("refresh_tokens")
}
```

---

### Paso 1.2: Password Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/password.service.ts`

**Acciones:**
- [ ] Crear servicio con funciones hashPassword y comparePassword
- [ ] Configurar Bcrypt con 10 rounds
- [ ] Crear validación de fortaleza de contraseña

**Código:**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 10) errors.push('Mínimo 10 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Al menos 1 mayúscula');
    if (!/[0-9]/.test(password)) errors.push('Al menos 1 número');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Al menos 1 carácter especial (!@#$%^&*)');
    
    return { valid: errors.length === 0, errors };
  }
}

export const passwordService = new PasswordService();
```

---

### Paso 1.3: Token Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/token.service.ts`

**Acciones:**
- [ ] Crear servicio de generación de JWT
- [ ] Implementar generateAccessToken (15 min)
- [ ] Implementar generateRefreshToken (7 días)
- [ ] Implementar verifyToken
- [ ] Implementar decodeToken

**Código:**
```typescript
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config/environment';

interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
}

export class TokenService {
  generateAccessToken(userId: string, email: string, roles: string[]): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      roles,
      type: 'access'
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '15m',
      issuer: 'minierp',
      jwtid: uuidv4()
    });
  }

  generateRefreshToken(userId: string): string {
    const payload = {
      sub: userId,
      type: 'refresh'
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'minierp',
      jwtid: uuidv4()
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'minierp'
    }) as TokenPayload;
  }

  verifyRefreshToken(token: string): { sub: string; jti: string } {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'minierp'
    }) as { sub: string; jti: string };
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  getRefreshTokenExpiration(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  }
}

export const tokenService = new TokenService();
```

---

### Paso 1.4: Auth Validator (Zod)
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/validators/auth.validator.ts`

**Acciones:**
- [ ] Crear esquemas de validación con Zod
- [ ] Validar email, password, etc.

**Código:**
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token requerido')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
```

---

### Paso 1.5: Auth Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/auth.service.ts`

**Acciones:**
- [ ] Implementar lógica de login
- [ ] Implementar lógica de refresh
- [ ] Implementar lógica de logout
- [ ] Integrar con Redis para rate limiting
- [ ] Registrar logs de login

**Código:**
```typescript
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
```

---

### Paso 1.6: Auth Validator (Login Log Service)
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/login-log.service.ts`

**Acciones:**
- [ ] Crear servicio para consultar logs de login
- [ ] Implementar paginación
- [ ] Implementar filtros por fecha

---

### Paso 1.7: Auth Routes
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/routes/auth.routes.ts`

**Acciones:**
- [ ] Crear router con Express
- [ ] Implementar POST /api/auth/login
- [ ] Implementar POST /api/auth/logout
- [ ] Implementar POST /api/auth/refresh
- [ ] Implementar GET /api/auth/me
- [ ] Agregar rate limiting a login

**Código:**
```typescript
import { Router, Request, Response } from 'express';
import { authService } from '../domains/identity/services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rate-limiter';

const router = Router();

// POST /api/auth/login
router.post('/login', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login({ email, password }, ip, userAgent);

    // Setear httpOnly cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutos
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.json({
      success: true,
      data: result.user
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    await authService.logout(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Sesión cerrada'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    const tokens = await authService.refresh(refreshToken);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Tokens renovados'
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const profile = await authService.getProfile(userId);

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
```

---

### Paso 1.8: Auth Middleware
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/middleware/auth.middleware.ts`

**Acciones:**
- [ ] Extraer token de httpOnly cookie
- [ ] Verificar JWT
- [ ] Adjuntar usuario a request

**Código:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../domains/identity/services/token.service';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extraer token de cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Verificar token
    const decoded = tokenService.verifyAccessToken(token);
    
    // Adjuntar usuario al request
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};
```

---

### Paso 1.9: RBAC Middleware
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/middleware/rbac.middleware.ts`

**Acciones:**
- [ ] Crear middleware de autorización
- [ ] Verificar roles del JWT
- [ ] Retornar 403 si no tiene permiso

**Código:**
```typescript
import { Request, Response, NextFunction } from 'express';

export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user || !user.roles) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const hasRole = user.roles.some((role: string) => allowedRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para esta acción'
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Error de autorización'
      });
    }
  };
};
```

---

### Paso 1.10: Rate Limiter
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/middleware/rate-limiter.ts`

**Acciones:**
- [ ] Implementar rate limiting con Redis
- [ ] Limitar a 5 intentos por IP
- [ ] Bloquear por 15 minutos

**Código:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

const MAX_REQUESTS = 5;
const WINDOW_SECONDS = 60; // 1 minuto
const LOCKOUT_SECONDS = 900; // 15 minutos

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate_limit:${ip}`;

    // Verificar si está bloqueado
    const isLocked = await redisClient.get(`locked:${key}`);
    if (isLocked) {
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.'
      });
    }

    // Obtener contador actual
    const current = await redisClient.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= MAX_REQUESTS) {
      // Bloquear IP
      await redisClient.set(`locked:${key}`, '1', 'EX', LOCKOUT_SECONDS);
      await redisClient.del(key);

      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.'
      });
    }

    // Incrementar contador
    await redisClient.multi()
      .incr(key)
      .expire(key, WINDOW_SECONDS)
      .exec();

    next();
  } catch (error) {
    // Si Redis falla, permitir request
    next();
  }
};
```

---

### Paso 1.11: Error Handler
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/middleware/error-handler.ts`

**Acciones:**
- [ ] Crear middleware global de errores
- [ ] Formatear respuestas de error
- [ ] Manejar errores conocidos

---

## 🗂️ FASE 2: Frontend Admin (Next.js)

### Paso 2.1: Instalar Dependencias
**Estado:** ✅ Completado

**Acciones:**
- [ ] `npm install next-auth`
- [ ] `npm install zod @hookform/resolvers react-hook-form`

---

### Paso 2.2: NextAuth Configuration
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/api/auth/[...nextauth]/route.ts`

**Acciones:**
- [ ] Configurar NextAuth
- [ ] Configurar CredentialsProvider
- [ ] Configurar callbacks jwt y session
- [ ] Configurar pages personalizadas

**Código:**
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password
          }),
          credentials: 'include'
        });

        const data = await res.json();

        if (data.success) {
          return {
            id: data.data.id,
            email: data.data.email,
            name: `${data.data.nombres} ${data.data.apellidos}`,
            roles: data.data.roles
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as any).roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).roles = token.roles;
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60 // 12 horas
  }
});

export { handler as GET, handler as POST };
```

---

### Paso 2.3: Auth Provider
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/components/providers/auth-provider.tsx`

---

### Paso 2.4: Login Page
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/(auth)/login/page.tsx`

**Acciones:**
- [ ] Crear formulario con React Hook Form + Zod
- [ ] Diseño institucional
- [ ] Manejar loading states
- [ ] Manejar errores
- [ ] Redirigir a dashboard tras login exitoso

---

### Paso 2.5: Auth Layout
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/(auth)/layout.tsx`

---

### Paso 2.6: Next.js Middleware
**Estado:** ✅ Completado
**Archivo:** `apps/admin/middleware.ts`

**Acciones:**
- [ ] Proteger rutas /dashboard/*
- [ ] Redirigir a /login si no autenticado
- [ ] Mantener URL de retorno

---

## 🗂️ FASE 3: Frontend Móvil (Flutter)

### Paso 3.1: Dependencias
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/pubspec.yaml`

**Acciones:**
- [ ] Agregar `flutter_secure_storage`
- [ ] Agregar `provider`
- [ ] Agregar `http`

---

### Paso 3.2: Auth Service
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/core/services/auth_service.dart`

---

### Paso 3.3: API Client
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/core/services/api_client.dart`

---

### Paso 3.4: Auth Provider
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/core/providers/auth_provider.dart`

---

### Paso 3.5: Login Screen
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/auth/screens/login_screen.dart`

---

### Paso 3.6: Home Screen
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/home/screens/home_screen.dart`

---

## 🗂️ FASE 4: Documentación

### Paso 4.1: Guía Zod
**Estado:** ✅ Completado
**Archivo:** `docs/GUIA_ZOD.md`

### Paso 4.2: Documentación Auth
**Estado:** ✅ Completado
**Archivo:** `docs/AUTH.md`

---

## ✅ Checklist de Verificación

### Backend
- [ ] Endpoints funcionando: login, logout, refresh, me
- [ ] Rate limiting activo
- [ ] Logs de login guardados
- [ ] JWT con expiración correcta
- [ ] Refresh token rotativo

### Frontend Admin
- [ ] Login page funcional
- [ ] Sesión persistente
- [ ] Protected routes
- [ ] Dashboard layout

### Frontend Móvil
- [ ] Login screen funcional
- [ ] Tokens almacenados seguro
- [ ] Navegación según auth

### Seguridad
- [ ] httpOnly cookies
- [ ] Rate limiting (5/min)
- [ ] Bcrypt (10 rounds)
- [ ] Mensajes genéricos de error
- [ ] Validación de entrada Zod

---

## 🚀 Comandos Útiles

```bash
# Backend
cd apps/backend
npm run dev                    # Iniciar backend
npx prisma migrate dev         # Ejecutar migraciones
npx prisma db seed             # Poblar BD

# Frontend Admin
cd apps/admin
npm run dev                    # Iniciar admin en puerto 3002

# Frontend Móvil
cd apps/mobile
flutter run -d chrome          # Ejecutar en navegador
flutter run                    # Ejecutar en dispositivo
```
