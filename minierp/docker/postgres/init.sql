-- Archivo de inicialización de PostgreSQL
-- Este archivo se ejecuta automáticamente al crear el contenedor

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar zona horaria
SET timezone = 'America/Lima';
