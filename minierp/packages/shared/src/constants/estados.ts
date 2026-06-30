export const ESTADOS_TRAMITE = {
  PENDIENTE: 'Pendiente',
  DERIVADO: 'Derivado a Dirección',
  OBSERVADO: 'Observado',
  FINALIZADO: 'Finalizado',
} as const;

export const ESTADOS_PAGO = {
  PENDIENTE: 'Pendiente',
  EN_VALIDACION: 'En Validación',
  PAGADO: 'Pagado',
  MOROSO: 'Moroso',
} as const;

export const ESTADOS_VALIDACION = {
  EN_VALIDACION: 'En Validación',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
} as const;

export const COLORES_ESTADO_TRAMITE: Record<string, string> = {
  [ESTADOS_TRAMITE.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
  [ESTADOS_TRAMITE.DERIVADO]: 'bg-blue-100 text-blue-800',
  [ESTADOS_TRAMITE.OBSERVADO]: 'bg-orange-100 text-orange-800',
  [ESTADOS_TRAMITE.FINALIZADO]: 'bg-green-100 text-green-800',
};

export const COLORES_ESTADO_PAGO: Record<string, string> = {
  [ESTADOS_PAGO.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
  [ESTADOS_PAGO.EN_VALIDACION]: 'bg-blue-100 text-blue-800',
  [ESTADOS_PAGO.PAGADO]: 'bg-green-100 text-green-800',
  [ESTADOS_PAGO.MOROSO]: 'bg-red-100 text-red-800',
};

export const TRANSICIONES_ESTADO_TRAMITE: Record<string, string[]> = {
  [ESTADOS_TRAMITE.PENDIENTE]: [
    ESTADOS_TRAMITE.DERIVADO,
    ESTADOS_TRAMITE.OBSERVADO,
  ],
  [ESTADOS_TRAMITE.OBSERVADO]: [
    ESTADOS_TRAMITE.PENDIENTE,
  ],
  [ESTADOS_TRAMITE.DERIVADO]: [
    ESTADOS_TRAMITE.FINALIZADO,
  ],
  [ESTADOS_TRAMITE.FINALIZADO]: [],
};

export const NIVELES_EDUCATIVOS = [
  'Primaria',
  'Secundaria',
] as const;

export const GRADOS = [1, 2, 3, 4, 5, 6] as const;

export const SECCIONES = ['A', 'B', 'C', 'D'] as const;
