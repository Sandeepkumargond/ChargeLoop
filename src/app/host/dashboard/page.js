'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HostDashboardPage() {
  const [hostData, setHostData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    activeBookings: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    fetchHostData();
    fetchBookings();
  }, []);

  const fetchHostData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHostData(data);
      } else {
        setError('Failed to fetch host data');
      }
    } catch (error) {
      console.error('Error fetching host data:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setStats(data.stats || stats);
      } else {
        // Mock data for demonstration
        const mockBookings = [
          {
            _id: '1',
            customerName: 'Rahul Sharma',
            customerPhone: '+91 9876543210',
            startTime: '2025-01-17T10:00:00Z',
            endTime: '2025-01-17T11:30:00Z',
            duration: 90,
            amount: 225,
            status: 'pending',
            vehicleNumber: 'MH 01 AB 1234',
            energyConsumed: 0
          },
          {
            _id: '2',
            customerName: 'Priya Patel',
            customerPhone: '+91 9876543211',
            startTime: '2025-01-16T14:00:00Z',
            endTime: '2025-01-16T15:00:00Z',
            duration: 60,
            amount: 150,
            status: 'active',
            vehicleNumber: 'GJ 05 CD 5678',
            energyConsumed: 25.5
          },
          {
            _id: '3',
            customerName: 'Amit Kumar',
            customerPhone: '+91 9876543212',
            startTime: '2025-01-15T09:00:00Z',
            endTime: '2025-01-15T10:30:00Z',
            duration: 90,
            amount: 225,
            status: 'completed',
            vehicleNumber: 'DL 08 EF 9012',
            energyConsumed: 42.3,
            rating: 5
          }
        ];
        setBookings(mockBookings);
        setStats({
          totalBookings: 15,
          totalEarnings: 3750,
          activeBookings: 1,
          averageRating: 4.6
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? { ...booking, status } : booking
        ));
        alert(`Booking ${status} successfully!`);
      } else {
        alert('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status');
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
        alert('Failed to update availability');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Error updating availability');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="min-h-screen text-black bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Host Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your charging station</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleAvailability}
                className={`px-4 py-2 rounded-md transition duration-200 ${
                  hostData?.available 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {hostData?.available ? 'Make Unavailable' : 'Make Available'}
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-600">₹{stats.totalEarnings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Active Bookings</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.activeBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Average Rating</h3>
            <p className="text-3xl font-bold text-purple-600">⭐ {stats.averageRating}</p>
          </div>
        </div>

        {/* Host Info Card */}
        {hostData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Station Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                hostData.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {hostData.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p><strong>Host Name:</strong> {hostData.hostName}</p>
                <p><strong>Charger Type:</strong> {hostData.chargerType}</p>
                <p><strong>Price:</strong> ₹{hostData.pricePerHour}/hour</p>
                <p><strong>Location:</strong> {hostData.location?.address}</p>
              </div>
              <div>
                <p><strong>Phone:</strong> {hostData.phone}</p>
                <p><strong>Email:</strong> {hostData.email}</p>
                {hostData.amenities && (
                  <div>
                    <strong>Amenities:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hostData.amenities.map((amenity, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['overview', 'pending', 'active', 'completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
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
          <div className="p-6">
            {activeTab === 'overview' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Bookings</h3>
                {bookings.slice(0, 5).map(booking => (
                  <BookingCard 
                    key={booking._id} 
                    booking={booking} 
                    onUpdateStatus={updateBookingStatus}
                    formatDateTime={formatDateTime}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {bookings
                  .filter(booking => booking.status === activeTab)
                  .map(booking => (
                    <BookingCard 
                      key={booking._id} 
                      booking={booking} 
                      onUpdateStatus={updateBookingStatus}
                      formatDateTime={formatDateTime}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                {bookings.filter(booking => booking.status === activeTab).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No {activeTab} bookings found</p>
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

function BookingCard({ booking, onUpdateStatus, formatDateTime, getStatusColor }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-lg">{booking.customerName}</h4>
          <p className="text-gray-600 text-sm">{booking.customerPhone}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Vehicle</p>
          <p className="font-medium">{booking.vehicleNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Duration</p>
          <p className="font-medium">{booking.duration} minutes</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Amount</p>
          <p className="font-medium text-green-600">₹{booking.amount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Start Time</p>
          <p className="font-medium">{formatDateTime(booking.startTime)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">End Time</p>
          <p className="font-medium">{booking.endTime ? formatDateTime(booking.endTime) : 'Ongoing'}</p>
        </div>
      </div>

      {booking.energyConsumed > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Energy Consumed</p>
          <p className="font-medium">{booking.energyConsumed} kWh</p>
        </div>
      )}

      {booking.rating && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Customer Rating</p>
          <p className="font-medium">{'⭐'.repeat(booking.rating)} ({booking.rating}/5)</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {booking.status === 'pending' && (
          <>
            <button
              onClick={() => onUpdateStatus(booking._id, 'active')}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition duration-200"
            >
              Accept
            </button>
            <button
              onClick={() => onUpdateStatus(booking._id, 'cancelled')}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition duration-200"
            >
              Decline
            </button>
          </>
        )}
        {booking.status === 'active' && (
          <button
            onClick={() => onUpdateStatus(booking._id, 'completed')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition duration-200"
          >
            Mark Complete
          </button>
        )}
        <button className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition duration-200">
          Contact Customer
        </button>
      </div>
    </div>
  );
}
