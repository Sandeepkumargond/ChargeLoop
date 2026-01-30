'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingCard from '@/components/LoadingCard';

export default function UserDashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [userData, setUserData] = useState({ chargingSessions: 0, walletBalance: 0 });

  // Fetch current bookings
  const fetchCurrentBookings = useCallback(async (token) => {
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
      } else {
      }
    } catch (error) {
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // Fetch my booking requests
  const fetchMyBookingRequests = useCallback(async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charging/requests/my-requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookingRequests(data.requests || []);
      } else {
      }
    } catch (error) {
    }
  }, []);



  // Fetch user data
  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData({
          chargingSessions: data.chargingSessions || 0,
          walletBalance: data.walletBalance || 0
        });
      }
    } catch (error) {
    }
  }, []);

  // Initial setup and auto-refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');

    if (!token) {
      router.push('/login');
      return;
    }

    setIsLoggedIn(true);
    setUserEmail(email);
    setLoading(false);

    // Initial fetch only
    fetchCurrentBookings(token);
    fetchMyBookingRequests(token);
    fetchUserData(token);

    return () => {};
  }, [router, fetchCurrentBookings, fetchMyBookingRequests, fetchUserData]);

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'accepted': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'declined': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'expired': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      'ongoing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'confirmed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
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
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto">
        <div className="py-6 sm:py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              User Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Manage your bookings and account
            </p>
          </div>
        
          {/* Quick Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Total Charges</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userData.chargingSessions}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{userData.walletBalance}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Vehicles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          {/* Active Booking Requests Section */}
          {bookingRequests.filter(req => req.status === 'pending').length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pending Requests</h2>
              <div className="space-y-3">
                {bookingRequests
                  .filter(req => req.status === 'pending')
                  .map((request) => (
                    <div key={request._id} className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-xs">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Host</p>
                          <p className="text-gray-900 dark:text-white font-medium">{request.hostName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Location</p>
                          <p className="text-gray-900 dark:text-white font-medium">{request.hostLocation}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Charger</p>
                          <p className="text-gray-900 dark:text-white font-medium">{request.chargerType}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Duration • Cost</p>
                          <p className="text-gray-900 dark:text-white font-medium">{request.estimatedDuration} min • ₹{request.estimatedCost}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded inline-block">
                        Waiting for approval
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Current Bookings Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Current Bookings</h2>
            {bookingsLoading ? (
              <LoadingCard variant="table" title="Loading..." />
            ) : bookings.length > 0 ? (
              <div>
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-6 gap-4 bg-gray-200 dark:bg-gray-700 p-3 rounded-t font-semibold text-gray-900 dark:text-white text-xs">
                  <div>Station</div>
                  <div>Location</div>
                  <div>Scheduled</div>
                  <div>Duration</div>
                  <div>Cost</div>
                  <div>Status</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2 md:space-y-0">
                  {bookings.map((booking) => (
                    <div 
                      key={booking._id || booking.id}
                      className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 bg-white dark:bg-gray-800 p-3 md:p-3 border border-gray-200 dark:border-gray-700 md:border-b md:border-l-0 md:border-r-0 md:border-t-0 rounded-lg md:rounded-none items-center text-xs md:text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Station - Mobile Label */}
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Station</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {booking.hostName || 'Charging Station'}
                      </div>

                      {/* Location - Mobile Label */}
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Location</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {booking.hostLocation || 'N/A'}
                      </div>

                      {/* Scheduled Time - Mobile Label */}
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Scheduled</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {booking.scheduledTime ? new Date(booking.scheduledTime).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'N/A'}
                      </div>

                      {/* Duration - Mobile Label */}
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Duration</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {booking.actualDuration || booking.estimatedDuration || 'N/A'} min
                      </div>

                      {/* Cost - Mobile Label */}
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Cost</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        ₹{booking.actualCost || booking.estimatedCost || '0'}
                      </div>

                      {/* Status - Mobile Label */}
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Status</div>
                      <div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded inline-block ${
                          booking.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          booking.status === 'accepted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          booking.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {booking.status === 'ongoing' && 'Active'}
                          {booking.status === 'accepted' && 'Accepted'}
                          {booking.status === 'completed' && 'Completed'}
                          {booking.status === 'cancelled' && 'Cancelled'}
                          {booking.status === 'pending' && 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">No active bookings</p>
                <button
                  onClick={() => router.push('/user/chargers')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition"
                >
                  Find a Charger
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
