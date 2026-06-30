# Mini-ERP I.E.P. La Asunción

Sistema ERP educativo para la gestión de trámites, tesorería y comunicación con apoderados.

## 🏗️ Arquitectura

- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend Admin**: Next.js 14 + Tailwind CSS
- **App Móvil**: Flutter (Web + Android + iOS)
- **Orquestador**: n8n (notificaciones)
- **Monitoreo**: Uptime Kuma
- **Despliegue**: Docker + EasyPanel

## 📁 Estructura del Proyecto

```
minierp/
├── apps/
│   ├── backend/          # API REST (Node.js + Express)
│   ├── admin/            # Panel administrativo (Next.js)
│   └── mobile/           # App para apoderados (Flutter)
├── packages/
│   ├── shared/           # Tipos y constantes compartidas
│   └── ui/               # Design system
├── docker/               # Configuraciones Docker
├── scripts/              # Scripts de utilidad
└── .github/              # CI/CD
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- Docker y Docker Compose
- npm o yarn

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/minierp.git
   cd minierp
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. Iniciar servicios:
   ```bash
   docker compose up -d
   ```

5. Ejecutar migraciones:
   ```bash
   npm run db:push
   ```

6. Poblar base de datos:
   ```bash
   npm run db:seed
   ```

7. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```

### URLs de Desarrollo

- Backend API: http://localhost:3001
- Frontend Admin: http://localhost:3002
- App Móvil: http://localhost:3003
- Uptime Kuma: http://localhost:3004
- n8n: http://localhost:5678

## 📚 Documentación

- [Arquitectura del Proyecto](./ARQUITECTURA_PROYECTO.md)
- [Arquitectura de Base de Datos](./ARQUITECTURA_BASE_DATOS.md)
- [Sistema de Monitoreo](./MONITOREO.md)

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar todos los servicios
npm run build                  # Construir todos los paquetes
npm run lint                   # Ejecutar linter

# Base de datos
npm run db:generate            # Generar cliente Prisma
npm run db:push                # Sincronizar esquema con BD
npm run db:migrate             # Crear migración
npm run db:seed                # Poblar BD con datos iniciales

# Docker
docker compose up -d           # Iniciar servicios
docker compose down            # Detener servicios
docker compose logs -f         # Ver logs
```

## 🛡️ Seguridad

- Autenticación JWT con httpOnly cookies
- RBAC (Control de Acceso Basado en Roles)
- Validación de entrada con Zod/Joi
- Cifrado de contraseñas con Bcrypt
- Headers de seguridad con Helmet
- Rate limiting con Redis

## 📊 Monitoreo

Uptime Kuma está configurado para monitorear:
- Backend API
- Frontend Admin
- App Móvil
- PostgreSQL
- Redis
- n8n

## 🤝 Contribuir

1. Crear una rama para tu feature (`git checkout -b feature/nueva-feature`)
2. Hacer commit de tus cambios (`git commit -m 'Add nueva feature'`)
3. Push a la rama (`git push origin feature/nueva-feature`)
4. Abrir un Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](./LICENSE) para más detalles.
