# Implementación HU-11: Aprobación Final de Documentos

## Resumen

Implementación del panel de Dirección para revisar trámites derivados, aprobarlos y generar constancias en PDF. Incluye state machine con bloqueo definitivo, registro de auditoría, notificaciones SSE, y generación de documentos PDF con PDFKit.

## Archivos Creados

### Backend
1. **`src/routes/direccion-tramite.routes.ts`** — Rutas de Dirección
   - `GET /api/direccion/tramites/derivados` — Listar derivados con filtros
   - `GET /api/direccion/tramites/estadisticas` — Estadísticas
   - `GET /api/direccion/tramites/:id/detalle` — Detalle completo
   - `GET /api/direccion/tramites/:id/constancia` — Descargar constancia PDF

2. **`src/services/constancia.service.ts`** — Servicio de generación de PDF con PDFKit

### Frontend Admin
3. **`src/app/dashboard/direccion/tramites-derivados/page.tsx`** — Página principal Dirección
4. **`src/app/dashboard/direccion/tramites-derivados/components/tramite-derivado-card.tsx`** — Card de trámite derivado
5. **`src/app/dashboard/direccion/tramites-derivados/components/detalle-tramite-direccion-modal.tsx`** — Modal detalle
6. **`src/app/dashboard/direccion/tramites-derivados/components/confirmar-aprobacion-modal.tsx`** — Modal confirmación

### Documentación
7. **`docs/HU11_APROBACION_DOCUMENTOS.md`** — Documentación técnica
8. **`IMPLEMENTACION_HU11.md`** — Este archivo

## Archivos Modificados

### Backend
1. **`src/routes/admin-tramite.routes.ts`**
   - Nuevo endpoint `PATCH /api/tramites/:id/aprobar`
   - RBAC con roles `['Direccion', 'Administrador']`
   - State machine: solo "Derivado a Dirección" → "Finalizado"
   - Transacción: UPDATE estado + UPDATE fechaCulminacion + auditoría
   - Emite eventos `tramite:aprobado` y `tramite:finalizado`

2. **`src/server.ts`**
   - Import de `direccionTramiteRoutes`
   - Registro: `app.use('/api', direccionTramiteRoutes)`

### Frontend Admin
3. **`src/components/sidebar.tsx`**
   - Nuevo ítem "Trámites Derivados" con icono `CheckCircle`
   - Ruta: `/dashboard/direccion/tramites-derivados`

4. **`src/hooks/use-admin-tramite-sse.ts`**
   - Nuevo callback `onTramiteAprobado`
   - Listener para evento `tramite:aprobado`

## Dependencias

- **pdfkit** — Generación de PDF (instalado en backend)
- **@types/pdfkit** — Tipos TypeScript

## Decisiones Técnicas

1. **RBAC**: Endpoints de Dirección usan roles `['Direccion', 'Administrador']`
2. **State Machine**: Solo "Derivado a Dirección" puede aprobarse
3. **Bloqueo Definitivo**: Trámite "Finalizado" no puede modificarse
4. **PDF con PDFKit**: Más ligero que Puppeteer,适合 VPS con 4GB RAM
5. **Constancia PDF**: Incluye datos del alumno, apoderado, tipo de trámite, fechas, y aprobador
6. **Reactive UI**: Después de aprobar, trámite desaparece de la lista
7. **SSE dual**: Emite `tramite:aprobado` y `tramite:finalizado` al apoderado
8. **Descarga PDF**: Frontend descarga PDF como blob y genera link temporal

## Endpoints API

| Método | Ruta | Descripción | RBAC |
|--------|------|-------------|------|
| GET | `/api/direccion/tramites/derivados` | Listar derivados | Direccion, Administrador |
| GET | `/api/direccion/tramites/estadisticas` | Estadísticas | Direccion, Administrador |
| GET | `/api/direccion/tramites/:id/detalle` | Detalle completo | Direccion, Administrador |
| GET | `/api/direccion/tramites/:id/constancia` | Constancia PDF | Direccion, Administrador |
| PATCH | `/api/tramites/:id/aprobar` | Aprobar trámite | Direccion, Administrador |

## Flujo de Usuario

1. Directora accede a "Trámites Derivados"
2. Ve lista de trámites con badge azul "Derivado a Dirección"
3. Hace clic en "Ver Detalle" → modal con info completa + documentos + historial
4. Hace clic en "Aprobar" → modal de confirmación con textarea opcional
5. Confirma → PATCH `/api/tramites/:id/aprobar`
6. Backend: valida estado → transacción (estado + fechaCulminacion) → auditoría → SSE
7. Trámite desaparece de la lista (reactive)
8. Apoderado recibe notificación SSE
9. Directora puede descargar constancia PDF del trámite finalizado

## Generación de Constancia PDF

El PDF incluye:
- Encabezado: I.E.P. La Asunción
- Título: CONSTANCIA DE TRÁMITE FINALIZADO
- Número de seguimiento y tipo de trámite
- Datos del alumno (nombre, DNI, nivel/grado/sección)
- Datos del apoderado (nombre, DNI)
- Detalle del trámite (estado, fechas, aprobador)
- Pie de página con fecha de generación

## Pendiente para HU-12

La infraestructura está preparada para que HU-12 (Historial de auditoría) implemente:
- Endpoint GET /api/tramites/:id/auditoria
- Vista completa del historial de cambios
