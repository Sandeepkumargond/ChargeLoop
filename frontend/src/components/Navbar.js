'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithFriendlyError } from '../utils/fetchWithFriendlyError';

const NAV_LINKS = [
  { href: '/map', label: 'Find Chargers' },
  { href: '/about', label: 'About' },
  { href: '/contactus', label: 'Contact' }
];

const NAV_LINK_CLASS =
  "px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 text-sm xl:text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors";

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
  const [healthStatus, setHealthStatus] = useState({ mongoStatus: 'Checking' });
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);

  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (showUserMenu && e.target.closest('.profile-menu') === null) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  useEffect(() => {
    setMounted(true);

    const fetchHealth = async () => {
      setIsCheckingHealth(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://chargeloop.onrender.com';
        const response = await fetchWithFriendlyError(`${apiUrl}/`);
        if (response.ok) {
          const data = await response.json();
          setHealthStatus(data);
        } else {
          setHealthStatus({ mongoStatus: 'Disconnected' });
        }
      } catch (err) {
        setHealthStatus({ mongoStatus: 'Disconnected' });
      } finally {
        setIsCheckingHealth(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      setUserEmail(localStorage.getItem('userEmail') || '');
      setUserRole(localStorage.getItem('userRole') || '');
    };

    checkAuth();
    window.addEventListener('authChange', checkAuth);
    window.addEventListener('storage', checkAuth);

    return () => {
      clearInterval(interval);
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    router.push('/');
  };

  if (!mounted) return <div className="h-16" />;

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow border-b dark:border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" className="h-10 w-10 rounded-lg" />
            <span className="font-bold hidden sm:block">
              <span className="text-blue-600">Charge</span>
              <span className="text-green-500">Loop</span>
            </span>
          </a>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-4">

            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </a>
            ))}

            {/* Theme */}
            <button onClick={toggleTheme} className="p-2">
              {theme === 'light' ? MOON_ICON : SUN_ICON}
            </button>

            {/* Auth */}
            {!isLoggedIn ? (
              <>
                <a href="/login" className="text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400">Login</a>
                <a href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Sign Up
                </a>
              </>
            ) : (
              <div className="relative profile-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:shadow-lg transition-shadow"
                  title={userEmail}
                >
                  {userEmail.charAt(0).toUpperCase()}
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-50">
                   

                    {/* Dashboard Link */}
                    <a
                      href={userRole === 'host' ? '/host' : userRole === 'admin' ? '/admin/dashboard' : '/user'}
                      className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                       Dashboard
                    </a>

                    {/* Profile Link */}
                    <a
                      href="/profile"
                      className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                       Profile
                    </a>

                    
                    {/* Divider */}
                    <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 px-2 py-1 text-sm text-neutral-600 dark:text-neutral-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCheckingHealth
                    ? "bg-yellow-400 animate-pulse"
                    : healthStatus.mongoStatus === "Connected"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="whitespace-nowrap">
                {isCheckingHealth
                  ? "Starting..."
                  : healthStatus.mongoStatus === "Connected"
                  ? "Server Online"
                  : "Server Offline"}
              </span>
            </div>

          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden p-4 space-y-3 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200">
              {link.label}
            </a>
          ))}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm px-3 py-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCheckingHealth
                  ? "bg-yellow-400 animate-pulse"
                  : healthStatus.mongoStatus === "Connected"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-neutral-600 dark:text-neutral-400">
              {isCheckingHealth
                ? "Starting..."
                : healthStatus.mongoStatus === "Connected"
                ? "Server Online"
                : "Server Offline"}
            </span>
          </div>

          {/* Mobile Auth */}
          {!isLoggedIn ? (
            <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <a href="/login" className="block px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600">
                Login
              </a>
              <a href="/signup" className="block px-3 py-2 rounded-lg bg-blue-600 text-center text-white hover:bg-blue-700">
                Sign Up
              </a>
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {localStorage.getItem('userName') || 'User'}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                  {userEmail}
                </p>
              </div>
              <a
                href={userRole === 'host' ? '/host' : userRole === 'admin' ? '/admin/dashboard' : '/user'}
                className="block px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                📊 Dashboard
              </a>
              <a
                href="/profile"
                className="block px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                👤 Profile
              </a>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-3 py-2 rounded-lg bg-red-600 text-center text-white hover:bg-red-700"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}