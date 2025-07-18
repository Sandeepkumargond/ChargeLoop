'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChargingHistoryPage() {
  const [chargingSessions, setChargingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, ongoing, cancelled
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, duration, cost
  const router = useRouter();

  useEffect(() => {
    const fetchChargingHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charging/history`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
          // Check if it's an HTML response (server not running)
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('text/html')) {
            throw new Error('Backend server is not running. Please start the backend server first.');
          }
          throw new Error('Failed to fetch charging history');
        }

        const historyData = await response.json();
        setChargingSessions(historyData.sessions || []);

      } catch (error) {
        console.error('Error fetching charging history:', error);
        setError(error.message);
        
        // For demo purposes, set mock data if API fails
        // setChargingSessions([
        //   {
        //     id: 1,
        //     hostName: 'John Doe',
        //     hostLocation: 'Downtown Mall, Mumbai',
        //     chargerType: 'Fast Charging (50kW)',
        //     startTime: '2025-01-15T10:30:00Z',
        //     endTime: '2025-01-15T11:15:00Z',
        //     duration: 45,
        //     energyConsumed: 25.5,
        //     cost: 150,
        //     status: 'completed',
        //     paymentMethod: 'wallet',
        //     transactionId: 'TXN123456',
        //     rating: 5
        //   },
        //   {
        //     id: 2,
        //     hostName: 'Sarah Wilson',
        //     hostLocation: 'Tech Park, Bangalore',
        //     chargerType: 'Regular Charging (22kW)',
        //     startTime: '2025-01-12T14:00:00Z',
        //     endTime: '2025-01-12T16:30:00Z',
        //     duration: 150,
        //     energyConsumed: 45.2,
        //     cost: 225,
        //     status: 'completed',
        //     paymentMethod: 'wallet',
        //     transactionId: 'TXN123455',
        //     rating: 4
        //   },
        //   {
        //     id: 3,
        //     hostName: 'Mike Johnson',
        //     hostLocation: 'Residential Area, Delhi',
        //     chargerType: 'Super Fast (100kW)',
        //     startTime: '2025-01-10T09:15:00Z',
        //     endTime: null,
        //     duration: 0,
        //     energyConsumed: 0,
        //     cost: 0,
        //     status: 'cancelled',
        //     paymentMethod: 'wallet',
        //     transactionId: null,
        //     rating: null
        //   },
        //   {
        //     id: 4,
        //     hostName: 'Lisa Chen',
        //     hostLocation: 'Shopping Center, Pune',
        //     chargerType: 'Fast Charging (50kW)',
        //     startTime: '2025-01-08T13:45:00Z',
        //     endTime: '2025-01-08T14:30:00Z',
        //     duration: 45,
        //     energyConsumed: 28.7,
        //     cost: 172,
        //     status: 'completed',
        //     paymentMethod: 'wallet',
        //     transactionId: 'TXN123453',
        //     rating: 5
        //   }
        // ]);
      } finally {
        setLoading(false);
      }
    };

    fetchChargingHistory();
  }, [router]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'ongoing':
        return '⚡';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDuration = (minutes) => {
    if (minutes === 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStarRating = (rating) => {
    if (!rating) return 'Not rated';
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filteredSessions = chargingSessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.startTime) - new Date(a.startTime);
      case 'oldest':
        return new Date(a.startTime) - new Date(b.startTime);
      case 'duration':
        return b.duration - a.duration;
      case 'cost':
        return b.cost - a.cost;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading charging history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Charging History</h1>
              <p className="text-gray-600 mt-1">Your charging session history and bookings</p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
            >
              Back to Profile
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Sessions</h3>
            <p className="text-2xl font-bold text-blue-600">{chargingSessions.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Completed</h3>
            <p className="text-2xl font-bold text-green-600">
              {chargingSessions.filter(s => s.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Energy</h3>
            <p className="text-2xl font-bold text-purple-600">
              {chargingSessions.reduce((sum, s) => sum + (s.energyConsumed || 0), 0).toFixed(1)} kWh
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
            <p className="text-2xl font-bold text-orange-600">
              ₹{chargingSessions.reduce((sum, s) => sum + (s.cost || 0), 0)}
            </p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex  text-black space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sessions</option>
                <option value="completed">Completed</option>
                <option value="ongoing">Ongoing</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">By Duration</option>
                <option value="cost">By Cost</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {sortedSessions.length} of {chargingSessions.length} sessions
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Note:</strong> {error}
            </p>
            <p className="text-sm text-yellow-600 mt-1">Showing demo data for preview</p>
          </div>
        )}

        {/* Charging Sessions List */}
        <div className="space-y-4">
          {sortedSessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔌</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Charging Sessions</h3>
              <p className="text-gray-600 mb-4">You haven't booked any charging sessions yet</p>
              <button
                onClick={() => router.push('/map')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Find Chargers
              </button>
            </div>
          ) : (
            sortedSessions.map((session) => (
              <div key={session._id || session.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Session Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{session.hostName}</h3>
                        <p className="text-gray-600">{session.hostLocation}</p>
                        <p className="text-sm text-blue-600 font-medium">{session.chargerType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)} {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2  text-black gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Start Time:</span>
                        <p className="font-medium">{formatDateTime(session.startTime)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">End Time:</span>
                        <p className="font-medium">{formatDateTime(session.endTime)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <p className="font-medium">{formatDuration(session.duration)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Energy:</span>
                        <p className="font-medium">{session.energyConsumed || 0} kWh</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost and Actions */}
                  <div className="lg:col-span-1 flex flex-col justify-between">
                    <div className="text-center lg:text-right">
                      <div className="mb-4">
                        <span className="text-gray-600 text-sm">Total Cost</span>
                        <p className="text-3xl font-bold text-green-600">₹{session.cost || 0}</p>
                        <p className="text-xs text-gray-500">via {session.paymentMethod}</p>
                      </div>

                      {session.status === 'completed' && (
                        <div className="mb-4">
                          <span className="text-gray-600 text-sm">Rating</span>
                          <p className="text-lg">{renderStarRating(session.rating)}</p>
                        </div>
                      )}

                      {session.transactionId && (
                        <div className="mb-4">
                          <span className="text-gray-600 text-xs">Transaction ID</span>
                          <p className="text-xs font-mono text-gray-800">{session.transactionId}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 text-sm">
                        View Details
                      </button>
                      {session.status === 'completed' && (
                        <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200 text-sm">
                          Download Receipt
                        </button>
                      )}
                      {session.status === 'completed' && !session.rating && (
                        <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition duration-200 text-sm">
                          Rate Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {sortedSessions.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-200">
              Load More Sessions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
