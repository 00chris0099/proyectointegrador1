'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  User,
  Users,
  LinkIcon,
  LogOut,
  ChevronLeft,
  ClipboardList,
  CheckCircle,
  History,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Mis Alumnos',
    href: '/dashboard/alumnos',
    icon: Users,
  },
  {
    label: 'Trámites',
    href: '/dashboard/tramites',
    icon: FileText,
  },
  {
    label: 'Pagos',
    href: '/dashboard/tesoreria',
    icon: CreditCard,
  },
  {
    label: 'Solicitudes Vinculación',
    href: '/dashboard/admin/solicitudes-vinculacion',
    icon: LinkIcon,
  },
  {
    label: 'Trámites Pendientes',
    href: '/dashboard/admin/tramites-pendientes',
    icon: ClipboardList,
  },
  {
    label: 'Trámites Derivados',
    href: '/dashboard/direccion/tramites-derivados',
    icon: CheckCircle,
  },
  {
    label: 'Auditoría Documental',
    href: '/dashboard/admin/auditoria',
    icon: History,
  },
  {
    label: 'Mi Perfil',
    href: '/dashboard/profile',
    icon: User,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">LA</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">La Asunción</h1>
            <p className="text-xs text-gray-500">Mini-ERP</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={20} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}