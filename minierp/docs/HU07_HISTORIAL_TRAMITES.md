# HU-07: Historial de Trámites con SSE (Tiempo Real)

## Descripción

Esta funcionalidad permite a los apoderados y al personal administrativo recibir actualizaciones en tiempo real sobre el estado de los trámites mediante Server-Sent Events (SSE).

## Características

- **Conexión SSE**: Los clientes se conectan al endpoint `/api/tramites/stream`
- **Heartbeat**: El servidor envía un heartbeat cada 30 segundos para mantener la conexión activa
- **Auto-reconnect**: Los clientes se reconectan automáticamente con backoff exponencial
- **Eventos en tiempo real**: Los cambios de estado se notifican inmediatamente a los usuarios afectados

## Endpoints

### SSE Endpoint

```
GET /api/tramites/stream
```

**Headers requeridos:**
- `Cookie: accessToken=<jwt_token>`

**Headers de respuesta:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Autenticación:**
El endpoint valida el JWT token de la cookie `accessToken`. Si el token es inválido o está expirado, retorna un error 401.

## Eventos

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `tramite:created` | Nuevo trámite creado | `tramiteId`, `idSeguimiento`, `estado`, `fecha` |
| `tramite:estado` | Cambio de estado general | `tramiteId`, `idSeguimiento`, `estado`, `fecha` |
| `tramite:observado` | Trámite marcado como observado | `tramiteId`, `idSeguimiento`, `estado`, `fecha`, `detalles` |
| `tramite:derivado` | Trámite derivado a dirección | `tramiteId`, `idSeguimiento`, `estado`, `fecha` |
| `tramite:aprobado` | Trámite aprobado por dirección | `tramiteId`, `idSeguimiento`, `estado`, `fecha` |
| `tramite:documento` | Documento agregado/eliminado | `tramiteId`, `idSeguimiento`, `estado`, `fecha`, `detalles` |
| `tramite:finalizado` | Trámite finalizado | `tramiteId`, `idSeguimiento`, `estado`, `fecha` |

## Formato de Evento SSE

```
event: tramite:estado
data: {"tramiteId":"uuid","idSeguimiento":"TRM-2026-0001","estado":"En Proceso","fecha":"2026-06-29T12:00:00.000Z"}
```

## Flujo de Reconexión

1. **Primer intento**: 1 segundo
2. **Segundo intento**: 2 segundos
3. **Tercer intento**: 4 segundos
4. **Cuarto intento**: 8 segundos
5. **Quinto intento**: 16 segundos
6. **Máximo**: 30 segundos
7. **Máximo de intentos**: 10

## Implementación Backend

### SSE Service (`src/services/sse.service.ts`)

- Singleton que gestiona las conexiones activas
- Mapa de clientes conectados por userId
- Heartbeat cada 30 segundos
- Método `addClient()`, `removeClient()`, `sendEvent()`, `broadcastEvent()`

### Event Bus Service (`src/services/event-bus.service.ts`)

- Emite eventos cuando ocurren cambios en trámites
- Resuelve el `apoderadoId` del trámite para notificar al dueño
- Integra con `sseService` para enviar eventos

### SSE Routes (`src/routes/sse.routes.ts`)

- Endpoint `GET /api/tramites/stream`
- Valida JWT por cookie
- Registra conexión en SSE service

## Implementación Frontend

### Admin (React)

- Hook `useTramiteSSE()` en `src/hooks/use-tramite-sse.ts`
- Integra con `tramites/page.tsx`
- Muestra indicador de conexión (verde/gris)
- Actualiza lista de trámites en tiempo real

### Móvil (Flutter)

- Servicio `SSEService` en `lib/core/services/sse_service.dart`
- Integra con `tramites_screen.dart`
- Muestra indicador de conexión en AppBar
- Actualiza lista de trámites en tiempo real

## Índices de Base de Datos

Los índices ya existen en el schema de Prisma:

- `Tramite`: `@@index([apoderadoId, fechaCreacion(sort: Desc)])`
- `Tramite`: `@@index([estado])`
- `AuditoriaTramite`: `@@index([tramiteId, fechaHora(sort: Desc)])`

## Decisiones Técnicas

1. **SSE vs WebSocket**: Se eligió SSE porque es más simple, no requiere bibliotecas adicionales, y funciona bien con HTTP/1.1
2. **Cookie JWT**: Se mantiene la misma autenticación que los endpoints REST
3. **Backoff exponencial**: Evita sobrecarga del servidor en caso de reconexiones masivas
4. **Heartbeat cada 30s**: Mantiene la conexión activa y detecta desconexiones
5. **Singleton SSE**: Un solo gestor de conexiones en todo el servidor
