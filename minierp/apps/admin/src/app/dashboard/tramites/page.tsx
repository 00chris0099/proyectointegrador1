'use client';

import { authFetch } from '@/lib/api';;

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, FileText, Plus, Inbox, Search, Filter, Wifi, WifiOff } from 'lucide-react';
import TramiteCard from './components/tramite-card';
import NewTramiteForm from './components/new-tramite-form';
import { useTramiteSSE, TramiteSSEEvent } from '@/hooks/use-tramite-sse';

interface TramiteData {
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
    nombreOriginal: string;
    tipoMime: string;
    pesoBytes: number;
  }[];
}

type FilterType = 'Pendiente' | 'En Proceso' | 'Finalizado' | 'Observado' | 'Todas';

export default function TramitesPage() {
  const { data: session } = useSession();
  const [tramites, setTramites] = useState<TramiteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<FilterType>('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTramites = useCallback(async () => {
    try {
      const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/me`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTramites(data.data);
      } else {
        setError(data.message || 'Error al cargar trámites');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTramites();
  }, [fetchTramites]);

  const handleSSECreated = useCallback((event: TramiteSSEEvent) => {
    fetchTramites();
  }, [fetchTramites]);

  const handleSSEEstado = useCallback((event: TramiteSSEEvent) => {
    setTramites((prev) =>
      prev.map((t) =>
        t.id === event.tramiteId ? { ...t, estado: event.estado } : t
      )
    );
  }, []);

  const handleSSEDocumento = useCallback((event: TramiteSSEEvent) => {
    fetchTramites();
  }, [fetchTramites]);

  const { isConnected, reconnecting } = useTramiteSSE({
    onCreated: handleSSECreated,
    onEstado: handleSSEEstado,
    onObservado: handleSSEEstado,
    onDerivado: handleSSEEstado,
    onAprobado: handleSSEEstado,
    onDocumento: handleSSEDocumento,
    onFinalizado: handleSSEEstado,
  });

  const filteredTramites = tramites.filter((t) => {
    const matchesFilter = filter === 'Todas' || t.estado === filter;
    const matchesSearch =
      searchTerm === '' ||
      t.idSeguimiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.alumno.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.alumno.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={28} className="text-blue-600" />
            Mis Trámites
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona tus solicitudes de trámites
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-green-600">En tiempo real</span>
              </>
            ) : reconnecting ? (
              <>
                <WifiOff size={16} className="text-yellow-500" />
                <span className="text-yellow-600">Reconectando...</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-gray-400" />
                <span className="text-gray-500">Sin conexión</span>
              </>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus size={18} />
            Nuevo Trámite
          </button>
        </div>
      </div>

      {/* Formulario de nuevo trámite */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nuevo Trámite
          </h3>
          <NewTramiteForm
            onSubmitted={() => {
              setShowForm(false);
              fetchTramites();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex gap-2 flex-wrap">
              {(['Todas', 'Pendiente', 'En Proceso', 'Observado', 'Finalizado'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, alumno o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-900">{tramites.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-xl font-bold text-yellow-600">
            {tramites.filter((t) => t.estado === 'Pendiente').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">En Proceso</p>
          <p className="text-xl font-bold text-blue-600">
            {tramites.filter((t) => t.estado === 'En Proceso').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Finalizados</p>
          <p className="text-xl font-bold text-green-600">
            {tramites.filter((t) => t.estado === 'Finalizado').length}
          </p>
        </div>
      </div>

      {/* Lista de trámites */}
      {filteredTramites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Inbox size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay trámites {filter !== 'Todas' ? filter.toLowerCase() : ''}
          </h3>
          <p className="text-gray-500 mb-4">
            {tramites.length === 0
              ? 'Aún no has creado ningún trámite.'
              : 'No se encontraron trámites con los filtros seleccionados.'}
          </p>
          {tramites.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus size={18} />
              Crear Primer Trámite
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTramites.map((tramite) => (
            <TramiteCard key={tramite.id} tramite={tramite} />
          ))}
        </div>
      )}
    </div>
  );
}
