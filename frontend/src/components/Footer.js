'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');

      const authState = !!token;
      setIsLoggedIn(authState);

      setIsAdmin(authState && userRole === 'admin');
    };

    checkAuth();

    window.addEventListener('authChange', checkAuth);

    setCurrentYear(new Date().getFullYear());

    return () => {
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('authChange'));
    router.push('/');
  };

  return (
    <footer className="dark:bg-neutral-900 bg-white text-neutral-900 dark:text-white py-8 border-t border-neutral-200 dark:border-neutral-700">
      <div className="max-w-6xl mx-auto px-6">
        {}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {}
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold mb-4">
              <span className="text-blue-400">Charge</span>
              <span className="text-green-400">Loop</span>
            </div>
            <p className="text-neutral-900 dark:text-white text-sm">
              Connecting EV owners with charging stations worldwide.
            </p>
          </div>

          {}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-neutral-700 dark:text-neutral-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Home</a></li>
              <li><a href="/map" className="text-neutral-700 dark:text-neutral-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Find Chargers</a></li>
              <li><a href="/about" className="text-neutral-700 dark:text-neutral-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">About</a></li>
              <li><a href="/contactus" className="text-neutral-700 dark:text-neutral-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Account</h4>
            <ul className="space-y-2 text-sm">
              {isLoggedIn ? (
                <>
                  <li><a href="/profile" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Profile</a></li>
                  <li><a href="/charging-history" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">History</a></li>
                  <li><a href="/wallet" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Wallet</a></li>

                  <li><button onClick={handleLogout} className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Sign Out</button></li>
                </>
              ) : (
                <>
                  <li><a href="/login" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Login</a></li>
                  <li><a href="/signup" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Sign Up</a></li>
                </>
              )}
            </ul>
          </div>

          {}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/contactus" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/admin/login" className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-blue-400 transition-colors">Admin</a></li>
            </ul>
          </div>
        </div>

        {}
        <div className="border-t border-neutral-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-neutral-400 text-sm">
              © {currentYear} ChargeLoop. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-blue-600 transition-colors" title="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-blue-400 transition-colors" title="Twitter">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-pink-500 transition-colors" title="Instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-blue-700 transition-colors" title="LinkedIn">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
