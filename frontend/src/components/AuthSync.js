'use client';

import { useEffect } from 'react';
import { syncAuthCookies } from '@/utils/auth';

export default function AuthSync() {
  useEffect(() => {
    syncAuthCookies();

    const handleSync = () => syncAuthCookies();
    window.addEventListener('authChange', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('authChange', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  return null;
}
