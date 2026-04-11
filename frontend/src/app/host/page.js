'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingCard from '@/components/LoadingCard';
import { fetchWithFriendlyError } from '@/utils/fetchWithFriendlyError';

export default function HostPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [regStatusLoading, setRegStatusLoading] = useState(false);
  const [regStatusError, setRegStatusError] = useState('');

  const [isVisibleOnMap, setIsVisibleOnMap] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [bookingRequests, setBookingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  const [stats, setStats] = useState({
    totalChargers: 0,
    totalEarnings: 0,
    activeBookings: 0,
    pendingRequests: 0
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchRegistrationStatus = useCallback(async () => {
    setRegStatusLoading(true);
    setRegStatusError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/host-registration-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch registration status');
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

  const fetchPendingRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/host/booking-requests/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load booking requests');
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

    fetchRegistrationStatus();
    fetchPendingRequests();

    // The statusInterval was causing the auto-refresh. It has been removed.
    // const statusInterval = setInterval(() => {
    //   fetchRegistrationStatus();
    // }, 10000);

    // return () => clearInterval(statusInterval);
  }, [router, fetchRegistrationStatus, fetchPendingRequests]);

  const handleAcceptRequest = async (requestId) => {
    setProcessingRequestId(requestId);
    setProcessingAction('accept');
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/host/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.msg || data.error || 'Failed to accept request');
      }

      const data = await response.json();
      setBookingRequests(prev => prev.filter(req => req._id !== requestId));
      setStats(prev => ({
        ...prev,
        pendingRequests: Math.max(0, prev.pendingRequests - 1)
      }));
    } catch (err) {
      console.error(err.message || 'Error accepting request');
      alert(err.message || 'Error accepting request');
    } finally {
      setProcessingRequestId(null);
      setProcessingAction(null);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setProcessingRequestId(requestId);
    setProcessingAction('decline');
    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Enter reason for declining (optional):');

      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/host/requests/${requestId}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || '' })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.msg || data.error || 'Failed to decline request');
      }

      const data = await response.json();
      setBookingRequests(prev => prev.filter(req => req._id !== requestId));
      setStats(prev => ({
        ...prev,
        pendingRequests: Math.max(0, prev.pendingRequests - 1)
      }));
    } catch (err) {
      console.error(err.message || 'Error declining request');
      alert(err.message || 'Error declining request');
    } finally {
      setProcessingRequestId(null);
      setProcessingAction(null);
    }
  };

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
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/host/${hostId}/visibility`, {
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
    } catch (err) {
      console.error(err.message || 'Failed to toggle visibility');
    } finally {
      setToggleLoading(false);
    }
  };

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
    <div className="bg-neutral-50 dark:bg-neutral-900 h-screen flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto">
        <div className="py-6 sm:py-8">
          {}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Host Dashboard</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage your charging stations</p>
            </div>
            <div className="flex flex-col gap-3 items-end">
              {/* Host Status Card - Right side */}
              {regStatusLoading ? (
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Loading...</div>
              ) : regStatusError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-2 text-end">
                  <p className="text-red-800 dark:text-red-300 text-xs">{regStatusError}</p>
                </div>
              ) : !registrationStatus ? (
                <button
                  onClick={() => router.push('/host/register')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                >
                  Complete Registration
                </button>
              ) : (
                <div className={`rounded border p-3 w-max ${
                  registrationStatus.verificationStatus === 'approved'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : registrationStatus.verificationStatus === 'rejected'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm ${
                        registrationStatus.verificationStatus === 'approved'
                          ? 'text-green-900 dark:text-green-300'
                          : registrationStatus.verificationStatus === 'rejected'
                          ? 'text-red-900 dark:text-red-300'
                          : 'text-yellow-900 dark:text-yellow-300'
                      }`}>
                        {registrationStatus.verificationStatus === 'approved' 
                          ? 'Approved' 
                          : registrationStatus.verificationStatus === 'rejected'
                          ? 'Rejected'
                          : 'Pending Review'}
                      </h3>
                      <p className={`text-xs ${
                        registrationStatus.verificationStatus === 'approved'
                          ? 'text-green-800 dark:text-green-400'
                          : registrationStatus.verificationStatus === 'rejected'
                          ? 'text-red-800 dark:text-red-400'
                          : 'text-yellow-800 dark:text-yellow-400'
                      }`}>
                        {registrationStatus.verificationStatus === 'approved'
                          ? 'You can accept bookings now'
                          : registrationStatus.verificationStatus === 'rejected'
                          ? 'Your application was rejected'
                          : 'Your registration is under review'}
                      </p>
                    </div>

                    {/* Map Visibility Toggle - Inside Status Card */}
                    {registrationStatus?.verificationStatus === 'approved' && (
                      <div className="flex items-center gap-2 sm:pl-3 sm:border-l sm:border-current sm:border-opacity-20 shrink-0">
                        <span className="text-xs font-medium text-inherit">Map</span>
                        <button
                          onClick={toggleMapVisibility}
                          disabled={toggleLoading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                            isVisibleOnMap ? 'bg-green-600 hover:bg-green-700' : 'bg-neutral-400 hover:bg-neutral-500'
                          } ${toggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} focus:outline-none`}
                          title={isVisibleOnMap ? 'Hide from map' : 'Show on map'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                              isVisibleOnMap ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        {}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Pending Requests</h2>
            <button onClick={fetchPendingRequests} className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors">
              Refresh
            </button>
          </div>

          {!registrationStatus || registrationStatus.verificationStatus !== 'approved' ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-6 text-center">
              <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Complete Registration first</p>
            </div>
          ) : requestsLoading ? (
            <LoadingCard variant="table" title="Loading..." />
          ) : requestsError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-4">
              <p className="text-red-800 dark:text-red-300 text-sm">{requestsError}</p>
            </div>
          ) : bookingRequests.length === 0 ? (
            <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded p-6 text-center">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookingRequests.filter(req => req.status === 'pending').map(request => (
                <div key={request._id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3 text-xs">
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-1 font-semibold">User</p>
                      <p className="text-neutral-900 dark:text-white font-medium">{request.userId?.name || 'User'}</p>
                      <p className="text-neutral-600 dark:text-neutral-400">{request.userPhone || 'N/A'}</p>
                      <p className="text-neutral-600 dark:text-neutral-400 text-xs">{request.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-1 font-semibold">Duration</p>
                      <p className="text-neutral-900 dark:text-white font-medium">{request.requestedDuration || request.estimatedDuration} min</p>
                      <p className="text-neutral-600 dark:text-neutral-400">{request.vehicleType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-1 font-semibold">Energy</p>
                      <p className="text-neutral-900 dark:text-white font-medium">{request.totalUnitsKwh || request.desiredKwh || 'N/A'} kWh</p>
                      <p className="text-neutral-600 dark:text-neutral-400">@ ₹{request.pricePerKwh || 0}/kWh</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-1 font-semibold">Total Price</p>
                      <p className="text-green-600 dark:text-green-400 font-bold">₹{request.totalBill || request.estimatedCost || 0}</p>
                      <p className="text-neutral-600 dark:text-neutral-400">Charger: {request.chargerType}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-1 font-semibold">Start Time</p>
                      <p className="text-neutral-900 dark:text-white font-medium">
                        {request.scheduledTime 
                          ? new Date(request.scheduledTime).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {request.scheduledTime
                          ? new Date(request.scheduledTime).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'
                        }
                      </p>
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
                        disabled={processingRequestId === request._id}
                        className={`flex-1 text-white text-xs px-3 py-1.5 rounded font-medium transition-all ${
                          processingRequestId === request._id
                            ? 'bg-blue-500 opacity-75 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {processingRequestId === request._id && processingAction === 'accept' ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request._id)}
                        disabled={processingRequestId === request._id}
                        className={`flex-1 text-white text-xs px-3 py-1.5 rounded font-medium transition-all ${
                          processingRequestId === request._id
                            ? 'bg-red-500 opacity-75 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {processingRequestId === request._id && processingAction === 'decline' ? 'Declining...' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
