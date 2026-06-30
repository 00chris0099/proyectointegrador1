export interface EstadoCuenta {
  id: string;
  alumnoId: string;
  conceptoId: number;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  fechaVencimiento: Date;
  estado: EstadoPago;
  diasMora: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EstadoPago = 
  | 'Pendiente'
  | 'En Validación'
  | 'Pagado'
  | 'Moroso';

export interface ConceptoPago {
  id: number;
  nombre: string;
  descripcion?: string;
  monto: number;
  activo: boolean;
}

export interface ReportePago {
  id: string;
  estadoCuentaId: string;
  apoderadoId: string;
  numeroOperacion: string;
  fechaPago: Date;
  montoPago: number;
  urlVoucher: string;
  estadoValidacion: EstadoValidacion;
  motivoRechazo?: string;
  validadoPor?: string;
  fechaValidacion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EstadoValidacion = 
  | 'En Validación'
  | 'Aprobado'
  | 'Rechazado';

export interface ReportarPagoRequest {
  estadoCuentaId: string;
  numeroOperacion: string;
  fechaPago: string;
  montoPago: number;
  voucher: File;
}

export interface AuditoriaFinanciera {
  id: number;
  estadoCuentaId: string;
  usuarioId: string;
  fechaHora: Date;
  montoOriginal: number;
  montoFinal: number;
  motivoAjuste: string;
}
