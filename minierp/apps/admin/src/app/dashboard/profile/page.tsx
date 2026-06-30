import { authFetch } from '@/lib/api';
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, User, Mail, Phone, Shield, IdCard } from 'lucide-react';
import AvatarUpload from './components/avatar-upload';
import EditContactForm from './components/edit-contact-form';
import ChangePasswordForm from './components/change-password-form';

interface ProfileData {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  avatarUrl: string | null;
  roles: string[];
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authFetch(`${'https://aimachristian-backendintegrador.ajcxjb.easypanel.host'}/api/users/profile`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProfile(data.data);
      } else {
        setError(data.message || 'Error al cargar perfil');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>

      {/* Sección: Avatar y Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <AvatarUpload
            currentAvatar={profile.avatarUrl}
            onAvatarUpdated={(url) => setProfile({ ...profile, avatarUrl: url })}
          />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900">
              {profile.nombres} {profile.apellidos}
            </h2>
            <div className="flex items-center gap-2 justify-center sm:justify-start mt-1 text-gray-500 text-sm">
              <IdCard size={14} />
              DNI: {profile.dni}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Shield size={12} />
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Datos de Contacto */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail size={20} className="text-blue-600" />
          Datos de Contacto
        </h3>
        <EditContactForm
          currentEmail={profile.email}
          currentPhone={profile.telefono}
          onUpdated={fetchProfile}
        />
      </div>

      {/* Sección: Seguridad */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-blue-600" />
          Cambiar Contraseña
        </h3>
        <ChangePasswordForm onUpdated={fetchProfile} />
      </div>
    </div>
  );
}
