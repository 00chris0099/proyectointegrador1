# Implementación HU-10: Observación de Trámites

## Resumen

Implementación del endpoint y UI para que el personal de secretaría observe trámites y solicite correcciones a los apoderados. Incluye validación de máquina de estados, campo obligatorio de motivo, registro de auditoría, notificaciones SSE al apoderado, y actualización reactiva de la lista sin refrescar la página.

## Archivos Creados

### Backend
1. **`prisma/migrations/20260629000000_add_comentario_observacion/migration.sql`** — Migration SQL para nuevo campo

### Frontend Admin
2. **`src/app/dashboard/admin/tramites-pendientes/components/confirmar-observacion-modal.tsx`** — Modal de confirmación con textarea

### Documentación
3. **`docs/HU10_OBSERVACION_TRAMITES.md`** — Documentación técnica de endpoints
4. **`IMPLEMENTACION_HU10.md`** — Este archivo

## Archivos Modificados

### Backend
1. **`prisma/schema.prisma`**
   - Nuevo campo `comentarioObservacion` (String? @db.Text) en modelo Tramite
   - Mapeado a columna `comentario_observacion` en PostgreSQL

2. **`src/routes/admin-tramite.routes.ts`**
   - Nuevo endpoint `PATCH /api/tramites/:id/observar`
   - Validación manual de body: `motivo` (string, 10-500 caracteres)
   - State machine: solo "Pendiente" → "Observado"
   - Transacción: UPDATE estado + raw SQL para comentarioObservacion y updatedBy + INSERT AuditoriaTramite
   - Emite evento `tramite:observado` al apoderado via SSE

### Frontend Admin
3. **`src/app/dashboard/admin/tramites-pendientes/page.tsx`**
   - Import de `ConfirmarObservacionModal`
   - Estados: `observandoTramiteId`, `observandoIdSeguimiento`, `observandoLoading`, `observandoModalOpen`
   - Handler `handleObservar` — abre modal de confirmación
   - Handler `handleConfirmObservar` — llama PATCH endpoint y remueve trámite de la lista
   - Handler `handleCloseObservarModal` — cierra modal
   - Pasa `onObservar` a `TramitePendienteCard` y `DetalleTramiteModal`
   - Renderiza `ConfirmarObservacionModal`

4. **`src/app/dashboard/admin/tramites-pendientes/components/tramite-pendiente-card.tsx`**
   - Nuevo prop `onObservar: (tramiteId: string) => void`
   - Nuevo botón "Observar" con icono `AlertCircle` (solo visible si estado es "Pendiente")

5. **`src/app/dashboard/admin/tramites-pendientes/components/detalle-tramite-modal.tsx`**
   - Nuevo prop `onObservar?: (tramiteId: string) => void`
   - Botón "Observar" en footer (solo visible si estado es "Pendiente")

6. **`src/hooks/use-admin-tramite-sse.ts`**
   - Nuevo callback `onTramiteObservado`
   - Listener para evento `tramite:observado`
   - Agregado a dependency array del `connect`

## Decisiones Técnicas

1. **Campo nuevo vs reutilizar `comentario`**: Se creó `comentarioObservacion` separado porque `comentario` es del apoderado al crear el trámite. Ambos campos coexisten sin conflicos.
2. **State Machine**: Solo "Pendiente" puede observarse. "Observado" puede derivarse (HU-09) o corregirse por el apoderado.
3. **Validación**: Se validó manualmente (sin Zod) para mantener consistencia con el endpoint de derivar. Mínimo 10 chars, máximo 500.
4. **Transacción Prisma**: Misma estructura que HU-09 — UPDATE Prisma + raw SQL para campos problemáticos + INSERT auditoría.
5. **SSE**: Se reutiliza `emitTramiteEvent()` que ya busca el trámite y envía al apoderado.
6. **Reactive UI**: Después de PATCH exitoso, el trámite se remueve de la lista local.
7. **RBAC**: Mismos roles que HU-08 y HU-09 (`Secretaria`, `Administrador`).

## Endpoints API

| Método | Ruta | Descripción | RBAC |
|--------|------|-------------|------|
| PATCH | `/api/tramites/:id/observar` | Observar trámite | Secretaria, Administrador |

### Respuesta exitosa (200)
```json
{
  "success": true,
  "message": "Trámite observado exitosamente",
  "data": {
    "tramiteId": "uuid",
    "idSeguimiento": "TRAM-2026-001",
    "estadoAnterior": "Pendiente",
    "estadoNuevo": "Observado",
    "observadoPor": "María García López",
    "motivo": "Falta el certificado médico adjunto",
    "fechaObservacion": "2026-06-29T..."
  }
}
```

### Error 400 (validación)
```json
{
  "success": false,
  "message": "El motivo de observación es obligatorio (mínimo 10 caracteres)"
}
```

### Error 409 (estado no válido)
```json
{
  "success": false,
  "message": "No se puede observar un trámite en estado 'Aprobado'"
}
```

## Máquina de Estados

```
Pendiente ──────→ Observado ✅
Observado ──────→ Derivado a Dirección ✅ (HU-09)
Observado ──────→ Pendiente ✅ (corrección del apoderado)
En Proceso ─────→ ❌
Derivado ───────→ ❌
Aprobado ───────→ ❌
Finalizado ─────→ ❌
```

## Flujo de Usuario

1. Secretaria ve lista de trámites (Pendiente + Observado)
2. Hace clic en "Observar" (card o modal detalle)
3. Se abre modal con textarea para el motivo
4. Ingresa motivo (mín. 10 chars) → confirma
5. Backend: valida estado → transacción → auditoría → SSE al apoderado
6. Trámite desaparece de la lista (reactive, sin refresh)
7. Apoderado recibe notificación SSE con el motivo de observación

## Pruebas Realizadas

1. **Backend**:
   - Endpoint rechaza usuarios sin rol Secretaria/Administrador (403)
   - Endpoint rechaza trámites en estado no válido (409)
   - Endpoint rechaza motivo vacío o menor a 10 caracteres (400)
   - Endpoint rechaza motivo mayor a 500 caracteres (400)
   - Transacción crea registro de auditoría correctamente
   - SSE notifica al apoderado

2. **Frontend**:
   - Lista muestra trámites Pendiente y Observado
   - Botón "Observar" solo visible para estado "Pendiente"
   - Modal muestra ID del trámite
   - Validación de textarea funciona (contador, min/max)
   - Después de observar, trámite desaparece de la lista

## Pendiente para HU-11

La infraestructura está preparada para que HU-11 (Aprobación final) implemente:
- Endpoint PATCH para aprobar trámites derivados
- Cambio de estado a "Finalizado"
- Registro de fecha_culminacion
- Generación de constancia PDF
