'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
  });
  const router = useRouter();

  useEffect(() => {
    // Get user role from localStorage
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }

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
        
        const enhancedUser = {
          ...userData,
          chargingSessions: Array.isArray(userData.chargingSessions) ? userData.chargingSessions : [],
          hostSessions: Array.isArray(userData.hostSessions) ? userData.hostSessions : [],
          vehicles: Array.isArray(userData.vehicles) ? userData.vehicles : [],
        };

        const chargingSessionsArray = enhancedUser.chargingSessions;

        enhancedUser.totalBookings = chargingSessionsArray.length;
        enhancedUser.totalSpent = chargingSessionsArray.reduce((total, session) => 
          total + (session.amount || 0), 0);
        enhancedUser.memberSince = userData.createdAt ? new Date(userData.createdAt).getFullYear() : new Date().getFullYear();
        
        setUser(enhancedUser);
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          location: userData.location || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!formData.name || formData.name.trim().length === 0) {
      setError('Name is required');
      return;
    }

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorData.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      const enhancedUser = {
        ...updatedUser,
        chargingSessions: Array.isArray(updatedUser.chargingSessions) ? updatedUser.chargingSessions : [],
        hostSessions: Array.isArray(updatedUser.hostSessions) ? updatedUser.hostSessions : [],
        vehicles: Array.isArray(updatedUser.vehicles) ? updatedUser.vehicles : [],
      };

      const chargingSessionsArray = enhancedUser.chargingSessions;
      enhancedUser.totalBookings = chargingSessionsArray.length;
      enhancedUser.totalSpent = chargingSessionsArray.reduce((total, session) => 
        total + (session.amount || 0), 0);
      enhancedUser.memberSince = updatedUser.createdAt ? new Date(updatedUser.createdAt).getFullYear() : new Date().getFullYear();

      setUser(enhancedUser);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      location: user?.location || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
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
    <>
      {/* Main Content */}
      <div className="min-h-screen bg-white dark:bg-gray-900 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
          {/* Profile Card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 sm:p-8">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-3xl">
                  {(isEditing ? formData.name : user?.name)
                    ? (isEditing ? formData.name : user?.name).split(' ').map(n => n[0]).join('').toUpperCase() 
                    : 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{isEditing ? formData.name : user?.name || 'User'}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                  {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}
                </p>
              </div>
              {!isEditing && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition w-full sm:w-auto"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Key Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Charging Sessions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{user?.chargingSessions?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Wallet Balance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{user?.walletBalance || 0}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{user?.totalSpent || 0}</p>
              </div>
            </div>

            {/* Personal Information - View Mode */}
            {!isEditing && (
              <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Full Name</p>
                    <p className="text-gray-900 dark:text-white">{user?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Email</p>
                    <p className="text-gray-900 dark:text-white">{user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Phone</p>
                    <p className="text-gray-900 dark:text-white">{user?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Location</p>
                    <p className="text-gray-900 dark:text-white">{user?.location || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information - Edit Mode */}
            {isEditing && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit Personal Information</h2>
                <form className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="Enter your location"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed opacity-75"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email address cannot be changed</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
