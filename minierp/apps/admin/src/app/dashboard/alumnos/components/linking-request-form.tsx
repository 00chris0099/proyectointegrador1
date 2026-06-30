'use client';

import { authFetch } from '@/lib/api';;

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, Search } from 'lucide-react';

const parentescosPermitidos = [
  'Padre',
  'Madre',
  'Abuelo Paterno',
  'Abuela Paterna',
  'Abuelo Materno',
  'Abuela Materna',
  'Tutor',
  'Tía',
  'Tío',
  'Hermano',
  'Hermana',
  'Otro',
];

const linkingSchema = z
  .object({
    dni: z
      .string()
      .length(8, 'El DNI debe tener 8 dígitos')
      .regex(/^\d+$/, 'El DNI solo debe contener números'),
    parentesco: z.enum(parentescosPermitidos as [string, ...string[]], {
      message: 'Selecciona un parentesco',
    }),
    parentescoCustom: z.string().max(100, 'Máximo 100 caracteres').optional(),
  })
  .refine(
    (data) => {
      if (data.parentesco === 'Otro') {
        return data.parentescoCustom && data.parentescoCustom.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Si seleccionas "Otro", debes especificar el parentesco',
      path: ['parentescoCustom'],
    }
  );

type LinkingFormData = z.infer<typeof linkingSchema>;

interface LinkingRequestFormProps {
  onSubmitted: () => void;
}

export default function LinkingRequestForm({ onSubmitted }: LinkingRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LinkingFormData>({
    resolver: zodResolver(linkingSchema),
  });

  const parentesco = watch('parentesco');

  const onSubmit = async (data: LinkingFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload: any = {
        dni: data.dni,
        parentesco: data.parentesco,
      };

      if (data.parentesco === 'Otro' && data.parentescoCustom) {
        payload.parentescoCustom = data.parentescoCustom;
      }

      const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/apoderados/me/solicitud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: result.message });
        reset();
        onSubmitted();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Search size={14} className="inline mr-1" /> DNI del Alumno
        </label>
        <input
          {...register('dni')}
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="12345678"
          maxLength={8}
          disabled={isSubmitting}
        />
        {errors.dni && (
          <p className="mt-1 text-sm text-red-600">{errors.dni.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parentesco
        </label>
        <select
          {...register('parentesco')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={isSubmitting}
        >
          <option value="">Seleccionar parentesco</option>
          {parentescosPermitidos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.parentesco && (
          <p className="mt-1 text-sm text-red-600">{errors.parentesco.message}</p>
        )}
      </div>

      {parentesco === 'Otro' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especificar parentesco
          </label>
          <input
            {...register('parentescoCustom')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Ej: Padrino, Hermano mayor, etc."
            disabled={isSubmitting}
          />
          {errors.parentescoCustom && (
            <p className="mt-1 text-sm text-red-600">{errors.parentescoCustom.message}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <UserPlus size={20} />
        )}
        Enviar Solicitud
      </button>
    </form>
  );
}