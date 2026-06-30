# Guía de Exposición — Épica 1: Módulo de Autogestión y Flujo Documental
## Mini-ERP I.E.P. La Asunción — HU-01 a HU-12

---

## 1. Estructura de la Exposición

| Momento | Duración | Contenido |
|---------|----------|-----------|
| Apertura | 2 min | Problema y contexto |
| Demo Usuario | 10 min | Navegación completa del sistema |
| Arquitectura | 5 min | Stack, despliegue, diagramas |
| Código | 8 min | Estructura, autenticación, flujo de datos |
| Cierre | 2 min | Resultados y aprendizajes |

---

## 2. Guion de Apertura (2 min)

> "El problema que aborda nuestro proyecto es la gestión documental manual en instituciones educativas. Los apoderados deben asistir físicamente para crear solicitudes, la secretaría maneja expedientes en papel, y no existe trazabilidad de los trámites.
>
> Nuestra solución es un Mini-ERP que digitaliza todo el flujo: el apoderado crea trámites desde su celular, la secretaría los revisa y deriva, y la directora los aprueba. Todo con seguimiento en tiempo real y auditoría completa."

---

## 3. Demo de Navegación por Usuario (10 min)

### 3.1 Panel del Apoderado (Mobile Web)

**URL:** https://aimachristian-mobileintegrador.ajcxjb.easypanel.host

| Paso | Acción | Qué se muestra |
|------|--------|----------------|
| 1 | Login con `apoderado@test.com` / `Password123!` | Pantalla de login institucional |
| 2 | Ver "Mis Alumnos" | Lista de alumnos vinculados (Ana María, Luis Carlos) |
| 3 | Ir a "Trámites" → "Nuevo Trámite" | Formulario: selección de tipo, alumno, archivos adjuntos |
| 4 | Crear un trámite (ej: Constancia de Vacantes) | Confirmación con ID de seguimiento `TRM-2026-XXXX` |
| 5 | Ver "Mis Trámites" | Lista con estados: Pendiente → Observado → Derivado → Finalizado |
| 6 | Click en un trámite | Detalle con historial de cambios en tiempo real (SSE) |

**Qué explicar:**
- "El apoderado no necesita ir al colegio. Crea la solicitud desde su celular"
- "El ID de seguimiento le permite consultar el estado sin llamar"
- "Los cambios de estado se reflejan en tiempo real gracias a Server-Sent Events"

### 3.2 Panel de Secretaría (Admin)

**URL:** https://aimachristian-adminintegrador.ajcxjb.easypanel.host

| Paso | Acción | Qué se muestra |
|------|--------|----------------|
| 1 | Login con `secretaria@laasuncion.edu.pe` / `Password123!` | Dashboard administrativo |
| 2 | Ir a "Trámites Pendientes" | Bandeja de entrada con trámites por revisar |
| 3 | Click en un trámite → Ver detalle | Información completa: apoderado, alumno, documentos adjuntos |
| 4 | Botón "Derivar a Dirección" | Modal de confirmación → trámite se mueve a Dirección |
| 5 | Botón "Observar" | Modal con campo de comentario obligatorio |
| 6 | Ver "Solicitudes de Vinculación" | Peticiones de apoderados para vincular alumnos |

**Qué explicar:**
- "La secretaría filtra trámites por fecha, tipo o estado"
- "Al derivar, la directora recibe notificación en tiempo real"
- "Si el trámite tiene documentos faltantes, se observa con comentario"

### 3.3 Panel de Dirección (Admin)

| Paso | Acción | Qué se muestra |
|------|--------|----------------|
| 1 | Login con `direccion@laasuncion.edu.pe` / `Password123!` | Dashboard |
| 2 | Ir a "Trámites Derivados" | Trámites esperando aprobación |
| 3 | Click en un trámite → Ver detalle | Documentos, historial completo |
| 4 | Botón "Aprobar" | Trámite cambia a "Finalizado" con fecha de culminación |
| 5 | Ir a "Auditoría Documental" | Log completo de todos los cambios del trámite |

**Qué explicar:**
- "La directora ve solo los trámites que le corresponden"
- "Al aprobar, el trámite queda inmutable — no se puede modificar"
- "La auditoría muestra quién hizo qué y cuándo"

### 3.4 Flujo Completo de un Trámite

```
Apoderado crea trámite → Estado: PENDIENTE
        ↓
Secretaría revisa → Observa (con comentario) → Vuelve a PENDIENTE
        ↓                        ↓
Secretaría deriva → Estado: DERIVADO A DIRECCIÓN
        ↓
Directora aprueba → Estado: FINALIZADO
        ↓
Auditoría registra todo el historial
```

---

## 4. Arquitectura del Sistema (5 min)

### 4.1 Stack Tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Backend | Node.js + Express | Rápido de desarrollar, amplio ecosistema |
| ORM | Prisma | Type-safe, migraciones automáticas |
| Frontend Admin | Next.js 14 | SSR, App Router, ecosistema React |
| App Móvil | Flutter Web | Multiplataforma, una sola base de código |
| Base de Datos | PostgreSQL | Robusto, open source, escalable |
| Caché | Redis | Sesiones, rate limiting, tokens |
| Despliegue | Docker + EasyPanel | Orquestación simple en VPS |

### 4.2 Diagrama de Despliegue

```
┌─────────────────────────────────────────────┐
│              VPS (4GB RAM, 2 vCPU)          │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │           EasyPanel                  │   │
│  │    (Orquestador Docker)              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Backend  │  │  Admin   │  │ Mobile   │ │
│  │ :3001    │  │  :3002   │  │   :80    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │              │       │
│  ┌────┴──────────────┴──────────────┴───┐  │
│  │     PostgreSQL :5432  +  Redis :6379 │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 4.3 URLs de Acceso

| Servicio | URL |
|----------|-----|
| Backend API | https://aimachristian-backendintegrador.ajcxjb.easypanel.host |
| Admin Panel | https://aimachristian-adminintegrador.ajcxjb.easypanel.host |
| Mobile Web | https://aimachristian-mobileintegrador.ajcxjb.easypanel.host |

---

## 5. Explicación del Código (8 min)

### 5.1 Estructura del Proyecto (Monorepo)

```
minierp/
├── apps/
│   ├── backend/          # API REST (Node.js + Express)
│   │   ├── src/
│   │   │   ├── config/           # Variables de entorno, DB, Redis
│   │   │   ├── domains/          # Bounded Contexts (Clean Architecture)
│   │   │   │   ├── identity/     # Auth, Usuarios, Roles
│   │   │   │   └── documentary/  # Trámites, Documentos
│   │   │   ├── middleware/       # Auth JWT, RBAC, Rate Limiting
│   │   │   ├── routes/           # Endpoints Express
│   │   │   └── services/         # SSE, EventBus
│   │   └── prisma/
│   │       ├── schema.prisma     # Modelo de datos
│   │       └── seed.ts           # Datos iniciales
│   │
│   ├── admin/             # Panel administrativo (Next.js 14)
│   │   └── src/app/
│   │       ├── (auth)/           # Login, Recovery
│   │       ├── dashboard/
│   │       │   ├── admin/        # Secretaría
│   │       │   ├── direccion/    # Directora
│   │       │   ├── tramites/     # Apoderado
│   │       │   └── profile/      # Perfil
│   │       └── api/auth/         # NextAuth.js
│   │
│   └── mobile/            # App para apoderados (Flutter)
│       └── lib/
│           ├── core/services/    # Auth, Trámites, Profile
│           └── features/         # Auth, Trámites, Alumnos, Perfil
│
├── packages/shared/       # Tipos compartidos
└── docker/                # Configuraciones Docker
```

### 5.2 Autenticación (HU-01)

**Backend — Flujo de Login:**

```
1. POST /api/auth/login
   → Recibe: { email, password }
   → Valida contra PostgreSQL (bcrypt)
   → Genera JWT (accessToken + refreshToken)
   → Guarda refresh token en Redis
   → Retorna: { user data, tokens }

2. Middleware auth.middleware.ts
   → Extrae token de Authorization header o cookie
   → Verifica JWT con jsonwebtoken
   → Adjunta usuario al request
```

**Código clave:**
```typescript
// src/domains/identity/services/auth.service.ts
async login(data: LoginInput, ip?: string, userAgent?: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: validated.email },
    include: { roles: { include: { rol: true } } }
  });
  
  const passwordValid = await passwordService.comparePassword(
    validated.password, usuario.passwordHash
  );
  
  const accessToken = tokenService.generateAccessToken(
    usuario.id, usuario.email, roles
  );
  
  return { user: { ... }, accessToken, refreshToken };
}
```

### 5.3 RBAC — Control de Acceso por Roles (HU-01, HU-08, HU-11)

```typescript
// src/middleware/rbac.middleware.ts
export const requireRole = (...roles: string[]) => {
  return (req, res, next) => {
    const userRoles = req.user.roles;
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        message: 'No tienes permiso' 
      });
    }
    next();
  };
};

// Uso en rutas:
router.get('/admin/tramites/pendientes', 
  authMiddleware, 
  requireRole('Secretaria', 'Administrador'),
  controller.getPendientes
);
```

### 5.4 Flujo Documental — Máquina de Estados (HU-05 a HU-11)

```
PENDIENTE ──→ OBSERVADO (con comentario)
    │              │
    │              └──→ PENDIENTE (al subsanar)
    │
    └──→ DERIVADO A DIRECCIÓN
              │
              └──→ FINALIZADO (con fecha de culminación)
```

**Backend — Endpoints del flujo:**

| Endpoint | HU | Acción |
|----------|-----|--------|
| `POST /api/tramites` | HU-05 | Crear trámite |
| `PATCH /api/tramites/:id/observar` | HU-10 | Marcar como observado |
| `PATCH /api/tramites/:id/derivar` | HU-09 | Derivar a dirección |
| `PATCH /api/tramites/:id/aprobar` | HU-11 | Aprobar (finalizar) |
| `GET /api/tramites/:id/auditoria` | HU-12 | Ver historial |

### 5.5 Server-Sent Events — Tiempo Real (HU-07)

```typescript
// src/services/sse.service.ts
class SSEService {
  private clients: Map<string, Response> = new Map();

  addClient(userId: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    this.clients.set(userId, res);
  }

  sendToUser(userId: string, event: string, data: any) {
    const client = this.clients.get(userId);
    if (client) {
      client.write(`event: ${event}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
}
```

**Cómo funciona:**
1. El frontend abre una conexión SSE al backend
2. Cuando la secretaría deriva un trámite, el backend envía evento al apoderado
3. El apoderado ve el cambio de estado sin recargar la página

### 5.6 Auditoría Documental (HU-12)

```sql
-- Tabla de auditoría (inmutable)
CREATE TABLE auditoria_tramites (
  id SERIAL PRIMARY KEY,
  tramite_id UUID REFERENCES tramites(id),
  usuario_id UUID REFERENCES usuarios(id),
  fecha_hora TIMESTAMP DEFAULT NOW(),
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  accion VARCHAR(100),
  detalles JSONB
);
```

**Cada cambio de estado registra:**
- Quién lo hizo (usuario_id)
- Cuándo (fecha_hora)
- De qué estado vino (estado_anterior)
- A qué estado fue (estado_nuevo)
- Qué acción se realizó (accion)
- Detalles adicionales en JSON (detalles)

---

## 6. Criterios de Aceptación Cumplidos

| HU | Criterio | Estado |
|----|----------|--------|
| HU-01 | Login con roles (Apoderado, Secretaría, Dirección) | ✅ |
| HU-01 | Rate limiting (5 intentos/min) | ✅ |
| HU-01 | JWT con expiración 12h | ✅ |
| HU-02 | Recuperación de contraseña vía email | ✅ |
| HU-03 | Gestión de perfil (email, teléfono) | ✅ |
| HU-04 | Vinculación Alumno-Apoderado | ✅ |
| HU-05 | Creación de trámite con tipos preconfigurados | ✅ |
| HU-06 | Carga de documentos (PDF/JPG, max 5MB) | ✅ |
| HU-07 | Historial de trámites con SSE | ✅ |
| HU-08 | Trámites pendientes para secretaría | ✅ |
| HU-09 | Derivación a dirección | ✅ |
| HU-10 | Observación con comentario obligatorio | ✅ |
| HU-11 | Aprobación final con fecha de culminación | ✅ |
| HU-12 | Auditoría documental completa | ✅ |

---

## 7. Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@laasuncion.edu.pe | Password123! |
| Secretaria | secretaria@laasuncion.edu.pe | Password123! |
| Dirección | direccion@laasuncion.edu.pe | Password123! |
| Tesorería | tesoreria@laasuncion.edu.pe | Password123! |
| Apoderado | apoderado@test.com | Password123! |

---

## 8. Preguntas Frecuentes y Respuestas

**P: ¿Por qué PostgreSQL y no SQL Server como indica el proyecto original?**
R: PostgreSQL es open source, no requiere licencia, y funciona perfectamente en VPS Linux. La arquitectura es la misma.

**P: ¿Cómo se maneja la seguridad?**
R: Contraseñas con bcrypt (10 rounds), JWT con expiración, CORS configurado, rate limiting con Redis, validación de entrada con Zod.

**P: ¿Por qué SSE y no WebSockets?**
R: SSE es más simple, nativo del navegador, y adecuado para notificaciones unidireccionales (servidor → cliente). WebSockets serían necesarios para chat bidireccional.

**P: ¿Qué pasa si el backend se cae?**
R: Redis mantiene las sesiones y tokens. Al reiniciar, el backend se reconecta automáticamente a PostgreSQL y Redis.

**P: ¿Cómo se despliega?**
R: Cada servicio tiene su propio Dockerfile. EasyPanel orquesta los contenedores en el VPS con auto-restart y health checks.

---

## 9. Resumen para el Cierre (2 min)

> "Hemos implementado el módulo completo de autogestión y flujo documental del Mini-ERP. El sistema permite:
>
> 1. **Autenticación segura** con 5 roles diferenciados
> 2. **Flujo documental completo**: creación → revisión → derivación → aprobación
> 3. **Tiempo real** con Server-Sent Events
> 4. **Auditoría total** de cada cambio realizado
> 5. **Despliegue en producción** con Docker y EasyPanel
>
> La arquitectura está preparada para escalar: el módulo de tesorería (Épica 2) se integrará sobre la misma base."

---

*Documento generado para la exposición del Proyecto Integrador — Épica 1 (Sprint 1-3)*
