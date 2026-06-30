'use client';

import { authFetch } from '@/lib/api';;

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Mail, Phone } from 'lucide-react';

const contactSchema = z.object({
  email: z.string().email('Email inválido'),
  telefono: z
    .string()
    .regex(/^9\d{8}$/, 'Teléfono debe tener 9 dígitos y empezar con 9')
    .optional()
    .or(z.literal('')),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface EditContactFormProps {
  currentEmail: string;
  currentPhone: string | null;
  onUpdated: () => void;
}

export default function EditContactForm({
  currentEmail,
  currentPhone,
  onUpdated,
}: EditContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: currentEmail,
      telefono: currentPhone || '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload: any = {};
      if (data.telefono && data.telefono !== currentPhone) {
        payload.telefono = data.telefono;
      }
      if (data.email !== currentEmail) {
        const verifyRes = await authFetch(
          `${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/users/profile/verify-email`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: data.email }),
          }
        );
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          setMessage({ type: 'error', text: verifyData.message });
          setIsSubmitting(false);
          return;
        }

        setNewEmail(data.email);
        setShowVerify(true);
        setIsSubmitting(false);
        return;
      }

      if (Object.keys(payload).length > 0) {
        const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/users/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const result = await res.json();

        if (res.ok) {
          setMessage({ type: 'success', text: 'Teléfono actualizado' });
          onUpdated();
        } else {
          setMessage({ type: 'error', text: result.message });
        }
      } else {
        setMessage({ type: 'error', text: 'No hay cambios para guardar' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsSubmitting(true);
    try {
      const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/users/profile/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ codigo: verifyCode }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Correo actualizado exitosamente' });
        setShowVerify(false);
        onUpdated();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showVerify) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          Se envió un código de 6 dígitos a <strong>{newEmail}</strong>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de verificación
          </label>
          <input
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="000000"
            maxLength={6}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleVerifyCode}
            disabled={isSubmitting || verifyCode.length !== 6}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Confirmar
          </button>
          <button
            onClick={() => { setShowVerify(false); setVerifyCode(''); }}
            className="text-gray-600 hover:text-gray-800 py-2 px-4"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

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
          <Mail size={14} className="inline mr-1" /> Correo electrónico
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Phone size={14} className="inline mr-1" /> Teléfono
        </label>
        <input
          {...register('telefono')}
          type="tel"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="912345678"
          disabled={isSubmitting}
        />
        {errors.telefono && (
          <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Guardar cambios
      </button>
    </form>
  );
}
