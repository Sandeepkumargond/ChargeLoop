'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import LoadingCard from '@/components/LoadingCard';

export default function HostPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Registration Status States
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [regStatusLoading, setRegStatusLoading] = useState(false);
  const [regStatusError, setRegStatusError] = useState('');

  // Map Visibility States
  const [isVisibleOnMap, setIsVisibleOnMap] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Booking Requests States
  const [bookingRequests, setBookingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');

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

    // Initial fetch only
    fetchRegistrationStatus();
    fetchPendingRequests();

    return () => {};
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
      setRegistrationStatus(data.host || null);
      if (data.host) {
        setIsVisibleOnMap(data.host.isVisibleOnMap !== false);
      }
      setStats(prev => ({
        ...prev,
        pendingRequests: data.host?.verificationStatus === 'pending' ? 1 : 0
      }));
    } catch (err) {
      setRegStatusError(err.message);
    } finally {
      setRegStatusLoading(false);
    }
  }, []);

  // Fetch Pending Booking Requests
  const fetchPendingRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/booking-requests/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setBookingRequests(data.requests || []);
      setStats(prev => ({
        ...prev,
        pendingRequests: data.requests?.filter(r => r.status === 'pending').length || 0
      }));
    } catch (err) {
      setRequestsError(err.message);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  // Handle Accept Request
  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charging/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || 'Failed to accept request');
      }
      
      showSuccess('Booking request accepted successfully!');
      fetchPendingRequests();
    } catch (err) {
      showError(err.message || 'Error accepting request');
    }
  };

  // Handle Decline Request
  const handleDeclineRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Enter reason for declining (optional):');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charging/requests/${requestId}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || '' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || 'Failed to decline request');
      }
      
      showSuccess('Booking request declined successfully!');
      fetchPendingRequests();
    } catch (err) {
      showError(err.message || 'Error declining request');
    }
  };

  // Toggle Map Visibility
  const toggleMapVisibility = async () => {
    try {
      setToggleLoading(true);
      const token = localStorage.getItem('token');
      const hostId = registrationStatus?._id;
      
      if (!hostId) {
        showError('Host ID not found');
        return;
      }
      
      const newVisibility = !isVisibleOnMap;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/${hostId}/visibility`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVisibleOnMap: newVisibility })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle visibility');
      }
      
      setIsVisibleOnMap(data.isVisibleOnMap);
      const statusMessage = data.isVisibleOnMap 
        ? 'Your charger is now visible on the map' 
        : 'Your charger has been hidden from the map';
      showSuccess(statusMessage);
    } catch (err) {
      showError(err.message || 'Failed to toggle visibility');
    } finally {
      setToggleLoading(false);
    }
  };

  // Refresh Data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchRegistrationStatus(), fetchPendingRequests()]);
    setLastUpdate(new Date());
  }, [fetchRegistrationStatus, fetchPendingRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingCard variant="table" title="Loading..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 h-screen flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto">
        <div className="py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Host Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your charging stations</p>
            </div>
            {registrationStatus?.verificationStatus === 'approved' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Map Visibility</span>
                <button
                  onClick={toggleMapVisibility}
                  disabled={toggleLoading}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    isVisibleOnMap ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 hover:bg-gray-400'
                  } ${toggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} focus:outline-none`}
                  title={isVisibleOnMap ? 'Hide from map' : 'Show on map'}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isVisibleOnMap ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingRequests}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Chargers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalChargers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Earnings</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalEarnings}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Active</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeBookings}</p>
          </div>
        </div>

        {/* Pending Booking Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Requests</h2>
            <button onClick={refreshData} className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              Refresh
            </button>
          </div>

          {requestsLoading ? (
            <LoadingCard variant="table" title="Loading..." />
          ) : requestsError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-4">
              <p className="text-red-800 dark:text-red-300 text-sm">{requestsError}</p>
            </div>
          ) : bookingRequests.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookingRequests.filter(req => req.status === 'pending').map(request => (
                <div key={request._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.userId?.name || 'User'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{request.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Booking</p>
                      <p className="text-sm text-gray-900 dark:text-white">{request.estimatedDuration} min • ₹{request.estimatedCost}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(request.scheduledTime).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Charger</p>
                      <p className="text-sm text-gray-900 dark:text-white">{request.chargerType}</p>
                    </div>
                  </div>

                  {request.status === 'accepted' ? (
                    <div className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 inline-block">
                      Accepted
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-medium transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded font-medium transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registration Status Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Host Status</h2>

          {regStatusLoading ? (
            <LoadingCard variant="table" title="Loading..." />
          ) : regStatusError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-4 text-center">
              <p className="text-red-800 dark:text-red-300 text-sm">{regStatusError}</p>
            </div>
          ) : !registrationStatus ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-6 text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Complete Registration</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Set up your charger to start earning</p>
              <button
                onClick={() => router.push('/host/register')}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`rounded border p-4 ${
                registrationStatus.verificationStatus === 'approved'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
              }`}>
                <h3 className={`font-semibold text-sm mb-1 ${
                  registrationStatus.verificationStatus === 'approved'
                    ? 'text-green-900 dark:text-green-300'
                    : 'text-yellow-900 dark:text-yellow-300'
                }`}>
                  {registrationStatus.verificationStatus === 'approved' ? 'Approved' : 'Pending Review'}
                </h3>
                <p className={`text-xs ${
                  registrationStatus.verificationStatus === 'approved'
                    ? 'text-green-800 dark:text-green-400'
                    : 'text-yellow-800 dark:text-yellow-400'
                }`}>
                  {registrationStatus.verificationStatus === 'approved'
                    ? 'You can accept bookings now'
                    : 'Your registration is under review'}
                </p>
              </div>

              {registrationStatus && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Charger Info</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Type</p>
                      <p className="text-gray-900 dark:text-white font-medium">{registrationStatus.chargerType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Rate</p>
                      <p className="text-gray-900 dark:text-white font-medium">₹{registrationStatus.pricePerHour || '0'}/hr</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Location</p>
                      <p className="text-gray-900 dark:text-white font-medium">{registrationStatus.location?.address?.split(',')[0] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Rating</p>
                      <p className="text-gray-900 dark:text-white font-medium">{registrationStatus.rating?.average || '0'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
