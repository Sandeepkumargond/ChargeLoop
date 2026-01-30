'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  // Load initial state on mount only
  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sidebarOpen');
    setIsOpen(savedState !== null ? JSON.parse(savedState) : true);
    
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
    }
  }, [isOpen, mounted]);

  // Determine if we're in user or host section based on stored role
  const isHostSection = userRole === 'host';
  const isUserSection = userRole === 'user';

  const userMenuItems = [
    { label: 'Dashboard', href: '/user' },
    { label: 'Find Chargers', href: '/user/chargers' },
    { label: 'Charging History', href: '/user/charging-history' },
    { label: 'My Wallet', href: '/user/wallet' },
    { label: 'My Vehicles', href: '/user/vehicles' },
    { label: 'Account', href: '/profile' },
    { label: 'Logout', href: '' },
  ];

  const hostMenuItems = [
    { label: 'Dashboard', href: '/host' },
    { label: 'Manage Chargers', href: '/host/stations' },
    { label: 'Bookings & Requests', href: '/host/bookings' },
    { label: 'Earnings & Payouts', href: '/host/earnings' },
    { label: 'Account', href: '/profile' },
    { label: 'Logout', href: '' },
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

  // Don't render if not mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

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
      <aside className={`fixed left-0 top-0 bottom-0 w-52 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-0.5">
            {menuItems
              .filter(item => item.label !== 'Logout')
              .map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
          </nav>
        </div>

        {/* Logout Button at Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <button
            onClick={() => handleMenuClick({ label: 'Logout' })}
            className="w-full text-left px-3 py-2 text-sm rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Logout
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
