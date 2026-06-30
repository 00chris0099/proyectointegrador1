'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  History,
  Search,
  Filter,
  Calendar,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Eye,
  X,
} from 'lucide-react';

interface AuditoriaRegistro {
  id: number;
  tramiteId: string;
  usuarioId: string;
  fechaHora: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  accion: string;
  detalles: unknown;
  tramite: {
    id: string;
    idSeguimiento: string;
    estado: string;
    alumno: {
      nombres: string;
      apellidos: string;
      nivel: string;
      grado: number;
      seccion: string;
    };
    apoderado: {
      nombres: string;
      apellidos: string;
    };
    tipo: {
      nombre: string;
    };
  };
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
}

interface Estadisticas {
  totalRegistros: number;
  registrosHoy: number;
  porAccion: { accion: string; count: number }[];
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function AuditoriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [registros, setRegistros] = useState<AuditoriaRegistro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [acciones, setAcciones] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedRegistro, setSelectedRegistro] = useState<AuditoriaRegistro | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchRegistros = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filtroAccion) params.append('accion', filtroAccion);
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auditoria?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setRegistros(data.data.registros);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Error al cargar auditoría');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filtroAccion, fechaInicio, fechaFin]);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auditoria/estadisticas`,
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

  const fetchAcciones = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auditoria/acciones`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setAcciones(data.data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRegistros();
      fetchEstadisticas();
      fetchAcciones();
    }
  }, [status, fetchRegistros, fetchEstadisticas, fetchAcciones]);

  const handleSearch = () => {
    fetchRegistros(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFiltroAccion('');
    setFechaInicio('');
    setFechaFin('');
  };

  const formatFecha = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'Aprobación':
        return 'bg-green-100 text-green-800';
      case 'Observación':
        return 'bg-orange-100 text-orange-800';
      case 'Derivación':
        return 'bg-blue-100 text-blue-800';
      case 'Creación':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
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
            <History size={28} className="text-blue-600" />
            Auditoría Documental
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Historial de cambios de estado de trámites
          </p>
        </div>
      </div>

      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Registros</p>
            <p className="text-xl font-bold text-blue-600">{estadisticas.totalRegistros}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Registros Hoy</p>
            <p className="text-xl font-bold text-green-600">{estadisticas.registrosHoy}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Acciones Registradas</p>
            <p className="text-xl font-bold text-purple-600">{estadisticas.porAccion.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID de seguimiento, alumno o apoderado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} />
            Filtros
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Search size={16} />
            Buscar
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Acción</label>
              <select
                value={filtroAccion}
                onChange={(e) => setFiltroAccion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {acciones.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {(searchTerm || filtroAccion || fechaInicio || fechaFin) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtros activos:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                Búsqueda: &quot;{searchTerm}&quot;
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                  <X size={12} />
                </button>
              </span>
            )}
            {filtroAccion && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                Acción: {filtroAccion}
                <button onClick={() => setFiltroAccion('')} className="hover:text-purple-900">
                  <X size={12} />
                </button>
              </span>
            )}
            {(fechaInicio || fechaFin) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                <Calendar size={12} />
                {fechaInicio || '...'} — {fechaFin || '...'}
                <button onClick={() => { setFechaInicio(''); setFechaFin(''); }} className="hover:text-green-900">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

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
      ) : registros.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Inbox size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay registros de auditoría
          </h3>
          <p className="text-gray-500">
            No se encontraron registros con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha/Hora</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Trámite</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Alumno</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Acción</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Ejecutado por</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {registros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatFecha(reg.fechaHora)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-400" />
                          <span className="font-mono font-medium text-gray-900">
                            {reg.tramite.idSeguimiento}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {reg.tramite.tipo.nombre}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">
                          {reg.tramite.alumno.nombres} {reg.tramite.alumno.apellidos}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reg.tramite.alumno.nivel} {reg.tramite.alumno.grado}° {reg.tramite.alumno.seccion}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccionColor(reg.accion)}`}>
                          {reg.accion}
                        </span>
                        {reg.estadoAnterior && reg.estadoNuevo && (
                          <p className="text-xs text-gray-500 mt-1">
                            {reg.estadoAnterior} → {reg.estadoNuevo}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-700">
                            {reg.usuario.nombres} {reg.usuario.apellidos}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedRegistro(reg);
                            setDetailModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Eye size={14} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchRegistros(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
              </span>
              <button
                onClick={() => fetchRegistros(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {detailModalOpen && selectedRegistro && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setDetailModalOpen(false)}
            />
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Detalle de Auditoría</h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-gray-900">
                      {selectedRegistro.tramite.idSeguimiento}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccionColor(selectedRegistro.accion)}`}>
                      {selectedRegistro.accion}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <Calendar size={14} className="inline mr-1" />
                    {formatFecha(selectedRegistro.fechaHora)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-900 mb-1">Alumno</h4>
                    <p className="text-sm text-blue-800">
                      {selectedRegistro.tramite.alumno.nombres} {selectedRegistro.tramite.alumno.apellidos}
                    </p>
                    <p className="text-xs text-blue-600">
                      {selectedRegistro.tramite.alumno.nivel} {selectedRegistro.tramite.alumno.grado}° {selectedRegistro.tramite.alumno.seccion}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-900 mb-1">Ejecutado por</h4>
                    <p className="text-sm text-green-800">
                      {selectedRegistro.usuario.nombres} {selectedRegistro.usuario.apellidos}
                    </p>
                    <p className="text-xs text-green-600">{selectedRegistro.usuario.email}</p>
                  </div>
                </div>

                {selectedRegistro.estadoAnterior && selectedRegistro.estadoNuevo && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-yellow-900 mb-1">Cambio de Estado</h4>
                    <p className="text-sm text-yellow-800">
                      {selectedRegistro.estadoAnterior} → {selectedRegistro.estadoNuevo}
                    </p>
                  </div>
                )}

                {selectedRegistro.detalles && typeof selectedRegistro.detalles === 'object' && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-purple-900 mb-2">Detalles</h4>
                    <div className="space-y-1">
                      {Object.entries(selectedRegistro.detalles as Record<string, unknown>).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="font-medium text-purple-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                          </span>
                          <span className="text-purple-800">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
