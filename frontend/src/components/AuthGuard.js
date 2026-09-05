'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getAuth, isTokenExpired } from '@/utils/auth';

export default function AuthGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const isRedirecting = useRef(false);

  useEffect(() => {
    const checkAuthorization = () => {
      // If already redirecting, prevent redundant checks and redirect storms
      if (isRedirecting.current) return;

      const { token, role } = getAuth();

      // If no token or token is expired, redirect to appropriate login page
      if (!token || isTokenExpired(token)) {
        isRedirecting.current = true;
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

        const isAdmin = pathname.startsWith('/admin');
        const loginTarget = isAdmin
          ? '/admin/login'
          : `/login?redirect=${encodeURIComponent(pathname)}`;

        setAuthorized(false);
        setChecking(false);
        router.replace(loginTarget);
        return;
      }

      // Check role permissions if specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        isRedirecting.current = true;
        setAuthorized(false);
        setChecking(false);

        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (role === 'host') {
          router.replace('/host');
        } else {
          router.replace('/user');
        }
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };

    checkAuthorization();

    window.addEventListener('authChange', checkAuthorization);
    return () => window.removeEventListener('authChange', checkAuthorization);
  }, [router, pathname]);

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <LoadingSpinner fullScreen size="lg" message="Verifying authentication..." />
      </div>
    );
  }

  return children;
}
