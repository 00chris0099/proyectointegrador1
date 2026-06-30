'use client';

import { authFetch } from '@/lib/api';;

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Users, UserPlus, Inbox } from 'lucide-react';
import StudentCard from './components/student-card';
import LinkingRequestForm from './components/linking-request-form';

interface StudentData {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: number;
  seccion: string;
  estado: boolean;
  fechaNac: string | null;
  parentesco: string;
  esPrincipal: boolean;
}

export default function StudentsPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/apoderados/me/alumnos`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStudents(data.data);
      } else {
        setError(data.message || 'Error al cargar alumnos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={28} className="text-blue-600" />
            Mis Alumnos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Alumnos vinculados a tu cuenta de apoderado
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <UserPlus size={18} />
          Solicitar Vinculación
        </button>
      </div>

      {/* Formulario de solicitud */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nueva Solicitud de Vinculación
          </h3>
          <LinkingRequestForm
            onSubmitted={() => {
              setShowForm(false);
              fetchStudents();
            }}
          />
        </div>
      )}

      {/* Lista de alumnos */}
      {students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Inbox size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes alumnos vinculados
          </h3>
          <p className="text-gray-500 mb-4">
            Contacta a secretaría para que vincule tus hijos a tu cuenta, o envía una solicitud de vinculación.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <UserPlus size={18} />
            Solicitar Vinculación
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              id={student.id}
              dni={student.dni}
              nombres={student.nombres}
              apellidos={student.apellidos}
              nivel={student.nivel}
              grado={student.grado}
              seccion={student.seccion}
              estado={student.estado}
              fechaNac={student.fechaNac}
              parentesco={student.parentesco}
              esPrincipal={student.esPrincipal}
            />
          ))}
        </div>
      )}
    </div>
  );
}