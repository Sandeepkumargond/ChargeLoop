'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithFriendlyError } from '../utils/fetchWithFriendlyError';
import { clearAuth, logout } from '../utils/auth';

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
  const [userName, setUserName] = useState('');
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
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetchWithFriendlyError(`${apiUrl}/`).catch(() => null);
        if (response && response.ok) {
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
    const interval = setInterval(fetchHealth, 60000);

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      setUserEmail(localStorage.getItem('userEmail') || '');
      setUserRole(localStorage.getItem('userRole') || '');
      setUserName(localStorage.getItem('userName') || 'User');
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
    logout('/');
  };

  if (!mounted) return <div className="h-16" />;

  const dashboardHref = userRole === 'host' ? '/host' : userRole === 'admin' ? '/admin/dashboard' : '/user';

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow border-b dark:border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ChargeLoop Logo" className="h-10 w-10 rounded-lg" />
            <span className="font-bold hidden sm:block">
              <span className="text-blue-600">Charge</span>
              <span className="text-green-500">Loop</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">

            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            ))}

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2" aria-label="Toggle Theme">
              {theme === 'light' ? MOON_ICON : SUN_ICON}
            </button>

            {/* Auth Buttons */}
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="relative profile-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:shadow-lg transition-shadow"
                  title={userEmail}
                >
                  {(userName || userEmail || 'U').charAt(0).toUpperCase()}
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{userName}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{userEmail}</p>
                    </div>

                    <Link
                      href={dashboardHref}
                      className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>

                    <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2" aria-label="Toggle Theme">
              {theme === 'light' ? MOON_ICON : SUN_ICON}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Open Mobile Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t dark:border-neutral-700 px-4 pt-2 pb-4 space-y-2 bg-white dark:bg-neutral-800">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium"
            >
              {link.label}
            </Link>
          ))}

          {/* Status */}
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 text-neutral-500 dark:text-neutral-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isCheckingHealth
                  ? "bg-yellow-400 animate-pulse"
                  : healthStatus.mongoStatus === "Connected"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            <span>
              {isCheckingHealth
                ? "Checking server..."
                : healthStatus.mongoStatus === "Connected"
                ? "Server Online"
                : "Server Offline"}
            </span>
          </div>

          {/* Mobile Auth */}
          {!isLoggedIn ? (
            <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-center text-neutral-700 dark:text-neutral-200 font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg bg-blue-600 text-center text-white font-medium hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                  {userEmail}
                </p>
              </div>
              <Link
                href={dashboardHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-center text-neutral-700 dark:text-neutral-200 font-medium"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-center text-neutral-700 dark:text-neutral-200 font-medium"
              >
                👤 Profile
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-3 py-2 rounded-lg bg-red-600 text-center text-white font-medium hover:bg-red-700"
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