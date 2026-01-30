'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingCard from '@/components/LoadingCard';

export default function BookingsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // pending, history
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [totalPages, setTotalPages] = useState(1);

  // Fetch pending booking requests
  const fetchPendingRequests = useCallback(async (token) => {
    try {
      setRequestsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/booking-requests/pending`, {
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
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  // Fetch booking history
  const fetchBookingHistory = useCallback(async (token, page = 1, status = 'all') => {
    try {
      setRequestsLoading(true);
      const statusQuery = status !== 'all' ? `&status=${status}` : '';
      const response = await fetch(
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
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  // Handle accept booking request
  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/charging/requests/${requestId}/accept`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Refresh requests
        fetchPendingRequests(token);
        alert('Booking request accepted successfully!');
      } else {
        alert('Failed to accept booking request');
      }
    } catch (error) {
      alert('Error accepting booking request');
    }
  };

  // Handle decline booking request
  const handleDeclineRequest = async (requestId, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/charging/requests/${requestId}/decline`,
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
        // Refresh requests
        fetchPendingRequests(token);
        alert('Booking request declined successfully!');
      } else {
        alert('Failed to decline booking request');
      }
    } catch (error) {
      alert('Error declining booking request');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsLoggedIn(true);
    setLoading(false);

    // Fetch initial data
    fetchBookingHistory(token, 1, 'all');
  }, [router, fetchPendingRequests, fetchBookingHistory]);

  // Handle tab switch
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    const token = localStorage.getItem('token');
    setCurrentPage(1);
    fetchBookingHistory(token, 1, filterStatus);
  };

  // Handle filter change
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Requests</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your incoming bookings and view booking history</p>
        </div>

        {/* Booking History */}
        <div>
          {/* Filter Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleFilterChange('accepted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'accepted'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => handleFilterChange('declined')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'declined'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Declined
            </button>
          </div>

          {requestsLoading ? (
            <LoadingCard variant="table" title="Loading your bookings..." />
          ) : bookingHistory.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No booking history available</p>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-7 gap-4 bg-gray-200 dark:bg-gray-700 p-4 rounded-t-lg font-semibold text-gray-900 dark:text-white text-sm">
                <div>Customer</div>
                <div>Vehicle</div>
                <div>Duration</div>
                <div>Cost</div>
                <div>Scheduled</div>
                <div>Status</div>
                <div>Request ID</div>
              </div>

              {/* Table Rows */}
              <div className="space-y-2 md:space-y-0">
                {bookingHistory.map((request, index) => (
                  <div 
                    key={request._id} 
                    className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-4 bg-white dark:bg-gray-800 p-4 md:p-4 border border-gray-200 dark:border-gray-700 md:border-b md:border-l-0 md:border-r-0 md:border-t-0 rounded-lg md:rounded-none items-center text-sm"
                  >
                    {/* Customer - Mobile Label */}
                    <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Customer</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {request.userId?.name || 'User'}
                    </div>

                    {/* Vehicle - Mobile Label */}
                    <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Vehicle</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {request.vehicleNumber || 'N/A'}
                    </div>

                    {/* Duration - Mobile Label */}
                    <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Duration</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {request.estimatedDuration} min
                    </div>

                    {/* Cost - Mobile Label */}
                    <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Cost</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ₹{request.estimatedCost}
                    </div>

                    {/* Scheduled - Mobile Label */}
                    <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Scheduled</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(request.scheduledTime).toLocaleDateString()}
                    </div>

                    {/* Status - Mobile Label */}
                    <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Status</div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : request.status === 'accepted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>

                    {/* Request ID - Mobile Label */}
                    <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 font-semibold">Request ID</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs font-mono">
                      {request._id?.slice(-8) || request.requestId}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
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
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
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
