# HU-12: Historial de Auditoría Documental

## Descripción

Como Administrador o Directora, quiero poder consultar el historial de cambios de estado de cualquier trámite para verificar quién y cuándo realizó una modificación, garantizando transparencia y control contra irregularidades.

## Criterios de Aceptación

1. RBAC: Solo roles `Administrador` y `Direccion` pueden acceder
2. Cada cambio de estado registra: usuario, fecha, estado anterior, estado nuevo, acción, detalles
3. Los registros de auditoría son inmutables (solo INSERT, nunca UPDATE/DELETE)
4. Búsqueda por ID de seguimiento, nombre de alumno/apoderado
5. Filtro por rango de fechas y tipo de acción
6. Paginación de resultados (máx 50 por página)

## Endpoints

### GET /api/admin/auditoria

**RBAC**: Administrador, Direccion

**Query Params**:
| Param | Tipo | Descripción |
|-------|------|-------------|
| `search` | string | Búsqueda por ID seguimiento, alumno, apoderado |
| `accion` | string | Filtrar por tipo de acción (Creación, Derivación, Observación, Aprobación) |
| `fecha_inicio` | string | Fecha inicio del rango (YYYY-MM-DD) |
| `fecha_fin` | string | Fecha fin del rango (YYYY-MM-DD) |
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 20, max: 50) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "registros": [
      {
        "id": 1,
        "tramiteId": "uuid",
        "usuarioId": "uuid",
        "fechaHora": "2026-06-29T10:30:00.000Z",
        "estadoAnterior": "Pendiente",
        "estadoNuevo": "Derivado a Dirección",
        "accion": "Derivación",
        "detalles": { "motivo": "Derivado a Dirección desde secretaría" },
        "tramite": {
          "id": "uuid",
          "idSeguimiento": "TRM-2026-ABC1",
          "estado": "Derivado a Dirección",
          "alumno": { "nombres": "Juan", "apellidos": "Pérez", "nivel": "Secundaria", "grado": 3, "seccion": "A" },
          "apoderado": { "nombres": "María", "apellidos": "Pérez" },
          "tipo": { "nombre": "Constancia de vacante" }
        },
        "usuario": {
          "id": "uuid",
          "nombres": "Ana",
          "apellidos": "García",
          "email": "ana@colegio.pe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

### GET /api/admin/auditoria/estadisticas

**RBAC**: Administrador, Direccion

**Response 200**:
```json
{
  "success": true,
  "data": {
    "totalRegistros": 15,
    "registrosHoy": 3,
    "porAccion": [
      { "accion": "Derivación", "count": 8 },
      { "accion": "Observación", "count": 4 },
      { "accion": "Aprobación", "count": 3 }
    ]
  }
}
```

### GET /api/admin/auditoria/acciones

**RBAC**: Administrador, Direccion

**Response 200**:
```json
{
  "success": true,
  "data": ["Aprobación", "Creación", "Derivación", "Observación"]
}
```

## Frontend

### Ruta: `/dashboard/admin/auditoria`

**Componentes**:
- Tabla de historial de auditoría con columnas: Fecha/Hora, Trámite, Alumno, Acción, Ejecutado por, Detalle
- Barra de búsqueda por texto
- Filtros expandibles: Acción (select), Fecha Inicio, Fecha Fin
- Tags de filtros activos con botón de eliminación
- Estadísticas: Total registros, Registros hoy, Acciones registradas
- Modal de detalle con información completa del registro
- Paginación

**Permisos**: Solo visible para usuarios con rol `Administrador` o `Direccion`

## Datos de Auditoría (ya existentes)

La tabla `auditoria_tramites` ya existe en Prisma schema y es alimentada por:
- **HU-09**: `PATCH /api/tramites/:id/derivar` → accion: "Derivación"
- **HU-10**: `PATCH /api/tramites/:id/observar` → accion: "Observación"
- **HU-11**: `PATCH /api/tramites/:id/aprobar` → accion: "Aprobación"

## Archivos

### Backend
- `apps/backend/src/routes/admin-auditoria.routes.ts` — 3 endpoints
- `apps/backend/src/server.ts` — Registro de ruta

### Frontend
- `apps/admin/src/app/dashboard/admin/auditoria/page.tsx` — Página principal
- `apps/admin/src/components/sidebar.tsx` — Item de menú "Auditoría Documental"
