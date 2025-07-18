'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
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
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Brand and Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold mb-4">
              <span className="text-blue-400">Charge</span>
              <span className="text-green-400">Loop</span>
            </div>
            <p className="text-gray-300 text-sm">
              Connecting EV owners with charging stations worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
              <li><a href="/map" className="text-gray-300 hover:text-white transition-colors">Find Chargers</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About</a></li>
              <li><a href="/contactus" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Account</h4>
            <ul className="space-y-2 text-sm">
              {isLoggedIn ? (
                <>
                  <li><a href="/profile" className="text-gray-300 hover:text-white transition-colors">Profile</a></li>
                  <li><a href="/charging-history" className="text-gray-300 hover:text-white transition-colors">History</a></li>
                  <li><a href="/wallet" className="text-gray-300 hover:text-white transition-colors">Wallet</a></li>
                  <li><button onClick={handleLogout} className="text-gray-300 hover:text-white transition-colors">Sign Out</button></li>
                </>
              ) : (
                <>
                  <li><a href="/login" className="text-gray-300 hover:text-white transition-colors">Login</a></li>
                  <li><a href="/signup" className="text-gray-300 hover:text-white transition-colors">Sign Up</a></li>
                  <li><a href="/host/register" className="text-gray-300 hover:text-white transition-colors">Become Host</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-green-400">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/contactus" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} ChargeLoop. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                📘
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-300 transition-colors">
                🐦
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition-colors">
                📷
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                💼
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
