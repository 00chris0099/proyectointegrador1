'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LogOut, User, FileText, CreditCard, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mini-ERP La Asunción</h1>
              <p className="text-sm text-gray-500">Panel Administrativo</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={20} />
                <span className="font-medium">{session.user?.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bienvenido al Panel</h2>
          <p className="text-gray-600">
            Has iniciado sesión correctamente. Selecciona un módulo del menú para comenzar.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/tramites" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <FileText size={24} className="text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Documental</h3>
              <p className="text-sm text-gray-500 mt-1">Gestionar trámites</p>
            </Link>
            <Link href="/dashboard/tesoreria" className="block p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <CreditCard size={24} className="text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Tesorería</h3>
              <p className="text-sm text-gray-500 mt-1">Gestionar pagos</p>
            </Link>
            <Link href="/dashboard/admin/solicitudes-vinculacion" className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <Settings size={24} className="text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Administración</h3>
              <p className="text-sm text-gray-500 mt-1">Configurar el sistema</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
