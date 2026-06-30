# Implementación HU-09: Derivar a Dirección

## Resumen

Implementación del endpoint y UI para que el personal de secretaría derive trámites a Dirección. Incluye validación de máquina de estados, registro de auditoría, notificaciones SSE al apoderado y a usuarios con rol "Direccion", y actualización reactiva de la lista sin refrescar la página.

## Archivos Creados

### Frontend Admin
1. **`src/app/dashboard/admin/tramites-pendientes/components/confirmar-derivacion-modal.tsx`** - Modal de confirmación para derivación

### Documentación
2. **`docs/HU09_DERIVAR_DIRECCION.md`** - Documentación técnica de endpoints
3. **`IMPLEMENTACION_HU09.md`** - Este archivo

## Archivos Modificados

### Backend
1. **`src/routes/admin-tramite.routes.ts`**
   - Nuevo endpoint `PATCH /api/tramites/:id/derivar`
   - Import de `eventBusService`
   - Query de pendientes ahora incluye estado "Observado": `{ in: ['Pendiente', 'Observado'] }`
   - Estadísticas también incluyen "Observado"

2. **`src/services/event-bus.service.ts`**
   - Nuevo método `notifyDireccion()` — notifica a usuarios con rol "Direccion" y "Administrador" via SSE

### Frontend Admin
3. **`src/app/dashboard/admin/tramites-pendientes/page.tsx`**
   - Import de `ConfirmarDerivacionModal`
   - Estados: `derivandoTramiteId`, `derivandoIdSeguimiento`, `derivandoLoading`, `derivandoModalOpen`
   - Handler `handleDerivar` — abre modal de confirmación
   - Handler `handleConfirmDerivar` — llama PATCH endpoint y remueve trámite de la lista
   - Handler `handleCloseDerivarModal` — cierra modal
   - Pasa `onDerivar` a `TramitePendienteCard` y `DetalleTramiteModal`
   - Renderiza `ConfirmarDerivacionModal`

4. **`src/app/dashboard/admin/tramites-pendientes/components/tramite-pendiente-card.tsx`**
   - Nuevo prop `onDerivar: (tramiteId: string) => void`
   - Badge dinámico: naranja para "Observado", amarillo para "Pendiente"
   - Nuevo botón "Derivar" con icono `Send`

5. **`src/app/dashboard/admin/tramites-pendientes/components/detalle-tramite-modal.tsx`**
   - Nuevo prop `onDerivar?: (tramiteId: string) => void`
   - Badge dinámico en detalle (Observado/Pendiente)
   - Botón "Derivar a Dirección" en footer (solo visible si estado es "Pendiente" u "Observado")

6. **`src/hooks/use-admin-tramite-sse.ts`**
   - Nuevo callback `onTramiteDerivado`
   - Listener para evento `tramite:derivado`
   - Agregado a dependency array del `connect`

## Decisiones Técnicas

1. **State Machine**: Solo "Pendiente" y "Observado" pueden derivarse. Otros estados retornan 409 Conflict
2. **Idempotencia**: Si el trámite ya está "Derivado a Dirección", retorna 200 sin cambios
3. **Transacción Prisma**: UPDATE estado + raw SQL para updatedBy + INSERT AuditoriaTramite
4. **SSE dual**: Notifica al apoderado (evento `tramite:derivado`) y a Dirección (evento `tramite:derivado` via `notifyDireccion`)
5. **Reactive UI**: Después de PATCH exitoso, el trámite se remueve de la lista local sin refresh
6. **Query extendida**: Ahora muestra "Pendiente" Y "Observado" (antes solo "Pendiente")
7. **RBAC**: Mismos roles que HU-08 (`Secretaria`, `Administrador`)
8. **Auditoría**: Registra `estadoAnterior`, `estadoNuevo`, `accion: 'Derivación'`, y usuario que realizó la acción

## Endpoints API

| Método | Ruta | Descripción | RBAC |
|--------|------|-------------|------|
| PATCH | `/api/tramites/:id/derivar` | Derivar trámite a Dirección | Secretaria, Administrador |

### Respuesta exitosa (200)
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
    "fechaDerivacion": "2026-06-29T..."
  }
}
```

### Error 409 (estado no válido)
```json
{
  "success": false,
  "message": "No se puede derivar un trámite en estado 'Aprobado'"
}
```

## Flujo de Usuario

1. Secretaria accede a "Trámites Pendientes"
2. Ve trámites en estado "Pendiente" (amarillo) y "Observado" (naranja)
3. Hace clic en "Derivar" (card) o "Derivar a Dirección" (modal detalle)
4. Se abre modal de confirmación con ID del trámite
5. Confirma → `PATCH /api/tramites/:id/derivar`
6. Backend: valida estado → transacción → auditoría → SSE
7. Frontend: trámite desaparece de la lista (reactive)
8. Apoderado recibe notificación SSE
9. Usuarios con rol "Direccion" reciben notificación SSE

## Pruebas Realizadas

1. **Backend**:
   - Endpoint rechaza usuarios sin rol Secretaria/Administrador (403)
   - Endpoint rechaza trámites en estado no válido (409)
   - Endpoint es idempotente para trámites ya derivados (200)
   - Transacción crea registro de auditoría correctamente
   - SSE notifica a apoderado y Dirección

2. **Frontend**:
   - Lista muestra trámites Pendiente y Observado
   - Badge de estado es correcto (amarillo/naranja)
   - Modal de confirmación muestra ID correcto
   - Después de derivar, trámite desaparece de la lista
   - Botón "Derivar" solo visible para estados válidos

## Pendiente para HU-10

La infraestructura está preparada para que HU-10 (Observación de trámites) implemente:
- Endpoint PATCH para observar trámites
- Cambio de estado a "Observado"
- Comentario de observación
- Notificación SSE al apoderado
