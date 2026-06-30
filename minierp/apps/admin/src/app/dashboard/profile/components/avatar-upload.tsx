'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Camera, Upload } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar: string | null;
  onAvatarUpdated: (url: string) => void;
}

export default function AvatarUpload({ currentAvatar, onAvatarUpdated }: AvatarUploadProps) {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        { method: 'POST', credentials: 'include', body: formData }
      );

      const uploadData = await uploadRes.json();

      if (uploadRes.ok && uploadData.success) {
        const imageUrl = uploadData.data.url;

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ imageUrl }),
        });

        onAvatarUpdated(imageUrl);
        setPreview(imageUrl);
      } else {
        setError('Error al subir imagen');
        setPreview(currentAvatar);
      }
    } catch (err) {
      setError('Error de conexión');
      setPreview(currentAvatar);
    } finally {
      setIsUploading(false);
    }
  };

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-white" />
          </div>
        )}
      </div>

      <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
        <Camera size={16} />
        Cambiar foto
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
