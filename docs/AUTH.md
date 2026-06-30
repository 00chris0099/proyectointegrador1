# 🔐 Documentación de Autenticación — Mini-ERP

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura](#2-arquitectura)
3. [Flujo de Login](#3-flujo-de-login)
4. [JWT y Refresh Tokens](#4-jwt-y-refresh-tokens)
5. [Rate Limiting](#5-rate-limiting)
6. [RBAC (Control de Acceso)](#6-rbac-control-de-acceso)
7. [Endpoints API](#7-endpoints-api)
8. [Integración Frontend](#8-integración-frontend)
9. [Seguridad](#9-seguridad)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Descripción General

El sistema de autenticación del Mini-ERP utiliza:

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Backend | Express + JWT | API de autenticación |
| Almacenamiento | httpOnly cookies | Tokens seguros |
| Refresh Token | Redis | Rotación segura de tokens |
| Rate Limiting | Redis | Prevención de fuerza bruta |
| Validación | Zod | Type-safe validation |
| Admin Auth | NextAuth.js | Autenticación en Next.js |
| Mobile Auth | flutter_secure_storage | Tokens seguros en móvil |

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTES                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Admin (Next)  │  Mobile (Flutter)│     API REST            │
└────────┬────────┴────────┬────────┴────────────┬────────────┘
         │                 │                     │
         └─────────────────┼─────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Express   │
                    │   Backend   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │ PostgreSQL│ │ Redis │ │  imgBB    │
        │    BD     │ │ Cache │ │ Storage   │
        └───────────┘ └───────┘ └───────────┘
```

---

## 3. Flujo de Login

### 3.1 Diagrama de Secuencia

```
┌──────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│Client│      │  Auth   │      │  Redis  │      │   DB    │
└──┬───┘      └────┬────┘      └────┬────┘      └────┬────┘
   │  POST /login  │                │                 │
   │──────────────>│                │                 │
   │               │  GET attempts  │                 │
   │               │───────────────>│                 │
   │               │<───────────────│                 │
   │               │                │                 │
   │               │  GET user      │                 │
   │               │────────────────────────────────>│
   │               │<────────────────────────────────│
   │               │                │                 │
   │               │  COMPARE pwd   │                 │
   │               │───────────────>│                 │
   │               │<───────────────│                 │
   │               │                │                 │
   │               │  SET refresh   │                 │
   │               │───────────────>│                 │
   │               │                │                 │
   │               │  CREATE log    │                 │
   │               │────────────────────────────────>│
   │               │                │                 │
   │  Set-Cookie   │                │                 │
   │<──────────────│                │                 │
   │               │                │                 │
```

### 3.2 Flujo Detallado

1. **Cliente envía credenciales**
   ```http
   POST /api/auth/login
   Content-Type: application/json
   
   {
     "email": "usuario@ejemplo.com",
     "password": "MiContraseña123!"
   }
   ```

2. **Backend verifica rate limiting**
   - Verifica intentos en Redis: `login_attempts:{email}`
   - Si >= 5 intentos, bloquea por 15 minutos

3. **Backend busca usuario en BD**
   - Si no existe: incrementa intentos, retorna error genérico
   - Si existe pero inactivo: retorna "Cuenta desactivada"

4. **Backend verifica contraseña**
   - Usa bcrypt.compare con 10 rounds
   - Si es incorrecta: incrementa intentos, retorna error genérico

5. **Login exitoso**
   - Limpia intentos en Redis
   - Genera accessToken (15 min) y refreshToken (7 días)
   - Guarda refreshToken en Redis
   - Registra log exitoso en BD
   - Setea cookies httpOnly

6. **Respuesta exitosa**
   ```json
   {
     "success": true,
     "data": {
       "id": "uuid",
       "email": "usuario@ejemplo.com",
       "nombres": "Juan",
       "apellidos": "Pérez",
       "roles": ["APODERADO"]
     }
   }
   ```

---

## 4. JWT y Refresh Tokens

### 4.1 Estructura del Access Token

```typescript
{
  sub: "uuid-usuario",      // ID del usuario
  email: "user@email.com",  // Email
  roles: ["ADMIN"],         // Roles asignados
  type: "access",           // Tipo de token
  iat: 1234567890,          // Emitido en
  exp: 1234568790,          // Expira en (15 min)
  iss: "minierp",           // Emisor
  jti: "unique-id"          // ID único del token
}
```

### 4.2 Estructura del Refresh Token

```typescript
{
  sub: "uuid-usuario",
  type: "refresh",
  iat: 1234567890,
  exp: 1234654290,          // Expira en (7 días)
  iss: "minierp",
  jti: "unique-id"
}
```

### 4.3 Almacenamiento

| Token | Ubicación | Duración | Seguridad |
|-------|-----------|----------|-----------|
| Access Token | httpOnly cookie | 15 minutos | No accesible via JS |
| Refresh Token | httpOnly cookie + Redis | 7 días | Rotación en cada uso |

### 4.4 Flujo de Refresh

```
1. Cliente detecta token expirado (401)
2. Cliente envía POST /api/auth/refresh con refreshToken
3. Backend verifica refreshToken en Redis
4. Si es válido: genera nuevos tokens, actualiza Redis
5. Si es inválido: retorna 401, cliente debe re-login
```

---

## 5. Rate Limiting

### 5.1 Configuración

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| MAX_REQUESTS | 5 | Intentos máximos por ventana |
| WINDOW_SECONDS | 60 | Ventana de tiempo (1 min) |
| LOCKOUT_SECONDS | 900 | Bloqueo tras exceder (15 min) |

### 5.2 Flujo

```
Request → IP Check → Redis Check
                         │
              ┌──────────┴──────────┐
              │                     │
         (bloqueado)          (no bloqueado)
              │                     │
         429 Error            Incrementar
              │               contador
              │                     │
              │              ┌──────┴──────┐
              │              │             │
              │          (< 5)        (>= 5)
              │              │             │
              │           200 OK     Bloquear IP
              │                      + 429 Error
```

### 5.3 Keys en Redis

```
rate_limit:{ip}           → Contador de intentos
locked:rate_limit:{ip}    → Flag de bloqueo
login_attempts:{email}    → Intentos por usuario
refresh_token:{userId}    → Token de refresco
```

---

## 6. RBAC (Control de Acceso)

### 6.1 Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| SUPER_ADMIN | Administrador total | Todos |
| ADMIN | Administrador del sistema | Gestión de usuarios, configuración |
| TESORERO | Personal de tesorería | Validar pagos, ver estado cuentas |
| SECRETARIO | Personal administrativo | Crear trámites, gestionar documentos |
| APODERADO | Padres/tutores | Ver trámites, reportar pagos |

### 6.2 Uso en Rutas

```typescript
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';

// Solo administradores
router.get('/admin/users', 
  authMiddleware, 
  rbacMiddleware(['SUPER_ADMIN', 'ADMIN']), 
  controller.getUsers
);

// Tesoreros y administradores
router.post('/payments/validate', 
  authMiddleware, 
  rbacMiddleware(['SUPER_ADMIN', 'ADMIN', 'TESORERO']), 
  controller.validatePayment
);

// Todos los autenticados
router.get('/profile', 
  authMiddleware, 
  controller.getProfile
);
```

### 6.3 Respuesta 403

```json
{
  "success": false,
  "message": "No tienes permisos para esta acción"
}
```

---

## 7. Endpoints API

### 7.1 POST /api/auth/login

**Descripción:** Iniciar sesión

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "nombres": "string",
    "apellidos": "string",
    "roles": ["string"]
  }
}
```

**Cookies seteadas:**
- `accessToken`: JWT de acceso (15 min)
- `refreshToken`: JWT de refresco (7 días)

**Errores:**
- `401`: Credenciales inválidas
- `429`: Demasiados intentos

---

### 7.2 POST /api/auth/logout

**Descripción:** Cerrar sesión

**Headers:**
```
Cookie: accessToken=jwt
```

**Response (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

---

### 7.3 POST /api/auth/refresh

**Descripción:** Renovar tokens

**Request:**
```json
{
  "refreshToken": "jwt"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tokens renovados"
}
```

**Cookies seteadas:**
- Nuevos `accessToken` y `refreshToken`

---

### 7.4 GET /api/auth/me

**Descripción:** Obtener perfil del usuario autenticado

**Headers:**
```
Cookie: accessToken=jwt
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "nombres": "string",
    "apellidos": "string",
    "dni": "string",
    "telefono": "string",
    "avatarUrl": "string",
    "roles": ["string"]
  }
}
```

---

### 7.5 POST /api/auth/recover

**Descripción:** Solicitar recuperación de contraseña

**Rate Limit:** 5 intentos/minuto por IP

**Request:**
```json
{
  "email": "usuario@email.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Si el correo existe, recibirás un enlace de recuperación."
}
```

> **Nota de seguridad:** La respuesta es genérica para prevenir enumeración de usuarios. Si el correo no existe, igual retorna éxito.

**Efectos secundarios:**
- Se genera un token UUID v4 único
- Se guarda en PostgreSQL (tabla `tokens_recuperacion`) y Redis
- Se envía un email con enlace de restablecimiento
- Tokens anteriores del usuario se invalidan automáticamente

---

### 7.6 POST /api/auth/validate-token

**Descripción:** Validar si un token de recuperación es válido

**Request:**
```json
{
  "token": "uuid-v4-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

**Response (400):** Token inválido
```json
{
  "success": true,
  "data": {
    "valid": false
  }
}
```

---

### 7.7 POST /api/auth/reset-password

**Descripción:** Restablecer contraseña con token válido

**Request:**
```json
{
  "token": "uuid-v4-token",
  "password": "NuevaContraseña123!",
  "confirmPassword": "NuevaContraseña123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente."
}
```

**Response (400):** Token inválido o expirado
```json
{
  "success": false,
  "message": "Token inválido o expirado. Solicita uno nuevo."
}
```

**Response (400):** Validación fallida
```json
{
  "success": false,
  "errors": [
    {
      "field": "password",
      "message": "Debe contener al menos 1 mayúscula"
    }
  ]
}
```

---

### 7.8 GET /api/users/profile

**Descripción:** Obtener perfil del usuario autenticado

**Headers:**
```
Cookie: accessToken=jwt-token
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@correo.com",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "dni": "12345678",
    "telefono": "912345678",
    "avatarUrl": "https://imgbb.com/...",
    "roles": ["APODERADO"]
  }
}
```

---

### 7.9 PATCH /api/users/profile

**Descripción:** Actualizar datos de contacto (email/teléfono)

**Headers:**
```
Cookie: accessToken=jwt-token
```

**Request:**
```json
{
  "email": "nuevo@email.com",
  "telefono": "912345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente"
}
```

**Nota:** Si se cambia el email, se envía código de verificación de 6 dígitos.

---

### 7.10 POST /api/users/profile/verify-email

**Descripción:** Enviar código de verificación para cambio de email

**Headers:**
```
Cookie: accessToken=jwt-token
```

**Request:**
```json
{
  "email": "nuevo@email.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Código de verificación enviado"
}
```

---

### 7.11 POST /api/users/profile/confirm-email

**Descripción:** Confirmar cambio de email con código de verificación

**Headers:**
```
Cookie: accessToken=jwt-token
```

**Request:**
```json
{
  "codigo": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Correo actualizado exitosamente"
}
```

---

### 7.12 PATCH /api/users/profile/password

**Descripción:** Cambiar contraseña

**Headers:**
```
Cookie: accessToken=jwt-token
```

**Request:**
```json
{
  "currentPassword": "ContraseñaActual123!",
  "newPassword": "NuevaContraseña456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Response (400):** Contraseña actual incorrecta
```json
{
  "success": false,
  "message": "La contraseña actual es incorrecta"
}
```

---

### 7.13 POST /api/users/profile/avatar

**Descripción:** Actualizar avatar del usuario

**Headers:**
```
Cookie: accessToken=jwt-token
```

**Request:**
```json
{
  "imageUrl": "https://i.ibb.co/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar actualizado exitosamente",
  "data": {
    "avatarUrl": "https://i.ibb.co/..."
  }
}
```

---

## 7A. Flujo de Recuperación de Contraseña

### Diagrama de Secuencia

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Cliente  │     │ Backend  │     │  Redis   │     │   DB     │     │  Email   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ POST /recover  │                │                │                │
     │───────────────>│                │                │                │
     │                │ Verificar      │                │                │
     │                │ rate limit     │                │                │
     │                │───────────────>│                │                │
     │                │<───────────────│                │                │
     │                │                │                │                │
     │                │ Buscar usuario │                │                │
     │                │───────────────────────────────>│                │
     │                │<───────────────────────────────│                │
     │                │                │                │                │
     │                │ Generar token  │                │                │
     │                │───────────────>│                │                │
     │                │ Guardar token  │                │                │
     │                │───────────────────────────────>│                │
     │                │                │                │                │
     │                │ Enviar email ──────────────────────────────────>│
     │                │                │                │                │
     │  200 OK        │                │                │                │
     │<───────────────│                │                │                │
     │                │                │                │                │
     │ GET /reset-password?token=xxx   │                │                │
     │───────────────>│                │                │                │
     │                │ Validar token  │                │                │
     │                │───────────────>│                │                │
     │                │<───────────────│                │                │
     │  Formulario    │                │                │                │
     │<───────────────│                │                │                │
     │                │                │                │                │
     │ POST /reset-password            │                │                │
     │───────────────>│                │                │                │
     │                │ Actualizar pwd │                │                │
     │                │───────────────────────────────>│                │
     │                │ Marcar token   │                │                │
     │                │───────────────────────────────>│                │
     │                │ Eliminar token │                │                │
     │                │───────────────>│                │                │
     │  200 OK        │                │                │                │
     │<───────────────│                │                │                │
```

---

## 7B. Almacenamiento de Tokens de Recuperación

### PostgreSQL (tabla `tokens_recuperacion`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID autoincremental |
| `usuario_id` | UUID (FK) | Referencia al usuario |
| `token` | VARCHAR(255) | Token UUID v4 único |
| `expires_at` | DATETIME | Fecha de expiración (30 min) |
| `used` | BOOLEAN | Si ya fue utilizado |
| `created_at` | DATETIME | Fecha de creación |

### Redis

```
recovery_token:{token} → {usuarioId}  (TTL: 30 minutos)
```

### Flujo de Almacenamiento

1. **Generación:** Se crea UUID v4, se guarda en PostgreSQL y Redis
2. **Validación:** Se verifica primero en Redis (rápido), luego en PostgreSQL (fallback)
3. **Uso:** Se marca `used=true` en PostgreSQL y se elimina de Redis
4. **Invalidación:** Tokens anteriores del mismo usuario se marcan como usados

---

## 7C. Seguridad de Recuperación

| Medida | Implementación |
|--------|----------------|
| Prevención de enumeración | Respuesta genérica siempre exitosa |
| Tokens de un solo uso | Se invalidan tras usar |
| Expiración | 30 minutos |
| Rate limiting | 5 intentos/min en `/recover` |
| Tokens anteriores | Se invalidan al generar uno nuevo |
| Validación de contraseña | Mínimo 10 chars, mayúscula, número, especial |

---

## 8. Integración Frontend

### 8.1 Next.js (Admin)

```typescript
// Login
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: data.email,
  password: data.password,
  redirect: false,
});

if (result?.error) {
  // Manejar error
} else {
  router.push('/dashboard');
}

// Obtener sesión
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();

// Cerrar sesión
import { signOut } from 'next-auth/react';

await signOut({ callbackUrl: '/login' });
```

### 8.2 Flutter (Mobile)

```dart
// Login
final auth = context.read<AuthService>();
final success = await auth.login(email, password);

if (success) {
  Navigator.pushReplacementNamed(context, '/home');
}

// Obtener usuario
final user = auth.user;
print(user?.fullName);

// Cerrar sesión
await context.read<AuthService>().logout();
```

---

## 9. Seguridad

### 9.1 Mejores Prácticas Implementadas

| Práctica | Implementación |
|----------|----------------|
| httpOnly cookies | Tokens no accesibles via JavaScript |
| SameSite=strict | Previene CSRF |
| Secure flag | Solo HTTPS en producción |
| Bcrypt rounds | 10 rounds de hash |
| Rate limiting | 5 intentos/min por IP |
| Mensajes genéricos | No revelar si el usuario existe |
| Token rotation | Refresh token se renueva en cada uso |
| JWT expiration | Access: 15 min, Refresh: 7 días |

### 9.2 Políticas de Contraseña

```
- Mínimo 10 caracteres
- Al menos 1 mayúscula
- Al menos 1 número
- Al menos 1 carácter especial (!@#$%^&*)
```

### 9.3 Protección contra Enumeración de Usuarios

Todos los mensajes de error son genéricos:
- "Credenciales inválidas" (no "Usuario no encontrado")
- "Credenciales inválidas" (no "Contraseña incorrecta")

---

## 10. Troubleshooting

### 10.1 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `TOKEN_EXPIRED` | Access token expirado | Usar refresh token |
| `429 Too Many Requests` | Rate limit excedido | Esperar 15 minutos |
| `401 No autenticado` | No hay token | Iniciar sesión |
| `403 Acceso denegado` | Rol insuficiente | Verificar permisos |

### 10.2 Logs de Login

Los logs se guardan en la tabla `login_logs`:

```sql
SELECT * FROM login_logs 
WHERE email = 'usuario@email.com'
ORDER BY created_at DESC;
```

### 10.3 Limpiar Rate Limit Manual

```redis
DEL rate_limit:127.0.0.1
DEL locked:rate_limit:127.0.0.1
DEL login_attempts:usuario@email.com
```

### 10.4 Verificar Tokens en Redis

```redis
GET refresh_token:uuid-usuario
```

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `apps/backend/src/domains/identity/services/auth.service.ts` | Lógica de autenticación |
| `apps/backend/src/domains/identity/services/password.service.ts` | Hash de contraseñas |
| `apps/backend/src/domains/identity/services/token.service.ts` | Generación de JWT |
| `apps/backend/src/domains/identity/services/email.service.ts` | Envío de emails |
| `apps/backend/src/domains/identity/services/recovery-token.service.ts` | Tokens de recuperación |
| `apps/backend/src/domains/identity/services/password-recovery.service.ts` | Lógica de recuperación |
| `apps/backend/src/domains/identity/validators/recovery.validator.ts` | Validadores Zod |
| `apps/backend/src/routes/auth.routes.ts` | Rutas de autenticación |
| `apps/backend/src/routes/recovery.routes.ts` | Rutas de recuperación |
| `apps/backend/src/middleware/auth.middleware.ts` | Middleware JWT |
| `apps/backend/src/middleware/rbac.middleware.ts` | Control de acceso |
| `apps/backend/src/middleware/rate-limiter.ts` | Rate limiting |
| `apps/admin/src/app/api/auth/[...nextauth]/route.ts` | NextAuth config |
| `apps/admin/src/app/(auth)/forgot-password/page.tsx` | Formulario recuperación (Admin) |
| `apps/admin/src/app/(auth)/reset-password/page.tsx` | Formulario restablecer (Admin) |
| `apps/mobile/lib/core/services/auth_service.dart` | Servicio Flutter |
| `apps/mobile/lib/features/auth/screens/forgot_password_screen.dart` | Formulario recuperación (Móvil) |
| `apps/mobile/lib/features/auth/screens/reset_password_screen.dart` | Formulario restablecer (Móvil) |

---

**Última actualización:** 2024
