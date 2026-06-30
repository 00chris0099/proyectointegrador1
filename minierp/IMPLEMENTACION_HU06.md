# IMPLEMENTACIÓN HU-06: Carga de Documentos Adjuntos

## Resumen

Implementación completa del sistema de carga y gestión de documentos adjuntos para trámites del Mini-ERP La Asunción.

## Archivos Creados/Modificados

### Backend (`apps/backend/`)

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/domains/documental/services/upload.service.ts` | **Nuevo** | Servicio de uploads con multer + imgBB |
| `src/routes/upload.routes.ts` | **Nuevo** | Endpoint `POST /api/upload` |
| `src/routes/tramite.routes.ts` | Modificado | Agregados endpoints de documentos |
| `src/domains/documental/services/tramite.service.ts` | Modificado | Agregados `getDocuments`, `getDocumentById`, `deleteDocument` |
| `src/server.ts` | Modificado | Registro de upload routes |

### Frontend Admin (`apps/admin/`)

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/lib/api.ts` | **Nuevo** | API service con upload, documentos |
| `src/app/dashboard/tramites/components/document-upload.tsx` | **Nuevo** | Componente dropzone de uploads |
| `src/app/dashboard/tramites/components/document-list.tsx` | **Nuevo** | Lista de documentos con acciones |
| `src/app/dashboard/tramites/{[id]}/page.tsx` | **Nuevo** | Página de detalle de trámite |
| `src/app/dashboard/tramites/components/new-tramite-form.tsx` | Modificado | Upload real a `/api/tramites/:id/documentos` |

### Frontend Móvil (`apps/mobile/`)

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `lib/core/services/tramite_service.dart` | Modificado | Métodos upload, getDocumentos, delete |
| `lib/features/tramites/widgets/document_upload_widget.dart` | **Nuevo** | Widget de uploads con file_picker |
| `lib/features/tramites/screens/tramite_detail_screen.dart` | **Nuevo** | Pantalla de detalle |
| `lib/features/tramites/screens/new_tramite_screen.dart` | Modificado | Sección de documentos adjuntos |
| `lib/features/tramites/screens/tramites_screen.dart` | Modificado | Navegación al detalle |
| `lib/main.dart` | Modificado | Ruta `/tramite-detail` |
| `pubspec.yaml` | Modificado | Agregado `file_picker` |

### Documentación

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `docs/HU06_CARGA_DOCUMENTOS.md` | **Nuevo** | API docs completos |

## Decisiones Técnicas

1. **Almacenamiento:** imgBB API (gratuito, URLs públicas)
2. **Validación:** Multer en backend + validación Zod
3. **Flujo upload:** Archivo → imgBB → URL → Prisma DB
4. **Permisos:** Solo el apoderado dueño puede agregar/eliminar docs
5. **Restricción:** Solo se pueden modificar docs en estado "Pendiente"

## Dependencias Agregadas

- **Backend:** `axios` (para imgBB API)
- **Mobile:** `file_picker` (selección de archivos)

## Endpoints Implementados

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/upload` | Sube archivo a imgBB |
| POST | `/api/tramites/:id/documentos` | Agrega documento al trámite |
| GET | `/api/tramites/:id/documentos` | Lista documentos |
| GET | `/api/tramites/:id/documentos/:docId` | Info de un documento |
| DELETE | `/api/tramites/:id/documentos/:docId` | Elimina documento |

## Próximos Pasos

- HU-07: Historial de trámites
- HU-08: Seguimiento de estado
- HU-09: Notificaciones push
