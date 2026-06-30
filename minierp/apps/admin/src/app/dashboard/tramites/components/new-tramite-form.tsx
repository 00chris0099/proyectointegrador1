'use client';

import { authFetch } from '@/lib/api';;

import { useState, useEffect } from 'react';
import { Loader2, Upload, X, FileText, CheckCircle } from 'lucide-react';

interface TipoTramite {
  id: number;
  nombre: string;
  descripcion: string | null;
  requisitos: any;
}

interface Alumno {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: number;
  seccion: string;
}

interface NewTramiteFormProps {
  onSubmitted: () => void;
  onCancel: () => void;
}

export default function NewTramiteForm({ onSubmitted, onCancel }: NewTramiteFormProps) {
  const [tipos, setTipos] = useState<TipoTramite[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedTipo, setSelectedTipo] = useState<number>(0);
  const [selectedAlumno, setSelectedAlumno] = useState<string>('');
  const [comentario, setComentario] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiposRes, alumnosRes] = await Promise.all([
          fetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/tipos`, { credentials: 'include' }),
          fetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/apoderados/me/alumnos`, { credentials: 'include' }),
        ]);

        const tiposData = await tiposRes.json();
        const alumnosData = await alumnosRes.json();

        if (tiposRes.ok && tiposData.success) {
          setTipos(tiposData.data);
        }
        if (alumnosRes.ok && alumnosData.success) {
          setAlumnos(alumnosData.data);
        }
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`El archivo ${file.name} excede el límite de 5MB`);
        continue;
      }
      if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setError(`El archivo ${file.name} no es un formato válido (solo PDF/JPG)`);
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTipo) {
      setError('Selecciona un tipo de trámite');
      return;
    }
    if (!selectedAlumno) {
      setError('Selecciona un alumno');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tipoId: selectedTipo,
          alumnoId: selectedAlumno,
          comentario: comentario || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const tramiteId = data.data.id;

        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadRes = await authFetch(
            `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/tramites/${tramiteId}/documentos`,
            {
              method: 'POST',
              credentials: 'include',
              body: formData,
            }
          );

          if (!uploadRes.ok) {
            const uploadData = await uploadRes.json();
            console.error('Error subiendo archivo:', uploadData.message);
          }
        }

        setSuccess(`Trámite creado exitosamente. ID de seguimiento: ${data.data.idSeguimiento}`);
        setTimeout(() => {
          onSubmitted();
        }, 2000);
      } else {
        setError(data.message || 'Error al crear trámite');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
        <h4 className="text-lg font-semibold text-green-800 mb-2">¡Trámite Creado!</h4>
        <p className="text-green-700">{success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Trámite <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={0}>Seleccionar tipo...</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
          {selectedTipo > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {tipos.find((t) => t.id === selectedTipo)?.descripcion}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alumno <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedAlumno}
            onChange={(e) => setSelectedAlumno(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar alumno...</option>
            {alumnos.map((alumno) => (
              <option key={alumno.id} value={alumno.id}>
                {alumno.nombres} {alumno.apellidos} - {alumno.nivel} {alumno.grado}°{alumno.seccion}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Describe brevemente el motivo de tu solicitud..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Documentos Adjuntos (opcional)
        </label>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Arrastra archivos o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF o JPG, máximo 5MB por archivo</p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Trámite'
          )}
        </button>
      </div>
    </form>
  );
}
