'use client';

import { X, FileText, Download, Clock, User, GraduationCap, Calendar, History, Send, AlertCircle } from 'lucide-react';

interface TramiteDetalle {
  id: string;
  idSeguimiento: string;
  estado: string;
  comentario: string | null;
  fechaCreacion: string;
  fechaCulminacion?: string | null;
  apoderado: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    dni: string;
    telefono?: string | null;
  };
  alumno: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    nivel: string;
    grado: number;
    seccion: string;
    fechaNac?: string | null;
  };
  tipo: {
    id: number;
    nombre: string;
    descripcion: string | null;
    requisitos: unknown;
  };
  documentos: {
    id: number;
    urlArchivo: string;
    nombreOriginal: string;
    tipoMime: string;
    pesoBytes: number;
    createdAt: string;
  }[];
  auditoria?: {
    id: number;
    fechaHora: string;
    estadoAnterior: string | null;
    estadoNuevo: string | null;
    accion: string;
    detalles: unknown;
    usuario: {
      nombres: string;
      apellidos: string;
    };
  }[];
}

interface DetalleTramiteModalProps {
  tramite: TramiteDetalle | null;
  isOpen: boolean;
  onClose: () => void;
  onDerivar?: (tramiteId: string) => void;
  onObservar?: (tramiteId: string) => void;
}

export default function DetalleTramiteModal({ tramite, isOpen, onClose, onDerivar, onObservar }: DetalleTramiteModalProps) {
  if (!isOpen || !tramite) return null;

  const formatFecha = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-3xl p-6 my-8 text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              Detalle del Trámite
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="font-mono text-lg font-bold text-gray-900">{tramite.idSeguimiento}</span>
                {tramite.estado === 'Observado' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <AlertCircle size={14} />
                    {tramite.estado}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Clock size={14} />
                    {tramite.estado}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Tipo:</span> {tramite.tipo.nombre}
              </p>
              {tramite.tipo.descripcion && (
                <p className="text-sm text-gray-500 mt-1">{tramite.tipo.descripcion}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <User size={16} />
                  Apoderado
                </h3>
                <p className="text-sm text-blue-800">{tramite.apoderado.nombres} {tramite.apoderado.apellidos}</p>
                <p className="text-xs text-blue-600 mt-1">DNI: {tramite.apoderado.dni}</p>
                <p className="text-xs text-blue-600">{tramite.apoderado.email}</p>
                {tramite.apoderado.telefono && (
                  <p className="text-xs text-blue-600">Tel: {tramite.apoderado.telefono}</p>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <GraduationCap size={16} />
                  Alumno
                </h3>
                <p className="text-sm text-green-800">{tramite.alumno.nombres} {tramite.alumno.apellidos}</p>
                <p className="text-xs text-green-600 mt-1">DNI: {tramite.alumno.dni}</p>
                <p className="text-xs text-green-600">{tramite.alumno.nivel} {tramite.alumno.grado}° {tramite.alumno.seccion}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-gray-400" />
                Creado: {formatFecha(tramite.fechaCreacion)}
              </span>
              {tramite.fechaCulminacion && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  Culminado: {formatFecha(tramite.fechaCulminacion)}
                </span>
              )}
            </div>

            {tramite.comentario && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">Comentario del Apoderado</h3>
                <p className="text-sm text-yellow-800">{tramite.comentario}</p>
              </div>
            )}

            {tramite.documentos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Documentos Adjuntos ({tramite.documentos.length})</h3>
                <div className="space-y-2">
                  {tramite.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.nombreOriginal}</p>
                          <p className="text-xs text-gray-500">{formatTamano(doc.pesoBytes)}</p>
                        </div>
                      </div>
                      <a
                        href={doc.urlArchivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download size={14} />
                        Descargar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tramite.auditoria && tramite.auditoria.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <History size={16} />
                  Historial de Cambios
                </h3>
                <div className="space-y-2">
                  {tramite.auditoria.map((entry) => (
                    <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{entry.usuario.nombres} {entry.usuario.apellidos}</span>
                          {' '}realizó {entry.accion}
                        </p>
                        <span className="text-xs text-gray-500">{formatFecha(entry.fechaHora)}</span>
                      </div>
                      {entry.estadoAnterior && entry.estadoNuevo && (
                        <p className="text-xs text-gray-600 mt-1">
                          Estado: {entry.estadoAnterior} → {entry.estadoNuevo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(tramite.estado === 'Pendiente' || tramite.estado === 'Observado') && onDerivar && (
                <button
                  onClick={() => onDerivar(tramite.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Send size={16} />
                  Derivar a Dirección
                </button>
              )}
              {tramite.estado === 'Pendiente' && onObservar && (
                <button
                  onClick={() => onObservar(tramite.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <AlertCircle size={16} />
                  Observar
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
