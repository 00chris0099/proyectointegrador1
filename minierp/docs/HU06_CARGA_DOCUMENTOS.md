# HU-06: Carga de Documentos Adjuntos

## Endpoints

### POST /api/upload
Sube un archivo a imgBB y retorna la URL pública.

**Headers:**
- `Cookie: accessToken=<token>`

**Body (multipart/form-data):**
- `file`: Archivo PDF o JPG, máximo 5MB

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://i.ibb.co/xxx/image.jpg",
    "deleteUrl": "https://api.imgbb.com/1/delete/xxx",
    "filename": "certificado.pdf",
    "mimetype": "application/pdf",
    "size": 1024000
  }
}
```

**Errors:**
- 400: Archivo no proporcionado, tipo no permitido, o excede 5MB
- 401: No autenticado

---

### POST /api/tramites/:id/documentos
Agrega un documento adjunto a un trámite existente.

**Headers:**
- `Cookie: accessToken=<token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "urlArchivo": "https://i.ibb.co/xxx/image.jpg",
  "nombreOriginal": "certificado.pdf",
  "tipoMime": "application/pdf",
  "pesoBytes": 1024000
}
```

**Validación:**
- `urlArchivo`: URL válida (obligatorio)
- `nombreOriginal`: String, máximo 255 caracteres (obligatorio)
- `tipoMime`: Solo `application/pdf`, `image/jpeg`, `image/jpg` (obligatorio)
- `pesoBytes`: Integer positivo, máximo 5MB (obligatorio)

**Response 201:**
```json
{
  "success": true,
  "message": "Documento agregado exitosamente"
}
```

**Errors:**
- 400: Datos inválidos, trámite no encontrado, o trámite no está pendiente
- 401: No autenticado
- 403: No vinculado al trámite

---

### GET /api/tramites/:id/documentos
Lista todos los documentos de un trámite.

**Headers:**
- `Cookie: accessToken=<token>`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "urlArchivo": "https://i.ibb.co/xxx/image.jpg",
      "nombreOriginal": "certificado.pdf",
      "tipoMime": "application/pdf",
      "pesoBytes": 1024000,
      "createdAt": "2026-06-29T10:30:00.000Z"
    }
  ]
}
```

---

### GET /api/tramites/:id/documentos/:docId
Obtiene información de un documento específico.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "urlArchivo": "https://i.ibb.co/xxx/image.jpg",
    "nombreOriginal": "certificado.pdf",
    "tipoMime": "application/pdf",
    "pesoBytes": 1024000,
    "createdAt": "2026-06-29T10:30:00.000Z"
  }
}
```

**Errors:**
- 404: Documento no encontrado

---

### DELETE /api/tramites/:id/documentos/:docId
Elimina un documento adjunto.

**Restricciones:**
- Solo se pueden eliminar documentos de trámites en estado "Pendiente"

**Response 200:**
```json
{
  "success": true,
  "message": "Documento eliminado exitosamente"
}
```

**Errors:**
- 400: Trámite no está pendiente
- 404: Documento no encontrado

---

## Políticas de Archivos

| Criterio | Valor |
|----------|-------|
| Tipos permitidos | PDF, JPG, JPEG |
| Tamaño máximo | 5MB por archivo |
| Máximo de archivos | 5 por subida |
| Almacenamiento | imgBB (nube) |

## Flujo de Uso

1. **Creación de trámite:**
   - Crear trámite → `POST /api/tramites`
   - Subir cada archivo → `POST /api/upload`
   - Vincular docs → `POST /api/tramites/:id/documentos`

2. **Consulta:**
   - Ver detalle → `GET /api/tramites/:id` (incluye documentos)
   - Listar docs → `GET /api/tramites/:id/documentos`

3. **Eliminación:**
   - Solo si estado = "Pendiente"
   - `DELETE /api/tramites/:id/documentos/:docId`
