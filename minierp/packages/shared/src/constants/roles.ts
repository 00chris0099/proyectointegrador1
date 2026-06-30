export const ROLES = {
  APODERADO: 'Apoderado',
  SECRETARIA: 'Secretaria',
  DIRECCION: 'Direccion',
  TESORERIA: 'Tesoreria',
  ADMINISTRADOR: 'Administrador',
} as const;

export const PERMISOS = {
  // Trámites
  TRAMITES_CREATE: 'tramites.create',
  TRAMITES_READ: 'tramites.read',
  TRAMITES_DERIVAR: 'tramites.derivar',
  TRAMITES_OBSERVAR: 'tramites.observar',
  TRAMITES_APROBAR: 'tramites.aprobar',
  
  // Alumnos
  ALUMNOS_READ: 'alumnos.read',
  
  // Pagos
  PAGOS_REPORTAR: 'pagos.reportar',
  PAGOS_VALIDAR: 'pagos.validar',
  PAGOS_RECHAZAR: 'pagos.rechazar',
  
  // Perfil
  PERFIL_READ: 'perfil.read',
  PERFIL_UPDATE: 'perfil.update',
  
  // Dashboard
  DASHBOARD_READ: 'dashboard.read',
  
  // Reportes
  REPORTES_FINANCIERO: 'reportes.financiero',
  
  // Auditoría
  AUDITORIA_READ: 'auditoria.read',
  
  // Admin
  ADMIN_ALL: '*',
} as const;

export const PERMISOS_POR_ROL: Record<string, string[]> = {
  [ROLES.APODERADO]: [
    PERMISOS.TRAMITES_CREATE,
    PERMISOS.TRAMITES_READ,
    PERMISOS.PAGOS_REPORTAR,
    PERMISOS.PERFIL_READ,
    PERMISOS.PERFIL_UPDATE,
  ],
  [ROLES.SECRETARIA]: [
    PERMISOS.TRAMITES_READ,
    PERMISOS.TRAMITES_DERIVAR,
    PERMISOS.TRAMITES_OBSERVAR,
    PERMISOS.ALUMNOS_READ,
  ],
  [ROLES.DIRECCION]: [
    PERMISOS.TRAMITES_READ,
    PERMISOS.TRAMITES_APROBAR,
    PERMISOS.REPORTES_FINANCIERO,
    PERMISOS.AUDITORIA_READ,
  ],
  [ROLES.TESORERIA]: [
    PERMISOS.PAGOS_VALIDAR,
    PERMISOS.PAGOS_RECHAZAR,
    PERMISOS.DASHBOARD_READ,
    PERMISOS.REPORTES_FINANCIERO,
  ],
  [ROLES.ADMINISTRADOR]: [PERMISOS.ADMIN_ALL],
};
