'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';

export default function GoogleOAuthWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return children;
  }

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      onScriptProps={{
        async: true,
        defer: true,
        crossOrigin: 'anonymous',
      }}
    >
      {children}
    </GoogleOAuthProvider>
  );
}
