'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Calendar,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import DocumentList from '../components/document-list';
import DocumentUpload from '../components/document-upload';
import { addDocumentoToTramite } from '@/lib/api';

interface Tramite {
  id: string;
  idSeguimiento: string;
  estado: string;
  comentario: string | null;
  fechaCreacion: string;
  fechaCulminacion: string | null;
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
    urlArchivo: string;
    nombreOriginal: string;
    tipoMime: string;
    pesoBytes: number;
  }[];
}

export default function TramiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tramiteId = params.id as string;

  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchTramite = async () => {
    try {
      const res = await fetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/${tramiteId}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setTramite(data.data);
      } else {
        setError(data.message || 'Error al cargar trámite');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTramite();
  }, [tramiteId]);

  const handleUpload = async (file: File) => {
    await addDocumentoToTramite(tramiteId, file);
    await fetchTramite();
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock size={16} />
            Pendiente
          </span>
        );
      case 'En Proceso':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <FileText size={16} />
            En Proceso
          </span>
        );
      case 'Observado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <AlertCircle size={16} />
            Observado
          </span>
        );
      case 'Derivado a Dirección':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <FileText size={16} />
            Derivado a Dirección
          </span>
        );
      case 'Finalizado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} />
            Finalizado
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !tramite) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600">{error || 'Trámite no encontrado'}</p>
          <button
            onClick={() => router.push('/dashboard/tramites')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Volver a Trámites
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/dashboard/tramites"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a Trámites
      </Link>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{tramite.tipo.nombre}</h1>
                  <p className="text-sm text-gray-500">ID: {tramite.idSeguimiento}</p>
                </div>
              </div>
            </div>
            {getStatusBadge(tramite.estado)}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Alumno</h3>
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-gray-400" />
              <p className="text-gray-900">
                {tramite.alumno.nombres} {tramite.alumno.apellidos}
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              DNI: {tramite.alumno.dni} · {tramite.alumno.nivel} {tramite.alumno.grado}°{tramite.alumno.seccion}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Creación</h3>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <p className="text-gray-900">
                {new Date(tramite.fechaCreacion).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {tramite.tipo.descripcion && (
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Descripción del Trámite</h3>
              <p className="text-gray-700">{tramite.tipo.descripcion}</p>
            </div>
          )}

          {tramite.comentario && (
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Observaciones</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-700">{tramite.comentario}</p>
              </div>
            </div>
          )}

          {tramite.estado === 'Observado' && tramite.comentario && (
            <div className="sm:col-span-2">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-800 mb-1">Observación</h3>
                <p className="text-orange-700">{tramite.comentario}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Documentos Adjuntos ({tramite.documentos.length})
            </h3>
            {tramite.estado === 'Pendiente' && (
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus size={16} />
                Agregar Documento
              </button>
            )}
          </div>

          {showUpload && tramite.estado === 'Pendiente' && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <DocumentUpload onUpload={handleUpload} />
            </div>
          )}

          <DocumentList
            documentos={tramite.documentos}
            tramiteId={tramite.id}
            canDelete={tramite.estado === 'Pendiente'}
            onDeleted={fetchTramite}
          />
        </div>
      </div>
    </div>
  );
}
