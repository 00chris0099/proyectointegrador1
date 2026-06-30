# Guía del Administrador: Gestión de Vinculaciones

## ¿Qué es la gestión de vinculaciones?

Como administrador, puedes revisar, aprobar o rechazar las solicitudes de vinculación que envían los apoderados para conectarse con sus hijos/alumnos.

## Acceso al módulo

### Desde el Panel Web

1. **Inicia sesión** con tu cuenta de administrador
2. En el menú lateral, haz clic en **"Solicitudes Vinculación"**
3. Verás la lista de solicitudes

## Panel de solicitudes

### Filtros disponibles

| Filtro | Descripción |
|--------|-------------|
| **Pendiente** | Solo solicitudes esperando revisión |
| **Todas** | Todas las solicitudes sin filtro |
| **Aprobada** | Solicitudes ya aprobadas |
| **Rechazada** | Solicitudes ya rechazadas |

### Búsqueda

Puedes buscar por:
- Nombre del alumno
- Apellido del alumno
- DNI del alumno
- Nombre del apoderado
- Email del apoderado

### Estadísticas

El panel muestra:
- **Pendientes**: Cantidad de solicitudes esperando revisión
- **Aprobadas**: Cantidad de solicitudes aprobadas
- **Rechazadas**: Cantidad de solicitudes rechazadas

## Aprobar una solicitud

1. Busca la solicitud pendiente
2. Verifica la información:
   - **Alumno**: Nombre, DNI, nivel, grado, sección
   - **Apoderado**: Nombre, email, parentesco
3. Haz clic en **"Aprobar"**
4. Confirma la acción

**Efecto:**
- Se crea la vinculación automáticamente
- El apoderado puede ver al alumno en "Mis Alumnos"
- La solicitud cambia a estado "Aprobada"

## Rechazar una solicitud

1. Busca la solicitud pendiente
2. Verifica la información
3. Haz clic en **"Rechazar"**
4. Escribe el **motivo** del rechazo (mínimo 10 caracteres)
5. Confirma la acción

**Efecto:**
- La solicitud cambia a estado "Rechazada"
- El apoderado ve el motivo del rechazo
- No se crea vinculación

### Motivos válidos de rechazo

- DNI no corresponde a un alumno activo
- El apoderado no está autorizado
- Información incorrecta
- Solicitud duplicada
- Otro (especificar)

## Información de la solicitud

Cada solicitud muestra:

### Datos del alumno
- Nombre completo
- DNI
- Nivel (Primaria/Secundaria)
- Grado
- Sección

### Datos del apoderado
- Nombre completo
- Email
- Parentesco declarado

### Datos de la solicitud
- Fecha de envío
- Estado actual
- Motivo (si fue rechazada)

## Buenas prácticas

### Antes de aprobar

1. **Verifica el DNI** del alumno
2. **Confirma el parentesco** declarado
3. **Revisa el email** del apoderado
4. **Asegúrate** de que no exista vinculación previa

### Antes de rechazar

1. **Escribe un motivo claro** y específico
2. **Mínimo 10 caracteres** en el motivo
3. **Sé profesional** en la redacción
4. **Considera** si se puede resolver con el apoderado

## Errores comunes

### "La solicitud ya fue procesada"

**Causa:** Otro admin ya aprobó o rechazó esta solicitud.

**Solución:** Actualiza la página para ver el estado actual.

### "ID de solicitud inválido"

**Causa:** El ID no es un número válido.

**Solución:** Verifica que el ID sea correcto.

## Reportes

### Solicitudes pendientes

Para ver solicitudes pendientes:
1. Selecciona filtro **"Pendiente"**
2. O usa **"Todas"** y ordena por fecha

### Historial de solicitudes

Para ver todas las solicitudes:
1. Selecciona filtro **"Todas"**
2. Usa la búsqueda para filtrar

## Notificaciones

Actualmente las notificaciones se envían por:
- **Email**: Al aprobar o rechazar
- **n8n**: Integración con WhatsApp (próximamente)

## Acceso rápido

| Ruta | Descripción |
|------|-------------|
| `/dashboard/admin/solicitudes-vinculacion` | Panel principal |
| `?estado=Pendiente` | Solo pendientes |
| `?estado=Aprobada` | Solo aprobadas |
| `?estado=Rechazada` | Solo rechazadas |

## Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Verifica la conexión a la BD
3. Contacta al equipo de desarrollo
