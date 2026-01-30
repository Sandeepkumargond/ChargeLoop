'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sidebarOpen');
    setIsOpen(savedState !== null ? JSON.parse(savedState) : true);

    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
    }
  }, [isOpen, mounted]);

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

  if (!mounted) {
    return null;
  }

  return (
    <>
      {}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-neutral-800 text-white p-2 rounded"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {}
      <aside className={`fixed left-0 top-0 bottom-0 w-52 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'tranneutral-x-0' : '-tranneutral-x-full'} lg:tranneutral-x-0`}>
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
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
          </nav>
        </div>

        {}
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-3">
          <button
            onClick={() => handleMenuClick({ label: 'Logout' })}
            className="w-full text-left px-3 py-2 text-sm rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
