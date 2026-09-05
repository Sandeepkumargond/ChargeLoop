/**
 * Authentication and Cookie Management Utilities
 */

export function setCookie(name, value, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + encodeURIComponent(name) + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload && payload.exp) {
      // payload.exp is in seconds
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function getAuth() {
  if (typeof window === 'undefined') {
    return { token: null, role: null, email: null, name: null };
  }

  let token = localStorage.getItem('token');
  let role = localStorage.getItem('userRole');
  let email = localStorage.getItem('userEmail');
  let name = localStorage.getItem('userName');

  // If token is in cookie but missing from localStorage (e.g. after fresh browser open)
  if (!token) {
    const cookieToken = getCookie('token');
    const cookieRole = getCookie('userRole');
    if (cookieToken && !isTokenExpired(cookieToken)) {
      token = cookieToken;
      role = cookieRole || 'user';
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
    }
  }

  // Check token expiration
  if (token && isTokenExpired(token)) {
    clearAuth();
    return { token: null, role: null, email: null, name: null };
  }

  return { token, role, email, name };
}

export function setAuth({ token, userRole = 'user', userEmail = '', userName = '' }) {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', userRole || 'user');
    if (userEmail) localStorage.setItem('userEmail', userEmail);
    if (userName) localStorage.setItem('userName', userName);

    setCookie('token', token, 7);
    setCookie('userRole', userRole || 'user', 7);
  }

  window.dispatchEvent(new Event('authChange'));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;

  const hadToken = localStorage.getItem('token');
  const hadRole = localStorage.getItem('userRole');

  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');

  deleteCookie('token');
  deleteCookie('userRole');

  // Only dispatch event if auth state actually changed to avoid event loops
  if (hadToken || hadRole) {
    window.dispatchEvent(new Event('authChange'));
  }
}

export function logout(redirectTo = '/') {
  clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}

export function syncAuthCookies() {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (token && !isTokenExpired(token)) {
    setCookie('token', token, 7);
    if (role) setCookie('userRole', role, 7);
  } else if (!token) {
    deleteCookie('token');
    deleteCookie('userRole');
  }
}
