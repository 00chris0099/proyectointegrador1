'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { setTokens, clearTokens } from '@/lib/api';

export function useAuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.user?.accessToken) {
      setTokens(
        (session as any).user.accessToken,
        (session as any).user.refreshToken || ''
      );
    }
    if (status === 'unauthenticated') {
      clearTokens();
    }
  }, [session, status]);
}
