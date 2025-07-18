'use client';

import { useEffect, useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Update auth state when localStorage token is added/removed
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const newAuthState = !!token;
      console.log('Navbar auth check:', { hasToken: !!token, currentIsLoggedIn: isLoggedIn, newState: newAuthState });
      
      if (newAuthState !== isLoggedIn) {
        setIsLoggedIn(newAuthState);
      }
      setLoading(false);
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (from other tabs)
    const handleStorageChange = () => {
      console.log('Storage change detected');
      checkAuth();
    };

    // Listen for custom auth event (from same tab)
    const handleAuthChange = () => {
      console.log('Auth change event detected');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);

    // Optional: dispatch a custom event
    window.dispatchEvent(new Event('authChange'));

    router.push('/login');
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
      {/* Brand */}
      <div className="text-2xl font-bold">
        <span className="text-blue-600">Charge</span>
        <span className="text-green-600">Loop</span>
      </div>

      {/* Navigation Links */}
      <ul className="flex space-x-6 text-gray-700 font-medium">
        <a href="/" className="cursor-pointer hover:text-blue-600">Home</a>
        <a href="/map" className="cursor-pointer hover:text-blue-600">Map</a>
        <a href="/about" className="cursor-pointer hover:text-blue-600">About</a>
        <a href="/contactus" className="cursor-pointer hover:text-blue-600">Contact</a>
      </ul>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {loading ? (
          // Show loading state
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : isLoggedIn ? (
          // Show user menu when logged in
          <>
            <BellIcon className="h-6 w-6 text-gray-600 hover:text-blue-600 cursor-pointer" />
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center items-center rounded-full bg-gray-200 hover:ring-2 ring-blue-500 focus:outline-none transition-all duration-200">
                  <img
                    src="https://www.w3schools.com/howto/img_avatar.png"
                    alt="Profile"
                    className="h-10 w-10 rounded-full cursor-pointer"
                    // onClick={() => router.push('/profile')}
                  />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute text-black right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-1 py-1">
                    
                    <Menu.Item>
                      {({ active }) => (
                        <a 
                          href="/profile" 
                          className={`${active ? 'bg-blue-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                        >
                          Your Profile
                        </a>
                      )}
                    </Menu.Item>
                    
                    <Menu.Item>
                      {({ active }) => (
                        <a 
                          href="/charging-history" 
                          className={`${active ? 'bg-blue-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                        >
                          Charging History
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a 
                          href="/wallet" 
                          className={`${active ? 'bg-blue-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                        >
                          Your Wallet
                        </a>
                      )}
                    </Menu.Item>
                    <div className="border-t border-gray-200 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <a 
                          href="/host/register" 
                          className={`${active ? 'bg-green-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                        >
                          🏠 Become a Host
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a 
                          href="/host/dashboard" 
                          className={`${active ? 'bg-green-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                        >
                          📊 Host Dashboard
                        </a>
                      )}
                    </Menu.Item>
                    <div className="border-t border-gray-200 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${active ? 'bg-red-100 text-red-600' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                        >
                          Sign Out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </>
        ) : (
          // Show login/signup buttons when not logged in
          <div className="flex space-x-3">
            <a 
              href="/login" 
              className="text-blue-600 px-4 py-2 font-semibold hover:underline transition-all duration-200"
            >
              LogIn
            </a>
            <a 
              href="/signup" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all duration-200"
            >
              Sign Up
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}