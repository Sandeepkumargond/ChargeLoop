'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, setIsOpen, mounted } = useSidebar();
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const loadUserData = () => {
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName');
      const email = localStorage.getItem('userEmail');
      setUserRole(role);
      setUserName(name);
      setUserEmail(email || '');
    };

    loadUserData();
    window.addEventListener('authChange', loadUserData);
    return () => window.removeEventListener('authChange', loadUserData);
  }, []);

  const isAdminSection = userRole === 'admin';
  const isHostSection = userRole === 'host';
  const isUserSection = userRole === 'user';

  const adminMenuItems = [
    { id: 'pending', label: 'Pending', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'approved', label: 'Approved', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'rejected', label: 'Rejected', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'admins', label: 'Admins', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )}
  ];

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/user', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4V7" /></svg>
    )},
    { id: 'chargers', label: 'Find Chargers', href: '/user/chargers', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    )},
    { id: 'history', label: 'Charging History', href: '/user/charging-history', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'vehicles', label: 'My Vehicles', href: '/user/vehicles', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h.01M12 12h.01M18 12h.01M6 6h.01M12 6h.01M18 6h.01M6 18h.01M12 18h.01M18 18h.01" /></svg>
    )},
  ];

  const hostMenuItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/host', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4V7" /></svg>
    )},

    { id: 'bookings', label: 'Bookings & Requests', href: '/host/bookings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    )},
    { id: 'earnings', label: 'Earnings & Payouts', href: '/host/earnings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
  ];

  const menuItems = isAdminSection ? adminMenuItems : (isHostSection ? hostMenuItems : userMenuItems);

  const isActive = (item) => {
    if (isAdminSection) {
      return activeTab === item.id;
    }
    const href = item.href;
    if (href === '/user' && pathname === '/user') return true;
    if (href === '/host' && pathname === '/host') return true;
    if (href === '/profile') return pathname === '/profile' || pathname.startsWith('/profile/');
    return pathname === href;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.dispatchEvent(new Event('authChange'));
    router.push('/');
  };

  const handleMenuClick = (item) => {
    if (isAdminSection) {
      setActiveTab(item.id);
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
      <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out shadow-sm lg:static lg:inset-auto lg:z-auto`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-100 dark:border-neutral-700">
          <div className={`flex items-center gap-2 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0">
              CL
            </div>
            <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
              ChargeLoop
            </span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`group relative flex items-center w-full p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <span className={`shrink-0 transition-colors ${isActive(item) ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'}`}>
                {item.icon}
              </span>

              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                {item.label}
              </span>

              {isActive(item) && isOpen && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}

              {!isOpen && (
                <div className="absolute left-14 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-700">
          {isAdminSection ? (
            isOpen ? (
              <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-xl p-3 mb-2 flex items-center gap-3 cursor-default">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {userName?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden min-w-0 text-left">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{userName || 'Admin'}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Administrator</p>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center mb-2 p-2 rounded-lg cursor-default">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {userName?.charAt(0) || 'A'}
                </div>
              </div>
            )
          ) : (
            isOpen ? (
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-xl p-3 mb-2 flex items-center gap-3 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {userName?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden min-w-0 text-left">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{userName}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">View Profile</p>
                </div>
              </button>
            ) : (
              <button
                onClick={() => router.push('/profile')}
                className="relative w-full flex justify-center mb-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {userName?.charAt(0) || 'U'}
                </div>
                <div className="absolute left-14 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                  {userName}
                </div>
              </button>
            )
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center w-full p-2 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors ${!isOpen && 'justify-center'}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {isOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
