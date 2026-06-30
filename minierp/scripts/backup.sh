#!/bin/bash

# Script para crear backup de la base de datos
# Uso: ./scripts/backup.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/minierp_$DATE.sql"

echo "📦 Creando backup de la base de datos..."

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker no está ejecutándose. Por favor, inicia Docker."
  exit 1
fi

# Verificar si el contenedor de PostgreSQL está ejecutándose
if ! docker ps | grep -q minierp-postgres; then
  echo "❌ El contenedor de PostgreSQL no está ejecutándose."
  exit 1
fi

# Crear backup
docker exec minierp-postgres pg_dump -U minierp_user minierp_db > $BACKUP_FILE

# Verificar si el backup se creó correctamente
if [ -f "$BACKUP_FILE" ]; then
  echo "✅ Backup creado exitosamente: $BACKUP_FILE"
  echo "📊 Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
else
  echo "❌ Error al crear el backup"
  exit 1
fi

# Eliminar backups antiguos (más de 7 días)
echo "🗑️ Eliminando backups antiguos..."
find $BACKUP_DIR -name "minierp_*.sql" -mtime +7 -delete

echo "✅ Proceso completado"
