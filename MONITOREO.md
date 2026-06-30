# 📊 Sistema de Monitoreo — Uptime Kuma

## Mini-ERP I.E.P. La Asunción

---

## 1. ¿Qué es Uptime Kuma?

Uptime Kuma es una herramienta de monitoreo de uptime open-source, auto-hospedada, con interfaz web moderna. Es ideal para VPS porque:

- **Ligero**: Usa ~50MB de RAM
- **Fácil**: Interfaz web intuitiva
- **Alertas**: Notifica por email, Telegram, WhatsApp, Discord, etc.
- **Dashboard**: Visualización en tiempo real del estado de servicios
- **Historial**: Registros de uptime/downtime

---

## 2. Comparativa de Opciones

| Herramienta | RAM | Complejidad | Costo | Recomendada |
|-------------|-----|-------------|-------|-------------|
| **Uptime Kuma** | ~50MB | Baja | Gratis | ✅ Sí |
| Grafana + Prometheus | ~500MB | Alta | Gratis | No (muy pesado) |
| Netdata | ~300MB | Media | Gratis | No |
| Hetrix Tools | ~100MB | Baja | Gratis/Pago | Alternativa |

**Recomendación**: Uptime Kuma por simplicidad y bajo consumo de recursos.

---

## 3. Instalación en Docker (EasyPanel)

### 3.1 Opción 1: Agregar en EasyPanel

1. Abrir EasyPanel → **Servicios**
2. Click **+ Agregar servicio**
3. Seleccionar **Docker Compose**
4. Pegar la siguiente configuración:

```yaml
version: '3.8'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    restart: always
    environment:
      - TZ=America/Lima
    volumes:
      - uptime-kuma_data:/app/data
    ports:
      - "3004:3001"

volumes:
  uptime-kuma_data:
```

5. Puerto: `3004`
6. Click **Deploy**

### 3.2 Opción 2: Docker Compose separado

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    restart: always
    environment:
      - TZ=America/Lima
    volumes:
      - uptime-kuma_data:/app/data
    ports:
      - "3004:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  uptime-kuma_data:
```

Ejecutar:
```bash
docker compose -f docker-compose.monitoring.yml up -d
```

---

## 4. Configuración Inicial

### 4.1 Primera vez

1. Acceder a `http://tu-vps:3004`
2. Crear cuenta de administrador:
   - Usuario: `admin`
   - Contraseña: `tu_password_seguro`
3. Completar configuración inicial

### 4.2 Configurar Notificaciones

**Email (Gmail)**:
1. Settings → Notifications → Add Notification
2. Tipo: **Email (SMTP)**
3. Configurar:
   - SMTP Server: `smtp.gmail.com`
   - Port: `465`
   - Username: `tu-email@gmail.com`
   - Password: `tu-app-password` (no tu contraseña real)
   - From: `tu-email@gmail.com`
   - To: `tu-email@gmail.com`

**Telegram**:
1. Crear bot con @BotFather
2. Obtener token del bot
3. Obtener chat ID con @userinfobot
4. Configurar en Uptime Kuma

**WhatsApp (vía n8n)**:
1. Crear webhook en n8n
2. Configurar Uptime Kuma para llamar al webhook
3. n8n envía mensaje a WhatsApp

---

## 5. Monitoreo de Servicios

### 5.1 Backend API

1. **Add New Monitor**
2. **Name**: `Backend API`
3. **Type**: HTTP(S)
4. **URL**: `https://tu-subdominio-api.minierp.local/api/health`
5. **Interval**: 60 segundos
6. **Retry**: 3
7. **Notification**: Seleccionar tu canal configurado

**Agregar endpoint de health en el backend**:

```typescript
// src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Verificar PostgreSQL
    await prisma.$queryRaw`SELECT 1`;

    // Verificar Redis
    await redisClient.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: error instanceof Error ? 'disconnected' : 'unknown',
        redis: 'unknown'
      }
    });
  }
});

export default router;
```

### 5.2 Frontend Admin

1. **Add New Monitor**
2. **Name**: `Frontend Admin`
3. **Type**: HTTP(S)
4. **URL**: `https://tu-subdominio-admin.minierp.local`
5. **Interval**: 120 segundos

### 5.3 App Móvil (Flutter Web)

1. **Add New Monitor**
2. **Name**: `App Móvil Web`
3. **Type**: HTTP(S)
4. **URL**: `https://tu-subdominio-app.minierp.local`
5. **Interval**: 120 segundos

### 5.4 PostgreSQL

1. **Add New Monitor**
2. **Name**: `PostgreSQL`
3. **Type**: PostgreSQL
4. **Hostname**: `postgres` (nombre del contenedor)
5. **Port**: `5432`
6. **Database**: `minierp_db`
7. **Username**: `minierp_user`
8. **Password**: `${DB_PASSWORD}`
9. **Interval**: 300 segundos (5 minutos)

### 5.5 Redis

1. **Add New Monitor**
2. **Name**: `Redis`
3. **Type**: Docker
4. **Container Name**: `minierp-redis`
5. **Interval**: 300 segundos

### 5.6 n8n

1. **Add New Monitor**
2. **Name**: `n8n Orquestador`
3. **Type**: HTTP(S)
4. **URL**: `http://n8n:5678/healthz`
5. **Interval**: 300 segundos

---

## 6. Configuración de Status Page

Uptime Kuma permite crear una página pública de estado.

### 6.1 Crear Status Page

1. **Status Pages** → **Add New Status Page**
2. **Title**: `Estado del Sistema - Mini-ERP`
3. **Description**: `Estado actual de los servicios del Mini-ERP I.E.P. La Asunción`
4. **Theme**: Oscuro (recomendado)
5. Agregar todos los monitores
6. **Publish**

### 6.2 URL Pública

La status page estará disponible en:
```
http://tu-vps:3004/status/minierp
```

---

## 7. Dashboard de Monitoreo

### 7.1 Métricas a Monitorear

| Servicio | Métrica | Umbral de Alerta |
|----------|---------|------------------|
| Backend | Tiempo de respuesta | > 2000ms |
| Backend | Tasa de error | > 5% |
| PostgreSQL | Conexiones activas | > 80% del máximo |
| PostgreSQL | Uso de disco | > 85% |
| Redis | Memoria usada | > 80% |
| Redis | Tasa de hits | < 90% |
| n8n | Webhooks procesados | Fallo > 3 consecutivos |

### 7.2 Widgets del Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                    MINI-ERP MONITORING                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Backend │  │  Admin  │  │   App   │  │  n8n    │       │
│  │   UP    │  │   UP    │  │   UP    │  │   UP    │       │
│  │  99.9%  │  │  99.9%  │  │  99.8%  │  │  99.7%  │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Uptime Últimos 30 Días                  │   │
│  │  ████████████████████████████████████████████████░░  │   │
│  │  99.85%                                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Tiempo de Respuesta (últimas 24h)          │   │
│  │     150ms ─────────────────────────────────────      │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Alertas por Canal

### 8.1 Configurar Múltiples Canales

**Canal Principal: Email**
- Para: Alertas críticas (servicio caído)
- Umbral: 2 fallos consecutivos

**Canal Secundario: Telegram**
- Para: Alertas de warning (tiempo de respuesta alto)
- Umbral: 3 fallos consecutivos

**Canal Terciario: n8n → WhatsApp**
- Para: Alertas informativas
- Umbral: 5 fallos consecutivos

### 8.2 Ejemplo de Notificación

```
🔴 DOWN: Backend API
Service: Backend API
Status: Down
Message: Connection refused
Time: 2026-06-25 14:30:00
```

---

## 9. Mantenimiento Programado

### 9.1 Configurar Mantenimientos

1. **Maintenance** → **Add New Maintenance**
2. **Title**: `Mantenimiento programado - Actualización del sistema`
3. **Description**: `Actualización de dependencias y parches de seguridad`
4. **Schedule**: Fecha y hora programada
5. **Duration**: 2 horas estimadas
6. **Monitors**: Seleccionar servicios afectados

---

## 10. Scripts de Utilidad

### 10.1 Backup de Uptime Kuma

```bash
#!/bin/bash
# backup-uptime-kuma.sh

BACKUP_DIR="/backups/uptime-kuma"
DATE=$(date +%Y%m%d)

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup del volumen
docker exec uptime-kuma tar -czf /tmp/kuma-backup.tar.gz /app/data
docker cp uptime-kuma:/tmp/kuma-backup.tar.gz $BACKUP_DIR/kuma-$DATE.tar.gz

# Retener últimos 7 backups
find $BACKUP_DIR -name "kuma-*.tar.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/kuma-$DATE.tar.gz"
```

### 10.2 Script de Verificación

```bash
#!/bin/bash
# check-services.sh

echo "=== Verificando servicios Mini-ERP ==="

# Backend
if curl -s -f http://localhost:3001/api/health > /dev/null; then
  echo "✅ Backend API: UP"
else
  echo "❌ Backend API: DOWN"
fi

# Admin
if curl -s -f http://localhost:3002 > /dev/null; then
  echo "✅ Frontend Admin: UP"
else
  echo "❌ Frontend Admin: DOWN"
fi

# PostgreSQL
if docker exec minierp-postgres pg_isready -U minierp_user > /dev/null 2>&1; then
  echo "✅ PostgreSQL: UP"
else
  echo "❌ PostgreSQL: DOWN"
fi

# Redis
if docker exec minierp-redis redis-cli -a $REDIS_PASSWORD ping > /dev/null 2>&1; then
  echo "✅ Redis: UP"
else
  echo "❌ Redis: DOWN"
fi

# Uptime Kuma
if curl -s -f http://localhost:3004 > /dev/null; then
  echo "✅ Uptime Kuma: UP"
else
  echo "❌ Uptime Kuma: DOWN"
fi

echo "=== Verificación completada ==="
```

---

## 11. Resumen de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| EasyPanel | 3000 | http://tu-vps:3000 |
| Backend API | 3001 | https://api.minierp.local |
| Frontend Admin | 3002 | https://admin.minierp.local |
| App Móvil Web | 3003 | https://app.minierp.local |
| Uptime Kuma | 3004 | http://tu-vps:3004 |
| PostgreSQL | 5432 | Solo interno |
| Redis | 6379 | Solo interno |
| n8n | 5678 | http://tu-vps:5678 |

---

## 12. URLs de Acceso

```
┌─────────────────────────────────────────────────────────────┐
│                    MAPA DE SERVICIOS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EasyPanel:     http://tu-vps-ip:3000                       │
│                                                             │
│  Backend API:   https://api.minierp.local (futuro)          │
│                 http://tu-vps-ip:3001 (actual)              │
│                                                             │
│  Admin Panel:   https://admin.minierp.local (futuro)        │
│                 http://tu-vps-ip:3002 (actual)              │
│                                                             │
│  App Móvil:     https://app.minierp.local (futuro)          │
│                 http://tu-vps-ip:3003 (actual)              │
│                                                             │
│  Uptime Kuma:   http://tu-vps-ip:3004                       │
│                                                             │
│  n8n:           http://tu-vps-ip:5678                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Consideraciones Finales

### Recursos del VPS

| Servicio | RAM Estimada | CPU |
|----------|--------------|-----|
| PostgreSQL | ~200MB | 10% |
| Redis | ~50MB | 2% |
| Backend | ~150MB | 15% |
| Admin | ~100MB | 5% |
| App Móvil | ~50MB | 2% |
| Uptime Kuma | ~50MB | 2% |
| n8n | ~200MB | 10% |
| **Total** | **~800MB** | **~46%** |

**VPS recomendado**: 4GB RAM, 2 vCPU ✅ (suficiente)

### Próximos pasos

1. Instalar Uptime Kuma en EasyPanel
2. Configurar cuenta de administrador
3. Agregar monitores para cada servicio
4. Configurar notificaciones (email, Telegram)
5. Crear Status Page pública
6. Programar backup semanal
