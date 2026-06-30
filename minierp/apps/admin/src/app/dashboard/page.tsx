'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LogOut, User, FileText, CreditCard, Settings, Users, ClipboardList, CheckCircle, History, LinkIcon } from 'lucide-react';
import Link from 'next/link';

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  bgColor: string;
  roles: string[];
}

const cards: DashboardCard[] = [
  {
    title: 'Mis Alumnos',
    description: 'Ver alumnos vinculados',
    href: '/dashboard/alumnos',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'hover:border-blue-500 hover:bg-blue-50',
    roles: ['Apoderado'],
  },
  {
    title: 'Mis Trámites',
    description: 'Crear y consultar trámites',
    href: '/dashboard/tramites',
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'hover:border-indigo-500 hover:bg-indigo-50',
    roles: ['Apoderado'],
  },
  {
    title: 'Trámites Pendientes',
    description: 'Revisar y derivar solicitudes',
    href: '/dashboard/admin/tramites-pendientes',
    icon: ClipboardList,
    color: 'text-orange-600',
    bgColor: 'hover:border-orange-500 hover:bg-orange-50',
    roles: ['Secretaria', 'Administrador'],
  },
  {
    title: 'Solicitudes Vinculación',
    description: 'Aprobar o rechazar vínculos',
    href: '/dashboard/admin/solicitudes-vinculacion',
    icon: LinkIcon,
    color: 'text-teal-600',
    bgColor: 'hover:border-teal-500 hover:bg-teal-50',
    roles: ['Secretaria', 'Administrador'],
  },
  {
    title: 'Trámites Derivados',
    description: 'Aprobar documentos finales',
    href: '/dashboard/direccion/tramites-derivados',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'hover:border-green-500 hover:bg-green-50',
    roles: ['Direccion', 'Administrador'],
  },
  {
    title: 'Auditoría Documental',
    description: 'Historial de cambios',
    href: '/dashboard/admin/auditoria',
    icon: History,
    color: 'text-purple-600',
    bgColor: 'hover:border-purple-500 hover:bg-purple-50',
    roles: ['Direccion', 'Administrador'],
  },
  {
    title: 'Tesorería',
    description: 'Gestionar pagos y deudas',
    href: '/dashboard/tesoreria',
    icon: CreditCard,
    color: 'text-emerald-600',
    bgColor: 'hover:border-emerald-500 hover:bg-emerald-50',
    roles: ['Tesoreria', 'Administrador'],
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRoles = (session?.user as any)?.roles || [];

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

  if (!session) return null;

  const visibleCards = cards.filter(card =>
    card.roles.some(role => userRoles.includes(role))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mini-ERP La Asunción</h1>
              <p className="text-sm text-gray-500">Panel Administrativo — {userRoles[0] || 'Usuario'}</p>
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Bienvenido, {session.user?.name}</h2>
          <p className="text-gray-600">Selecciona un módulo del menú para comenzar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCards.map(card => (
            <Link key={card.href} href={card.href} className={`block p-5 border border-gray-200 rounded-xl transition-colors ${card.bgColor}`}>
              <card.icon size={28} className={`${card.color} mb-3`} />
              <h3 className="font-semibold text-gray-900">{card.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
