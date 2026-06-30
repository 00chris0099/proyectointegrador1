# HU-11: Aprobación Final de Documentos

## Descripción

Como Directora, quiero poder aprobar trámites derivados por secretaría para finalizar el ciclo documental, generando una constancia en PDF y notificando al apoderado.

## Criterios de Aceptación

1. Solo se pueden aprobar trámites en estado "Derivado a Dirección"
2. Al aprobar, el estado cambia a "Finalizado" y se registra fecha de culminación
3. Se genera una constancia en PDF descargable
4. El apoderado recibe notificación via SSE
5. Un trámite finalizado no puede modificarse (bloqueo definitivo)
6. Se registra auditoría completa

## Endpoints

### GET /api/direccion/tramites/derivados

**RBAC**: Direccion, Administrador

**Query Params**: `page`, `limit`, `fecha_inicio`, `fecha_fin`, `tipo_tramite`, `search`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "tramites": [...],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

### PATCH /api/tramites/:id/aprobar

**RBAC**: Direccion, Administrador

**Request Body** (opcional):
```json
{
  "comentario": "Trámite revisado y aprobado"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Trámite aprobado y finalizado exitosamente",
  "data": {
    "tramiteId": "...",
    "idSeguimiento": "TRAM-2026-001",
    "estadoAnterior": "Derivado a Dirección",
    "estadoNuevo": "Finalizado",
    "aprobadoPor": "Directora García",
    "fechaCulminacion": "2026-06-29T..."
  }
}
```

**Response 409**:
```json
{
  "success": false,
  "message": "No se puede aprobar un trámite en estado 'Pendiente'"
}
```

### GET /api/direccion/tramites/:id/constancia

**RBAC**: Direccion, Administrador

**Response**: PDF (application/pdf) como descarga

## Constancia PDF

El documento PDF generado incluye:

```
┌─────────────────────────────────────┐
│  I.E.P. LA ASUNCIÓN                 │
│  Institución Educativa Privada      │
├─────────────────────────────────────┤
│  CONSTANCIA DE TRÁMITE FINALIZADO   │
│                                     │
│  Número de Seguimiento: TRAM-...    │
│  Tipo de Trámite: Constancia...     │
├─────────────────────────────────────┤
│  DATOS DEL ALUMNO                   │
│  Nombre: Juan Pérez                 │
│  DNI: 12345678                      │
│  Nivel/Grado/Sección: Pri - 3° A    │
├─────────────────────────────────────┤
│  DATOS DEL APODERADO                │
│  Nombre: María García               │
│  DNI: 87654321                      │
├─────────────────────────────────────┤
│  DETALLE DEL TRÁMITE                │
│  Estado: Finalizado (Aprobado)      │
│  Fecha solicitud: 15/06/2026        │
│  Fecha aprobación: 29/06/2026       │
│  Aprobado por: Directora García     │
├─────────────────────────────────────┤
│  Constancia generada el 29/06/2026  │
│  I.E.P. La Asunción                 │
└─────────────────────────────────────┘
```

## Máquina de Estados (completa)

```
Pendiente ──────→ Observado ✅ (HU-10)
Pendiente ──────→ Derivado a Dirección ✅ (HU-09)
Observado ──────→ Derivado a Dirección ✅ (HU-09)
Derivado ───────→ Finalizado ✅ (HU-11)
```

**Bloqueo definitivo**: "Finalizado" → 403 en TODOS los endpoints de escritura.

## Frontend

### Panel de Dirección

- **Ruta**: `/dashboard/direccion/tramites-derivados`
- **Sidebar**: Nuevo ítem "Trámites Derivados" con icono CheckCircle

### Componentes

1. **TramiteDerivadoCard** — Badge azul, botones "Ver Detalle" y "Aprobar"
2. **DetalleTramiteDireccionModal** — Info completa, documentos, historial, botón "Aprobar" o "Descargar Constancia"
3. **ConfirmarAprobacionModal** — Textarea opcional, botón "Aprobar y Finalizar"

### Flujo

1. Directora ve lista de trámites derivados
2. Clic en "Ver Detalle" → modal completo
3. Clic en "Aprobar" → modal de confirmación
4. Confirma → PATCH → trámite desaparece de la lista
5. Puede descargar constancia PDF del trámite finalizado

## Transacción Backend

```typescript
prisma.$transaction(async (tx) => {
  // 1. Actualizar estado y fechaCulminacion
  await tx.tramite.update({
    where: { id: tramiteId },
    data: { estado: 'Finalizado', fechaCulminacion: new Date() }
  });

  // 2. Actualizar updatedBy (raw SQL)
  await tx.$executeRaw`UPDATE tramites SET updated_by = ${userId}::uuid WHERE id = ${tramiteId}::uuid`;

  // 3. Registrar auditoría
  await tx.auditoriaTramite.create({
    data: {
      tramiteId, usuarioId: userId,
      estadoAnterior: 'Derivado a Dirección',
      estadoNuevo: 'Finalizado',
      accion: 'Aprobación',
      detalles: { motivo: comentario }
    }
  });
});
```

## Seguridad

- RBAC estricto: solo "Direccion" o "Administrador"
- State machine: solo "Derivado a Dirección" puede aprobarse
- Bloqueo definitivo: "Finalizado" es inmutable
- Auditoría: cada acción registra usuario, fecha, estados
