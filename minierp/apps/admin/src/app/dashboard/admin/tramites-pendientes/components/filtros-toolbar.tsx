'use client';

import { authFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Search, X, Calendar, FileText } from 'lucide-react';

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
        const res = await authFetch('/api/tramites/tipos');
        const data = await res.json();
        if (res.ok && data.success) setTipos(data.data);
      } catch { /* ignore */ }
    };
    fetchTipos();
  }, []);

  const handleApply = () => {
    onFilterChange({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, tipo_tramite: tipoTramite, search });
  };

  const clearFilters = () => {
    setFechaInicio('');
    setFechaFin('');
    setTipoTramite('');
    setSearch('');
    onFilterChange({ fecha_inicio: '', fecha_fin: '', tipo_tramite: '', search: '' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <div className="relative">
          <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={tipoTramite} onChange={e => setTipoTramite(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm">
            <option value="">Todos los tipos</option>
            {tipos.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}
          </select>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleApply} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Buscar</button>
          {(fechaInicio || fechaFin || tipoTramite || search) && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
