'use client';

import { authFetch } from '@/lib/api';;

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Clock, AlertTriangle, Inbox, Wifi, WifiOff, X } from 'lucide-react';
import { useAdminTramiteSSE, AdminTramiteSSEEvent } from '@/hooks/use-admin-tramite-sse';
import FiltrosToolbar from './components/filtros-toolbar';
import TramitePendienteCard from './components/tramite-pendiente-card';
import DetalleTramiteModal from './components/detalle-tramite-modal';
import ConfirmarDerivacionModal from './components/confirmar-derivacion-modal';
import ConfirmarObservacionModal from './components/confirmar-observacion-modal';

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

interface Estadisticas {
  totalPendientes: number;
  antiguos: number;
  porTipo: {
    tipo: { id: number; nombre: string } | null;
    count: number;
  }[];
}

interface Filters {
  fecha_inicio: string;
  fecha_fin: string;
  tipo_tramite: string;
  search: string;
}

export default function TramitesPendientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tramites, setTramites] = useState<TramitePendiente[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    fecha_inicio: '',
    fecha_fin: '',
    tipo_tramite: '',
    search: '',
  });
  const [selectedTramite, setSelectedTramite] = useState<TramitePendiente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [derivandoTramiteId, setDerivandoTramiteId] = useState<string | null>(null);
  const [derivandoIdSeguimiento, setDerivandoIdSeguimiento] = useState<string>('');
  const [derivandoLoading, setDerivandoLoading] = useState(false);
  const [derivandoModalOpen, setDerivandoModalOpen] = useState(false);
  const [observandoTramiteId, setObservandoTramiteId] = useState<string | null>(null);
  const [observandoIdSeguimiento, setObservandoIdSeguimiento] = useState<string>('');
  const [observandoLoading, setObservandoLoading] = useState(false);
  const [observandoModalOpen, setObservandoModalOpen] = useState(false);
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
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
      if (filters.tipo_tramite) params.append('tipo_tramite', filters.tipo_tramite);
      if (filters.search) params.append('search', filters.search);

      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/admin/tramites/pendientes?${params.toString()}`,
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
  }, [filters]);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/admin/tramites/estadisticas`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setEstadisticas(data.data);
      }
    } catch {
      console.error('Error al cargar estadísticas');
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTramites();
      fetchEstadisticas();
    }
  }, [status, fetchTramites, fetchEstadisticas]);

  useEffect(() => {
    fetchTramites(1);
  }, [filters, fetchTramites]);

  const handleSSENuevo = useCallback((_event: AdminTramiteSSEEvent) => {
    fetchTramites(pagination.page);
    fetchEstadisticas();
  }, [fetchTramites, fetchEstadisticas, pagination.page]);

  const handleSSEActualizado = useCallback((_event: AdminTramiteSSEEvent) => {
    fetchTramites(pagination.page);
    fetchEstadisticas();
  }, [fetchTramites, fetchEstadisticas, pagination.page]);

  const { isConnected, reconnecting } = useAdminTramiteSSE({
    onNuevoTramite: handleSSENuevo,
    onTramiteActualizado: handleSSEActualizado,
    enabled: status === 'authenticated',
  });

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleViewDetail = async (tramite: TramitePendiente) => {
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/admin/tramites/${tramite.id}/detalle`,
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

  const handleDerivar = (tramiteId: string) => {
    const tramite = tramites.find((t) => t.id === tramiteId);
    if (tramite) {
      setDerivandoTramiteId(tramiteId);
      setDerivandoIdSeguimiento(tramite.idSeguimiento);
      setDerivandoModalOpen(true);
    }
  };

  const handleConfirmDerivar = async () => {
    if (!derivandoTramiteId) return;

    setDerivandoLoading(true);
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/${derivandoTramiteId}/derivar`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setTramites((prev) => prev.filter((t) => t.id !== derivandoTramiteId));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
        setDerivandoModalOpen(false);
        setDerivandoTramiteId(null);
        setDerivandoIdSeguimiento('');
      } else {
        setActionError(data.message || 'Error al derivar trámite');
      }
    } catch {
      setActionError('Error de conexión al derivar trámite');
    } finally {
      setDerivandoLoading(false);
    }
  };

  const handleCloseDerivarModal = () => {
    if (!derivandoLoading) {
      setDerivandoModalOpen(false);
      setDerivandoTramiteId(null);
      setDerivandoIdSeguimiento('');
    }
  };

  const handleObservar = (tramiteId: string) => {
    const tramite = tramites.find((t) => t.id === tramiteId);
    if (tramite) {
      setObservandoTramiteId(tramiteId);
      setObservandoIdSeguimiento(tramite.idSeguimiento);
      setObservandoModalOpen(true);
    }
  };

  const handleConfirmObservar = async (motivo: string) => {
    if (!observandoTramiteId) return;

    setObservandoLoading(true);
    try {
      const res = await authFetch(
        `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/${observandoTramiteId}/observar`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ motivo }),
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setTramites((prev) => prev.filter((t) => t.id !== observandoTramiteId));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
        setObservandoModalOpen(false);
        setObservandoTramiteId(null);
        setObservandoIdSeguimiento('');
      } else {
        setActionError(data.message || 'Error al observar trámite');
      }
    } catch {
      setActionError('Error de conexión al observar trámite');
    } finally {
      setObservandoLoading(false);
    }
  };

  const handleCloseObservarModal = () => {
    if (!observandoLoading) {
      setObservandoModalOpen(false);
      setObservandoTramiteId(null);
      setObservandoIdSeguimiento('');
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
            Trámites Pendientes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona las solicitudes de trámites de los apoderados
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Pendientes</p>
            <p className="text-xl font-bold text-gray-900">{estadisticas.totalPendientes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Antiguos (&gt;7 días)</p>
            <p className="text-xl font-bold text-orange-600">{estadisticas.antiguos}</p>
          </div>
          {estadisticas.porTipo.slice(0, 2).map((item) => (
            <div key={item.tipo?.id || 'unknown'} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 truncate">{item.tipo?.nombre || 'Sin tipo'}</p>
              <p className="text-xl font-bold text-blue-600">{item.count}</p>
            </div>
          ))}
        </div>
      )}

      <FiltrosToolbar onFilterChange={handleFilterChange} />

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
            No hay trámites pendientes
          </h3>
          <p className="text-gray-500">
            No se encontraron trámites con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {tramites.map((tramite) => (
              <TramitePendienteCard
                key={tramite.id}
                tramite={tramite}
                onViewDetail={handleViewDetail}
                onDerivar={handleDerivar}
                onObservar={handleObservar}
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

      <DetalleTramiteModal
        tramite={selectedTramite}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onDerivar={handleDerivar}
        onObservar={handleObservar}
      />

      <ConfirmarDerivacionModal
        isOpen={derivandoModalOpen}
        onClose={handleCloseDerivarModal}
        onConfirm={handleConfirmDerivar}
        tramiteIdSeguimiento={derivandoIdSeguimiento}
        isLoading={derivandoLoading}
      />

      <ConfirmarObservacionModal
        isOpen={observandoModalOpen}
        onClose={handleCloseObservarModal}
        onConfirm={handleConfirmObservar}
        tramiteIdSeguimiento={observandoIdSeguimiento}
        isLoading={observandoLoading}
      />
    </div>
  );
}
