import { authFetch } from '@/lib/api';
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Clock, AlertTriangle, Inbox, Wifi, WifiOff, X } from 'lucide-react';
import { useAdminTramiteSSE, AdminTramiteSSEEvent } from '@/hooks/use-admin-tramite-sse';
import TramiteDerivadoCard from './components/tramite-derivado-card';
import DetalleTramiteDireccionModal from './components/detalle-tramite-direccion-modal';
import ConfirmarAprobacionModal from './components/confirmar-aprobacion-modal';

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

interface TramiteDetalle extends TramiteDerivado {
  comentarioObservacion: string | null;
  fechaCulminacion: string | null;
  apoderado: TramiteDerivado['apoderado'] & { dni: string };
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

export default function TramitesDerivadosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tramites, setTramites] = useState<TramiteDerivado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTramite, setSelectedTramite] = useState<TramiteDetalle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [estadisticas, setEstadisticas] = useState<{ totalDerivados: number; antiguos: number } | null>(null);

  const [aprobandoTramiteId, setAprobandoTramiteId] = useState<string | null>(null);
  const [aprobandoIdSeguimiento, setAprobandoIdSeguimiento] = useState<string>('');
  const [aprobandoLoading, setAprobandoLoading] = useState(false);
  const [aprobandoModalOpen, setAprobandoModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchTramites = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/direccion/tramites/derivados?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setTramites(data.data.tramites);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Error al cargar trámites');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/direccion/tramites/estadisticas`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setEstadisticas(data.data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTramites();
      fetchEstadisticas();
    }
  }, [status, fetchTramites, fetchEstadisticas]);

  const handleSSEDerivado = useCallback((_event: AdminTramiteSSEEvent) => {
    fetchTramites(pagination.page);
    fetchEstadisticas();
  }, [fetchTramites, fetchEstadisticas, pagination.page]);

  const handleSSEAprobado = useCallback((_event: AdminTramiteSSEEvent) => {
    fetchTramites(pagination.page);
    fetchEstadisticas();
  }, [fetchTramites, fetchEstadisticas, pagination.page]);

  const { isConnected, reconnecting } = useAdminTramiteSSE({
    onTramiteDerivado: handleSSEDerivado,
    onTramiteAprobado: handleSSEAprobado,
    enabled: status === 'authenticated',
  });

  const handleViewDetail = async (tramite: TramiteDerivado) => {
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/direccion/tramites/${tramite.id}/detalle`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTramite(data.data);
        setModalOpen(true);
      }
    } catch {
      console.error('Error al cargar detalle');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTramite(null);
  };

  const handleAprobar = (tramiteId: string) => {
    const tramite = tramites.find((t) => t.id === tramiteId);
    if (tramite) {
      setAprobandoTramiteId(tramiteId);
      setAprobandoIdSeguimiento(tramite.idSeguimiento);
      setAprobandoModalOpen(true);
    }
  };

  const handleConfirmAprobar = async (comentario: string) => {
    if (!aprobandoTramiteId) return;

    setAprobandoLoading(true);
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/${aprobandoTramiteId}/aprobar`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ comentario }),
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setTramites((prev) => prev.filter((t) => t.id !== aprobandoTramiteId));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
        setAprobandoModalOpen(false);
        setAprobandoTramiteId(null);
        setAprobandoIdSeguimiento('');
        fetchEstadisticas();
      } else {
        setActionError(data.message || 'Error al aprobar trámite');
      }
    } catch {
      setActionError('Error de conexión al aprobar trámite');
    } finally {
      setAprobandoLoading(false);
    }
  };

  const handleCloseAprobarModal = () => {
    if (!aprobandoLoading) {
      setAprobandoModalOpen(false);
      setAprobandoTramiteId(null);
      setAprobandoIdSeguimiento('');
    }
  };

  const handleDescargarConstancia = async (tramiteId: string) => {
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/direccion/tramites/${tramiteId}/constancia`,
        { credentials: 'include' }
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `constancia-${tramiteId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await res.json();
        console.error('Error al descargar constancia:', data.message);
      }
    } catch {
      console.error('Error de conexión al descargar constancia');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={28} className="text-blue-600" />
            Trámites Derivados a Dirección
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Revisa y aprueba los trámites enviados por secretaría
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Wifi size={12} />
              En tiempo real
            </span>
          ) : reconnecting ? (
            <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              <WifiOff size={12} />
              Reconectando...
            </span>
          ) : null}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Derivados</p>
            <p className="text-xl font-bold text-blue-600">{estadisticas.totalDerivados}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Antiguos (&gt;7 días)</p>
            <p className="text-xl font-bold text-orange-600">{estadisticas.antiguos}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            {error}
          </div>
        </div>
      ) : tramites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Inbox size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay trámites derivados
          </h3>
          <p className="text-gray-500">
            No se encontraron trámites pendientes de revisión.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {tramites.map((tramite) => (
              <TramiteDerivadoCard
                key={tramite.id}
                tramite={tramite}
                onViewDetail={handleViewDetail}
                onAprobar={handleAprobar}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchTramites(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchTramites(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      <DetalleTramiteDireccionModal
        tramite={selectedTramite}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onAprobar={(id) => {
          handleCloseModal();
          handleAprobar(id);
        }}
        onDescargarConstancia={handleDescargarConstancia}
      />

      <ConfirmarAprobacionModal
        isOpen={aprobandoModalOpen}
        onClose={handleCloseAprobarModal}
        onConfirm={handleConfirmAprobar}
        tramiteIdSeguimiento={aprobandoIdSeguimiento}
        isLoading={aprobandoLoading}
      />
    </div>
  );
}
