'use client';

import { GraduationCap, User, Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react';

interface StudentCardProps {
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

export default function StudentCard({
  id,
  dni,
  nombres,
  apellidos,
  nivel,
  grado,
  seccion,
  estado,
  fechaNac,
  parentesco,
  esPrincipal,
}: StudentCardProps) {
  const initials = `${nombres[0]}${apellidos[0]}`.toUpperCase();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-white">{initials}</span>
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {nombres} {apellidos}
            </h3>
            {esPrincipal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <CheckCircle size={12} />
                Principal
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User size={14} />
              DNI: {dni}
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap size={14} />
              {nivel} - {grado}° {seccion}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {parentesco}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                estado
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {estado ? (
                <>
                  <CheckCircle size={12} />
                  Activo
                </>
              ) : (
                <>
                  <XCircle size={12} />
                  Inactivo
                </>
              )}
            </span>
          </div>

          {fechaNac && (
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
              <Calendar size={14} />
              Nacimiento: {new Date(fechaNac).toLocaleDateString('es-PE')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}