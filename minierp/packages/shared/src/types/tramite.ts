export interface Tramite {
  id: string;
  idSeguimiento: string;
  apoderadoId: string;
  alumnoId: string;
  tipoId: number;
  estado: EstadoTramite;
  comentario?: string;
  fechaCreacion: Date;
  fechaCulminacion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EstadoTramite = 
  | 'Pendiente'
  | 'Derivado a Dirección'
  | 'Observado'
  | 'Finalizado';

export interface TipoTramite {
  id: number;
  nombre: string;
  descripcion?: string;
  requisitos: string[];
  activo: boolean;
}

export interface DocumentoAdjunto {
  id: number;
  tramiteId: string;
  urlArchivo: string;
  nombreOriginal: string;
  tipoMime: string;
  pesoBytes: number;
  createdAt: Date;
}

export interface AuditoriaTramite {
  id: number;
  tramiteId: string;
  usuarioId: string;
  fechaHora: Date;
  estadoAnterior?: string;
  estadoNuevo?: string;
  accion: string;
  detalles?: any;
}

export interface CreateTramiteRequest {
  alumnoId: string;
  tipoId: number;
  comentario?: string;
  documentos?: File[];
}

export interface TramiteResponse {
  success: boolean;
  data?: Tramite;
  message?: string;
}
