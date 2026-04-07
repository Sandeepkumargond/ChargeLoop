'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sidebarOpen');
    setIsOpen(savedState !== null ? JSON.parse(savedState) : true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
    }
  }, [isOpen, mounted]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, mounted }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}
