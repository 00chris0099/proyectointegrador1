'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Link, CheckCircle, XCircle, Clock, User, GraduationCap, Filter, Search } from 'lucide-react';
import RejectModal from './components/reject-modal';

interface SolicitudData {
  id: number;
  apoderadoId: string;
  alumnoId: string;
  parentesco: string;
  parentescoCustom: string | null;
  estado: string;
  motivo: string | null;
  adminId: string | null;
  fechaRespuesta: string | null;
  createdAt: string;
  apoderado: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
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
}

type FilterType = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Todas';

export default function SolicitudesVinculacionPage() {
  const { data: session } = useSession();
  const [solicitudes, setSolicitudes] = useState<SolicitudData[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<SolicitudData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('Pendiente');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudData | null>(null);

  const fetchSolicitudes = useCallback(async () => {
    try {
      const url = filter === 'Pendiente'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/solicitudes-vinculacion?estado=Pendiente`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/solicitudes-vinculacion`;
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();

      if (res.ok && data.success) {
        setSolicitudes(data.data);
      } else {
        setError(data.message || 'Error al cargar solicitudes');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  useEffect(() => {
    let result = solicitudes;
    
    if (filter !== 'Todas' && filter !== 'Pendiente') {
      result = result.filter(s => s.estado === filter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.alumno.nombres.toLowerCase().includes(term) ||
        s.alumno.apellidos.toLowerCase().includes(term) ||
        s.alumno.dni.includes(term) ||
        s.apoderado.nombres.toLowerCase().includes(term) ||
        s.apoderado.apellidos.toLowerCase().includes(term)
      );
    }
    
    setFilteredSolicitudes(result);
  }, [solicitudes, filter, searchTerm]);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/solicitudes-vinculacion/${id}/aprobar`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        fetchSolicitudes();
      } else {
        alert(data.message || 'Error al aprobar solicitud');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (solicitud: SolicitudData) => {
    setSelectedSolicitud(solicitud);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async (motivo: string) => {
    if (!selectedSolicitud) return;
    
    setProcessingId(selectedSolicitud.id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/solicitudes-vinculacion/${selectedSolicitud.id}/rechazar`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ motivo }),
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setRejectModalOpen(false);
        setSelectedSolicitud(null);
        fetchSolicitudes();
      } else {
        alert(data.message || 'Error al rechazar solicitud');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} />
            Pendiente
          </span>
        );
      case 'Aprobada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} />
            Aprobada
          </span>
        );
      case 'Rechazada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} />
            Rechazada
          </span>
        );
      default:
        return null;
    }
  };

  const getParentescoDisplay = (parentesco: string, parentescoCustom: string | null) => {
    if (parentesco === 'Otro' && parentescoCustom) {
      return parentescoCustom;
    }
    return parentesco;
  };

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
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        solicitud={selectedSolicitud}
        isProcessing={processingId === selectedSolicitud?.id}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Link size={28} className="text-blue-600" />
          Solicitudes de Vinculación
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona las solicitudes de vinculación entre apoderados y alumnos
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex gap-2">
              {(['Pendiente', 'Todas', 'Aprobada', 'Rechazada'] as FilterType[]).map((f) => (
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

          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI del alumno o apoderado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-xl font-bold text-gray-900">
                {solicitudes.filter(s => s.estado === 'Pendiente').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aprobadas</p>
              <p className="text-xl font-bold text-gray-900">
                {solicitudes.filter(s => s.estado === 'Aprobada').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rechazadas</p>
              <p className="text-xl font-bold text-gray-900">
                {solicitudes.filter(s => s.estado === 'Rechazada').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      {filteredSolicitudes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Link size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay solicitudes {filter !== 'Todas' ? filter.toLowerCase() : ''}
          </h3>
          <p className="text-gray-500">
            {filter === 'Pendiente'
              ? 'No hay solicitudes pendientes de revisión.'
              : 'No se encontraron solicitudes con los filtros seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSolicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info del alumno */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <GraduationCap size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {solicitud.alumno.nombres} {solicitud.alumno.apellidos}
                      </h3>
                      <p className="text-sm text-gray-500">
                        DNI: {solicitud.alumno.dni} | {solicitud.alumno.nivel} - {solicitud.alumno.grado}° {solicitud.alumno.seccion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Apoderado: {solicitud.apoderado.nombres} {solicitud.apoderado.apellidos}
                      </p>
                      <p className="text-xs text-gray-500">
                        {solicitud.apoderado.email} | Parentesco: {getParentescoDisplay(solicitud.parentesco, solicitud.parentescoCustom)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Solicitud enviada: {new Date(solicitud.createdAt).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {solicitud.motivo && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs font-medium text-red-700">Motivo de rechazo:</p>
                      <p className="text-xs text-red-600">{solicitud.motivo}</p>
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                  {getStatusBadge(solicitud.estado)}
                  
                  {solicitud.estado === 'Pendiente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(solicitud.id)}
                        disabled={processingId === solicitud.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === solicitud.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectClick(solicitud)}
                        disabled={processingId === solicitud.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle size={16} />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
