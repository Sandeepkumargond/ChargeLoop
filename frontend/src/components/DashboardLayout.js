'use client';

import Sidebar from './Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

export default function DashboardLayout({ children }) {
  const { isOpen, setIsOpen, mounted } = useSidebar();

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 lg:flex-row">
      {/* Mobile Hamburger Button - Fixed at top-left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed lg:hidden top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-0 transition-all duration-300">
        <div className="flex-1 overflow-y-auto pt-20 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
