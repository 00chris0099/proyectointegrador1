#!/bin/bash

# Script para ejecutar seed de la base de datos
# Uso: ./scripts/seed.sh

echo "🌱 Ejecutando seed de la base de datos..."

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker no está ejecutándose. Por favor, inicia Docker."
  exit 1
fi

# Verificar si el contenedor de PostgreSQL está ejecutándose
if ! docker ps | grep -q minierp-postgres; then
  echo "❌ El contenedor de PostgreSQL no está ejecutándose."
  echo "   Ejecuta: docker compose up -d postgres"
  exit 1
fi

# Ejecutar seed
docker compose exec backend npm run db:seed

echo "✅ Seed completado exitosamente"
