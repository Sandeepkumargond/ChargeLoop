'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingCard from '@/components/LoadingCard';
import { fetchWithFriendlyError } from '@/utils/fetchWithFriendlyError';

export default function BookingsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('history');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [markingDoneRequestId, setMarkingDoneRequestId] = useState(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [decliningRequestId, setDecliningRequestId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({});

  const fetchPendingRequests = useCallback(async (token) => {
    try {
      setRequestsLoading(true);
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/host/booking-requests/pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookingRequests(data.requests || []);
      }
    } catch (error) {
      setBookingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const fetchBookingHistory = useCallback(async (token, page = 1, status = 'all') => {
    try {
      setRequestsLoading(true);
      const statusQuery = status !== 'all' ? `&status=${status}` : '';
      const response = await fetchWithFriendlyError(
        `${process.env.NEXT_PUBLIC_API_URL}/api/host/booking-requests/history?page=${page}&limit=10${statusQuery}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookingHistory(data.requests || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      setBookingHistory([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const handleAcceptRequest = async (requestId) => {
    setAcceptingRequestId(requestId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithFriendlyError(
        `${process.env.NEXT_PUBLIC_API_URL}/api/host/requests/${requestId}/accept`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        fetchPendingRequests(token);
        fetchBookingHistory(token, currentPage, filterStatus);
        alert('Booking request accepted successfully!');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.msg || 'Failed to accept booking request');
      }
    } catch (error) {
      alert(error.message || 'Error accepting booking request');
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const handleDeclineRequest = async (requestId, reason = '') => {
    setDecliningRequestId(requestId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithFriendlyError(
        `${process.env.NEXT_PUBLIC_API_URL}/api/host/requests/${requestId}/decline`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        fetchPendingRequests(token);
        fetchBookingHistory(token, currentPage, filterStatus);
        alert('Booking request declined successfully!');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.msg || 'Failed to decline booking request');
      }
    } catch (error) {
      alert(error.message || 'Error declining booking request');
    } finally {
      setDecliningRequestId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    setCancellingRequestId(requestId);
    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Enter reason for cancellation (optional):');

      if (reason === null) {
        setCancellingRequestId(null);
        return;
      }

      const response = await fetchWithFriendlyError(
        `${process.env.NEXT_PUBLIC_API_URL}/api/host/requests/${requestId}/cancel`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: reason || '' }),
        }
      );

      if (response.ok) {
        const token = localStorage.getItem('token');
        fetchBookingHistory(token, currentPage, filterStatus);
        alert('Booking cancelled successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to cancel booking');
      }
    } catch (error) {
      alert(error.message || 'Error cancelling booking');
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleMarkDone = async (requestId) => {
    setMarkingDoneRequestId(requestId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithFriendlyError(
        `${process.env.NEXT_PUBLIC_API_URL}/api/host/requests/${requestId}/mark-done`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const token = localStorage.getItem('token');
        fetchBookingHistory(token, currentPage, filterStatus);
        alert('Charging marked as completed successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to mark charging as done');
      }
    } catch (error) {
      alert(error.message || 'Error marking charging done');
    } finally {
      setMarkingDoneRequestId(null);
    }
  };

  const calculateTimeRemaining = useCallback((startTime, requestedDuration) => {
    if (!startTime || !requestedDuration) return null;
    
    const start = new Date(startTime);
    const end = new Date(start.getTime() + requestedDuration * 60 * 1000);
    const now = new Date();
    
    const remainingMs = end - now;
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
    
    if (remainingMinutes <= 0) {
      return 'Time expired - Mark as done';
    }
    
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  }, []);

  useEffect(() => {
    // Update time remaining every minute
    const interval = setInterval(() => {
      const updated = {};
      bookingHistory.forEach(request => {
        if (request.status === 'accepted' && request.startTime && request.requestedDuration) {
          updated[request._id] = calculateTimeRemaining(request.startTime, request.requestedDuration);
        }
      });
      setTimeRemaining(updated);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [bookingHistory, calculateTimeRemaining]);

  // Calculate time remaining on first load
  useEffect(() => {
    const updated = {};
    bookingHistory.forEach(request => {
      if (request.status === 'accepted' && request.startTime && request.requestedDuration) {
        updated[request._id] = calculateTimeRemaining(request.startTime, request.requestedDuration);
      }
    });
    setTimeRemaining(updated);
  }, [bookingHistory, calculateTimeRemaining]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsLoggedIn(true);
    setLoading(false);

    fetchBookingHistory(token, 1, 'all');
  }, [router, fetchPendingRequests, fetchBookingHistory]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    const token = localStorage.getItem('token');
    setCurrentPage(1);
    fetchBookingHistory(token, 1, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
    const token = localStorage.getItem('token');
    fetchBookingHistory(token, 1, status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingCard variant="table" title="Loading bookings..." />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Booking Requests</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your incoming bookings and view booking history</p>
        </div>

        {}
        <div>
          {}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleFilterChange('accepted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'accepted'
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => handleFilterChange('declined')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'declined'
                  ? 'bg-red-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              Declined
            </button>
            <button
              onClick={() => handleFilterChange('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              Completed
            </button>
          </div>

          {requestsLoading ? (
            <LoadingCard variant="table" title="Loading your bookings..." />
          ) : bookingHistory.length === 0 ? (
            <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center">
              <p className="text-neutral-600 dark:text-neutral-400">No booking history available</p>
            </div>
          ) : (
            <div>
              {}
              <div className="hidden md:grid grid-cols-7 gap-4 bg-neutral-200 dark:bg-neutral-700 p-4 rounded-t-lg font-semibold text-neutral-900 dark:text-white text-sm">
                <div>Customer</div>
                <div>Vehicle</div>
                <div>Desired kWh</div>
                <div>Price/Unit</div>
                <div>Scheduled</div>
                <div>Status</div>
                <div>Request ID</div>
              </div>

              {}
              <div className="space-y-2 md:space-y-0">
                {bookingHistory.map((request, index) => (
                  <div
                    key={request._id}
                    className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-4 bg-white dark:bg-neutral-800 p-4 md:p-4 border border-neutral-200 dark:border-neutral-700 md:border-b md:border-l-0 md:border-r-0 md:border-t-0 rounded-lg md:rounded-none items-center text-sm"
                  >
                    {/* Customer */}
                    <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Customer</div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {request.userId?.name || 'User'}
                      </div>
                      {(request.userPhone || request.userId?.phone) && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                          {request.userPhone || request.userId?.phone}
                        </div>
                      )}
                    </div>

                    {/* Vehicle */}
                    <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Vehicle</div>
                    <div className="text-neutral-600 dark:text-neutral-400">
                      <div className="font-medium text-neutral-900 dark:text-white">
                        {request.vehicleNumber || 'N/A'}
                      </div>
                      {(request.vehicleModel || request.vehicleType) && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {[request.vehicleModel, request.vehicleType].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>

                    {/* Desired kWh */}
                    <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Desired kWh</div>
                    <div className="text-neutral-600 dark:text-neutral-400">
                      <div className="font-medium text-neutral-900 dark:text-white">
                        {request.totalUnitsKwh || request.desiredKwh || 0} kWh
                      </div>
                      {(request.requestedDuration || request.estimatedDuration) && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {request.requestedDuration || request.estimatedDuration} min
                        </div>
                      )}
                    </div>

                    {/* Price/Unit */}
                    <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Price/Unit</div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        ₹{request.pricePerKwh ?? request.pricePerUnit ?? 0}/kWh
                      </div>
                      {(request.totalBill || request.estimatedCost) && (
                        <div className="text-xs font-semibold text-green-600 dark:text-green-400 mt-0.5">
                          Total: ₹{request.totalBill || request.estimatedCost}
                        </div>
                      )}
                    </div>

                    {/* Scheduled */}
                    <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Scheduled</div>
                    <div className="text-neutral-600 dark:text-neutral-400 text-xs">
                      <div>{new Date(request.scheduledTime).toLocaleDateString()}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {new Date(request.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Status</div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block w-fit ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : request.status === 'accepted'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : request.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : request.status === 'cancelled'
                          ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>

                      {request.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleAcceptRequest(request._id)}
                            disabled={acceptingRequestId === request._id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-all"
                          >
                            {acceptingRequestId === request._id ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request._id)}
                            disabled={decliningRequestId === request._id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-all"
                          >
                            {decliningRequestId === request._id ? 'Declining...' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <>
                          {timeRemaining[request._id] && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                              ⏱️ {timeRemaining[request._id]}
                            </p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleMarkDone(request._id)}
                              disabled={markingDoneRequestId === request._id}
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                markingDoneRequestId === request._id
                                  ? 'bg-green-500 text-white opacity-75 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {markingDoneRequestId === request._id ? 'Marking...' : 'Mark Done'}
                            </button>
                            <button
                              onClick={() => handleCancelRequest(request._id)}
                              disabled={cancellingRequestId === request._id}
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                cancellingRequestId === request._id
                                  ? 'bg-orange-500 text-white opacity-75 cursor-not-allowed'
                                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                              }`}
                            >
                              {cancellingRequestId === request._id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Request ID */}
                    <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Request ID</div>
                    <div className="text-neutral-600 dark:text-neutral-400 text-xs font-mono">
                      {request._id?.slice(-8) || request.requestId}
                    </div>
                  </div>
                ))}
              </div>

              {}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        const token = localStorage.getItem('token');
                        fetchBookingHistory(token, page, filterStatus);
                      }}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
