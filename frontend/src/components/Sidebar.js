'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState(null);
  const [isOpen, setIsOpen] = useState(() => {
    // Initialize from localStorage on first render
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarOpen');
      return savedState !== null ? JSON.parse(savedState) : true;
    }
    return true;
  });

  // Get user role from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  // Determine if we're in user or host section based on stored role
  const isHostSection = userRole === 'host';
  const isUserSection = userRole === 'user';

  const userMenuItems = [
    { label: 'Dashboard', href: '/user', icon: '' },
    { label: 'Find Chargers', href: '/user/chargers', icon: '' },
    { label: 'Charging History', href: '/user/charging-history', icon: '' },
    { label: 'My Wallet', href: '/user/wallet', icon: '' },
    { label: 'My Vehicles', href: '/user/vehicles', icon: '' },
    { label: 'Account', href: '/profile', icon: '' },
    { label: 'Logout', href: '', icon: '' },
  ];

  const hostMenuItems = [
    { label: 'Dashboard', href: '/host', icon: '' },
    { label: 'Manage Chargers', href: '/host/stations', icon: '' },
    { label: 'Bookings & Requests', href: '/host/bookings', icon: '' },
    { label: 'Earnings & Payouts', href: '/host/earnings', icon: '' },
    { label: 'Account', href: '/profile', icon: '' },
    { label: 'Logout', href: '', icon: '' },
  ];

  const menuItems = isHostSection ? hostMenuItems : userMenuItems;

  const isActive = (href) => {
    if (href === '/user' && pathname === '/user') return true;
    if (href === '/host' && pathname === '/host') return true;
    if (href === '/profile') return pathname === '/profile' || pathname.startsWith('/profile/');
    return pathname === href;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('authChange'));
    router.push('/');
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleMenuClick = (item) => {
    if (item.label === 'Logout') {
      handleLogout();
    } else {
      router.push(item.href);
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-gray-800 text-white p-2 rounded"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-56 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-2">
            {isHostSection ? '' : ''}
          </h3>
          
          <nav className="space-y-1">
            {menuItems
              .filter(item => item.label !== 'Logout')
              .map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded ${
                    isActive(item.href)
                      ? isHostSection
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 font-medium border-l-4 border-orange-600'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 font-medium border-l-4 border-blue-600'
                      : 'text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
          </nav>
        </div>

        {/* Logout Button at Bottom */}
        <div className="border-t border-gray-300 dark:border-gray-600 p-4">
          <button
            onClick={() => handleMenuClick({ label: 'Logout' })}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <span className="text-lg"></span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
