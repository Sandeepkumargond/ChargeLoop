'use client';

import Sidebar from './Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

export default function DashboardLayout({ children }) {
  const { isOpen, setIsOpen, mounted } = useSidebar();

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 lg:flex-row">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:ml-0 transition-all duration-300">
        {/* Mobile Header with Hamburger - Only visible on mobile */}
        <div className="lg:hidden flex items-center h-14 px-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-30">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Mobile Overlay - Only visible on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
