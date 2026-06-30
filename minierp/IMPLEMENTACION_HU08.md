# Implementación HU-08: Trámites Pendientes para Secretaría

## Resumen

Implementación del módulo de gestión de trámites pendientes para el personal de secretaría y administradores. Permite visualizar, filtrar y consultar detalles de todas las solicitudes de trámites enviadas por apoderados.

## Archivos Creados

### Backend
1. **`src/routes/admin-tramite.routes.ts`** - Rutas admin de trámites
   - `GET /api/admin/tramites/pendientes` - Listar pendientes con filtros
   - `GET /api/admin/tramites/estadisticas` - Estadísticas
   - `GET /api/admin/tramites/:id/detalle` - Detalle completo
   - RBAC con roles `['Secretaria', 'Administrador']`

### Frontend Admin
2. **`src/app/dashboard/admin/tramites-pendientes/page.tsx`** - Página principal
3. **`src/app/dashboard/admin/tramites-pendientes/components/filtros-toolbar.tsx`** - Filtros
4. **`src/app/dashboard/admin/tramites-pendientes/components/tramite-pendiente-card.tsx`** - Card de trámite
5. **`src/app/dashboard/admin/tramites-pendientes/components/detalle-tramite-modal.tsx`** - Modal de detalle
6. **`src/hooks/use-admin-tramite-sse.ts`** - Hook SSE para admin

### Documentación
7. **`docs/HU08_TRAMITES_PENDIENTES.md`** - Documentación técnica
8. **`IMPLEMENTACION_HU08.md`** - Este archivo

## Archivos Modificados

### Backend
1. **`src/server.ts`**
   - Import de `adminTramiteRoutes`
   - Registro: `app.use('/api', adminTramiteRoutes)`

2. **`src/services/event-bus.service.ts`**
   - Agregado tipo `admin:tramite:nuevo` y `admin:tramite:actualizado`
   - Nuevo método `notifySecretaria()` para broadcast a roles Secretaria/Administrador

3. **`src/domains/documental/services/tramite.service.ts`**
   - Agregada llamada a `eventBusService.notifySecretaria()` al crear trámite

### Frontend Admin
4. **`src/components/sidebar.tsx`**
   - Agregado ítem "Trámites Pendientes" con icono `ClipboardList`
   - Ruta: `/dashboard/admin/tramites-pendientes`

## Decisiones Técnicas

1. **RBAC**: Se reutilizó el middleware existente con roles del seed: `'Secretaria'`, `'Administrador'`
2. **Paginación**: Server-side con límite máximo de 50 registros por página
3. **Filtros**: Se aplican directamente en la consulta Prisma (fecha_inicio, fecha_fin, tipo_tramite, search)
4. **UI**: Se siguió el patrón card-based existente (sin DataGrid)
5. **Orden FIFO**: Los trámites se ordenan por `fechaCreacion` ASC (más antiguos primero)
6. **Indicador de antigüedad**: Trámites >7 días se muestran con borde naranja
7. **SSE**: Se extendió el event-bus para notificar a secretaría cuando se crea un trámite

## Endpoints API

| Método | Ruta | Descripción | RBAC |
|--------|------|-------------|------|
| GET | `/api/admin/tramites/pendientes` | Listar pendientes | Secretaria, Administrador |
| GET | `/api/admin/tramites/estadisticas` | Estadísticas | Secretaria, Administrador |
| GET | `/api/admin/tramites/:id/detalle` | Detalle completo | Secretaria, Administrador |

## Pruebas Realizadas

1. **Backend**:
   - RBAC rechaza usuarios sin rol Secretaria/Administrador (403)
   - Filtros funcionan correctamente
   - Paginación retorna datos correctos
   - Estadísticas calculan correctamente

2. **Frontend**:
   - Página carga con sesión autenticada
   - Filtros aplican correctamente
   - Modal muestra detalle completo
   - Sidebar muestra el nuevo ítem

## Pendiente para HU-09

La infraestructura SSE está preparada para que HU-09 (Seguimiento de trámites) implemente:
- Cambio de estado por secretaría
- Derivación a dirección
- Notificación al apoderado
