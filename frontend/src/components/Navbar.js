'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';

const NAV_LINKS = [
  { href: '/map', label: 'Find Chargers' },
  { href: '/about', label: 'About' },
  { href: '/contactus', label: 'Contact' }
];

const NAV_LINK_CLASS = "px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 text-sm xl:text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors";

const MOON_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 hover:rotate-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const SUN_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 hover:rotate-45">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25m-13.5 0h-2.25m15.356-6.394l-1.591 1.591M6.761 17.239l-1.591 1.591m12.728 0l-1.591-1.591M6.761 6.761L5.17 5.17M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
        if (response.ok) {
          const data = await response.json();
          setHealthStatus(data);
        } else {
          setHealthStatus({ mongoStatus: 'Disconnected' });
        }
      } catch (err) {
        setHealthStatus({ mongoStatus: 'Disconnected' });
      }
    };

    fetchHealth();
    const healthInterval = setInterval(fetchHealth, 30000);

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      const role = localStorage.getItem('userRole');
      setIsLoggedIn(!!token);
      setUserEmail(email || '');
      setUserRole(role || '');
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      clearInterval(healthInterval);
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
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
    userRole === 'host' ? router.push('/host') : router.push('/user');
    setShowUserMenu(false);
  };

  if (!mounted) return <div className="h-16 sm:h-20" />;

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow transition-colors sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">

          {}
          <a href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="ChargeLoop Logo" className="h-9 w-auto" />
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 hidden sm:inline">
              ChargeLoop
            </span>
          </a>

          {}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </a>
            ))}

            <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600 mx-2"></div>

            {}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
            >
              {theme === 'light' ? MOON_ICON : SUN_ICON}
            </button>

            <div className="flex items-center space-x-3">
              {!isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <a href="/login" className="px-3 py-1.5 text-neutral-700 dark:text-neutral-200 font-medium text-sm hover:text-blue-600 transition">
                    Login
                  </a>
                  <a href="/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition shadow-sm">
                    Sign Up
                  </a>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-offset-neutral-800"
                  >
                    <span className="text-white font-bold text-sm">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl overflow-hidden z-50">
                      <div className="py-1">
                        <button onClick={handleDashboardClick} className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                          Dashboard
                        </button>
                        <button onClick={() => { router.push('/profile'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                          Profile
                        </button>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-t border-neutral-100 dark:border-neutral-700">
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {healthStatus && (
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                  healthStatus.mongoStatus === 'Connected'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${healthStatus.mongoStatus === 'Connected' ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'}`}></span>
                  <span>{healthStatus.mongoStatus === 'Connected' ? 'Server On' : 'Server Off'}</span>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="lg:hidden flex items-center space-x-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-neutral-700 dark:text-neutral-200">
              {theme === 'light' ? MOON_ICON : SUN_ICON}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg text-neutral-700 dark:text-neutral-200">
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
