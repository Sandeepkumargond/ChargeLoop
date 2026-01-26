'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingCard from '@/components/LoadingCard';

export default function UserDashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');

    if (!token) {
      router.push('/login');
      return;
    }

    setIsLoggedIn(true);
    setUserEmail(email);
    setLoading(false);

    // Fetch current bookings
    fetchCurrentBookings(token);
  }, [router]);

  const fetchCurrentBookings = async (token) => {
    try {
      setBookingsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charging/current-bookings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(Array.isArray(data) ? data : data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="xl"
        message="Loading your dashboard..."
      />
    );
  }

  if (!isLoggedIn) {
    return null; // Router will redirect
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">
            User Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your charging sessions, vehicles, and account
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Charges</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">--</p>
                    </div>
                    <div className="text-4xl"></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Wallet Balance</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹--</p>
                    </div>
                    <div className="text-4xl"></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Vehicles</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">0</p>
                    </div>
                  </div>
                </div>
              </div>
        </div>

        {/* Current Bookings Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Current Bookings</h2>
          {bookingsLoading ? (
            <LoadingCard variant="table" title="Loading your bookings..." />
          ) : bookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <div key={booking._id || booking.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-l-4 border-blue-600">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.chargerStation?.name || booking.stationName || 'Charging Station'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {booking.chargerStation?.location || booking.location || 'Location not specified'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                      {booking.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Start Time:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {booking.startTime ? new Date(booking.startTime).toLocaleString() : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {booking.duration || booking.estimatedTime || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ₹{booking.amount || booking.cost || '0'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/user/charging-history`)}
                    className="w-full mt-4 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow text-center">
              <p className="text-gray-600 dark:text-gray-400">No active bookings at the moment</p>
              <button
                onClick={() => router.push('/user/chargers')}
                className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Find a Charger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
