'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function NavbarFooterWrapper() {
  const pathname = usePathname();

  const isHiddenRoute = pathname.startsWith('/user') || pathname.startsWith('/profile') || pathname.startsWith('/host') || pathname === '/map'|| pathname.startsWith('/admin/dashboard') ;

  if (isHiddenRoute) {
    return null;
  }

  return (
    <>
      <Navbar />
    </>
  );
}

export function FooterWrapper() {
  const pathname = usePathname();

  const isHiddenRoute = pathname.startsWith('/user') || pathname.startsWith('/profile') || pathname.startsWith('/host') || pathname === '/map' || pathname.startsWith('/admin/dashboard');

  if (isHiddenRoute) {
    return null;
  }

  return <Footer />;
}
