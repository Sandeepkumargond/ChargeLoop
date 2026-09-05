import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isHostRoute = pathname.startsWith('/host');
  const isUserRoute = pathname.startsWith('/user');
  const isProfileRoute = pathname.startsWith('/profile');

  const isProtectedRoute = isUserRoute || isHostRoute || isProfileRoute || isAdminRoute;

  // 1. If accessing a protected route without a token
  if (isProtectedRoute && !token) {
    if (isAdminRoute) {
      const adminLoginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(adminLoginUrl);
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Admin route protection: user must have role 'admin'
  if (isAdminRoute && userRole !== 'admin') {
    const adminLoginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(adminLoginUrl);
  }

  // 3. If an authenticated user visits /login or /signup, redirect to their dashboard
  if ((pathname === '/login' || pathname === '/signup') && token) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else if (userRole === 'host') {
      return NextResponse.redirect(new URL('/host', request.url));
    } else {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // 4. If an authenticated admin visits /admin/login, redirect to /admin/dashboard
  if (pathname === '/admin/login' && token && userRole === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user/:path*',
    '/user',
    '/host/:path*',
    '/host',
    '/admin/:path*',
    '/admin',
    '/profile/:path*',
    '/profile',
    '/login',
    '/signup',
  ],
};
