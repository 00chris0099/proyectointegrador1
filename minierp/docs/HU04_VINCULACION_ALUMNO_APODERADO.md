# HU-04: Vinculación Alumno-Apoderado

## Descripción

Esta HU permite a los apoderados vincularse con sus hijos/alumnos en el sistema, y a los administradores gestionar estas solicitudes.

## Flujos Principales

### Flujo 1: Apoderado solicita vinculación

1. El apoderado ingresa a "Mis Alumnos"
2. Hace clic en "Solicitar Vinculación"
3. Ingresa el DNI del alumno
4. Selecciona el parentesco (Padre, Madre, Abuelo, etc.)
5. Si selecciona "Otro", especifica el parentesco
6. Envía la solicitud
7. La solicitud queda en estado "Pendiente"
8. El admin revisa y aprueba/rechaza

### Flujo 2: Admin aprueba/rechaza

1. El admin ingresa a "Solicitudes de Vinculación"
2. Ve la lista de solicitudes pendientes
3. Puede filtrar por estado
4. Puede buscar por nombre o DNI
5. Aprueba o rechaza con motivo
6. Si aprueba: se crea la vinculación automáticamente
7. Si rechaza: se registra el motivo

## Endpoints API

### Autenticación

Todos los endpoints requieren JWT en httpOnly cookie.

### Apoderado Endpoints

#### GET /api/apoderados/me/alumnos

Lista los alumnos vinculados al apoderado autenticado.

**Headers:**
```
Cookie: access_token=<jwt_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-alumno",
      "dni": "12345678",
      "nombres": "Juan Carlos",
      "apellidos": "García López",
      "nivel": "Primaria",
      "grado": 3,
      "seccion": "A",
      "estado": true,
      "fechaNac": "2015-03-15T00:00:00.000Z",
      "parentesco": "Padre",
      "esPrincipal": true
    }
  ]
}
```

#### POST /api/apoderados/me/solicitud

Crea una nueva solicitud de vinculación.

**Body:**
```json
{
  "dni": "12345678",
  "parentesco": "Padre",
  "parentescoCustom": null
}
```

**Parentescos válidos:**
- `Padre`
- `Madre`
- `Abuelo Paterno`
- `Abuela Paterna`
- `Abuelo Materno`
- `Abuela Materna`
- `Tutor`
- `Tía`
- `Tío`
- `Hermano`
- `Hermana`
- `Otro` (requiere `parentescoCustom`)

**Response 201:**
```json
{
  "success": true,
  "message": "Solicitud de vinculación enviada exitosamente",
  "data": {
    "id": 1,
    "apoderadoId": "uuid-apoderado",
    "alumnoId": "uuid-alumno",
    "parentesco": "Padre",
    "parentescoCustom": null,
    "estado": "Pendiente",
    "createdAt": "2026-06-29T10:00:00.000Z"
  }
}
```

**Errores:**
- `400`: DNI no encontrado, ya vinculado, solicitud pendiente existente
- `400`: Datos inválidos (validación Zod)

#### GET /api/apoderados/me/solicitudes

Lista las solicitudes del apoderado autenticado.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "parentesco": "Padre",
      "estado": "Pendiente",
      "createdAt": "2026-06-29T10:00:00.000Z",
      "alumno": {
        "dni": "12345678",
        "nombres": "Juan Carlos",
        "apellidos": "García López",
        "nivel": "Primaria",
        "grado": 3,
        "seccion": "A"
      }
    }
  ]
}
```

#### DELETE /api/apoderados/me/solicitudes/:id

Cancela una solicitud pendiente.

**Params:**
- `id`: ID de la solicitud (número)

**Response 200:**
```json
{
  "success": true,
  "message": "Solicitud cancelada"
}
```

**Errores:**
- `400`: ID inválido, solicitud no encontrada, no pertenece al apoderado, ya procesada

### Admin Endpoints

#### GET /api/admin/solicitudes-vinculacion

Lista todas las solicitudes (requiere rol SUPER_ADMIN o ADMIN).

**Query Params:**
- `estado`: Filtrar por estado (opcional)
  - `Pendiente`: Solo solicitudes pendientes
  - Sin filtro: Todas las solicitudes

**Headers:**
```
Cookie: access_token=<jwt_token_admin>
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "apoderadoId": "uuid-apoderado",
      "alumnoId": "uuid-alumno",
      "parentesco": "Padre",
      "parentescoCustom": null,
      "estado": "Pendiente",
      "motivo": null,
      "adminId": null,
      "fechaRespuesta": null,
      "createdAt": "2026-06-29T10:00:00.000Z",
      "apoderado": {
        "id": "uuid-apoderado",
        "nombres": "María Elena",
        "apellidos": "García López",
        "email": "maria@email.com"
      },
      "alumno": {
        "id": "uuid-alumno",
        "dni": "12345678",
        "nombres": "Juan Carlos",
        "apellidos": "García López",
        "nivel": "Primaria",
        "grado": 3,
        "seccion": "A"
      }
    }
  ]
}
```

#### PATCH /api/admin/solicitudes-vinculacion/:id/aprobar

Aprueba una solicitud y crea la vinculación.

**Params:**
- `id`: ID de la solicitud (número)

**Response 200:**
```json
{
  "success": true,
  "message": "Solicitud aprobada y vinculación creada"
}
```

**Efecto secundario:**
- Se crea registro en tabla `ApoderadoAlumno`
- Se actualiza estado de solicitud a "Aprobada"

#### PATCH /api/admin/solicitudes-vinculacion/:id/rechazar

Rechaza una solicitud con motivo.

**Params:**
- `id`: ID de la solicitud (número)

**Body:**
```json
{
  "motivo": "El DNI no corresponde a un alumno activo"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Solicitud rechazada"
}
```

**Validación:**
- `motivo`: requerido, mínimo 10 caracteres

## Estados de Solicitud

| Estado | Descripción |
|--------|-------------|
| `Pendiente` | Solicitud creada, esperando revisión |
| `Aprobada` | Solicitud aprobada, vinculación creada |
| `Rechazada` | Solicitud rechazada con motivo |

## Modelos de Base de Datos

### SolicitudVinculacion

```prisma
model SolicitudVinculacion {
  id               Int      @id @default(autoincrement())
  apoderadoId      String
  alumnoId         String
  parentesco       String
  parentescoCustom String?
  estado           String   @default("Pendiente")
  motivo           String?
  adminId          String?
  fechaRespuesta   DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  apoderado Usuario @relation(fields: [apoderadoId], references: [id])
  alumno    Alumno  @relation(fields: [alumnoId], references: [id])

  @@unique([apoderadoId, alumnoId, estado])
}
```

### ApoderadoAlumno (vinculación creada al aprobar)

```prisma
model ApoderadoAlumno {
  id          Int      @id @default(autoincrement())
  apoderadoId String
  alumnoId    String
  parentesco  String
  esPrincipal Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  apoderado Usuario @relation(fields: [apoderadoId], references: [id])
  alumno    Alumno  @relation(fields: [alumnoId], references: [id])

  @@unique([apoderadoId, alumnoId])
}
```

## Seguridad

- **Autenticación**: JWT en httpOnly cookie
- **RBAC**: Solo SUPER_ADMIN y ADMIN pueden aprobar/rechazar
- **Validación**: Zod en todos los endpoints
- **Propiedad**: Apoderado solo ve sus alumnos/solicitudes
- **Transaccionalidad**: Aprobación usa transacción de BD

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Alumno no encontrado con ese DNI" | DNI no existe en BD | Verificar DNI |
| "Ya estás vinculado con este alumno" | Vinculación ya existe | No hacer nada |
| "Ya existe una solicitud pendiente" | Solicitud pendiente | Esperar o cancelar |
| "Solicitud no encontrada | ID no válido | Verificar ID |
| "La solicitud ya fue procesada" | Estado no es Pendiente | No se puede modificar |
| "No tienes permiso para cancelar" | No es el apoderado | Solo el apoderado puede cancelar |
