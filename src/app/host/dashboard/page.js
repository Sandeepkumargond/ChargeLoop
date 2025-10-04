'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function HostDashboardPage() {
  const router = useRouter();
  const [hostData, setHostData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    activeBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newBookingAlert, setNewBookingAlert] = useState(false);
  const [processingBooking, setProcessingBooking] = useState(null);
  const [notification, setNotification] = useState(null);
  const refreshIntervalRef = useRef(null);
  const previousBookingsRef = useRef([]);

  // Real-time refresh function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchHostData(), fetchBookings()]);
      setLastUpdate(new Date());
      console.log('Host dashboard data refreshed at:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Setup auto-refresh
  useEffect(() => {
    // Initial load
    fetchHostData();
    fetchBookings();
    
    // Setup auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(refreshData, 30000);
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshData]);

  // Check for new bookings and show alerts
  useEffect(() => {
    if (previousBookingsRef.current.length > 0 && bookings.length > previousBookingsRef.current.length) {
      const newBookings = bookings.filter(booking => 
        !previousBookingsRef.current.find(prev => prev._id === booking._id)
      );
      
      if (newBookings.length > 0) {
        setNewBookingAlert(true);
        // Auto-hide alert after 5 seconds
        setTimeout(() => setNewBookingAlert(false), 5000);
      }
    }
    previousBookingsRef.current = [...bookings];
  }, [bookings]);

  const fetchHostData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/host/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setHostData(data);
        console.log('Host data fetched successfully');
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else if (response.status === 404) {
        router.push('/host/register');
      } else {
        setError('Failed to fetch host data');
      }
    } catch (error) {
      console.error('Error fetching host data:', error);
      setError('Network error - Please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/host/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setStats(data.stats || {
          totalBookings: 0,
          totalEarnings: 0,
          activeBookings: 0
        });
        console.log(`Loaded ${data.bookings?.length || 0} real bookings`);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setBookings([]);
        setStats({
          totalBookings: 0,
          totalEarnings: 0,
          activeBookings: 0
        });
        setError('Unable to load booking data');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      setError('Network error while fetching bookings');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    setProcessingBooking(bookingId);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/host/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? { ...booking, status } : booking
        ));
        const statusMessages = {
          'accepted': { message: 'Booking accepted successfully! Customer has been notified.', type: 'success', icon: '' },
          'declined': { message: 'Booking declined. Customer has been notified.', type: 'warning', icon: '' },
          'completed': { message: 'Booking marked as completed! Payment processed.', type: 'success', icon: '' },
          'active': { message: 'Charging session started! Customer can now charge.', type: 'info', icon: '' }
        };
        const notification = statusMessages[status] || { message: `Booking ${status} successfully!`, type: 'success', icon: '' };
        setNotification(notification);
        setTimeout(() => setNotification(null), 5000);
        setTimeout(() => {
          refreshData();
        }, 1000);
      } else {
        const errorData = await response.json();
        setNotification({ 
          message: `Failed to update booking: ${errorData.message || 'Unknown error'}`, 
          type: 'error', 
          icon: '' 
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setNotification({ 
        message: 'Error updating booking status. Please check your connection.', 
        type: 'error', 
        icon: '' 
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessingBooking(null);
    }
  };

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/toggle-availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setHostData(prev => ({ ...prev, available: data.available }));
        alert(`Charger is now ${data.available ? 'available' : 'unavailable'}`);
      } else {
        let errorMsg = 'Failed to update availability';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch {}
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Error updating availability: ' + (error.message || error));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {newBookingAlert && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-pulse">
            <strong>New booking received!</strong> Check your pending bookings tab.
          </div>
        )}
        
        {notification && (
          <div className={`px-4 py-3 rounded mb-4 border ${
            notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
            notification.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
            notification.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
            'bg-blue-100 border-blue-400 text-blue-700'
          } animate-fade-in`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">{notification.icon}</span>
              <strong>{notification.message}</strong>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Host Dashboard</h1>
            <div className="text-sm text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button 
              onClick={refreshData} 
              disabled={isRefreshing} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={toggleAvailability} 
              className={`px-4 py-2 rounded ${hostData?.available ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              {hostData?.available ? 'Make Unavailable' : 'Make Available'}
            </button>

          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 rounded p-4 mb-4 text-center">{error}</div>
        )}

        {/* Real-time Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded shadow text-center">
            <div className="text-xs text-gray-500 mb-1">Total Bookings</div>
            <div className="text-2xl font-bold text-blue-700">{stats.totalBookings}</div>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <div className="text-xs text-gray-500 mb-1">Total Earnings</div>
            <div className="text-2xl font-bold text-green-700">₹{stats.totalEarnings}</div>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <div className="text-xs text-gray-500 mb-1">Active Bookings</div>
            <div className="text-2xl font-bold text-orange-700">{stats.activeBookings}</div>
          </div>
        </div>

        {/* Host Info Card */}
        {hostData && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-gray-900">Station Info</div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  hostData.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  hostData.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  hostData.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {hostData.verificationStatus === 'approved' && 'Approved'}
                  {hostData.verificationStatus === 'pending' && 'Pending Approval'}
                  {hostData.verificationStatus === 'rejected' && 'Rejected'}
                  {!hostData.verificationStatus && 'Under Review'}
                </span>
                <span className={`px-3 py-1 rounded text-xs font-medium ${hostData.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {hostData.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
            
            {/* Verification Status Message */}
            {hostData.verificationStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Verification Pending</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your host application is under review by our admin team. You'll be notified once it's approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {hostData.verificationStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Application Rejected</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Your host application was rejected. 
                      {hostData.rejectionReason && (
                        <span className="block mt-1 font-medium">
                          Reason: {hostData.rejectionReason}
                        </span>
                      )}
                      Please contact support for assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {hostData.verificationStatus === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Verification Completed</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Congratulations! Your charging station is approved and can now receive bookings.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <div className="text-sm text-gray-600">Host Name</div>
                <div className="font-semibold text-gray-800">{hostData.hostName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Charger Type</div>
                <div className="font-semibold text-gray-800">{hostData.chargerType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Verification Status</div>
                <div className={`font-semibold ${
                  hostData.verificationStatus === 'approved' ? 'text-green-600' :
                  hostData.verificationStatus === 'pending' ? 'text-yellow-600' :
                  hostData.verificationStatus === 'rejected' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {hostData.verificationStatus === 'approved' && 'Approved'}
                  {hostData.verificationStatus === 'pending' && 'Pending'}
                  {hostData.verificationStatus === 'rejected' && 'Rejected'}
                  {!hostData.verificationStatus && 'Under Review'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Price</div>
                <div className="font-semibold text-gray-800">₹{hostData.pricePerHour}/hour</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Location</div>
                <div className="font-semibold text-gray-800">{hostData.location?.address}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="font-semibold text-gray-800">{hostData.phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-semibold text-gray-800">{hostData.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-4">
              {['overview', 'pending', 'active', 'completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-2 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab !== 'overview' && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                      {bookings.filter(b => b.status === tab).length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Bookings List */}
          <div className="p-4">
            {activeTab === 'overview' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold">Recent Bookings</h3>
                </div>
                {bookings.length === 0 ? (
                  <div className="bg-gray-50 rounded p-6 text-center text-gray-500">No bookings yet.</div>
                ) : (
                  bookings.slice(0, 5).map(booking => (
                    <BookingCard 
                      key={booking._id} 
                      booking={booking} 
                      onUpdateStatus={updateBookingStatus}
                      formatDateTime={formatDateTime}
                      getStatusColor={getStatusColor}
                      processingBooking={processingBooking}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings</h3>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {bookings.filter(booking => {
                      if (activeTab === 'active') {
                        return booking.status === 'active' || booking.status === 'ongoing';
                      }
                      return booking.status === activeTab;
                    }).length} {activeTab} booking{bookings.filter(booking => {
                      if (activeTab === 'active') {
                        return booking.status === 'active' || booking.status === 'ongoing';
                      }
                      return booking.status === activeTab;
                    }).length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {bookings.filter(booking => {
                  if (activeTab === 'active') {
                    return booking.status === 'active' || booking.status === 'ongoing';
                  }
                  return booking.status === activeTab;
                }).length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <span className="text-4xl mb-4 block">
                      {activeTab === 'pending' && 'P'}
                      {activeTab === 'active' && 'A'}  
                      {activeTab === 'completed' && 'C'}
                    </span>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No {activeTab} bookings</h4>
                    <p className="text-gray-500">
                      {activeTab === 'pending' && 'New booking requests will appear here.'}
                      {activeTab === 'active' && 'Active charging sessions will appear here.'}
                      {activeTab === 'completed' && 'Completed bookings will appear here.'}
                    </p>
                  </div>
                ) : (
                  bookings
                    .filter(booking => {
                      if (activeTab === 'active') {
                        return booking.status === 'active' || booking.status === 'ongoing';
                      }
                      return booking.status === activeTab;
                    })
                    .map(booking => (
                      <BookingCard 
                        key={booking._id} 
                        booking={booking} 
                        onUpdateStatus={updateBookingStatus}
                        formatDateTime={formatDateTime}
                        getStatusColor={getStatusColor}
                        processingBooking={processingBooking}
                      />
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onUpdateStatus, formatDateTime, getStatusColor, processingBooking }) {
  const getTimeStatus = () => {
    try {
      const now = new Date();
      const startTime = new Date(booking.startTime);
      const endTime = booking.endTime ? new Date(booking.endTime) : null;
      
      if (booking.status === 'active' || booking.status === 'ongoing') {
        if (endTime && now > endTime) {
          return { text: 'Overdue', color: 'text-red-600', icon: '' };
        } else {
          const remaining = endTime ? Math.max(0, Math.floor((endTime - now) / (1000 * 60))) : 0;
          return { text: `${remaining} min remaining`, color: 'text-blue-600', icon: '' };
        }
      } else if (booking.status === 'pending') {
        const timeUntilStart = Math.floor((startTime - now) / (1000 * 60));
        if (timeUntilStart < 0) {
          return { text: 'Ready to start', color: 'text-green-600', icon: '' };
        } else {
          return { text: `Starts in ${timeUntilStart} min`, color: 'text-yellow-600', icon: '' };
        }
      }
      return null;
    } catch (error) {
      console.error('Error calculating time status:', error);
      return null;
    }
  };

  const timeStatus = getTimeStatus();

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            (booking.status === 'active' || booking.status === 'ongoing') ? 'bg-blue-500 animate-pulse' : 
            booking.status === 'pending' ? 'bg-yellow-500' : 
            booking.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div>
            <h4 className="font-semibold text-lg text-gray-800">{booking.customerName}</h4>
            <p className="text-gray-600 text-sm">{booking.customerPhone}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
          {timeStatus && (
            <span className={`text-xs ${timeStatus.color} flex items-center space-x-1`}>
              <span>{timeStatus.icon}</span>
              <span>{timeStatus.text}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 mb-1">Vehicle</p>
          <p className="font-semibold text-gray-800">{booking.vehicleNumber || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="font-semibold text-gray-800">{booking.duration} minutes</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Amount</p>
          <p className="font-semibold text-green-600">₹{booking.amount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Energy</p>
          <p className="font-semibold text-blue-600">{booking.energyConsumed || 0} kWh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Start Time</p>
          <p className="font-medium text-gray-800">{formatDateTime(booking.startTime)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">End Time</p>
          <p className="font-medium text-gray-800">
            {booking.endTime ? formatDateTime(booking.endTime) : ((booking.status === 'active' || booking.status === 'ongoing') ? 'In Progress...' : 'Not started')}
          </p>
        </div>
      </div>

      {booking.rating && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Customer Rating</p>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500 text-lg">{booking.rating}/5 stars</span>
            <span className="font-medium text-gray-800">({booking.rating}/5)</span>
          </div>
        </div>
      )}

      {/* Real-time Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        {booking.status === 'pending' && (
          <>
            <button
              onClick={() => {
                if (confirm(`Accept booking request from ${booking.customerName}?\n\nCustomer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nVehicle: ${booking.vehicleNumber || 'N/A'}\nDuration: ${booking.duration} minutes\nAmount: ₹${booking.amount}\n\nAccepting will notify the customer and allow them to start charging.`)) {
                  onUpdateStatus(booking._id, 'accepted');
                }
              }}
              disabled={processingBooking === booking._id}
              className={`${processingBooking === booking._id ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-md text-sm transition duration-200 flex items-center space-x-1`}
            >
              {processingBooking === booking._id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Accept</span>
                  <span>Accept Request</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (confirm(`Decline booking request from ${booking.customerName}?\n\nThis will notify the customer that their booking request was declined.`)) {
                  onUpdateStatus(booking._id, 'declined');
                }
              }}
              disabled={processingBooking === booking._id}
              className={`${processingBooking === booking._id ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-md text-sm transition duration-200 flex items-center space-x-1`}
            >
              {processingBooking === booking._id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Decline</span>
                  <span>Decline Request</span>
                </>
              )}
            </button>
          </>
        )}
        
        {(booking.status === 'active' || booking.status === 'ongoing') && (
          <button
            onClick={() => {
              if (confirm(`Mark booking for ${booking.customerName} as completed?`)) {
                onUpdateStatus(booking._id, 'completed');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition duration-200 flex items-center space-x-1"
          >
            <span>Complete</span>
            <span>Mark Complete</span>
          </button>
        )}
        
        <button
          onClick={() => alert(`Calling ${booking.customerPhone}...`)}
          className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition duration-200 flex items-center space-x-1"
        >
          <span>Contact</span>
          <span>Contact Customer</span>
        </button>
      </div>
    </div>
  );
}