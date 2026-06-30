# HU-10: Observación de Trámites

## Descripción

Como personal de secretaría, quiero poder observar trámites para solicitar correcciones a los apoderados, adjuntando obligatoriamente un motivo que explique qué falta o está mal.

## Criterios de Aceptación

1. El trámite puede observarse solo si está en estado "Pendiente"
2. El motivo es obligatorio (mínimo 10 caracteres, máximo 500)
3. Se registra auditoría completa (quién, cuándo, estado anterior/nuevo, motivo)
4. El apoderado recibe notificación via SSE con el motivo
5. El trámite se remueve de la lista de pendientes (reactive)

## Endpoint

### PATCH /api/tramites/:id/observar

**Autenticación**: Requerida (cookie httpOnly)

**RBAC**: Secretaria, Administrador

**Request Body**:
```json
{
  "motivo": "Falta el certificado médico adjunto"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| motivo | string | Sí | Mínimo 10 caracteres, máximo 500 |

**Response 200** (éxito):
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
    "fechaObservacion": "2026-06-29T10:30:00.000Z"
  }
}
```

**Response 400** (validación):
```json
{
  "success": false,
  "message": "El motivo de observación es obligatorio (mínimo 10 caracteres)"
}
```

**Response 404**:
```json
{
  "success": false,
  "message": "Trámite no encontrado"
}
```

**Response 409**:
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
En Proceso ─────→ ❌ (rechazado)
Derivado ───────→ ❌ (rechazado)
Aprobado ───────→ ❌ (rechazado)
Finalizado ─────→ ❌ (rechazado)
```

## Base de Datos

### Campo `comentario_observacion`

```sql
ALTER TABLE "tramites" ADD COLUMN "comentario_observacion" TEXT;
```

- Almacena el motivo de la observación
- Se llena solo cuando el estado cambia a "Observado"
- Coexiste con el campo `comentario` (del apoderado al crear)

### Auditoría

Cada observación registra en `auditoria_tramites`:

| Campo | Valor |
|-------|-------|
| tramite_id | UUID del trámite |
| usuario_id | UUID del usuario que observó |
| estado_anterior | "Pendiente" |
| estado_nuevo | "Observado" |
| accion | "Observación" |
| detalles | `{ "motivo": "..." }` |

## Eventos SSE

### Para el Apoderado
- Evento: `tramite:observado`
- Data: `{ tramiteId, idSeguimiento, estado, fecha, detalles: { estadoAnterior, estadoNuevo, observadoPor, motivo } }`

## Frontend

### Componentes

1. **ConfirmarObservacionModal** (nuevo)
   - Modal con textarea para el motivo
   - Validación: mínimo 10 caracteres, máximo 500
   - Contador de caracteres
   - Botones "Cancelar" / "Observar"
   - Loading state durante PATCH

2. **TramitePendienteCard**
   - Botón "Observar" con icono AlertCircle
   - Solo visible si estado es "Pendiente"

3. **DetalleTramiteModal**
   - Botón "Observar" en footer
   - Solo visible si estado es "Pendiente"

### Flujo de Usuario

1. Secretaria ve lista de trámites (Pendiente + Observado)
2. Hace clic en "Observar" (card o modal detalle)
3. Modal con textarea: "Indica el motivo por el cual el trámite requiere correcciones"
4. Ingresa motivo (mín. 10 chars) → confirma
5. PATCH request → trámite desaparece de la lista
6. Apoderado recibe notificación SSE con el motivo

### Estado Local

```typescript
observandoTramiteId: string | null    // ID del trámite a observar
observandoIdSeguimiento: string       // ID de seguimiento para mostrar
observandoLoading: boolean            // Loading state del modal
observandoModalOpen: boolean          // Control del modal
```

## Transacción Backend

```typescript
prisma.$transaction(async (tx) => {
  // 1. Actualizar estado del trámite
  await tx.tramite.update({
    where: { id: tramiteId },
    data: { estado: 'Observado' }
  });

  // 2. Actualizar comentarioObservacion y updatedBy (raw SQL)
  await tx.$executeRaw`UPDATE tramites SET comentario_observacion = ${motivo}, updated_by = ${userId}::uuid WHERE id = ${tramiteId}::uuid`;

  // 3. Registrar auditoría
  await tx.auditoriaTramite.create({
    data: {
      tramiteId,
      usuarioId: userId,
      estadoAnterior: 'Pendiente',
      estadoNuevo: 'Observado',
      accion: 'Observación',
      detalles: { motivo }
    }
  });
});
```

## Relación con Otras HUs

- **HU-09 (Derivar)**: Un trámite "Observado" puede derivarse a Dirección
- **HU-05 (Apoderado)**: El apoderado puede corregir y reenviar (vuelve a "Pendiente")
- **HU-11 (Aprobar)**: Solo aplica a trámites "Derivado a Dirección"
- **HU-12 (Auditoría)**: La observación se registra en el historial
