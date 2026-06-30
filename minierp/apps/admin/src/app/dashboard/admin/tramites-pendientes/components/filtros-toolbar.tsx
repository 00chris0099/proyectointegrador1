'use client';

import { authFetch } from '@/lib/api';;

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, X, Calendar, FileText } from 'lucide-react';

interface TipoTramite {
  id: number;
  nombre: string;
}

interface FiltrosToolbarProps {
  onFilterChange: (filters: {
    fecha_inicio: string;
    fecha_fin: string;
    tipo_tramite: string;
    search: string;
  }) => void;
}

export default function FiltrosToolbar({ onFilterChange }: FiltrosToolbarProps) {
  const [tipos, setTipos] = useState<TipoTramite[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoTramite, setTipoTramite] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/tipos`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTipos(data.data);
        }
      } catch {
        console.error('Error al cargar tipos de trámite');
      }
    };
    fetchTipos();
  }, []);

  const applyFilters = useCallback(() => {
    onFilterChange({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      tipo_tramite: tipoTramite,
      search,
    });
  }, [fechaInicio, fechaFin, tipoTramite, search, onFilterChange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setFechaInicio('');
    setFechaFin('');
    setTipoTramite('');
    setSearch('');
  };

  const hasFilters = fechaInicio || fechaFin || tipoTramite || search;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Fecha inicio"
          />
        </div>

        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Fecha fin"
          />
        </div>

        <div className="relative">
          <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={tipoTramite}
            onChange={(e) => setTipoTramite(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
          >
            <option value="">Todos los tipos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, alumno o apoderado..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
