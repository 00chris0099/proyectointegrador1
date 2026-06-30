'use client';

import { Loader2, CreditCard, Construction } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TesoreriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard size={24} />
        Tesorería
      </h1>
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <Construction size={48} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Módulo en desarrollo</h2>
        <p className="text-gray-500 mt-2">Esta sección estará disponible próximamente.</p>
        <Link href="/dashboard" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
