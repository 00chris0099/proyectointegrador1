# HU-12: Historial de Auditoría Documental

## Resumen
Proporcionar transparencia y control contra irregularidades. Un administrador o director puede consultar el log de cambios de cualquier trámite para verificar quién y cuándo realizó una modificación. Con esta historia se cierra la Épica 1 (Módulo Documental).

## Estado: ✅ COMPLETA

## Criterios de Aceptación
1. RBAC: Solo roles `Administrador` y `Direccion` pueden acceder
2. Cada cambio de estado registra: usuario, fecha, estado anterior, estado nuevo, acción, detalles
3. Los registros de auditoría son inmutables (solo INSERT, nunca UPDATE/DELETE)
4. Búsqueda por ID de seguimiento, nombre de alumno/apoderado, acción
5. Filtro por rango de fechas y tipo de acción
6. Paginación de resultados

## Fases de Implementación

### Fase 1: Backend Core
- Endpoint `GET /api/admin/auditoria` con RBAC
- Query params: search, fecha_inicio, fecha_fin, accion, page, limit
- JOIN con Tramite, Usuario para datos completos
- Paginación y conteo total

### Fase 2: Frontend Admin
- Página `/dashboard/admin/auditoria` con tabla de historial
- Filtros: búsqueda por texto, rango de fechas, tipo de acción
- Tarjeta de estadísticas (total registros, acciones hoy)
- Paginación
- Sidebar: nuevo item "Auditoría Documental"

### Fase 3: Documentación
- API docs en `docs/HU12_AUDITORIA_DOCUMENTAL.md`
- Resumen de implementación

## Archivos Modificados/Creados

### Backend
- `apps/backend/src/routes/admin-auditoria.routes.ts` — NUEVO: endpoint de auditoría
- `apps/backend/src/server.ts` — Modificado: registrar nueva ruta

### Frontend
- `apps/admin/src/app/dashboard/admin/auditoria/page.tsx` — NUEVO: página principal
- `apps/admin/src/components/sidebar.tsx` — Modificado: agregar item de menú
