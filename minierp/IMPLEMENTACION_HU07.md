# Implementación HU-07: Historial de Trámites con SSE

## Resumen

Implementación de actualizaciones en tiempo real para el historial de trámites utilizando Server-Sent Events (SSE). Permite a los apoderados y personal administrativo recibir notificaciones instantáneas sobre cambios de estado, documentos agregados, y otros eventos relacionados con trámites.

## Archivos Creados

### Backend
1. **`src/services/sse.service.ts`** - Servicio singleton de SSE
   - Gestiona conexiones activas por userId
   - Heartbeat cada 30 segundos
   - Métodos: `addClient()`, `removeClient()`, `sendEvent()`, `broadcastEvent()`

2. **`src/services/event-bus.service.ts`** - Bus de eventos
   - Emite eventos cuando ocurren cambios en trámites
   - Resuelve apoderadoId para notificar al dueño
   - Tipos de evento: `tramite:created`, `tramite:estado`, `tramite:observado`, `tramite:derivado`, `tramite:aprobado`, `tramite:documento`, `tramite:finalizado`

3. **`src/routes/sse.routes.ts`** - Rutas SSE
   - Endpoint: `GET /api/tramites/stream`
   - Autenticación JWT por cookie

### Frontend Admin
4. **`src/hooks/use-tramite-sse.ts`** - Hook React para SSE
   - Auto-reconnect con backoff exponencial
   - Callbacks para cada tipo de evento
   - Estados: `isConnected`, `lastEvent`, `reconnecting`

### Frontend Móvil
5. **`lib/core/services/sse_service.dart`** - Servicio SSE para Flutter
   - Conexión HTTP SSE con autenticación
   - Stream de eventos
   - Auto-reconnect con backoff exponencial

### Documentación
6. **`docs/HU07_HISTORIAL_TRAMITES.md`** - Documentación técnica
7. **`IMPLEMENTACION_HU07.md`** - Este archivo

## Archivos Modificados

### Backend
1. **`src/server.ts`**
   - Import de `sseService` y `sseRoutes`
   - Registro de ruta SSE: `app.use('/api', sseRoutes)`
   - Inicio de heartbeat en `start()`
   - Cleanup en `SIGTERM` y `SIGINT`

2. **`src/domains/documental/services/tramite.service.ts`**
   - Import de `eventBusService`
   - Emisión de `tramite:created` en `create()`
   - Emisión de `tramite:documento` en `addDocument()`
   - Emisión de `tramite:documento` en `deleteDocument()`

### Frontend Admin
3. **`src/app/dashboard/tramites/page.tsx`**
   - Import de `useTramiteSSE` y `Wifi`/`WifiOff` icons
   - Integración del hook SSE con callbacks
   - Indicador de conexión en tiempo real (verde/gris)
   - Actualización automática de lista de trámites

### Frontend Móvil
4. **`lib/features/tramites/screens/tramites_screen.dart`**
   - Import de `SSEService`
   - Conexión SSE en `initState()`
   - Listener de eventos SSE
   - Indicador de conexión en AppBar
   - Actualización automática de lista de trámites

## Decisiones Técnicas

1. **SSE vs WebSocket**: SSE fue elegido por:
   - Simplicidad de implementación
   - No requiere bibliotecas adicionales
   - Funciona bien con HTTP/1.1
   - Soporte nativo del navegador

2. **Cookie JWT**: Se mantiene la misma autenticación que los endpoints REST para consistencia

3. **Backoff exponencial**: Evita sobrecarga del servidor en caso de reconexiones masivas
   - Inicio: 1 segundo
   - Máximo: 30 segundos
   - Máximo de intentos: 10

4. **Heartbeat cada 30s**: Mantiene la conexión activa y detecta desconexiones

5. **Singleton SSE**: Un solo gestor de conexiones en todo el servidor para eficiencia de memoria

## Índices de Base de Datos

Los índices ya existían en el schema de Prisma:
- `Tramite`: `@@index([apoderadoId, fechaCreacion(sort: Desc)])`
- `Tramite`: `@@index([estado])`
- `AuditoriaTramite`: `@@index([tramiteId, fechaHora(sort: Desc)])`

No se requirió migración adicional.

## Pruebas Realizadas

1. **Backend**:
   - Conexión SSE con JWT válido
   - Rechazo con JWT inválido/expirado
   - Emisión de eventos al crear trámite
   - Emisión de eventos al agregar/eliminar documentos
   - Heartbeat funcionando correctamente

2. **Frontend Admin**:
   - Conexión SSE al cargar página
   - Indicador de conexión visible
   - Actualización automática al recibir eventos
   - Reconexión automática tras desconexión

3. **Frontend Móvil**:
   - Conexión SSE al abrir pantalla
   - Indicador de conexión en AppBar
   - Actualización automática al recibir eventos
   - Reconexión automática tras desconexión

## Pendiente para HU-08

La implementación de HU-07 establece la infraestructura SSE que será utilizada por:
- HU-08: Trámites pendientes para secretaría
- HU-09: Seguimiento de trámites
- HU-10: Notificaciones push
- HU-11: Dashboard en tiempo real

El event bus está preparado para emitir eventos que HU-08-HU-11 consumirán.
