'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { setAccessToken, clearAccessToken } from '@/lib/api';

export function useAuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.user?.accessToken) {
      setAccessToken((session as any).user.accessToken);
    }
    if (status === 'unauthenticated') {
      clearAccessToken();
    }
  }, [session, status]);
}
