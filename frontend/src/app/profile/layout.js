'use client';

import Sidebar from '@/components/Sidebar';

export default function ProfileLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 lg:flex-row">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:ml-56">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
