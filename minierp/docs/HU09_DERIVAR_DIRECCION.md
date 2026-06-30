# HU-09: Derivar a Dirección

## Descripción

Como personal de secretaría, quiero poder derivar trámites a Dirección para que sean revisados y aprobados por el personal directivo.

## Criterios de Aceptación

1. El trámite puede derivarse solo si está en estado "Pendiente" o "Observado"
2. Se registra auditoría completa (quién, cuándo, estado anterior/nuevo)
3. El apoderado recibe notificación via SSE
4. El personal de Dirección recibe notificación via SSE
5. El trámite se remueve de la lista de pendientes (reactive)

## Endpoint

### PATCH /api/tramites/:id/derivar

**Autenticación**: Requerida (cookie httpOnly)

**RBAC**: Secretaria, Administrador

**Request Body**: Ninguno

**Response 200** (éxito o idempotente):
```json
{
  "success": true,
  "message": "Trámite derivado a Dirección exitosamente",
  "data": {
    "tramiteId": "uuid",
    "idSeguimiento": "TRAM-2026-001",
    "estadoAnterior": "Pendiente",
    "estadoNuevo": "Derivado a Dirección",
    "derivadoPor": "María García López",
    "fechaDerivacion": "2026-06-29T10:30:00.000Z"
  }
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
  "message": "No se puede derivar un trámite en estado 'Aprobado'"
}
```

## Máquina de Estados

```
Pendiente ──────→ Derivado a Dirección ✅
Observado ──────→ Derivado a Dirección ✅
En Proceso ─────→ ❌ (rechazado)
Aprobado ───────→ ❌ (rechazado)
Rechazado ──────→ ❌ (rechazado)
Finalizado ─────→ ❌ (rechazado)
```

## Auditoría

Cada derivación registra en `auditoria_tramites`:

| Campo | Valor |
|-------|-------|
| tramite_id | UUID del trámite |
| usuario_id | UUID del usuario que derivó |
| estado_anterior | Estado previo ("Pendiente" o "Observado") |
| estado_nuevo | "Derivado a Dirección" |
| accion | "Derivación" |
| detalles | `{ "motivo": "Derivado a Dirección desde secretaría" }` |

## Eventos SSE

### Para el Apoderado
- Evento: `tramite:derivado`
- Data: `{ tramiteId, idSeguimiento, estado, fecha, detalles: { estadoAnterior, estadoNuevo, derivadoPor } }`

### Para Dirección
- Evento: `tramite:derivado`
- Data: `{ tramiteId, idSeguimiento, estado, fecha, detalles: { estadoAnterior, estadoNuevo, derivadoPor, accion } }`
- Destinatarios: Usuarios con rol "Direccion" o "Administrador"

## Frontend

### Componentes Modificados

1. **TramitePendienteCard**
   - Badge dinámico: amarillo (Pendiente), naranja (Observado)
   - Botón "Derivar" con icono Send

2. **DetalleTramiteModal**
   - Badge dinámico en detalle
   - Botón "Derivar a Dirección" en footer (solo para estados válidos)

3. **ConfirmarDerivacionModal** (nuevo)
   - Modal de confirmación con loading state
   - Muestra ID del trámite
   - Botones Cancelar/Derivar

### Flujo de Usuario

1. Secretaria ve lista de trámites (Pendiente + Observado)
2. Hace clic en "Derivar" o "Ver Detalle" → "Derivar a Dirección"
3. Modal de confirmación muestra: "¿Estás seguro de derivar el trámite {idSeguimiento} a Dirección?"
4. Confirma → PATCH request
5. Trámite se remueve de la lista (reactive, sin refresh)
6. Toast de éxito

### Estado Local

```typescript
derivandoTramiteId: string | null    // ID del trámite a derivar
derivandoIdSeguimiento: string       // ID de seguimiento para mostrar
derivandoLoading: boolean            // Loading state del modal
derivandoModalOpen: boolean          // Control del modal
```

## Transacción Backend

```typescript
prisma.$transaction(async (tx) => {
  // 1. Actualizar estado del trámite
  await tx.tramite.update({
    where: { id: tramiteId },
    data: { estado: 'Derivado a Dirección' }
  });

  // 2. Actualizar updatedBy (raw SQL por tipo Prisma)
  await tx.$executeRaw`UPDATE tramites SET updated_by = ${userId}::uuid WHERE id = ${tramiteId}::uuid`;

  // 3. Registrar auditoría
  await tx.auditoriaTramite.create({
    data: {
      tramiteId,
      usuarioId: userId,
      estadoAnterior,
      estadoNuevo: 'Derivado a Dirección',
      accion: 'Derivación',
      detalles: { motivo: 'Derivado a Dirección desde secretaría' }
    }
  });
});
```
