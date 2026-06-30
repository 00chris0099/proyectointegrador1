# HU-08: Trámites Pendientes para Secretaría

## Descripción

Esta funcionalidad permite al personal de secretaría y administradores ver y gestionar todos los trámites pendientes enviados por los apoderados. Incluye filtros, búsqueda, estadísticas y vista detalle.

## Roles Requeridos

- **Secretaria**: Acceso completo de lectura
- **Administrador**: Acceso completo de lectura

## Endpoints

### Listar Trámites Pendientes

```
GET /api/admin/tramites/pendientes
```

**Headers requeridos:**
- `Cookie: accessToken=<jwt_token>`

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página actual (default: 1) |
| `limit` | number | Resultados por página (max: 50, default: 20) |
| `fecha_inicio` | string | Fecha de inicio (YYYY-MM-DD) |
| `fecha_fin` | string | Fecha de fin (YYYY-MM-DD) |
| `tipo_tramite` | number | ID del tipo de trámite |
| `search` | string | Búsqueda por ID seguimiento, alumno o apoderado |

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "tramites": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Estadísticas

```
GET /api/admin/tramites/estadisticas
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalPendientes": 50,
    "antiguos": 10,
    "porTipo": [
      { "tipo": { "id": 1, "nombre": "Constancia de Vacante" }, "count": 15 },
      { "tipo": { "id": 2, "nombre": "Justificación de Inasistencia" }, "count": 20 }
    ]
  }
}
```

### Detalle de Trámite

```
GET /api/admin/tramites/:id/detalle
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "idSeguimiento": "TRM-2026-0001",
    "estado": "Pendiente",
    "apoderado": { "nombres": "...", "apellidos": "...", "email": "...", "dni": "..." },
    "alumno": { "nombres": "...", "apellidos": "...", "nivel": "Primaria", "grado": 4, "seccion": "A" },
    "tipo": { "nombre": "Constancia de Vacante", "requisitos": [...] },
    "documentos": [...],
    "auditoria": [...]
  }
}
```

## Frontend

### Ruta
`/dashboard/admin/tramites-pendientes`

### Componentes
1. **FiltrosToolbar** - Filtros de fecha, tipo y búsqueda
2. **TramitePendienteCard** - Card con info del trámite
3. **DetalleTramiteModal** - Modal con detalle completo
4. **Estadísticas** - Cards con conteos

### Funcionalidades
- Filtros por rango de fechas
- Filtro por tipo de trámite
- Búsqueda por texto
- Paginación
- Indicador de trámites antiguos (>7 días)
- Modal con detalle completo y documentos descargables
- Historial de auditoría

## SSE (Tiempo Real)

Los eventos `admin:tramite:nuevo` y `admin:tramite:actualizado` se emiten a usuarios con rol Secretaria/Administrador cuando:
- Un apoderado crea un nuevo trámite
- Se actualiza el estado de un trámite

## Decisiones Técnicas

1. **RBAC**: Se usa `rbacMiddleware(['Secretaria', 'Administrador'])`
2. **Paginación**: Server-side con límite máximo de 50
3. **Filtros**: Se aplican en la consulta Prisma
4. **UI**: Patrón card-based consistente con el resto del admin
5. **Orden**: FIFO (más antiguos primero) por defecto
