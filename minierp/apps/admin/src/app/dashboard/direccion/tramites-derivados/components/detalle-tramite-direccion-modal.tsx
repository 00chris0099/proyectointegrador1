'use client';

import { X, FileText, Download, Clock, User, GraduationCap, Calendar, History, CheckCircle } from 'lucide-react';

interface TramiteDetalle {
  id: string;
  idSeguimiento: string;
  estado: string;
  comentario: string | null;
  comentarioObservacion: string | null;
  fechaCreacion: string;
  fechaCulminacion: string | null;
  apoderado: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    dni: string;
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
    urlArchivo: string;
    createdAt: string;
  }[];
  auditoria: {
    id: number;
    estadoAnterior: string | null;
    estadoNuevo: string | null;
    accion: string;
    detalles: unknown;
    fechaHora: string;
    usuario: {
      id: string;
      nombres: string;
      apellidos: string;
    };
  }[];
}

interface DetalleTramiteDireccionModalProps {
  tramite: TramiteDetalle | null;
  isOpen: boolean;
  onClose: () => void;
  onAprobar?: (tramiteId: string) => void;
  onDescargarConstancia?: (tramiteId: string) => void;
}

export default function DetalleTramiteDireccionModal({
  tramite,
  isOpen,
  onClose,
  onAprobar,
  onDescargarConstancia,
}: DetalleTramiteDireccionModalProps) {
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
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Detalle del Trámite</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-4 mb-3">
              <span className="font-mono text-lg font-bold text-gray-900">{tramite.idSeguimiento}</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Clock size={14} />
                {tramite.estado}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              <Calendar size={14} className="inline mr-1" />
              Creado: {formatFecha(tramite.fechaCreacion)}
              {tramite.fechaCulminacion && (
                <span className="ml-3">
                  Finalizado: {formatFecha(tramite.fechaCulminacion)}
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1 mb-2">
                <User size={14} className="text-blue-500" />
                Alumno
              </h3>
              <p className="text-sm text-gray-700">{tramite.alumno.nombres} {tramite.alumno.apellidos}</p>
              <p className="text-xs text-gray-500">DNI: {tramite.alumno.dni}</p>
              <p className="text-xs text-gray-500">{tramite.alumno.nivel} {tramite.alumno.grado}° {tramite.alumno.seccion}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1 mb-2">
                <GraduationCap size={14} className="text-blue-500" />
                Apoderado
              </h3>
              <p className="text-sm text-gray-700">{tramite.apoderado.nombres} {tramite.apoderado.apellidos}</p>
              <p className="text-xs text-gray-500">DNI: {tramite.apoderado.dni}</p>
              <p className="text-xs text-gray-500">{tramite.apoderado.email}</p>
              {tramite.apoderado.telefono && <p className="text-xs text-gray-500">Tel: {tramite.apoderado.telefono}</p>}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1 mb-2">
              <FileText size={14} className="text-blue-500" />
              Tipo de Trámite
            </h3>
            <p className="text-sm text-gray-700 font-medium">{tramite.tipo.nombre}</p>
            {tramite.tipo.descripcion && <p className="text-xs text-gray-500">{tramite.tipo.descripcion}</p>}
          </div>

          {tramite.comentario && (
            <div className="mb-4 bg-blue-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Comentario del apoderado</h3>
              <p className="text-sm text-blue-800">{tramite.comentario}</p>
            </div>
          )}

          {tramite.comentarioObservacion && (
            <div className="mb-4 bg-orange-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-orange-900 mb-1">Observación de secretaría</h3>
              <p className="text-sm text-orange-800">{tramite.comentarioObservacion}</p>
            </div>
          )}

          {tramite.documentos.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Documentos adjuntos ({tramite.documentos.length})
              </h3>
              <div className="space-y-2">
                {tramite.documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{doc.nombreOriginal}</span>
                      <span className="text-xs text-gray-400">{formatTamano(doc.pesoBytes)}</span>
                    </div>
                    <a
                      href={doc.urlArchivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Download size={14} />
                      Ver
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tramite.auditoria.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1 mb-2">
                <History size={14} className="text-blue-500" />
                Historial de cambios
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tramite.auditoria.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 rounded-lg p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{entry.accion}</span>
                      <span className="text-xs text-gray-400">{formatFecha(entry.fechaHora)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {entry.usuario.nombres} {entry.usuario.apellidos}
                      {entry.estadoAnterior && entry.estadoNuevo && (
                        <span> — {entry.estadoAnterior} → {entry.estadoNuevo}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tramite.estado === 'Derivado a Dirección' && onAprobar && (
                <button
                  onClick={() => onAprobar(tramite.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <CheckCircle size={16} />
                  Aprobar Trámite
                </button>
              )}
              {tramite.estado === 'Finalizado' && onDescargarConstancia && (
                <button
                  onClick={() => onDescargarConstancia(tramite.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Descargar Constancia PDF
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
