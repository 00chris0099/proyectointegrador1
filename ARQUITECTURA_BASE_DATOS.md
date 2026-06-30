# 🗄️ Arquitectura de Base de Datos — PostgreSQL 16

## Mini-ERP I.E.P. La Asunción

---

## 1. Resumen Ejecutivo

Base de datos PostgreSQL 16 desplegada en VPS (4GB RAM, 2 vCPU) con EasyPanel, gestionada mediante Prisma ORM, con caché Redis para sesiones y tokens.

---

## 2. Stack de Persistencia

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| DB Principal | PostgreSQL 16 | Almacenamiento transaccional |
| ORM | Prisma | Migraciones, queries tipadas |
| Caché | Redis 7 | Sesiones, tokens JWT, rate limiting |
| Almacenamiento archivos | imgbb API | Imágenes de vouchers/comprobantes |

---

## 3. Modelo Entidad-Relación (ER)

### 3.1 Bounded Context: Identidad

```
┌─────────────────────────────────────────────────────────────────┐
│                        TABLA: usuarios                         │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID (PK)                                       │
│ email           VARCHAR(255) UNIQUE NOT NULL                    │
│ password_hash   VARCHAR(255) NOT NULL                           │
│ nombres         VARCHAR(100) NOT NULL                           │
│ apellidos       VARCHAR(100) NOT NULL                           │
│ dni             VARCHAR(8) UNIQUE NOT NULL                      │
│ telefono        VARCHAR(9)                                      │
│ estado          BOOLEAN DEFAULT true                            │
│ avatar_url      TEXT                                            │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
│ updated_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TABLA: roles                             │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ nombre          VARCHAR(50) UNIQUE NOT NULL                     │
│ descripcion     TEXT                                            │
│ permisos        JSONB DEFAULT '[]'                              │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   TABLA: usuario_roles (pivote)                │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ usuario_id      UUID (FK) → usuarios.id                        │
│ rol_id          INT (FK) → roles.id                            │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
│ UNIQUE(usuario_id, rol_id)                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   TABLA: tokens_recuperacion                   │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ usuario_id      UUID (FK) → usuarios.id                        │
│ token           VARCHAR(255) UNIQUE NOT NULL                    │
│ expires_at      TIMESTAMP NOT NULL                              │
│ used            BOOLEAN DEFAULT false                           │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Bounded Context: Documental

```
┌─────────────────────────────────────────────────────────────────┐
│                     TABLA: alumnos                              │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID (PK)                                       │
│ dni             VARCHAR(8) UNIQUE NOT NULL                      │
│ nombres         VARCHAR(100) NOT NULL                           │
│ apellidos       VARCHAR(100) NOT NULL                           │
│ fecha_nac       DATE                                            │
│ nivel           VARCHAR(20) NOT NULL (Primaria/Secundaria)      │
│ grado           INT NOT NULL                                    │
│ seccion         VARCHAR(5) NOT NULL                             │
│ estado          BOOLEAN DEFAULT true                            │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
│ updated_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                TABLA: apoderado_alumno (pivote)                │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ apoderado_id    UUID (FK) → usuarios.id                        │
│ alumno_id       UUID (FK) → alumnos.id                         │
│ parentesco      VARCHAR(30) NOT NULL                            │
│ es_principal    BOOLEAN DEFAULT false                           │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
│ UNIQUE(apoderado_id, alumno_id)                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  TABLA: tipos_tramite (catálogo)               │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ nombre          VARCHAR(100) NOT NULL                           │
│ descripcion     TEXT                                            │
│ requisitos      JSONB DEFAULT '[]'                              │
│ activo          BOOLEAN DEFAULT true                            │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TABLA: tramites                            │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID (PK)                                       │
│ id_seguimiento  VARCHAR(20) UNIQUE NOT NULL (TRM-2026-XXXX)    │
│ apoderado_id    UUID (FK) → usuarios.id                        │
│ alumno_id       UUID (FK) → alumnos.id                         │
│ tipo_id         INT (FK) → tipos_tramite.id                    │
│ estado          VARCHAR(30) DEFAULT 'Pendiente'                 │
│ comentario      TEXT                                            │
│ fecha_creacion  TIMESTAMP DEFAULT NOW()                         │
│ fecha_culminacion TIMESTAMP NULL                                 │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
│ updated_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘
   Estados válidos: Pendiente → Derivado a Dirección → Finalizado
                    Pendiente → Observado → (corregir) → Pendiente

┌─────────────────────────────────────────────────────────────────┐
│                 TABLA: documentos_adjuntos                      │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ tramite_id      UUID (FK) → tramites.id                        │
│ url_archivo     TEXT NOT NULL                                   │
│ nombre_original VARCHAR(255) NOT NULL                           │
│ tipo_mime       VARCHAR(50) NOT NULL                            │
│ peso_bytes      INT NOT NULL                                    │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                TABLA: auditoria_tramites                        │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ tramite_id      UUID (FK) → tramites.id                        │
│ usuario_id      UUID (FK) → usuarios.id                        │
│ fecha_hora      TIMESTAMP DEFAULT NOW()                         │
│ estado_anterior VARCHAR(30)                                     │
│ estado_nuevo    VARCHAR(30)                                     │
│ accion          VARCHAR(50) NOT NULL                            │
│ detalles        JSONB                                           │
└─────────────────────────────────────────────────────────────────┘
   ⚠️ TABLA APPEND-ONLY: Sin UPDATE/DELETE permitidos
```

### 3.3 Bounded Context: Tesorería

```
┌─────────────────────────────────────────────────────────────────┐
│                 TABLA: conceptos_pago (catálogo)               │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ nombre          VARCHAR(100) NOT NULL (ej: "Pensión Marzo")    │
│ descripcion     TEXT                                            │
│ monto           DECIMAL(10,2) NOT NULL                          │
│ activo          BOOLEAN DEFAULT true                            │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   TABLA: estado_cuenta                          │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID (PK)                                       │
│ alumno_id       UUID (FK) → alumnos.id                         │
│ concepto_id     INT (FK) → conceptos_pago.id                   │
│ monto_total     DECIMAL(10,2) NOT NULL                          │
│ monto_pagado    DECIMAL(10,2) DEFAULT 0.00                      │
│ saldo_pendiente DECIMAL(10,2) GENERATED ALWAYS AS              │
│                     (monto_total - monto_pagado) STORED         │
│ fecha_vencimiento DATE NOT NULL                                  │
│ estado          VARCHAR(20) DEFAULT 'Pendiente'                 │
│ dias_mora       INT DEFAULT 0                                   │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
│ updated_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘
   Estados: Pendiente → En Validación → Pagado
            Pendiente → Moroso → Pagado

┌─────────────────────────────────────────────────────────────────┐
│                  TABLA: reporte_pagos                           │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID (PK)                                       │
│ estado_cuenta_id UUID (FK) → estado_cuenta.id                  │
│ apoderado_id    UUID (FK) → usuarios.id                        │
│ numero_operacion VARCHAR(50) NOT NULL                           │
│ fecha_pago      DATE NOT NULL                                   │
│ monto_pago      DECIMAL(10,2) NOT NULL                          │
│ url_voucher     TEXT NOT NULL (URL de imgbb)                    │
│ estado_validacion VARCHAR(20) DEFAULT 'En Validación'           │
│ motivo_rechazo  TEXT                                            │
│ validado_por    UUID (FK) → usuarios.id NULL                   │
│ fecha_validacion TIMESTAMP NULL                                  │
│ created_at      TIMESTAMP DEFAULT NOW()                         │
│ updated_at      TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘
   Estados: En Validación → Aprobado
            En Validación → Rechazado

┌─────────────────────────────────────────────────────────────────┐
│                TABLA: auditoria_financiera                      │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ estado_cuenta_id UUID (FK) → estado_cuenta.id                  │
│ usuario_id      UUID (FK) → usuarios.id                        │
│ fecha_hora      TIMESTAMP DEFAULT NOW()                         │
│ monto_original  DECIMAL(10,2)                                   │
│ monto_final     DECIMAL(10,2)                                   │
│ motivo_ajuste   TEXT NOT NULL                                   │
└─────────────────────────────────────────────────────────────────┘
   ⚠️ TABLA APPEND-ONLY: Sin UPDATE/DELETE permitidos
```

### 3.4 Bounded Context: Notificaciones

```
┌─────────────────────────────────────────────────────────────────┐
│              TABLA: configuracion_notificaciones                │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ tipo_alerta     VARCHAR(30) NOT NULL (PREVENTIVA/MOROSIDAD)    │
│ cuerpo_mensaje  TEXT NOT NULL                                   │
│ activo          BOOLEAN DEFAULT true                            │
│ fecha_ultima_actualizacion TIMESTAMP DEFAULT NOW()              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                TABLA: logs_notificaciones                       │
├─────────────────────────────────────────────────────────────────┤
│ id              SERIAL (PK)                                     │
│ alumno_id       UUID (FK) → alumnos.id                         │
│ tipo_alerta     VARCHAR(30) NOT NULL                            │
│ canal           VARCHAR(20) NOT NULL (whatsapp/email)           │
│ estado_envio    VARCHAR(20) NOT NULL                            │
│ respuesta_api   JSONB                                           │
│ fecha_envio     TIMESTAMP DEFAULT NOW()                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Índices Optimizados

```sql
-- Índices para Consultas de Alta Frecuencia

-- Búsqueda de usuarios por email (login)
CREATE UNIQUE INDEX idx_usuarios_email ON usuarios(email);

-- Búsqueda de alumnos por DNI (vinculación)
CREATE UNIQUE INDEX idx_alumnos_dni ON alumnos(dni);

-- Índices compuestos para consultas académicas
CREATE INDEX idx_alumnos_nivel_grado_seccion ON alumnos(nivel, grado, seccion);

-- Trámites de un apoderado (ordenados por fecha)
CREATE INDEX idx_tramites_apoderado ON tramites(apoderado_id, fecha_creacion DESC);

-- Trámites pendientes (dashboard secretaría)
CREATE INDEX idx_tramites_estado ON tramites(estado) WHERE estado = 'Pendiente';

-- Trámites derivados a dirección
CREATE INDEX idx_tramites_derivados ON tramites(estado) WHERE estado = 'Derivado a Dirección';

-- Estado de cuenta por alumno
CREATE INDEX idx_estado_cuenta_alumno ON estado_cuenta(alumno_id, estado);

-- Dashboard tesorería: deudas por nivel
CREATE INDEX idx_estado_cuenta_vencimiento ON estado_cuenta(fecha_vencimiento, estado);

-- Logs de notificaciones por fecha
CREATE INDEX idx_logs_notif_fecha ON logs_notificaciones(fecha_envio DESC);

-- Auditoría por trámite
CREATE INDEX idx_auditoria_tramite ON auditoria_tramites(tramite_id, fecha_hora DESC);

-- Pagos por estado de validación
CREATE INDEX idx_pagos_estado ON reporte_pagos(estado_validacion);
```

---

## 5. Stored Procedures Críticos

### 5.1 Actualización Automática de Morosidad (diaria a medianoche)

```sql
CREATE OR REPLACE FUNCTION sp_actualizar_morosidad()
RETURNS void AS $$
BEGIN
  UPDATE estado_cuenta
  SET
    dias_mora = EXTRACT(DAY FROM NOW() - fecha_vencimiento),
    estado = CASE
      WHEN EXTRACT(DAY FROM NOW() - fecha_vencimiento) > 0
        AND estado = 'Pendiente' THEN 'Moroso'
      ELSE estado
    END,
    updated_at = NOW()
  WHERE fecha_vencimiento < NOW()
    AND estado IN ('Pendiente', 'Moroso');
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Conciliación de Pago (transacción ACID)

```sql
CREATE OR REPLACE FUNCTION sp_conciliar_pago(
  p_estado_cuenta_id UUID,
  p_monto DECIMAL(10,2),
  p_usuario_id UUID
)
RETURNS void AS $$
BEGIN
  BEGIN TRANSACTION;

  -- Actualizar saldo
  UPDATE estado_cuenta
  SET
    monto_pagado = monto_pagado + p_monto,
    estado = CASE
      WHEN (monto_pagado + p_monto) >= monto_total THEN 'Pagado'
      ELSE estado
    END,
    updated_at = NOW()
  WHERE id = p_estado_cuenta_id;

  -- Registrar auditoría
  INSERT INTO auditoria_financiera (estado_cuenta_id, usuario_id, monto_original, monto_final, motivo_ajuste)
  SELECT id, p_usuario_id, monto_pagado, monto_pagado + p_monto, 'Conciliación de pago'
  FROM estado_cuenta WHERE id = p_estado_cuenta_id;

  COMMIT;
END;
$$ LANGUAGE plpgsql;
```

### 5.3 Generación de ID de Seguimiento

```sql
CREATE OR REPLACE FUNCTION fn_generar_seguimiento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.id_seguimiento := 'TRM-' || EXTRACT(YEAR FROM NOW()) || '-'
    || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seguimiento
  BEFORE INSERT ON tramites
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_seguimiento();
```

---

## 6. Triggers de Auditoría

```sql
-- Trigger para auditoría de trámites (APPEND-ONLY)
CREATE OR REPLACE FUNCTION fn_auditar_tramite()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO auditoria_tramites (tramite_id, usuario_id, estado_anterior, estado_nuevo, accion)
    VALUES (NEW.id, NEW.updated_by, OLD.estado, NEW.estado, 'CAMBIO_ESTADO');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditar_tramites
  AFTER UPDATE ON tramites
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditar_tramite();

-- Trigger para auditoría financiera (APPEND-ONLY)
CREATE OR REPLACE FUNCTION fn_auditar_estado_cuenta()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.monto_pagado IS DISTINCT FROM NEW.monto_pagado THEN
    INSERT INTO auditoria_financiera (estado_cuenta_id, usuario_id, monto_original, monto_final, motivo_ajuste)
    VALUES (NEW.id, NEW.updated_by, OLD.monto_pagado, NEW.monto_pagado, 'Actualización de pago');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditar_estado_cuenta
  AFTER UPDATE ON estado_cuenta
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditar_estado_cuenta();
```

---

## 7. Seed Data Inicial

```sql
-- Roles del sistema
INSERT INTO roles (nombre, descripcion, permisos) VALUES
  ('Apoderado', 'Padre/Tutor del alumno', '["tramites.create", "tramites.read", "pagos.reportar", "perfil.read", "perfil.update"]'),
  ('Secretaria', 'Personal administrativo', '["tramites.read", "tramites.derivar", "tramites.observar", "alumnos.read"]'),
  ('Direccion', 'Directora de la institución', '["tramites.read", "tramites.aprobar", "reportes.financiero", "auditoria.read"]'),
  ('Tesoreria', 'Personal financiero', '["pagos.validar", "pagos.rechazar", "dashboard.read", "reportes.financiero"]'),
  ('Administrador', 'Super usuario del sistema', '["*"]');

-- Tipos de trámite
INSERT INTO tipos_tramite (nombre, descripcion, requisitos) VALUES
  ('Constancia de vacante', 'Certificado de vacante escolar', '["DNI del alumno", "Partida de nacimiento"]'),
  ('Justificación de inasistencia', 'Justificación por enfermedad', '["Certificado médico", "DNI del apoderado"]'),
  ('Constancia de estudios', 'Comprobante de matrícula activa', '["DNI del alumno"]'),
  ('Carta de conducción', 'Permiso para actividades', '["DNI del apoderado", "Fotografía"]');

-- Configuración de notificaciones
INSERT INTO configuracion_notificaciones (tipo_alerta, cuerpo_mensaje) VALUES
  ('PREVENTIVA', 'Estimado {nombre_apoderado}, le recordamos que la pensión de {nombre_alumno} por S/{monto_deuda} vence el {fecha_vencimiento}. Gracias.'),
  ('MOROSIDAD', 'Estimado {nombre_apoderado}, la pensión de {nombre_alumno} por S/{monto_deuda} se encuentra vencida desde hace {dias_mora} días. Le solicitamos regularizar a la brevedad.');
```

---

## 8. Diagrama Visual de Tablas

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   usuarios   │────<│ usuario_roles │>────│    roles     │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐     ┌──────────────┐
│ apoderado_   │>────│   alumnos    │
│   alumno     │     └──────────────┘
└──────────────┘            │
                            │ 1:N
                            ▼
┌──────────────┐     ┌──────────────┐
│   tramites   │────<│ documentos_  │
│              │     │   adjuntos   │
└──────────────┘     └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│ auditoria_   │  (APPEND-ONLY)
│  tramites    │
└──────────────┘

┌──────────────┐     ┌──────────────┐
│ estado_      │────<│ reporte_     │
│   cuenta     │     │   pagos      │
└──────────────┘     └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│ auditoria_   │  (APPEND-ONLY)
│  financiera  │
└──────────────┘
```

---

## 9. Backup Strategy

```bash
# Cron job diario en el VPS (ejecutar a las 3:00 AM)
0 3 * * * docker exec minierp-postgres pg_dump -U minierp_user minierp_db | gzip > /backups/minierp_$(date +\%Y\%m\%d).sql.gz

# Retener últimos 7 backups
0 4 * * * find /backups -name "minierp_*.sql.gz" -mtime +7 -delete
```

---

## 10. Consideraciones de Rendimiento

| Métrica | Objetivo | Estrategia |
|---------|----------|------------|
| Conexiones simultáneas | 50-100 | Connection pooling (PgBouncer) |
| Queries por segundo | 500+ | Índices + prepared statements |
| Tiempo de respuesta | < 100ms | Índices compuestos + Redis cache |
| Uptime | 99.9% | Health checks + auto-restart |

---

## 11. Seguridad

- **Cifrado en tránsito**: SSL/TLS forzado para conexiones remotas
- **Cifrado en repos**: PostgreSQL con pgcrypto para datos sensibles
- **RBAC**: Control de acceso por roles a nivel de aplicación
- **APPEND-ONLY**: Tablas de auditoría sin permisos de UPDATE/DELETE
- **Secretos**: Variables de entorno en EasyPanel, nunca en código
- **Backups**: Encriptados con GPG antes de almacenar
