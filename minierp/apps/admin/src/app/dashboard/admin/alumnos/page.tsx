'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Plus, Trash2, X } from 'lucide-react';
import { authFetch } from '@/lib/api';

interface Alumno {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: number;
  seccion: string;
  estado: boolean;
}

export default function AdminAlumnosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dni: '', nombres: '', apellidos: '', nivel: 'Primaria', grado: '1', seccion: 'A' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchAlumnos = async () => {
    try {
      const res = await authFetch('/api/admin/alumnos');
      const data = await res.json();
      if (data.success) setAlumnos(data.data);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchAlumnos(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authFetch('/api/admin/alumnos', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setForm({ dni: '', nombres: '', apellidos: '', nivel: 'Primaria', grado: '1', seccion: 'A' });
        fetchAlumnos();
      } else {
        setError(data.message);
      }
    } catch (e) { setError('Error al crear alumno'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este alumno?')) return;
    try {
      await authFetch(`/api/admin/alumnos/${id}`, { method: 'DELETE' });
      fetchAlumnos();
    } catch (e) { console.error(e); }
  };

  if (status === 'loading' || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 size={40} className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users size={24} /> Gestión de Alumnos</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nuevo Alumno
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Crear Alumno</h2>
            <button onClick={() => setShowForm(false)}><X size={20} /></button>
          </div>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="DNI" value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} className="px-3 py-2 border rounded-lg" required />
            <input placeholder="Nombres" value={form.nombres} onChange={e => setForm({...form, nombres: e.target.value})} className="px-3 py-2 border rounded-lg" required />
            <input placeholder="Apellidos" value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})} className="px-3 py-2 border rounded-lg" required />
            <select value={form.nivel} onChange={e => setForm({...form, nivel: e.target.value})} className="px-3 py-2 border rounded-lg">
              <option>Primaria</option>
              <option>Secundaria</option>
            </select>
            <select value={form.grado} onChange={e => setForm({...form, grado: e.target.value})} className="px-3 py-2 border rounded-lg">
              {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g} Grado</option>)}
            </select>
            <input placeholder="Sección" value={form.seccion} onChange={e => setForm({...form, seccion: e.target.value})} className="px-3 py-2 border rounded-lg" required />
            <div className="md:col-span-3">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">DNI</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nombres</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Apellidos</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nivel</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Grado</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sección</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {alumnos.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{a.dni}</td>
                <td className="px-4 py-3 text-sm">{a.nombres}</td>
                <td className="px-4 py-3 text-sm">{a.apellidos}</td>
                <td className="px-4 py-3 text-sm">{a.nivel}</td>
                <td className="px-4 py-3 text-sm">{a.grado}</td>
                <td className="px-4 py-3 text-sm">{a.seccion}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {alumnos.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No hay alumnos registrados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
