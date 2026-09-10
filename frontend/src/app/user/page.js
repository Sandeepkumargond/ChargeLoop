'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingCard from '@/components/LoadingCard';
import PaymentModal from '@/components/PaymentModal';
import ReceiptModal from '@/components/ReceiptModal';
import { fetchWithFriendlyError } from '@/utils/fetchWithFriendlyError';
import { useSocket } from '@/contexts/SocketContext';

export default function UserDashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const { socket } = useSocket();
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [userData, setUserData] = useState({ chargingSessions: 0 });
  const [cancellingId, setCancellingId] = useState(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [receiptModalBookingId, setReceiptModalBookingId] = useState(null);

  const fetchCurrentBookings = useCallback(async (token) => {
    try {
      setBookingsLoading(true);
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/user/bookings/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data.bookings || [];

        // Ensure only ongoing or upcoming bookings scheduled within the next 24 hours are shown
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const upcomingOnly = rawList.filter(b => {
          if (b.status === 'ongoing') return true;
          if (b.status === 'accepted') {
            if (!b.scheduledTime) return false;
            const scheduled = new Date(b.scheduledTime);
            return scheduled >= oneHourAgo && scheduled <= next24Hours;
          }
          return false;
        });

        setBookings(upcomingOnly);
      }
    } catch (error) {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const fetchMyBookingRequests = useCallback(async (token) => {
    try {
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/user/bookings/requests/my-requests`, {
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
    }
  }, []);

  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData({
          chargingSessions: data.chargingSessions || 0
        });
      }
    } catch (error) {
      setUserData({ chargingSessions: 0 });
    }
  }, []);

  const cancelBookingRequest = useCallback(async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setCancellingId(requestId);
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/user/bookings/requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchMyBookingRequests(token);
      }
    } catch (error) {
    } finally {
      setCancellingId(null);
    }
  }, [fetchMyBookingRequests]);

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

    fetchCurrentBookings(token);
    fetchMyBookingRequests(token);
    fetchUserData(token);

    return () => {};
  }, [router, fetchCurrentBookings, fetchMyBookingRequests, fetchUserData]);

  useEffect(() => {
    if (socket) {
      const handleBookingUpdate = (data) => {
        const token = localStorage.getItem('token');
        if (token) {
          fetchCurrentBookings(token);
          fetchMyBookingRequests(token);
        }
      };

      socket.on('booking_update', handleBookingUpdate);

      return () => {
        socket.off('booking_update', handleBookingUpdate);
      };
    }
  }, [socket, fetchCurrentBookings, fetchMyBookingRequests]);

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'accepted': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'declined': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'expired': 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300',
      'ongoing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'confirmed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return statusMap[status] || 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300';
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
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen flex flex-col w-full">
      <div className="w-full px-3 sm:px-6 lg:px-8 flex-1 overflow-y-auto">
        <div className="py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
              User Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
              Manage your bookings and account
            </p>
          </div>

          {}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-2">Total Charges</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{userData.chargingSessions}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-2">Vehicles</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          {}
          {bookingRequests.filter(req => req.status === 'pending').length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">Pending Requests</h2>
              <div className="space-y-2 sm:space-y-3">
                {bookingRequests
                  .filter(req => req.status === 'pending')
                  .map((request) => {
                    const scheduledDate = request.scheduledTime ? new Date(request.scheduledTime).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A';
                    
                    return (
                    <div key={request._id} className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-3 text-xs">
                        <div>
                          <p className="text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-[10px] sm:text-xs">Host</p>
                          <p className="text-neutral-900 dark:text-white font-medium text-xs line-clamp-1">{request.hostName}</p>
                        </div>
                        <div>
                          <p className="text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-[10px] sm:text-xs">Phone</p>
                          <p className="text-neutral-900 dark:text-white font-medium text-xs">{request.hostPhone || 'N/A'}</p>
                        </div>
                        <div className="sm:hidden">
                          <p className="text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-[10px]">Energy</p>
                          <p className="text-neutral-900 dark:text-white font-medium text-xs">{request.totalUnitsKwh || request.desiredKwh || 'N/A'} kWh</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-xs">Location</p>
                          <p className="text-neutral-900 dark:text-white font-medium text-xs line-clamp-1">{request.hostLocation}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-xs">Energy</p>
                          <p className="text-neutral-900 dark:text-white font-medium text-xs">{request.totalUnitsKwh || request.desiredKwh || 'N/A'} kWh</p>
                        </div>
                        <div className="hidden lg:block">
                          <p className="text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-xs">Price</p>
                          <p className="text-green-600 dark:text-green-400 font-bold text-xs">₹{request.totalBill || 0}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                          {scheduledDate}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <span className="text-[10px] sm:text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded inline-block">
                            Waiting for approval
                          </span>
                          <button
                            onClick={() => cancelBookingRequest(request._id)}
                            disabled={cancellingId === request._id}
                            className="text-[10px] sm:text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-2 sm:px-3 py-1 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {cancellingId === request._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Current Bookings */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">Current Bookings</h2>
            {bookingsLoading ? (
              <LoadingCard variant="table" title="Loading..." />
            ) : bookings.length > 0 ? (
              <div>
                {/* Desktop Table Headers */}
                <div className="hidden lg:grid grid-cols-7 gap-4 bg-neutral-200 dark:bg-neutral-700 p-3 rounded-t font-semibold text-neutral-900 dark:text-white text-xs">
                  <div>Station</div>
                  <div>Location</div>
                  <div>Scheduled</div>
                  <div>Duration</div>
                  <div>Cost</div>
                  <div>Status</div>
                  <div>Payment & Action</div>
                </div>

                {/* Bookings List */}
                <div className="space-y-2 lg:space-y-0">
                  {bookings.map((booking) => {
                    const isPaid = booking.paymentStatus === 'paid';
                    const billAmount = booking.totalBill || booking.actualCost || booking.energyCost || 0;

                    return (
                      <div
                        key={booking._id || booking.id}
                        className="grid grid-cols-1 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4 bg-white dark:bg-neutral-800 p-3 sm:p-3 border border-neutral-200 dark:border-neutral-700 lg:border-b lg:border-l-0 lg:border-r-0 lg:border-t-0 rounded-lg lg:rounded-none items-start lg:items-center text-xs sm:text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                      >
                        {/* Mobile Header: Station */}
                        <div className="lg:hidden text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Station</div>
                        <div className="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm line-clamp-1">
                          {booking.hostName || 'Charging Station'}
                        </div>

                        {/* Mobile Header: Location */}
                        <div className="lg:hidden text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Location</div>
                        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm line-clamp-1">
                          {booking.hostLocation || 'N/A'}
                        </div>

                        {/* Mobile Header: Scheduled */}
                        <div className="lg:hidden text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Scheduled</div>
                        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                          {booking.scheduledTime ? new Date(booking.scheduledTime).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'N/A'}
                        </div>

                        {/* Mobile Header: Duration */}
                        <div className="lg:hidden text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Duration</div>
                        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                          {booking.actualDuration || booking.estimatedDuration || 'N/A'} min
                        </div>

                        {/* Mobile Header: Cost */}
                        <div className="lg:hidden text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Cost</div>
                        <div className="text-green-600 dark:text-green-400 font-bold text-xs sm:text-sm">
                          ₹{billAmount}
                        </div>

                        {/* Mobile Header: Status */}
                        <div className="lg:hidden text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Status</div>
                        <div>
                          <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded inline-block capitalize ${getStatusColor(booking.status)}`}>
                            {booking.status === 'ongoing' ? 'Active' :
                             booking.status === 'accepted' ? 'Accepted' :
                             booking.status === 'completed' ? 'Completed' :
                             booking.status === 'cancelled' ? 'Cancelled' :
                             booking.status === 'declined' ? 'Declined' :
                             booking.status === 'expired' ? 'Expired' :
                             booking.status === 'pending' ? 'Pending' :
                             booking.status}
                          </span>
                        </div>

                        {/* Payment & Actions */}
                        <div className="lg:hidden text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Payment</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPaid ? (
                            <>
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                ✓ Paid
                              </span>
                              <button
                                onClick={() => setReceiptModalBookingId(booking._id || booking.id)}
                                className="px-2.5 py-1 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded transition border border-neutral-300 dark:border-neutral-600 flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Receipt
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                Unpaid
                              </span>
                              <button
                                onClick={() => setPaymentModalBooking(booking)}
                                className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded shadow-sm hover:shadow transition flex items-center gap-1.5"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Pay Now (₹{billAmount})
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">No active bookings</p>
                <button
                  onClick={() => router.push('/user/chargers')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition"
                >
                  Find a Charger
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      {paymentModalBooking && (
        <PaymentModal
          isOpen={true}
          booking={paymentModalBooking}
          onClose={() => setPaymentModalBooking(null)}
          onSuccess={(paidBooking) => {
            const token = localStorage.getItem('token');
            if (token) {
              fetchCurrentBookings(token);
              fetchMyBookingRequests(token);
            }
            setReceiptModalBookingId(paidBooking?._id || paymentModalBooking._id || paymentModalBooking.id);
          }}
        />
      )}

      {/* Official Payment Receipt Modal */}
      {receiptModalBookingId && (
        <ReceiptModal
          isOpen={true}
          bookingId={receiptModalBookingId}
          onClose={() => setReceiptModalBookingId(null)}
        />
      )}
    </div>
  );
}
