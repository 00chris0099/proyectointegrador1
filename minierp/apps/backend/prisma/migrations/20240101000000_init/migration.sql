-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "telefono" VARCHAR(9),
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "permisos" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "id" SERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_recuperacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumnos" (
    "id" UUID NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "fecha_nac" DATE,
    "nivel" VARCHAR(20) NOT NULL,
    "grado" SMALLINT NOT NULL,
    "seccion" VARCHAR(5) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apoderado_alumno" (
    "id" SERIAL NOT NULL,
    "apoderado_id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "parentesco" VARCHAR(30) NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apoderado_alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_tramite" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "requisitos" JSONB NOT NULL DEFAULT '[]',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramites" (
    "id" UUID NOT NULL,
    "id_seguimiento" VARCHAR(20) NOT NULL,
    "apoderado_id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "tipo_id" INTEGER NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    "comentario" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_culminacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tramites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_adjuntos" (
    "id" SERIAL NOT NULL,
    "tramite_id" UUID NOT NULL,
    "url_archivo" TEXT NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "tipo_mime" VARCHAR(50) NOT NULL,
    "peso_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_tramites" (
    "id" SERIAL NOT NULL,
    "tramite_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_anterior" VARCHAR(30),
    "estado_nuevo" VARCHAR(30),
    "accion" VARCHAR(50) NOT NULL,
    "detalles" JSONB,

    CONSTRAINT "auditoria_tramites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conceptos_pago" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conceptos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado_cuenta" (
    "id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "concepto_id" INTEGER NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "monto_pagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    "dias_mora" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estado_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporte_pagos" (
    "id" UUID NOT NULL,
    "estado_cuenta_id" UUID NOT NULL,
    "apoderado_id" UUID NOT NULL,
    "numero_operacion" VARCHAR(50) NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "monto_pago" DECIMAL(10,2) NOT NULL,
    "url_voucher" TEXT NOT NULL,
    "estado_validacion" VARCHAR(20) NOT NULL DEFAULT 'En Validación',
    "motivo_rechazo" TEXT,
    "validado_por" UUID,
    "fecha_validacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporte_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_financiera" (
    "id" SERIAL NOT NULL,
    "estado_cuenta_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto_original" DECIMAL(10,2) NOT NULL,
    "monto_final" DECIMAL(10,2) NOT NULL,
    "motivo_ajuste" TEXT NOT NULL,

    CONSTRAINT "auditoria_financiera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_notificaciones" (
    "id" SERIAL NOT NULL,
    "tipo_alerta" VARCHAR(30) NOT NULL,
    "cuerpo_mensaje" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_ultima_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_notificaciones" (
    "id" SERIAL NOT NULL,
    "alumno_id" UUID NOT NULL,
    "tipo_alerta" VARCHAR(30) NOT NULL,
    "canal" VARCHAR(20) NOT NULL,
    "estado_envio" VARCHAR(20) NOT NULL,
    "respuesta_api" JSONB,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_roles_usuario_id_rol_id_key" ON "usuario_roles"("usuario_id", "rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacion_token_key" ON "tokens_recuperacion"("token");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_dni_key" ON "alumnos"("dni");

-- CreateIndex
CREATE INDEX "alumnos_nivel_grado_seccion_idx" ON "alumnos"("nivel", "grado", "seccion");

-- CreateIndex
CREATE UNIQUE INDEX "apoderado_alumno_apoderado_id_alumno_id_key" ON "apoderado_alumno"("apoderado_id", "alumno_id");

-- CreateIndex
CREATE UNIQUE INDEX "tramites_id_seguimiento_key" ON "tramites"("id_seguimiento");

-- CreateIndex
CREATE INDEX "tramites_apoderado_id_fecha_creacion_idx" ON "tramites"("apoderado_id", "fecha_creacion" DESC);

-- CreateIndex
CREATE INDEX "tramites_estado_idx" ON "tramites"("estado");

-- CreateIndex
CREATE INDEX "auditoria_tramites_tramite_id_fecha_hora_idx" ON "auditoria_tramites"("tramite_id", "fecha_hora" DESC);

-- CreateIndex
CREATE INDEX "estado_cuenta_alumno_id_estado_idx" ON "estado_cuenta"("alumno_id", "estado");

-- CreateIndex
CREATE INDEX "estado_cuenta_fecha_vencimiento_estado_idx" ON "estado_cuenta"("fecha_vencimiento", "estado");

-- CreateIndex
CREATE INDEX "reporte_pagos_estado_validacion_idx" ON "reporte_pagos"("estado_validacion");

-- CreateIndex
CREATE INDEX "logs_notificaciones_fecha_envio_idx" ON "logs_notificaciones"("fecha_envio" DESC);

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apoderado_alumno" ADD CONSTRAINT "apoderado_alumno_apoderado_id_fkey" FOREIGN KEY ("apoderado_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apoderado_alumno" ADD CONSTRAINT "apoderado_alumno_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_apoderado_id_fkey" FOREIGN KEY ("apoderado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "tipos_tramite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_adjuntos" ADD CONSTRAINT "documentos_adjuntos_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_tramites" ADD CONSTRAINT "auditoria_tramites_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_tramites" ADD CONSTRAINT "auditoria_tramites_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_cuenta" ADD CONSTRAINT "estado_cuenta_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_cuenta" ADD CONSTRAINT "estado_cuenta_concepto_id_fkey" FOREIGN KEY ("concepto_id") REFERENCES "conceptos_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte_pagos" ADD CONSTRAINT "reporte_pagos_estado_cuenta_id_fkey" FOREIGN KEY ("estado_cuenta_id") REFERENCES "estado_cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte_pagos" ADD CONSTRAINT "reporte_pagos_apoderado_id_fkey" FOREIGN KEY ("apoderado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte_pagos" ADD CONSTRAINT "reporte_pagos_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_financiera" ADD CONSTRAINT "auditoria_financiera_estado_cuenta_id_fkey" FOREIGN KEY ("estado_cuenta_id") REFERENCES "estado_cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_financiera" ADD CONSTRAINT "auditoria_financiera_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_notificaciones" ADD CONSTRAINT "logs_notificaciones_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

