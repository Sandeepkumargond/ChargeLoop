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
    // Check if user is logged in and admin
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      const authState = !!token;
      setIsLoggedIn(authState);
      
      // Check if user is admin based on stored role
      setIsAdmin(authState && userRole === 'admin');
    };

    checkAuth();
    
    // Listen for auth changes
    window.addEventListener('authChange', checkAuth);
    
    // Update year
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
    <footer className="dark:bg-gray-900 bg-white text-gray-900 dark:text-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Brand and Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold mb-4">
              <span className="text-blue-400">Charge</span>
              <span className="text-green-400">Loop</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm">
              Connecting EV owners with charging stations worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Home</a></li>
              <li><a href="/map" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Find Chargers</a></li>
              <li><a href="/about" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">About</a></li>
              <li><a href="/contactus" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Account</h4>
            <ul className="space-y-2 text-sm">
              {isLoggedIn ? (
                <>
                  <li><a href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Profile</a></li>
                  <li><a href="/charging-history" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">History</a></li>
                  <li><a href="/wallet" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Wallet</a></li>
                 
                  <li><button onClick={handleLogout} className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Sign Out</button></li>
                </>
              ) : (
                <>
                  <li><a href="/login" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Login</a></li>
                  <li><a href="/signup" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Sign Up</a></li>
                  <li><a href="/host/register" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Become Host</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/contactus" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/admin/login" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-400 transition-colors">Admin</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} ChargeLoop. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <a href="https://www.instagram.com/sandeepkr_04/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.017 0C8.396 0 7.929.01 6.71.048 5.493.087 4.73.222 4.058.42a5.916 5.916 0 0 0-2.134 1.384A5.916 5.916 0 0 0 .42 4.058C.222 4.73.087 5.493.048 6.71.01 7.929 0 8.396 0 12.017c0 3.624.01 4.09.048 5.303.039 1.218.174 1.98.372 2.653a5.916 5.916 0 0 0 1.384 2.134 5.916 5.916 0 0 0 2.134 1.384c.673.198 1.435.333 2.653.372 1.218.039 1.684.048 5.303.048 3.624 0 4.09-.01 5.303-.048 1.218-.039 1.98-.174 2.653-.372a5.916 5.916 0 0 0 2.134-1.384 5.916 5.916 0 0 0 1.384-2.134c.198-.673.333-1.435.372-2.653.039-1.218.048-1.684.048-5.303 0-3.624-.01-4.09-.048-5.303-.039-1.218-.174-1.98-.372-2.653A5.916 5.916 0 0 0 19.658.42C18.985.222 18.222.087 17.004.048 15.785.01 15.319 0 11.695 0h.322zM12.017 2.163c3.564 0 3.988.012 5.396.05 1.3.06 2.008.27 2.478.45a4.14 4.14 0 0 1 1.526.992 4.14 4.14 0 0 1 .992 1.526c.18.47.39 1.178.45 2.478.038 1.408.05 1.832.05 5.396 0 3.564-.012 3.988-.05 5.396-.06 1.3-.27 2.008-.45 2.478a4.14 4.14 0 0 1-.992 1.526 4.14 4.14 0 0 1-1.526.992c-.47.18-1.178.39-2.478.45-1.408.038-1.832.05-5.396.05-3.564 0-3.988-.012-5.396-.05-1.3-.06-2.008-.27-2.478-.45a4.14 4.14 0 0 1-1.526-.992 4.14 4.14 0 0 1-.992-1.526c-.18-.47-.39-1.178-.45-2.478-.038-1.408-.05-1.832-.05-5.396 0-3.564.012-3.988.05-5.396.06-1.3.27-2.008.45-2.478a4.14 4.14 0 0 1 .992-1.526 4.14 4.14 0 0 1 1.526-.992c.47-.18 1.178-.39 2.478-.45 1.408-.038 1.832-.05 5.396-.05z" clipRule="evenodd" />
                  <circle cx="12.017" cy="12.017" r="3.708" />
                  <circle cx="17.963" cy="6.054" r=".947" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/sandeepkumargond/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://github.com/Sandeepkumargond" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
