'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function HostPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Registration Status States
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [regStatusLoading, setRegStatusLoading] = useState(false);
  const [regStatusError, setRegStatusError] = useState('');

  // Bookings States
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalChargers: 0,
    totalEarnings: 0,
    activeBookings: 0,
    pendingRequests: 0
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auth Check
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

    // Auto-fetch registration status when page loads
    fetchRegistrationStatus();
    fetchBookings();
  }, [router]);

  // Fetch Registration Status
  const fetchRegistrationStatus = useCallback(async () => {
    setRegStatusLoading(true);
    setRegStatusError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/host-registration-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setRegistrationStatus(data.request || null);
      setStats(prev => ({
        ...prev,
        pendingRequests: data.request?.status === 'pending' ? 1 : 0
      }));
    } catch (err) {
      setRegStatusError(err.message);
    } finally {
      setRegStatusLoading(false);
    }
  }, []);

  // Fetch Bookings
  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.ok ? await response.json() : { bookings: [] };
      setBookings(data.bookings || []);
      setStats(prev => ({
        ...prev,
        activeBookings: data.bookings?.filter(b => b.status === 'confirmed').length || 0
      }));
    } catch (err) {
      setBookingsError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // Refresh Data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchRegistrationStatus(), fetchBookings()]);
    setLastUpdate(new Date());
  }, [fetchRegistrationStatus, fetchBookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">Host Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your EV charging stations and earnings</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Chargers</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{stats.totalChargers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Earnings</p>
                <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">₹{stats.totalEarnings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Active Bookings</p>
                <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.activeBookings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Pending Requests</p>
                <p className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Requests Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Requests</h2>
            <button onClick={refreshData} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              ↻ Refresh
            </button>
          </div>

          {bookingsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : bookingsError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
              <p className="text-red-800 dark:text-red-300 font-medium">{bookingsError}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-8 text-center">
              <p className="text-blue-900 dark:text-blue-300 font-semibold mb-1">No booking requests yet</p>
              <p className="text-blue-800 dark:text-blue-400 text-sm">Check back soon for new requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">User</p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{booking.userEmail}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{booking.vehicle?.model || 'Unknown Vehicle'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Timeline</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-500">Check-in</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{new Date(booking.startTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-500">Check-out</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{new Date(booking.endTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 mt-4 w-full md:w-auto">
                          <button className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Accept</button>
                          <button className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Decline</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registration Status Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Host Registration</h2>

          {regStatusLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : regStatusError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
              <p className="text-red-800 dark:text-red-300 font-semibold">{regStatusError}</p>
            </div>
          ) : !registrationStatus ? (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl p-8 text-center">
              <p className="text-orange-900 dark:text-orange-300 font-semibold mb-2 text-lg">Ready to Start Hosting?</p>
              <p className="text-orange-800 dark:text-orange-400 mb-6">Submit your application to become a ChargeLoop host</p>
              <a href="/host/register" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Submit Application
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Card */}
              <div className={`border-2 rounded-xl p-8 ${registrationStatus.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' : registrationStatus.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'}`}>
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">
                      {registrationStatus.status === 'pending' && 'Application Under Review'}
                      {registrationStatus.status === 'approved' && 'Registration Approved'}
                      {registrationStatus.status === 'denied' && 'Application Denied'}
                    </h2>
                    <p className="text-lg mb-2">
                      {registrationStatus.status === 'pending' && 'Your application is being reviewed by our team.'}
                      {registrationStatus.status === 'approved' && 'You are approved to start hosting!'}
                      {registrationStatus.status === 'denied' && 'Your application has been denied.'}
                    </p>
                    <div className="inline-block">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        registrationStatus.status === 'pending' ? 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-300' :
                        registrationStatus.status === 'approved' ? 'bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300' :
                        'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        Status: {registrationStatus.status.charAt(0).toUpperCase() + registrationStatus.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Application Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Company Name</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{registrationStatus.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{registrationStatus.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{registrationStatus.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Number of Chargers</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{registrationStatus.numberOfChargers || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Denial Reason */}
              {registrationStatus.status === 'denied' && registrationStatus.denialReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-3">Reason for Denial</h3>
                  <p className="text-red-800 dark:text-red-200 mb-6">{registrationStatus.denialReason}</p>
                  <a href="/register-host" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Submit New Application
                  </a>
                </div>
              )}

              {/* Success Next Steps */}
              {registrationStatus.status === 'approved' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-4">What's Next?</h3>
                  <ul className="space-y-3">
                    <li className="text-green-800 dark:text-green-200">Check your email for confirmation</li>
                    <li className="text-green-800 dark:text-green-200">Set up your charger details and pricing</li>
                    <li className="text-green-800 dark:text-green-200">Start accepting bookings</li>
                    <li className="text-green-800 dark:text-green-200">Begin earning from your charging stations</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
