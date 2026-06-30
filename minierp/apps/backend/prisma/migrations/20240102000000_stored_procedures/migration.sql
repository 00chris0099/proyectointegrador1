-- ==================== STORED PROCEDURES ====================

-- Procedimiento para actualizar morosidad (diaria a medianoche)
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

-- Procedimiento para conciliación de pago (transacción ACID)
CREATE OR REPLACE FUNCTION sp_conciliar_pago(
  p_estado_cuenta_id UUID,
  p_monto DECIMAL(10,2),
  p_usuario_id UUID
)
RETURNS void AS $$
DECLARE
  v_monto_anterior DECIMAL(10,2);
BEGIN
  -- Obtener monto anterior
  SELECT monto_pagado INTO v_monto_anterior
  FROM estado_cuenta WHERE id = p_estado_cuenta_id;

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
  VALUES (p_estado_cuenta_id, p_usuario_id, v_monto_anterior, v_monto_anterior + p_monto, 'Conciliación de pago');
END;
$$ LANGUAGE plpgsql;

-- ==================== FUNCTIONS PARA TRIGGERS ====================

-- Function para generar ID de seguimiento automático
CREATE OR REPLACE FUNCTION fn_generar_seguimiento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.id_seguimiento := 'TRM-' || EXTRACT(YEAR FROM NOW()) || '-'
    || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para auditar cambios de estado en trámites
CREATE OR REPLACE FUNCTION fn_auditar_tramite()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO auditoria_tramites (tramite_id, usuario_id, estado_anterior, estado_nuevo, accion)
    VALUES (NEW.id, COALESCE(NEW.updated_by, '00000000-0000-0000-0000-000000000000'::uuid), OLD.estado, NEW.estado, 'CAMBIO_ESTADO');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para auditar cambios en estado de cuenta
CREATE OR REPLACE FUNCTION fn_auditar_estado_cuenta()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.monto_pagado IS DISTINCT FROM NEW.monto_pagado THEN
    INSERT INTO auditoria_financiera (estado_cuenta_id, usuario_id, monto_original, monto_final, motivo_ajuste)
    VALUES (NEW.id, COALESCE(NEW.updated_by, '00000000-0000-0000-0000-000000000000'::uuid), OLD.monto_pagado, NEW.monto_pagado, 'Actualización de pago');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

-- Trigger para generar ID de seguimiento automáticamente
CREATE TRIGGER trg_seguimiento
  BEFORE INSERT ON tramites
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_seguimiento();

-- Trigger para auditar cambios de estado en trámites
CREATE TRIGGER trg_auditar_tramites
  AFTER UPDATE ON tramites
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditar_tramite();

-- Trigger para auditar cambios en estado de cuenta
CREATE TRIGGER trg_auditar_estado_cuenta
  AFTER UPDATE ON estado_cuenta
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditar_estado_cuenta();

-- ==================== ÍNDICES ADICIONALES ====================

-- Índice para trámites derivados a dirección
CREATE INDEX idx_tramites_derivados ON tramites(estado) WHERE estado = 'Derivado a Dirección';

-- Índice para pagos por estado de validación
CREATE INDEX idx_pagos_estado ON reporte_pagos(estado_validacion);

-- Índice para dashboard tesorería: deudas por nivel
CREATE INDEX idx_estado_cuenta_nivel ON estado_cuenta(estado, fecha_vencimiento);

-- ==================== RESTRICCIONES DE SEGURIDAD ====================

-- Restricción para tablas de auditoría (APPEND-ONLY)
-- Nota: En PostgreSQL, para hacer tablas truly append-only se necesitan
-- permisos a nivel de objeto o triggers BEFORE UPDATE/DELETE

-- Crear role solo lectura para tablas de auditoría
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'readonly_audit') THEN
    CREATE ROLE readonly_audit;
  END IF;
END
$$;

-- Otorgar permisos de solo lectura a tablas de auditoría
GRANT SELECT ON auditoria_tramites TO readonly_audit;
GRANT SELECT ON auditoria_financiera TO readonly_audit;

-- Revocar permisos de escritura (prevenir UPDATE/DELETE manual)
REVOKE UPDATE, DELETE ON auditoria_tramites FROM PUBLIC;
REVOKE UPDATE, DELETE ON auditoria_financiera FROM PUBLIC;
