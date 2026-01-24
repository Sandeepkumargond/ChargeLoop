'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';

const NAV_LINKS = [
  { href: '/map', label: 'Find Chargers' },
  { href: '/about', label: 'About' },
  { href: '/contactus', label: 'Contact' }
];

const NAV_LINK_CLASS = "px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 text-sm xl:text-base font-medium";

const MOON_SVG = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SUN_SVG = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      const role = localStorage.getItem('userRole');
      setIsLoggedIn(!!token);
      setUserEmail(email || '');
      setUserRole(role || '');
    };

    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('authChange'));
    router.push('/');
  };

  const handleDashboardClick = () => {
    if (userRole === 'host') {
      router.push('/host');
    } else {
      router.push('/user');
    }
    setShowUserMenu(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow transition-colors sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="ChargeLoop Logo" className="h-10 sm:h-12 w-auto" />
            <span className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 hidden sm:inline">
              ChargeLoop
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </a>
            ))}
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

            {mounted && (
              <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-700 dark:text-gray-200" aria-label="Toggle theme">
                {theme === 'light' ? MOON_SVG : SUN_SVG}
              </button>
            )}

            <div className="flex items-center space-x-2">
              <a href="/register-host" className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium text-sm shadow-sm">
                Become a Host
              </a>
              {!isLoggedIn ? (
                <>
                  <a href="/login" className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 font-medium text-sm">
                    Login
                  </a>
                  <a href="/signup" className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium text-sm shadow-sm">
                    Sign Up
                  </a>
                </>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md"
                  >
                    <span className="text-white font-bold text-sm">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-10 dark:ring-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={handleDashboardClick}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/profile');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {mounted && (
              <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-700 dark:text-gray-200" aria-label="Toggle theme">
                {theme === 'light' ? MOON_SVG : SUN_SVG}
              </button>
            )}
            
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg text-gray-700 dark:text-gray-200" aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}>
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 animate-in slide-in-from-top duration-200">
            <div className="px-3 py-4 space-y-2">
              {NAV_LINKS.map(link => (
                <a key={link.href} href={link.href} className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 font-medium">
                  {link.label}
                </a>
              ))}
              
              <div className="py-2"></div>

              <a href="/register-host" className="block px-4 py-3 rounded-lg bg-orange-600 text-white font-medium text-center shadow-sm">
                Become a Host
              </a>
              {!isLoggedIn ? (
                <>
                  <a href="/login" className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 font-medium text-center border border-gray-300 dark:border-gray-600">
                    Login
                  </a>
                  <a href="/signup" className="block px-4 py-3 rounded-lg bg-green-600 text-white font-medium text-center shadow-sm">
                    Sign Up
                  </a>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDashboardClick}
                    className="w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 font-medium border border-gray-300 dark:border-gray-600"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/profile');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 font-medium border border-gray-300 dark:border-gray-600"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 font-medium border border-red-300 dark:border-red-600"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
