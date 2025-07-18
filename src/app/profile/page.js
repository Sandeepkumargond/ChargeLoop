'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('userEmail');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch real user profile from backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const userData = await response.json();
        
        // Enhance user data with additional calculated fields
        const enhancedUser = {
          ...userData,
          // Ensure chargingSessions is always an array
          chargingSessions: Array.isArray(userData.chargingSessions) ? userData.chargingSessions : [],
          hostSessions: Array.isArray(userData.hostSessions) ? userData.hostSessions : [],
          favoriteStations: Array.isArray(userData.favoriteStations) ? userData.favoriteStations : [],
        };

        // Calculate derived statistics safely
        const chargingSessionsArray = enhancedUser.chargingSessions;
        const hostSessionsArray = enhancedUser.hostSessions;

        enhancedUser.totalBookings = chargingSessionsArray.length;
        enhancedUser.totalSavings = chargingSessionsArray.reduce((total, session) => 
          total + (session.amount || 0), 0);
        enhancedUser.carbonSaved = Math.floor(chargingSessionsArray.length * 2.5) + ' kg';
        enhancedUser.memberSince = userData.createdAt ? new Date(userData.createdAt).getFullYear() : new Date().getFullYear();
        enhancedUser.lastLogin = userData.lastLogin || new Date();
        enhancedUser.accountType = userData.isPremium ? 'Premium' : 'Standard';
        
        // Default preferences if not set
        enhancedUser.preferences = userData.preferences || {
          notifications: true,
          darkMode: false,
          autoPayment: false
        };
        
        setUser(enhancedUser);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with Profile Info */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="relative mb-4 md:mb-0">
                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center">
                  <img
                    src="https://www.w3schools.com/howto/img_avatar.png"
                    alt="Profile"
                    className="h-20 w-20 rounded-full"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="md:ml-6 text-black text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold">{user?.name || 'User'}</h1>
                <p className="text-blue-100 mb-2">{user?.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  <span className="bg-white text-black bg-opacity-20 px-3 py-1 rounded-full">
                    📅 Member since {user?.memberSince}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    🎯 {user?.accountType} Account
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    🔋 {user?.chargingSessions?.length || 0} Sessions
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <button 
                  onClick={() => router.push('/profile/edit')}
                  className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100 transition-all duration-200"
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: '📊 Overview', icon: '📊' },
                { id: 'personal', label: '👤 Personal Info', icon: '👤' },
                { id: 'activity', label: '⚡ Activity', icon: '⚡' },
                { id: 'preferences', label: '⚙️ Preferences', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <div className="text-2xl mb-2">🔋</div>
                    <div className="text-2xl font-bold">{user?.chargingSessions?.length || 0}</div>
                    <div className="text-sm opacity-90">Charging Sessions</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <div className="text-2xl mb-2">💰</div>
                    <div className="text-2xl font-bold">₹{user?.walletBalance || 0}</div>
                    <div className="text-sm opacity-90">Wallet Balance</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="text-2xl font-bold">{user?.hostSessions?.length || 0}</div>
                    <div className="text-sm opacity-90">Host Sessions</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                    <div className="text-2xl mb-2">🌱</div>
                    <div className="text-2xl font-bold">{user?.carbonSaved || '0 kg'}</div>
                    <div className="text-sm opacity-90">CO₂ Saved</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50  text-black p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">📈 Recent Activity</h3>
                  <div className="space-y-3">
                    {(user?.chargingSessions || []).length > 0 ? (
                      (user?.chargingSessions || []).slice(0, 3).map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center">
                            <div className="bg-green-100 p-2 rounded-full mr-3">⚡</div>
                            <div>
                              <div className="font-medium">Charging Session</div>
                              <div className="text-sm text-gray-500">
                                {session.location || 'Location not specified'} - ₹{session.amount || 0}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Date unknown'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🔋</div>
                        <p>No charging sessions yet</p>
                        <p className="text-sm">Start charging to see your activity here!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Full Name:</span>
                      <span className="text-gray-800 font-semibold">{user?.name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Email:</span>
                      <span className="text-gray-800">{user?.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Phone:</span>
                      <span className="text-gray-800">{user?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Location:</span>
                      <span className="text-gray-800">{user?.location || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Last Login:</span>
                      <span className="text-gray-800">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Account Details</h3>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-xl">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-lg font-semibold text-gray-800">{user?.accountType} Member</div>
                      <div className="text-sm text-gray-600 mt-2">
                        Enjoying all the benefits of {user?.accountType.toLowerCase()} membership
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex text-gray-600 justify-between items-center">
                        <span className="font-medium">Total Spent</span>
                        <span className="text-green-600 font-bold">₹{user?.totalSavings || 0}</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-black">Favorite Stations</span>
                        <span className="text-blue-600 font-bold">{user?.favoriteStations?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">⚡ Activity Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-4">🔋 Charging Stats</h4>
                    <div className="space-y-3 text-black">
                      <div className="flex justify-between">
                        <span>Total Sessions:</span>
                        <span className="font-bold">{user?.chargingSessions?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Bookings:</span>
                        <span className="font-bold">{user?.totalBookings || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Money Spent:</span>
                        <span className="font-bold text-green-600">₹{user?.totalSavings || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                    <h4 className="font-semibold text-green-800 mb-4">🏠 Hosting Stats</h4>
                    <div className="space-y-3  text-black">
                      <div className="flex justify-between">
                        <span>Host Sessions:</span>
                        <span className="font-bold">{user?.hostSessions?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Earnings:</span>
                        <span className="font-bold text-green-600">₹{(user?.hostSessions || []).reduce((total, session) => total + (session.earnings || 0), 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-bold">{user?.hostRating ? `⭐ ${user.hostRating}/5` : '⭐ No ratings yet'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 text-black p-6 rounded-xl">
                  <h4 className="font-semibold mb-4">🌱 Environmental Impact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{user?.carbonSaved || '0 kg'}</div>
                      <div className="text-sm text-gray-600">CO₂ Saved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{Math.floor((user?.chargingSessions?.length || 0) * 25)} kWh</div>
                      <div className="text-sm text-gray-600">Clean Energy Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{Math.floor((user?.chargingSessions?.length || 0) * 2)} Trees</div>
                      <div className="text-sm text-gray-600">Equivalent Trees Planted</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">⚙️ Account Preferences</h3>
                
                <div className="grid text-black grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border">
                    <h4 className="font-semibold mb-4">🔔 Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Email Notifications</span>
                        <span className={`px-2 py-1 rounded text-sm ${user?.preferences?.notifications ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                          {user?.preferences?.notifications ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Auto Payment</span>
                        <span className={`px-2 py-1 rounded text-sm ${user?.preferences?.autoPayment ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                          {user?.preferences?.autoPayment ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border">
                    <h4 className="font-semibold mb-4">🎨 Appearance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Dark Mode</span>
                        <span className={`px-2 py-1 rounded text-sm ${user?.preferences?.darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {user?.preferences?.darkMode ? 'Dark' : 'Light'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-6 bg-gray-50 border-t">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => router.push('/wallet')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
              >
                💳 Wallet
              </button>
              <button 
                onClick={() => router.push('/charging-history')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center gap-2"
              >
                📋 History
              </button>
              <button 
                onClick={() => router.push('/host/register')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center gap-2"
              >
                🏠 Become Host
              </button>
              <button 
                onClick={() => router.push('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center gap-2"
              >
                🏠 Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
