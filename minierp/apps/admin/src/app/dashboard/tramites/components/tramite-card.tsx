'use client';

import { FileText, Calendar, GraduationCap, Paperclip, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

interface TramiteCardProps {
  tramite: {
    id: string;
    idSeguimiento: string;
    estado: string;
    comentario: string | null;
    fechaCreacion: string;
    fechaCulminacion: string | null;
    alumno: {
      dni: string;
      nombres: string;
      apellidos: string;
      nivel: string;
      grado: number;
      seccion: string;
    };
    tipo: {
      nombre: string;
    };
    documentos: {
      id: number;
      nombreOriginal: string;
    }[];
  };
}

export default function TramiteCard({ tramite }: TramiteCardProps) {
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} />
            Pendiente
          </span>
        );
      case 'En Proceso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FileText size={12} />
            En Proceso
          </span>
        );
      case 'Observado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle size={12} />
            Observado
          </span>
        );
      case 'Derivado a Dirección':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FileText size={12} />
            Derivado
          </span>
        );
      case 'Finalizado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} />
            Finalizado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tramite.tipo.nombre}</h3>
              <p className="text-sm text-gray-500">ID: {tramite.idSeguimiento}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <GraduationCap size={16} className="text-gray-400" />
              <span>
                {tramite.alumno.nombres} {tramite.alumno.apellidos}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} className="text-gray-400" />
              <span>
                {new Date(tramite.fechaCreacion).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            {tramite.documentos.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip size={16} className="text-gray-400" />
                <span>{tramite.documentos.length} archivo(s)</span>
              </div>
            )}
          </div>

          {tramite.comentario && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {tramite.comentario}
            </p>
          )}

          {tramite.estado === 'Observado' && tramite.comentario && (
            <div className="mt-2 p-2 bg-orange-50 rounded-lg">
              <p className="text-xs font-medium text-orange-700">Observación:</p>
              <p className="text-xs text-orange-600">{tramite.comentario}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(tramite.estado)}
          <Link
            href={`/dashboard/tramites/${tramite.id}`}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye size={16} />
            Ver
          </Link>
        </div>
      </div>
    </div>
  );
}
