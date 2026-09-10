'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LoadingCard from '@/components/LoadingCard';
import { fetchWithFriendlyError } from '@/utils/fetchWithFriendlyError';

const STATUS_TABS = [
  { id: 'all', label: 'All History', icon: '📋' },
  { id: 'pending', label: 'Pending', icon: '⏳' },
  { id: 'accepted', label: 'Accepted', icon: '✅' },
  { id: 'ongoing', label: 'Charging', icon: '⚡' },
  { id: 'completed', label: 'Completed', icon: '🎉' },
  { id: 'cancelled', label: 'Cancelled', icon: '🚫' },
  { id: 'declined', label: 'Declined', icon: '✕' },
  { id: 'expired', label: 'Expired', icon: '⏱️' },
];

export default function BookingsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    accepted: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    declined: 0,
    expired: 0
  });
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState(null);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [markingDoneRequestId, setMarkingDoneRequestId] = useState(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [decliningRequestId, setDecliningRequestId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({});

  const fetchBookingHistory = useCallback(async (token, page = 1, status = 'all') => {
    try {
      setRequestsLoading(true);
      const statusQuery = status !== 'all' ? `&status=${status}` : '';
      const response = await fetchWithFriendlyError(
        `${process.env.NEXT_PUBLIC_API_URL}/api/host/booking-requests/history?page=${page}&limit=100${statusQuery}`,
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
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
        setTotalPages(data.pagination?.pages || 1);
        setFetchError(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        setFetchError(errData.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      setBookingHistory([]);
      setFetchError(error.message || 'Connection error fetching bookings');
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

  const handleDeclineRequest = async (requestId) => {
    const inputReason = prompt('Enter reason for declining (optional):');
    if (inputReason === null) return;

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
          body: JSON.stringify({ reason: inputReason || '' }),
        }
      );

      if (response.ok) {
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
    const reason = prompt('Enter reason for cancellation (optional):');
    if (reason === null) return;

    setCancellingRequestId(requestId);
    try {
      const token = localStorage.getItem('token');
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
        fetchBookingHistory(token, currentPage, filterStatus);
        alert('Booking cancelled successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
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
        fetchBookingHistory(token, currentPage, filterStatus);
        alert('Charging marked as completed successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.msg || 'Failed to mark charging as done');
      }
    } catch (error) {
      alert(error.message || 'Error marking charging done');
    } finally {
      setMarkingDoneRequestId(null);
    }
  };

  const calculateTimeRemaining = useCallback((startTime, requestedDuration) => {
    if (!startTime) return null;
    const start = new Date(startTime);
    const durationMins = requestedDuration || 60;
    const end = new Date(start.getTime() + durationMins * 60 * 1000);
    const now = new Date();

    if (now < start) {
      const diffMins = Math.ceil((start - now) / (1000 * 60));
      if (diffMins < 60) return `Starts in ${diffMins}m`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `Starts in ${hours}h ${mins}m`;
    }

    const remainingMs = end - now;
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

    if (remainingMinutes <= 0) {
      return 'Time expired - Mark as done';
    }

    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
  }, []);

  // Update countdown timers
  useEffect(() => {
    const updateTimers = () => {
      const updated = {};
      bookingHistory.forEach(request => {
        if (request.status === 'accepted' || request.status === 'ongoing') {
          const time = request.startTime || request.scheduledTime;
          const duration = request.requestedDuration || request.estimatedDuration;
          if (time) {
            updated[request._id] = calculateTimeRemaining(time, duration);
          }
        }
      });
      setTimeRemaining(updated);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
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
  }, [router, fetchBookingHistory]);

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
    const token = localStorage.getItem('token');
    fetchBookingHistory(token, 1, status);
  };

  // Client-side search filtering across customer name, phone, vehicle, ID
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookingHistory;
    const q = searchQuery.toLowerCase().trim();
    return bookingHistory.filter(item => {
      const customer = (item.userId?.name || item.userName || '').toLowerCase();
      const phone = (item.userPhone || item.userId?.phone || '').toLowerCase();
      const vehicle = (item.vehicleNumber || '').toLowerCase();
      const model = (item.vehicleModel || '').toLowerCase();
      const reqId = (item.requestId || item._id || '').toLowerCase();
      return customer.includes(q) || phone.includes(q) || vehicle.includes(q) || model.includes(q) || reqId.includes(q);
    });
  }, [bookingHistory, searchQuery]);

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
        {/* Header with search & refresh */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Booking History</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">View all past, present, and upcoming bookings at your charging station</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, vehicle, ID..."
                className="w-64 sm:w-80 px-3.5 py-2 pl-9 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => {
                const token = localStorage.getItem('token');
                fetchBookingHistory(token, currentPage, filterStatus);
              }}
              className="px-3.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
              title="Refresh bookings"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Status Filter Tabs with Counts */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {STATUS_TABS.map((tab) => {
              const isActive = filterStatus === tab.id;
              const count = statusCounts[tab.id] ?? 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-500/80 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Error Alert if Database/Network issue */}
        {fetchError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Unable to load bookings from database</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {fetchError.includes('MongoDB') || fetchError.includes('Server') || fetchError.includes('whitelisted')
                  ? 'MongoDB connection error: please whitelist your IP (117.250.106.226) or allow 0.0.0.0/0 in MongoDB Atlas Network Access.'
                  : fetchError}
              </p>
            </div>
          </div>
        )}

        {/* Booking History Table / Cards */}
        <div>
          {requestsLoading ? (
            <LoadingCard variant="table" title="Loading bookings..." />
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-12 text-center shadow-sm">
              <span className="text-4xl block mb-3">📭</span>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                {searchQuery ? 'No matching bookings found' : `No ${filterStatus !== 'all' ? filterStatus : ''} bookings available`}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {searchQuery
                  ? `No booking records match "${searchQuery}". Try clearing your search.`
                  : 'New booking requests and charging sessions will show up here.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-xs font-medium rounded-md hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden">
              {/* Desktop Table Header */}
              <div className="hidden lg:grid grid-cols-7 gap-4 bg-neutral-100 dark:bg-neutral-750 px-6 py-3.5 font-semibold text-neutral-700 dark:text-neutral-300 text-xs border-b border-neutral-200 dark:border-neutral-700">
                <div>Customer</div>
                <div>Vehicle</div>
                <div>Energy & Duration</div>
                <div>Tariff & Bill</div>
                <div>Scheduled Time</div>
                <div>Status & Payment</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredBookings.map((request) => {
                  const remainingText = timeRemaining[request._id];
                  const isPaid = request.paymentStatus === 'paid';

                  return (
                    <div
                      key={request._id}
                      className="p-5 lg:px-6 lg:py-4 grid grid-cols-1 lg:grid-cols-7 gap-4 items-center text-xs hover:bg-neutral-50 dark:hover:bg-neutral-750/50 transition-colors"
                    >
                      {/* Customer */}
                      <div>
                        <div className="lg:hidden text-[10px] uppercase font-bold text-neutral-400 mb-1">Customer</div>
                        <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {request.userId?.name || request.userName || 'Customer'}
                        </div>
                        {(request.userPhone || request.userId?.phone) && (
                          <a
                            href={`tel:${request.userPhone || request.userId?.phone}`}
                            className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5 hover:underline block"
                          >
                            📞 {request.userPhone || request.userId?.phone}
                          </a>
                        )}
                        {request.userId?.email && (
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[160px]">
                            {request.userId?.email}
                          </div>
                        )}
                      </div>

                      {/* Vehicle */}
                      <div>
                        <div className="lg:hidden text-[10px] uppercase font-bold text-neutral-400 mb-1">Vehicle</div>
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {request.vehicleNumber || 'N/A'}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {[request.vehicleModel, request.vehicleType].filter(Boolean).join(' • ') || 'EV'}
                        </div>
                        {request.chargerType && (
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                            🔌 {request.chargerType}
                          </div>
                        )}
                      </div>

                      {/* Desired kWh & Duration */}
                      <div>
                        <div className="lg:hidden text-[10px] uppercase font-bold text-neutral-400 mb-1">Energy & Duration</div>
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {request.totalUnitsKwh || request.desiredKwh || 0} kWh
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          ⏱ {request.requestedDuration || request.estimatedDuration || 60} min
                        </div>
                      </div>

                      {/* Price / Tariff */}
                      <div>
                        <div className="lg:hidden text-[10px] uppercase font-bold text-neutral-400 mb-1">Tariff & Bill</div>
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          ₹{request.pricePerKwh ?? request.pricePerUnit ?? 0}/kWh
                        </div>
                        <div className="text-xs font-bold text-green-600 dark:text-green-400 mt-0.5">
                          Total: ₹{request.totalBill || request.estimatedCost || 0}
                        </div>
                      </div>

                      {/* Scheduled Time */}
                      <div>
                        <div className="lg:hidden text-[10px] uppercase font-bold text-neutral-400 mb-1">Scheduled Time</div>
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {request.scheduledTime ? new Date(request.scheduledTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {request.scheduledTime ? new Date(request.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>

                      {/* Status & Payment Badge */}
                      <div>
                        <div className="lg:hidden text-[10px] uppercase font-bold text-neutral-400 mb-1">Status & Payment</div>
                        <div className="flex flex-col gap-1.5 items-start">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                                request.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                  : request.status === 'ongoing'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                                  : request.status === 'accepted'
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                                  : request.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : request.status === 'cancelled'
                                  ? 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                                  : request.status === 'expired'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                              }`}
                            >
                              {request.status === 'ongoing' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />}
                              {request.status === 'ongoing'
                                ? '⚡ Charging'
                                : request.status === 'completed'
                                ? '✓ Completed'
                                : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              }`}
                            >
                              {isPaid ? '✓ Paid' : 'Unpaid'}
                            </span>
                          </div>

                          {/* Live Countdown for active/accepted */}
                          {(request.status === 'accepted' || request.status === 'ongoing') && remainingText && (
                            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                              ⏱ {remainingText}
                            </span>
                          )}

                          <span className="text-[10px] text-neutral-400 font-mono">
                            ID: {request.requestId || request._id?.slice(-8)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:text-right">
                        <div className="lg:hidden text-[10px] uppercase font-bold text-neutral-400 mb-1">Actions</div>
                        {request.status === 'pending' && (
                          <div className="flex lg:justify-end gap-2">
                            <button
                              onClick={() => handleAcceptRequest(request._id)}
                              disabled={acceptingRequestId === request._id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition shadow-sm"
                            >
                              {acceptingRequestId === request._id ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request._id)}
                              disabled={decliningRequestId === request._id}
                              className="px-3 py-1.5 border border-red-300 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 rounded-md text-xs font-semibold transition"
                            >
                              {decliningRequestId === request._id ? 'Declining...' : 'Decline'}
                            </button>
                          </div>
                        )}

                        {(request.status === 'accepted' || request.status === 'ongoing') && (
                          <div className="flex lg:justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => handleMarkDone(request._id)}
                              disabled={markingDoneRequestId === request._id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition shadow-sm"
                            >
                              {markingDoneRequestId === request._id ? 'Saving...' : 'Mark Done'}
                            </button>
                            <button
                              onClick={() => handleCancelRequest(request._id)}
                              disabled={cancellingRequestId === request._id}
                              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 rounded-md text-xs font-semibold transition"
                            >
                              {cancellingRequestId === request._id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          </div>
                        )}

                        {['completed', 'cancelled', 'declined', 'expired'].includes(request.status) && (
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
                            Session Closed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-center items-center gap-2 bg-neutral-50 dark:bg-neutral-800">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => {
                      const prev = Math.max(1, currentPage - 1);
                      setCurrentPage(prev);
                      const token = localStorage.getItem('token');
                      fetchBookingHistory(token, prev, filterStatus);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        const token = localStorage.getItem('token');
                        fetchBookingHistory(token, page, filterStatus);
                      }}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      const next = Math.min(totalPages, currentPage + 1);
                      setCurrentPage(next);
                      const token = localStorage.getItem('token');
                      fetchBookingHistory(token, next, filterStatus);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
