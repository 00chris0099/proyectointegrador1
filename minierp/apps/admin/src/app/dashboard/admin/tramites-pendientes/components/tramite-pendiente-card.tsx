'use client';

import { Clock, FileText, User, GraduationCap, Eye, Send, AlertCircle } from 'lucide-react';

interface TramitePendiente {
  id: string;
  idSeguimiento: string;
  estado: string;
  comentario: string | null;
  fechaCreacion: string;
  apoderado: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    dni: string;
  };
  alumno: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    nivel: string;
    grado: number;
    seccion: string;
  };
  tipo: {
    id: number;
    nombre: string;
    descripcion: string | null;
  };
  documentos: {
    id: number;
    nombreOriginal: string;
    tipoMime: string;
    pesoBytes: number;
  }[];
}

interface TramitePendienteCardProps {
  tramite: TramitePendiente;
  onViewDetail: (tramite: TramitePendiente) => void;
  onDerivar: (tramiteId: string) => void;
  onObservar: (tramiteId: string) => void;
}

export default function TramitePendienteCard({ tramite, onViewDetail, onDerivar, onObservar }: TramitePendienteCardProps) {
  const fechaCreacion = new Date(tramite.fechaCreacion);
  const now = new Date();
  const diffDias = Math.floor((now.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
  const esAntiguo = diffDias > 7;

  const formatFecha = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow ${esAntiguo ? 'border-l-4 border-orange-400' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-gray-900">
                {tramite.idSeguimiento}
              </span>
              {tramite.estado === 'Observado' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <AlertCircle size={12} />
                  Observado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock size={12} />
                  Pendiente
                </span>
              )}
              {esAntiguo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {diffDias} días
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">{tramite.tipo.nombre}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User size={14} className="text-gray-400" />
                {tramite.apoderado.nombres} {tramite.apoderado.apellidos}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap size={14} className="text-gray-400" />
                {tramite.alumno.nombres} {tramite.alumno.apellidos}
              </span>
              <span>
                {tramite.alumno.nivel} {tramite.alumno.grado}° {tramite.alumno.seccion}
              </span>
            </div>
            {tramite.comentario && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {tramite.comentario}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>Creado: {formatFecha(fechaCreacion)}</span>
              <span>{tramite.documentos.length} documento(s)</span>
              <span>
                {tramite.documentos.reduce((acc, d) => acc + d.pesoBytes, 0) > 0 &&
                  formatTamano(tramite.documentos.reduce((acc, d) => acc + d.pesoBytes, 0))}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onViewDetail(tramite)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye size={16} />
            Ver Detalle
          </button>
          <button
            onClick={() => onDerivar(tramite.id)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Send size={16} />
            Derivar
          </button>
          {tramite.estado === 'Pendiente' && (
            <button
              onClick={() => onObservar(tramite.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <AlertCircle size={16} />
              Observar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
