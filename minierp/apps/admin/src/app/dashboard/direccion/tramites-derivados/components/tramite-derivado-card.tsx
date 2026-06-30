'use client';

import { Clock, FileText, User, GraduationCap, Eye, CheckCircle } from 'lucide-react';

interface TramiteDerivado {
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
    telefono: string | null;
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

interface TramiteDerivadoCardProps {
  tramite: TramiteDerivado;
  onViewDetail: (tramite: TramiteDerivado) => void;
  onAprobar: (tramiteId: string) => void;
}

export default function TramiteDerivadoCard({ tramite, onViewDetail, onAprobar }: TramiteDerivadoCardProps) {
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

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
      esAntiguo ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-gray-900">
                {tramite.idSeguimiento}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Clock size={12} />
                Derivado a Dirección
              </span>
              {esAntiguo && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                  {diffDias} días
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
              <span className="inline-flex items-center gap-1">
                <FileText size={14} className="text-gray-400" />
                {tramite.tipo.nombre}
              </span>
              <span className="inline-flex items-center gap-1">
                <User size={14} className="text-gray-400" />
                {tramite.apoderado.nombres} {tramite.apoderado.apellidos}
              </span>
              <span className="inline-flex items-center gap-1">
                <GraduationCap size={14} className="text-gray-400" />
                {tramite.alumno.nombres} {tramite.alumno.apellidos}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              <span>Grado: {tramite.alumno.nivel} {tramite.alumno.grado}° {tramite.alumno.seccion}</span>
              <span>Docs: {tramite.documentos.length}</span>
              <span>Creado: {formatFecha(fechaCreacion)}</span>
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
              onClick={() => onAprobar(tramite.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <CheckCircle size={16} />
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
