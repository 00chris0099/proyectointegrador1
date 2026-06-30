'use client';

import Sidebar from '@/components/sidebar';
import { useAuthSync } from '@/hooks/use-auth-sync';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthSync();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
