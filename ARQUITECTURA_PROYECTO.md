# 🏗️ Arquitectura del Sistema — Mini-ERP I.E.P. La Asunción

## Despliegue en VPS con EasyPanel

---

## 1. Resumen Ejecutivo

Sistema Mini-ERP desplegado en VPS (4GB RAM, 2 vCPU) utilizando EasyPanel como orquestador Docker. Arquitectura de microservicios con 3 aplicaciones independientes, cada una con su propio subdominio y Dockerfile.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| **Backend API** | Node.js + Express | 20 LTS | API REST principal |
| **ORM** | Prisma | 5.x | Acceso a BD y migraciones |
| **Frontend Admin** | Next.js | 14.x | Panel administrativo |
| **App Móvil** | Flutter | 3.x | App para apoderados |
| **Base de Datos** | PostgreSQL | 16 | Persistencia |
| **Caché** | Redis | 7.x | Sesiones y tokens |
| **Orquestador** | n8n | Latest | Flujos de notificaciones |
| **Almacenamiento** | imgbb API | - | Imágenes de vouchers |

---

## 3. Arquitectura de Despliegue

```
                    ┌─────────────────────────────────────┐
                    │           VPS (4GB/2vCPU)           │
                    │                                     │
                    │  ┌─────────────────────────────┐   │
                    │  │       EasyPanel (3000)       │   │
                    │  │    Orquestador Docker        │   │
                    │  └─────────────────────────────┘   │
                    │                                     │
    Internet ──────▶│  ┌─────────────────────────────┐   │
                    │  │    api.minierp.local         │   │
                    │  │    (Node.js + Express)       │   │
                    │  └──────────────┬──────────────┘   │
                    │                 │                   │
                    │                 ▼                   │
                    │  ┌─────────────────────────────┐   │
                    │  │   PostgreSQL 16 + Redis 7    │   │
                    │  │      (Puerto 5432/6379)      │   │
                    │  └─────────────────────────────┘   │
                    │                                     │
                    │  ┌─────────────────────────────┐   │
                    │  │    admin.minierp.local       │   │
                    │  │      (Next.js 14)            │   │
                    │  └─────────────────────────────┘   │
                    │                                     │
                    │  ┌─────────────────────────────┐   │
                    │  │    app.minierp.local         │   │
                    │  │    (Flutter Web)             │   │
                    │  └─────────────────────────────┘   │
                    │                                     │
                    │  ┌─────────────────────────────┐   │
                    │  │    n8n (Webhooks)            │   │
                    │  │    Notificaciones            │   │
                    │  └─────────────────────────────┘   │
                    └─────────────────────────────────────┘
```

---

## 4. Estructura del Monorepo

```
minierp/
├── apps/
│   ├── backend/                    # API REST (Node.js + Express)
│   │   ├── src/
│   │   │   ├── config/             # Variables de entorno, DB
│   │   │   ├── domains/            # Bounded Contexts
│   │   │   │   ├── identity/       # Usuarios, Roles, Auth
│   │   │   │   ├── documentary/    # Trámites, Documentos
│   │   │   │   ├── treasury/       # Pagos, Estado de cuenta
│   │   │   │   └── notifications/  # Logs, Configuración
│   │   │   ├── middleware/         # Auth, RBAC, Validación
│   │   │   ├── routes/            # Endpoints Express
│   │   │   ├── services/          # Lógica de negocio
│   │   │   ├── utils/             # Helpers, funciones
│   │   │   └── server.ts          # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Modelo de datos
│   │   │   ├── migrations/        # Historial de migraciones
│   │   │   └── seed.ts            # Datos iniciales
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── admin/                     # Panel administrativo (Next.js)
│   │   ├── src/
│   │   │   ├── app/               # App Router
│   │   │   │   ├── (auth)/        # Login, Recovery
│   │   │   │   ├── dashboard/     # Panel principal
│   │   │   │   ├── tramites/      # Gestión documental
│   │   │   │   ├── tesoreria/     # Dashboard financiero
│   │   │   │   └── admin/         # Configuración
│   │   │   ├── components/        # Componentes reutilizables
│   │   │   ├── lib/               # Utilidades, API client
│   │   │   └── styles/            # Global styles
│   │   ├── public/                # Assets estáticos
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── mobile/                    # App para apoderados (Flutter)
│       ├── lib/
│       │   ├── main.dart
│       │   ├── core/              # Config, temas, utils
│       │   ├── features/          # Módulos por feature
│       │   │   ├── auth/          # Login, registro
│       │   │   ├── tramites/      # Crear, historial
│       │   │   ├── pagos/         # Reportar pagos
│       │   │   └── perfil/        # Datos personales
│       │   └── shared/            # Widgets compartidos
│       ├── android/
│       ├── ios/
│       ├── web/                   # Flutter Web
│       └── pubspec.yaml
│
├── packages/
│   ├── shared/                    # Tipos, interfaces compartidas
│   │   ├── types/
│   │   └── constants/
│   └── ui/                        # Design system compartido
│       ├── components/
│       └── tokens/
│
├── docker/                        # Configuraciones Docker
│   ├── postgres/
│   │   └── init.sql
│   ├── redis/
│   │   └── redis.conf
│   └── nginx/
│       └── nginx.conf
│
├── scripts/                       # Scripts de utilidad
│   ├── seed.sh
│   └── backup.sh
│
├── turbo.json                     # Configuración Turborepo
├── package.json                   # Root package.json
├── docker-compose.yml             # Para desarrollo local
└── .github/
    └── workflows/
        └── ci.yml                 # CI/CD (opcional)
```

---

## 5. Arquitectura del Backend (Node.js + Express)

### 5.1 Estructura de Capas (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │ Routes  │  │Controllers│ │Middleware│  │ Validators  │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘   │
│       │            │            │               │           │
├───────┼────────────┼────────────┼───────────────┼───────────┤
│       ▼            ▼            ▼               ▼           │
│                    APPLICATION LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Use Cases (Casos de Uso)                │   │
│  │  LoginUseCase | CreateTramiteUseCase | ...           │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                                │
├────────────────────────────┼────────────────────────────────┤
│                            ▼                                │
│                    DOMAIN LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Entities & Business Rules               │   │
│  │  Usuario | Tramite | EstadoCuenta | ...              │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                                │
├────────────────────────────┼────────────────────────────────┤
│                            ▼                                │
│                 INFRASTRUCTURE LAYER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Prisma  │  │  Redis   │  │  imgbb   │  │   n8n    │  │
│  │  Client  │  │  Client  │  │  Client  │  │ Webhooks │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Endpoints API (Resumen)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| POST | /api/auth/login | No | - | Iniciar sesión |
| POST | /api/auth/recover | No | - | Recuperar contraseña |
| GET | /api/users/profile | JWT | Todos | Ver perfil |
| PATCH | /api/users/profile | JWT | Todos | Actualizar perfil |
| GET | /api/apoderados/me/alumnos | JWT | Apoderado | Mis alumnos |
| GET | /api/tramites/tipos | JWT | Todos | Catálogo de trámites |
| POST | /api/tramites | JWT | Apoderado | Crear trámite |
| GET | /api/tramites/me | JWT | Apoderado | Mis trámites |
| GET | /api/tramites/stream | JWT | Apoderado | SSE tiempo real |
| GET | /api/admin/tramites/pendientes | JWT | Secretaría | Trámites pendientes |
| PATCH | /api/tramites/:id/derivar | JWT | Secretaría | Derivar a dirección |
| PATCH | /api/tramites/:id/observar | JWT | Secretaría | Observar trámite |
| GET | /api/direccion/tramites/derivados | JWT | Dirección | Trámites derivados |
| PATCH | /api/tramites/:id/aprobar | JWT | Dirección | Aprobar trámite |
| GET | /api/tramites/:id/auditoria | JWT | Admin/Dirección | Historial |
| GET | /api/tesoreria/estado-cuenta/me | JWT | Apoderado | Mi estado de cuenta |
| POST | /api/tesoreria/pagos/reportar | JWT | Apoderado | Reportar pago |
| GET | /api/tesoreria/dashboard/consolidado | JWT | Tesorería | Dashboard |
| PATCH | /api/tesoreria/pagos/:id/validar | JWT | Tesorería | Validar pago |
| PATCH | /api/tesoreria/pagos/:id/rechazar | JWT | Tesorería | Rechazar pago |
| GET | /api/tesoreria/reportes/financiero | JWT | Dirección | Reportes PDF |
| GET | /api/tesoreria/auditoria | JWT | Admin/Dirección | Auditoría financiera |
| GET | /api/admin/config/mensajes | JWT | Admin | Ver config |
| PATCH | /api/admin/config/mensajes | JWT | Admin | Actualizar config |
| GET | /api/admin/logs/notificaciones | JWT | Admin | Logs |

### 5.3 Variables de Entorno Backend

```env
# Database
DATABASE_URL=postgresql://minierp_user:${DB_PASSWORD}@localhost:5432/minierp_db

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=12h

# imgbb
IMGBB_API_KEY=${IMGBB_API_KEY}

# n8n Webhook
N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
N8N_WEBHOOK_SECRET=${N8N_WEBHOOK_SECRET}

# Server
PORT=3001
NODE_ENV=production
```

---

## 6. Arquitectura del Frontend Admin (Next.js)

### 6.1 Estructura de Páginas

```
src/app/
├── (auth)/
│   ├── login/page.tsx          # Login
│   └── recover/page.tsx        # Recuperar contraseña
├── dashboard/
│   ├── layout.tsx              # Layout con sidebar
│   ├── page.tsx                # Home según rol
│   ├── tramites/
│   │   ├── page.tsx            # Lista de trámites
│   │   └── [id]/page.tsx       # Detalle del trámite
│   ├── tesoreria/
│   │   ├── page.tsx            # Dashboard financiero
│   │   ├── pagos/page.tsx      # Validar pagos
│   │   └── reportes/page.tsx   # Reportes PDF
│   └── admin/
│       ├── usuarios/page.tsx   # Gestión de usuarios
│       ├── config/page.tsx     # Configuración notificaciones
│       └── logs/page.tsx       # Logs de auditoría
└── layout.tsx                  # Layout raíz
```

### 6.2 Variables de Entorno Admin

```env
# API URL
NEXT_PUBLIC_API_URL=https://api.minierp.local

# Auth
NEXT_PUBLIC_APP_NAME=Mini-ERP La Asunción
```

### 6.3 Dockerfile (Admin)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3002
CMD ["node", "server.js"]
```

---

## 7. Arquitectura de la App Móvil (Flutter)

### 7.1 Estructura de Features

```
lib/
├── main.dart
├── core/
│   ├── config/
│   │   ├── api_config.dart      # URL base API
│   │   └── app_config.dart
│   ├── theme/
│   │   └── app_theme.dart
│   ├── utils/
│   │   ├── validators.dart
│   │   └── formatters.dart
│   └── services/
│       ├── api_service.dart     # Cliente HTTP
│       ├── auth_service.dart    # Gestión JWT
│       └── storage_service.dart # Persistencia local
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── login_screen.dart
│   │   │   └── recover_screen.dart
│   │   └── widgets/
│   │       └── auth_form.dart
│   ├── home/
│   │   └── screens/
│   │       └── home_screen.dart
│   ├── tramites/
│   │   ├── screens/
│   │   │   ├── create_tramite_screen.dart
│   │   │   ├── tramites_list_screen.dart
│   │   │   └── tramite_detail_screen.dart
│   │   └── widgets/
│   │       └── tramite_card.dart
│   ├── pagos/
│   │   ├── screens/
│   │   │   ├── estado_cuenta_screen.dart
│   │   │   └── reportar_pago_screen.dart
│   │   └── widgets/
│   │       └── pago_card.dart
│   └── perfil/
│       ├── screens/
│       │   └── perfil_screen.dart
│       └── widgets/
│           └── perfil_form.dart
└── shared/
    ├── widgets/
    │   ├── custom_button.dart
    │   ├── custom_text_field.dart
    │   └── loading_widget.dart
    └── models/
        └── usuario_model.dart
```

### 7.2 Variables de Entorno Flutter

```dart
// lib/core/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'https://api.minierp.local';
  static const String appName = 'Mini-ERP La Asunción';
}
```

### 7.3 Build Commands

```bash
# Flutter Web (para presentar en navegador)
flutter build web --release

# Flutter Android
flutter build apk --release

# Flutter iOS
flutter build ios --release
```

---

## 8. Integración con Servicios Externos

### 8.1 imgbb API (Almacenamiento de Imágenes)

```typescript
// src/services/imgbb.service.ts
import axios from 'axios';

export class ImgBBService {
  private apiKey: string;
  private baseUrl = 'https://api.imgbb.com/1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async uploadImage(base64Image: string, name?: string): Promise<string> {
    const formData = new FormData();
    formData.append('key', this.apiKey);
    formData.append('image', base64Image);
    if (name) formData.append('name', name);

    const response = await axios.post(`${this.baseUrl}/upload`, formData);
    return response.data.data.url;
  }

  async uploadFromBuffer(buffer: Buffer, filename: string): Promise<string> {
    const base64 = buffer.toString('base64');
    return this.uploadImage(base64, filename);
  }
}
```

### 8.2 n8n Webhooks

```typescript
// src/services/n8n.service.ts
import axios from 'axios';

export class N8nService {
  private webhookUrl: string;
  private secret: string;

  constructor(webhookUrl: string, secret: string) {
    this.webhookUrl = webhookUrl;
    this.secret = secret;
  }

  async sendAlertaPreventiva(data: {
    nombreApoderado: string;
    nombreAlumno: string;
    montoDeuda: number;
    fechaVencimiento: string;
    telefono: string;
  }): Promise<void> {
    await axios.post(this.webhookUrl, {
      tipo: 'PREVENTIVA',
      ...data
    }, {
      headers: {
        'Authorization': `Bearer ${this.secret}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendAlertaMorosidad(data: {
    nombreApoderado: string;
    nombreAlumno: string;
    montoDeuda: number;
    diasMora: number;
    telefono: string;
  }): Promise<void> {
    await axios.post(this.webhookUrl, {
      tipo: 'MOROSIDAD',
      ...data
    }, {
      headers: {
        'Authorization': `Bearer ${this.secret}`,
        'Content-Type': 'application/json'
      }
    });
  }
}
```

---

## 9. Docker Compose (Desarrollo Local)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: minierp-postgres
    restart: always
    environment:
      POSTGRES_DB: minierp_db
      POSTGRES_USER: minierp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-EXEC", "pg_isready -U minierp_user -d minierp_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: minierp-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: minierp-backend
    restart: always
    environment:
      DATABASE_URL: postgresql://minierp_user:${DB_PASSWORD}@postgres:5432/minierp_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      IMGBB_API_KEY: ${IMGBB_API_KEY}
      N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL}
      N8N_WEBHOOK_SECRET: ${N8N_WEBHOOK_SECRET}
      PORT: 3001
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  admin:
    build:
      context: ./apps/admin
      dockerfile: Dockerfile
    container_name: minierp-admin
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    ports:
      - "3002:3002"
    depends_on:
      - backend

  mobile-web:
    build:
      context: ./apps/mobile
      dockerfile: Dockerfile
    container_name: minierp-mobile
    restart: always
    ports:
      - "3003:80"
    depends_on:
      - backend

  n8n:
    image: n8nio/n8n
    container_name: minierp-n8n
    restart: always
    environment:
      N8N_BASIC_AUTH_ACTIVE: "true"
      N8N_BASIC_AUTH_USER: ${N8N_USER}
      N8N_BASIC_AUTH_PASSWORD: ${N8N_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
    ports:
      - "5678:5678"

volumes:
  postgres_data:
  redis_data:
  n8n_data:
```

---

## 10. Configuración de EasyPanel

### 10.1 Paso a Paso para Desplegar

1. **Crear repositorio GitHub** con la estructura del monorepo
2. **Abrir EasyPanel** en `http://tu-vps:3000`
3. **Crear proyecto** "minierp"
4. **Agregar servicio Backend**:
   - Tipo: Dockerfile
   - Puerto: 3001
   - Variables de entorno: DATABASE_URL, REDIS_URL, JWT_SECRET, etc.
5. **Agregar servicio Admin**:
   - Tipo: Dockerfile
   - Puerto: 3002
   - Variables: NEXT_PUBLIC_API_URL
6. **Agregar servicio Mobile Web**:
   - Tipo: Dockerfile
   - Puerto: 80
7. **Agregar servicio PostgreSQL**:
   - Tipo: PostgreSQL
   - Puerto: 5432
   - Variables: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
8. **Agregar servicio Redis**:
   - Tipo: Redis
   - Puerto: 6379
9. **Configurar subdominios** (asignados automáticamente por EasyPanel)

### 10.2 Variables de Entorno en EasyPanel

```env
# PostgreSQL
POSTGRES_DB=minierp_db
POSTGRES_USER=minierp_user
POSTGRES_PASSWORD=tu_password_seguro

# Redis
REDIS_PASSWORD=tu_password_redis

# Backend
DATABASE_URL=postgresql://minierp_user:tu_password_seguro@postgres:5432/minierp_db
REDIS_URL=redis://:tu_password_redis@redis:6379
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRATION=12h
IMGBB_API_KEY=tu_api_key_imgbb
N8N_WEBHOOK_URL=http://n8n:5678/webhook/minierp
N8N_WEBHOOK_SECRET=tu_secret_n8n

# Admin
NEXT_PUBLIC_API_URL=https://tu-subdominio-api.minierp.local

# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=tu_password_n8n
```

---

## 11. CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build and push Docker images
        run: |
          docker compose build
          docker compose push

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_KEY }}
          script: |
            cd /path/to/minierp
            git pull
            docker compose pull
            docker compose up -d
```

---

## 12. Diagrama de Flujo de Autenticación

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│  Login  │─────▶│ Backend │─────▶│  Redis  │─────▶│  Token  │
│ (App)   │      │  API    │      │ (Cache) │      │ (JWT)   │
└─────────┘      └────┬────┘      └─────────┘      └─────────┘
                      │
                      ▼
                ┌─────────┐      ┌─────────┐
                │PostgreSQL│─────▶│ RBAC    │
                │ (Users) │      │ (Roles) │
                └─────────┘      └─────────┘
```

**Flujo:**
1. App envía email + password a `POST /api/auth/login`
2. Backend valida contra PostgreSQL
3. Backend genera JWT con claims de roles
4. JWT se almacena en httpOnly cookie
5. Redis almacena refresh token (opcional)
6. Frontend redirige a dashboard según rol

---

## 13. Seguridad Implementada

| Control | Implementación | OWASP |
|---------|---------------|-------|
| Autenticación | JWT + httpOnly cookies | M2 |
| Autorización | RBAC por roles | M4 |
| Validación de entrada | Zod/Joi en todos los endpoints | M3 |
| Cifrado de contraseñas | Bcrypt (10 rounds) | M2 |
| Rate limiting | Redis-based | M5 |
| Headers de seguridad | Helmet.js | M6 |
| CORS | Configurado por dominio | M7 |
| Validación de archivos | Magic numbers (no extensiones) | M9 |
| Tokens temporales | Cifrado AES/RSA | M10 |

---

## 14. Monitorización y Logs

- **Logs estructurados**: JSON con Winston/Pino
- **Health checks**: Endpoint `/api/health`
- **Métricas**: Request/response times, error rates
- **Alertas**: n8n notifica si un servicio cae

---

## 15. Próximos Pasos

1. ✅ Configurar repositorio GitHub
2. ✅ Crear Dockerfiles para cada app
3. ✅ Desplegar PostgreSQL y Redis en EasyPanel
4. ✅ Desplegar Backend API
5. ✅ Desplegar Frontend Admin
6. ✅ Desplegar App Móvil (Flutter Web)
7. ✅ Configurar n8n con webhooks
8. ✅ Probar integración completa
9. ✅ Configurar monitoreo (Uptime Kuma)
