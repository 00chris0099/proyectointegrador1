-- Agregar columna updated_by para auditoría
ALTER TABLE "tramites" ADD COLUMN "updated_by" UUID;
ALTER TABLE "estado_cuenta" ADD COLUMN "updated_by" UUID;

-- Agregar foreign keys para updated_by
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "estado_cuenta" ADD CONSTRAINT "estado_cuenta_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
