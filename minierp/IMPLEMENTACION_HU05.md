# Implementación HU-05: Creación de Solicitud de Trámite

## Estado de Implementación

| Fase | Estado | Descripción |
|------|--------|-------------|
| **Fase 1** | ✅ Completada | Backend Core |
| **Fase 2** | ✅ Completada | Frontend Admin |
| **Fase 3** | ✅ Completada | Frontend Móvil |
| **Fase 4** | ✅ Completada | Documentación |

---

## Fase 1: Backend Core ✅

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `src/domains/documental/services/tipo-tramite.service.ts` | Servicio de catálogo |
| `src/domains/documental/services/tramite.service.ts` | CRUD de trámites |
| `src/domains/documental/validators/tramite.validator.ts` | Schemas Zod |
| `src/domains/documental/utils/tracking-id.ts` | Generador TRM-2026-XXXX |
| `src/routes/tramite.routes.ts` | Rutas API |
| `prisma/seed.ts` | 8 tipos de trámite |

### Endpoints Implementados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tramites/tipos` | Catálogo de tipos |
| POST | `/api/tramites` | Crear trámite |
| GET | `/api/tramites/me` | Mis trámites |
| GET | `/api/tramites/:id` | Detalle del trámite |
| POST | `/api/tramites/:id/documentos` | Agregar documento |

---

## Fase 2: Frontend Admin ✅

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `apps/admin/src/app/dashboard/tramites/page.tsx` | Lista de trámites |
| `apps/admin/src/app/dashboard/tramites/components/tramite-card.tsx` | Tarjeta de trámite |
| `apps/admin/src/app/dashboard/tramites/components/new-tramite-form.tsx` | Formulario con upload |

### Funcionalidades

- Lista de trámites con filtros y búsqueda
- Estadísticas de trámites por estado
- Formulario con selección de tipo y alumno
- Upload de archivos (PDF/JPG, max 5MB)
- Confirmación con ID de seguimiento

---

## Fase 3: Frontend Móvil ✅

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `lib/core/services/tramite_service.dart` | Servicio API |
| `lib/features/tramites/screens/tramites_screen.dart` | Lista de trámites |
| `lib/features/tramites/screens/new_tramite_screen.dart` | Formulario |
| `lib/features/tramites/widgets/tramite_card.dart` | Tarjeta |
| `lib/main.dart` | Rutas actualizadas |
| `lib/features/home/screens/home_screen.dart` | Navegación actualizada |

### Funcionalidades

- Lista de trámites con pull-to-refresh
- Filtros por estado
- Formulario con dropdowns
- Navegación desde home

---

## Fase 4: Documentación ✅

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `docs/HU05_CREACION_TRAMITE.md` | Documentación técnica |
| `docs/GUIA_APODERADO_TRAMITES.md` | Guía para apoderados |
| `IMPLEMENTACION_HU05.md` | Este archivo |

---

## Tipos de Trámite (Seed)

| # | Nombre | Requisitos |
|---|--------|------------|
| 1 | Constancia de Vacante | DNI, Partida de nacimiento |
| 2 | Justificación de Inasistencia | Certificado médico, DNI |
| 3 | Certificado de Estudios | DNI |
| 4 | Carta de Presentación | DNI, Motivo |
| 5 | Declaración Jurada | DNI, Documento sustento |
| 6 | Constancia de Notas | DNI |
| 7 | Historial Académico | DNI, Solicitud formal |
| 8 | Solicitud Especial | DNI, Documento sustento |

## Tracking ID

Formato: `TRM-{AÑO}-{4 caracteres alfanuméricos}`

Ejemplo: `TRM-2026-A1B2`

## Estados del Trámite

```
Pendiente → En Proceso → Derivado a Dirección → Finalizado
    ↓
 Observado (regresa a Pendiente al corregirse)
```
