# HU-05: Creación de Solicitud de Trámite

## Descripción

Esta HU permite a los apoderados crear solicitudes de trámites administrativos de forma virtual, seleccionando opciones preconfiguradas y adjuntando documentos si es necesario.

## Tipos de Trámite Disponibles

| # | Nombre | Descripción |
|---|--------|-------------|
| 1 | Constancia de Vacante | Certificado de vacante escolar para transferencia |
| 2 | Justificación de Inasistencia | Justificación médica o personal por faltas |
| 3 | Certificado de Estudios | Comprobante de matrícula activa y cursado |
| 4 | Carta de Presentación | Carta para instituciones externas |
| 5 | Declaración Jurada | Declaración bajo juramento para fines académicos |
| 6 | Constancia de Notas | Reporte oficial de calificaciones |
| 7 | Historial Académico | Historial completo de estudios realizados |
| 8 | Solicitud Especial | Cualquier otra solicitud no estandarizada |

## Flujos Principales

### Flujo 1: Crear un trámite

1. El apoderado ingresa a "Mis Trámites"
2. Hace clic en "Nuevo Trámite"
3. Selecciona el tipo de trámite
4. Selecciona el alumno vinculado
5. Agrega observaciones (opcional)
6. Adjunta documentos (opcional, max 5MB PDF/JPG)
7. Envía la solicitud
8. Recibe ID de seguimiento único (TRM-2026-XXXX)

### Flujo 2: Seguimiento

1. El apoderado ve la lista de sus trámites
2. Puede filtrar por estado
3. Puede buscar por ID o nombre
4. Hace clic en "Ver" para detalles

## Endpoints API

### GET /api/tramites/tipos

Lista los tipos de trámite activos.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Constancia de Vacante",
      "descripcion": "Certificado de vacante escolar para transferencia",
      "requisitos": ["DNI del alumno", "Partida de nacimiento"],
      "activo": true
    }
  ]
}
```

### POST /api/tramites

Crea un nuevo trámite.

**Body:**
```json
{
  "alumnoId": "uuid-alumno",
  "tipoId": 1,
  "comentario": "Necesito la constancia para transferencia"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Trámite creado exitosamente",
  "data": {
    "id": "uuid-tramite",
    "idSeguimiento": "TRM-2026-A1B2",
    "apoderadoId": "uuid-apoderado",
    "alumnoId": "uuid-alumno",
    "tipoId": 1,
    "estado": "Pendiente",
    "comentario": "Necesito la constancia para transferencia",
    "fechaCreacion": "2026-06-29T10:00:00.000Z"
  }
}
```

### GET /api/tramites/me

Lista los trámites del apoderado autenticado.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-tramite",
      "idSeguimiento": "TRM-2026-A1B2",
      "estado": "Pendiente",
      "comentario": "...",
      "fechaCreacion": "2026-06-29T10:00:00.000Z",
      "alumno": {
        "id": "uuid-alumno",
        "dni": "12345678",
        "nombres": "Juan Carlos",
        "apellidos": "García López",
        "nivel": "Primaria",
        "grado": 3,
        "seccion": "A"
      },
      "tipo": {
        "id": 1,
        "nombre": "Constancia de Vacante",
        "descripcion": "..."
      },
      "documentos": []
    }
  ]
}
```

### GET /api/tramites/:id

Obtiene el detalle de un trámite específico.

### POST /api/tramites/:id/documentos

Agrega un documento adjunto a un trámite.

## Tracking ID

El ID de seguimiento tiene el formato: `TRM-{AÑO}-{4 caracteres}`

Ejemplo: `TRM-2026-A1B2`

## Estados del Trámite

| Estado | Descripción |
|--------|-------------|
| `Pendiente` | Recién creado, esperando revisión |
| `En Proceso` | Siendo revisado por secretaría |
| `Observado` | Requiere correcciones |
| `Derivado a Dirección` | Enviado a la directora |
| `Finalizado` | Trámite completado |

## Seguridad

- **Autenticación**: JWT en httpOnly cookie
- **Validación**: Solo alumnos vinculados al apoderado
- **Archivos**: Máximo 5MB, solo PDF/JPG
- **IDs Únicos**: Generados automáticamente con verificación de unicidad

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Alumno no encontrado" | ID de alumno no válido | Verificar selección |
| "No estás vinculado con este alumno" | Alumno no vinculado | Vincular primero (HU-04) |
| "Tipo de trámite no válido" | Tipo ID no existe | Seleccionar tipo válido |
