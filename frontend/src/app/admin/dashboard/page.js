'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingCard from '@/components/LoadingCard';
import { useNotification } from '@/contexts/NotificationContext';

export default function AdminDashboard() {
  const [adminStats, setAdminStats] = useState(null);
  const [allHosts, setAllHosts] = useState([]);
  const [pendingHosts, setPendingHosts] = useState([]);
  const [approvedHosts, setApprovedHosts] = useState([]);
  const [rejectedHosts, setRejectedHosts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostsLoading, setHostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [processingHost, setProcessingHost] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [hostToReject, setHostToReject] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');
  const [currentAdminName, setCurrentAdminName] = useState('');
  const [documentLoadingError, setDocumentLoadingError] = useState({});
  const [documentViewerModal, setDocumentViewerModal] = useState({ open: false, url: null, title: null, type: null });
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const router = useRouter();
  const { showSuccess, showError: showErrorToast } = useNotification();

  useEffect(() => {
    fetchAdminData();
    fetchHosts();
    fetchAdmins();
    fetchRegistrationRequests();
    fetchCurrentAdmin();
  }, []);

  const fetchHosts = async () => {
    try {
      setHostsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all hosts
      const allResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts?limit=100`, { headers });
      if (allResponse.ok) {
        const allData = await allResponse.json();
        const hosts = allData.hosts || [];
        setAllHosts(hosts);

        // Separate hosts by status
        setPendingHosts(hosts.filter(host => host.verificationStatus === 'pending'));
        setApprovedHosts(hosts.filter(host => host.verificationStatus === 'approved'));
        setRejectedHosts(hosts.filter(host => host.verificationStatus === 'rejected'));
      }
    } catch (err) {
    } finally {
      setHostsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/list`, { headers });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
    }
  };

  const fetchRegistrationRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch pending hosts from the consolidated hosts endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/pending`, { headers });
      if (response.ok) {
        const data = await response.json();
        const pendingHostsList = data.hosts ? data.hosts.filter(host => host.verificationStatus === 'pending') : [];
        setRegistrationRequests(pendingHostsList);
        if (pendingHostsList && pendingHostsList.length > 0) {
          setSelectedRegistration(pendingHostsList[0]);
        }
      } else {
      }
    } catch (err) {
    }
  };

  const fetchCurrentAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Decode JWT token to extract admin info
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        if (payload.email) {
          setCurrentAdminEmail(payload.email);
        }
        if (payload.name) {
          setCurrentAdminName(payload.name);
        }
        if (payload.email && !payload.name) {
          setCurrentAdminName(payload.email.split('@')[0]);
        }
      } catch (err) {
        setCurrentAdminName('Admin');
      }
    } catch (err) {
    }
  };

  const approveRegistration = async (registrationId) => {
    try {
      setProcessingHost(registrationId);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/host-registration-requests/${registrationId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        await fetchRegistrationRequests();
        await fetchHosts();
        setSelectedRegistration(null);
        showSuccess('Registration approved successfully!');
      } else {
        const errorMsg = data.message || 'Failed to approve registration';
        setError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to approve registration';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setProcessingHost(null);
    }
  };

  const denyRegistration = async (registrationId) => {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;

    try {
      setProcessingHost(registrationId);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/host-registration-requests/${registrationId}/deny`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        await fetchRegistrationRequests();
        setSelectedRegistration(null);
        showSuccess('Registration rejected successfully!');
      } else {
        const errorMsg = data.message || 'Failed to reject registration';
        setError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to reject registration';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setProcessingHost(null);
    }
  };

  const addNewAdmin = async (e) => {
    e.preventDefault();
    setAddingAdmin(true);
    setError('');
    setAdminSuccess('');

    try {
      if (!newAdminEmail || !newAdminPassword) {
        setError('Email and password are required');
        setAddingAdmin(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setAddingAdmin(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          name: newAdminName || newAdminEmail.split('@')[0]
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAdminSuccess(`Admin '${newAdminEmail}' created successfully!`);
        showSuccess(`Admin '${newAdminEmail}' created successfully!`);
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminName('');
        await fetchAdmins();
      } else {
        const errorMsg = data.message || 'Failed to create admin';
        setError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Error creating admin';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setAddingAdmin(false);
    }
  };

  const deleteAdminUser = async (adminId, adminEmail) => {
    if (!window.confirm(`Are you sure you want to delete admin '${adminEmail}'?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setAdminSuccess(`Admin deleted successfully`);
        showSuccess('Admin deleted successfully');
        await fetchAdmins();
      } else {
        const errorMsg = data.message || 'Failed to delete admin';
        setError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Error deleting admin';
      setError(errorMsg);
      showErrorToast(errorMsg);
    }
  };

  const approveHost = async (hostId) => {
    try {
      setProcessingHost(hostId);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/${hostId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        // Refresh the hosts list
        await fetchHosts();
        showSuccess('Host approved successfully!');
      } else {
        const errorMsg = data.error || 'Failed to approve host';
        setError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to approve host';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setProcessingHost(null);
    }
  };

  const downloadDocument = (url, filename) => {
    window.open(url, '_blank');
  };

  const openRejectModal = (host) => {
    setHostToReject(host);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const rejectHost = async () => {
    if (!hostToReject || !rejectionReason.trim()) {
      showErrorToast('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingHost(hostToReject._id);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/${hostToReject._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        setShowRejectModal(false);
        setHostToReject(null);
        setRejectionReason('');
        // Refresh the hosts list
        await fetchHosts();
        showSuccess('Host rejected successfully!');
      } else {
        const errorMsg = data.error || 'Failed to reject host';
        setError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to reject host';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setProcessingHost(null);
    }
  };

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch admin stats first (most important)
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, { headers });
      
      if (statsResponse.status === 403) {
        setError('Admin access required. Please login with admin credentials.');
        setTimeout(() => router.push('/admin/login'), 3000);
        return;
      }
      
      if (statsResponse.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        router.push('/admin/login');
        return;
      }
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setAdminStats(stats);
        setLoading(false);
        setError(''); // Clear any errors
      } else {
        throw new Error(`Failed to fetch admin stats: ${statsResponse.status}`);
      }

    } catch (err) {
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  // Render host table component
  const renderHostTable = (hosts, title, emptyMessage) => (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title} ({hosts.length})</h3>
        {hosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hosts.map((host, index) => (
                  <tr key={host._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {host.userId?.name ? host.userId.name.charAt(0).toUpperCase() : 'H'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {host.userId?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {host.userId?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{host.businessName || 'Not provided'}</div>
                      <div className="text-sm text-gray-500">{host.businessType || 'Not specified'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{host.address || 'Not provided'}</div>
                      <div className="text-sm text-gray-500">{host.city || ''} {host.state || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        host.verificationStatus === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : host.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {host.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {host.createdAt ? new Date(host.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="xl"
        message="Loading admin dashboard..."
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col h-screen fixed left-0 top-0`}>
        {/* Toggle Button */}
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold text-gray-900 dark:text-white">ChargeLoop</h2>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? '→' : '←'}
          </button>
        </div>

        {/* Stats in Sidebar */}
        <div className="flex-1 px-4 py-6 space-y-4 overflow-hidden">
          {sidebarOpen && <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2">Navigation</h3>}
          
          {/* Pending Hosts Button */}
          <button
            onClick={() => setActiveTab('pending')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-gray-100 dark:bg-gray-700 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {sidebarOpen && <p className="text-sm text-gray-900 dark:text-white">Pending</p>}
          </button>

          {/* Approved Hosts Button */}
          <button
            onClick={() => setActiveTab('approved')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeTab === 'approved'
                ? 'bg-gray-100 dark:bg-gray-700 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {sidebarOpen && <p className="text-sm text-gray-900 dark:text-white">Approved</p>}
          </button>

          {/* Rejected Hosts Button */}
          <button
            onClick={() => setActiveTab('rejected')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeTab === 'rejected'
                ? 'bg-gray-100 dark:bg-gray-700 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {sidebarOpen && <p className="text-sm text-gray-900 dark:text-white">Rejected</p>}
          </button>

          {/* Admins Button */}
          <button
            onClick={() => setActiveTab('admins')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeTab === 'admins'
                ? 'bg-gray-100 dark:bg-gray-700 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {sidebarOpen && <p className="text-sm text-gray-900 dark:text-white">Admins</p>}
          </button>

        </div>

        {/* Account & Logout Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 mt-auto space-y-3">
          {/* Account Info */}
          {sidebarOpen && (
            <div className="flex items-center space-x-3 p-2">
              <div className="h-10 w-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {currentAdminName ? currentAdminName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentAdminName || 'Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentAdminEmail || 'Loading...'}</p>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userRole');
              router.push('/admin/login');
            }}
            className="w-full px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium text-sm"
          >
            Logout
          </button>
        </div>

       
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header with Stats */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Title and Stats Row */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage host verifications and platform settings</p>
              </div>

              {/* Compact Stats */}
              {adminStats && (
                <div className="flex gap-3">
                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-w-max">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">HOSTS</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{adminStats.totalHosts || 0}</p>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-w-max">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">PENDING</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{adminStats.pendingHosts || 0}</p>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-w-max">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">USERS</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{adminStats.totalUsers || 0}</p>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-w-max">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">APPROVED</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{approvedHosts.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Host Management Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Tab Content */}
              <div className="p-6">
                {hostsLoading ? (
                  <LoadingCard 
                    variant="table" 
                    title="Loading hosts..."
                    description="Please wait while we fetch the data"
                  />
                ) : (
                  <>
                    {activeTab === 'pending' && (
                      <div className="h-full flex flex-col">
                        {/* Registration Requests Section */}
                        {registrationRequests.length > 0 && (
                          <>
                            <div className="flex-shrink-0">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Host Registration Requests ({registrationRequests.length})</h3>
                            </div>
                            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* List Panel */}
                              <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-y-auto">
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {registrationRequests.map((reg) => (
                                    <div
                                      key={reg._id}
                                      onClick={() => setSelectedRegistration(reg)}
                                      className={`p-4 cursor-pointer transition-colors ${
                                        selectedRegistration?._id === reg._id
                                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                      }`}
                                    >
                                      <p className="font-medium text-gray-900 dark:text-white">{reg.hostName || reg.name}</p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">{reg.phone || reg.mobile}</p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {new Date(reg.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Details Panel */}
                              {selectedRegistration && (
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto flex flex-col">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Registration Details</h3>

                                  {/* Basic Info */}
                                  <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                                      <p className="text-gray-900 dark:text-white mt-1">{selectedRegistration.hostName || selectedRegistration.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                                      <p className="text-gray-900 dark:text-white mt-1">{selectedRegistration.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                                      <p className="text-gray-900 dark:text-white mt-1">{selectedRegistration.phone || selectedRegistration.mobile}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                                      <p className="text-gray-900 dark:text-white mt-1">{selectedRegistration.location?.address || selectedRegistration.address}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location Coordinates</label>
                                      <p className="text-gray-900 dark:text-white mt-1">
                                        {selectedRegistration.location?.latitude || selectedRegistration.latitude}, {selectedRegistration.location?.longitude || selectedRegistration.longitude}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Charger Type</label>
                                      <p className="text-gray-900 dark:text-white mt-1">{selectedRegistration.chargerType || 'Not specified'}</p>
                                    </div>
                                  </div>

                                  {/* Documents Section */}
                                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Documents</h4>
                                    <div className="space-y-3">
                                      {/* Address Proof */}
                                      {selectedRegistration.documents?.addressProofUrl && (
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <span className="text-lg font-semibold text-gray-400">Doc</span>
                                              <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Address Proof</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Document</p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <a
                                                href={`https://docs.google.com/gview?url=${encodeURIComponent(selectedRegistration.documents.addressProofUrl)}&embedded=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                              >
                                                View
                                              </a>
                                              <a
                                                href={selectedRegistration.documents.addressProofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                                              >
                                                Download
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Aadhar Card */}
                                      {selectedRegistration.documents?.aadharCardUrl && (
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <span className="text-lg font-semibold text-gray-400">Doc</span>
                                              <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Aadhar Card</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Document</p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <a
                                                href={`https://docs.google.com/gview?url=${encodeURIComponent(selectedRegistration.documents.aadharCardUrl)}&embedded=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                              >
                                                View
                                              </a>
                                              <a
                                                href={selectedRegistration.documents.aadharCardUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                                              >
                                                Download
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Light Bill / Connection Proof */}
                                      {selectedRegistration.documents?.lightConnectionProofUrl && (
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <span className="text-lg font-semibold text-gray-400">Doc</span>
                                              <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Light Bill / Connection Proof</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Document</p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <a
                                                href={`https://docs.google.com/gview?url=${encodeURIComponent(selectedRegistration.documents.lightConnectionProofUrl)}&embedded=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                              >
                                                View
                                              </a>
                                              <a
                                                href={selectedRegistration.documents.lightConnectionProofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                                              >
                                                Download
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => approveHost(selectedRegistration._id)}
                                        disabled={processingHost === selectedRegistration._id}
                                        className="flex-1 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                      >
                                        {processingHost === selectedRegistration._id ? 'Processing...' : 'Approve'}
                                      </button>
                                      <button
                                        onClick={() => openRejectModal(selectedRegistration)}
                                        disabled={processingHost === selectedRegistration._id}
                                        className="flex-1 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                      >
                                        {processingHost === selectedRegistration._id ? 'Processing...' : 'Reject'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'approved' && (
                      <div>
                        {approvedHosts.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Host Info</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Business</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {approvedHosts.map((host, index) => (
                                  <tr key={host._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                                            {host.userId?.name ? host.userId.name.charAt(0).toUpperCase() : 'H'}
                                          </div>
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {host.userId?.name || 'Unknown'}
                                          </div>
                                          <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {host.userId?.email || 'No email'}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{host.hostName || 'Not provided'}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{host.chargerType || 'Not specified'}</div>
                                      <div className="text-xs text-blue-600 dark:text-blue-400">₹{host.pricePerHour}/hour</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900 dark:text-white">{host.location?.address || 'Not provided'}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{host.location?.city || ''} {host.location?.state || ''}</div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500">{host.location?.pincode || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex flex-col space-y-1">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                                          {host.verificationStatus || 'approved'}
                                        </span>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {host.createdAt ? `Approved ${new Date(host.createdAt).toLocaleDateString()}` : 'Date unknown'}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900 dark:text-white">
                                        <div className="text-xs text-green-600 dark:text-green-400">Active: {host.isActive ? 'Yes' : 'No'}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Bookings: {host.totalBookings || 0}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Rating: {host.rating?.average || 'N/A'}/5</div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No approved hosts yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'rejected' && (
                      <div>
                        {rejectedHosts.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Host Info</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Host Details</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rejection Info</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {rejectedHosts.map((host, index) => (
                                  <tr key={host._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                                            {host.userId?.name ? host.userId.name.charAt(0).toUpperCase() : 'H'}
                                          </div>
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {host.userId?.name || 'Unknown'}
                                          </div>
                                          <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {host.userId?.email || 'No email'}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{host.hostName || 'Not provided'}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{host.chargerType || 'Not specified'}</div>
                                      <div className="text-xs text-blue-600 dark:text-blue-400">₹{host.pricePerHour}/hour</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900 dark:text-white">{host.location?.address || 'Not provided'}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{host.location?.city || ''} {host.location?.state || ''}</div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500">{host.location?.pincode || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                        {host.verificationStatus || 'rejected'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900 dark:text-white">
                                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">Rejected</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {host.createdAt ? `On ${new Date(host.createdAt).toLocaleDateString()}` : 'Date unknown'}
                                        </div>
                                        {host.rejectionReason && (
                                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-xs truncate" title={host.rejectionReason}>
                                            Reason: {host.rejectionReason}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No rejected hosts</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'admins' && (
                      <div>
                        {/* Add Admin Button */}
                        <div className="mb-6">
                          <button
                            onClick={() => setShowAddAdminModal(true)}
                            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-sm"
                          >
                            Add New Admin
                          </button>
                        </div>

                        {/* Admin List */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                          <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Admins</h3>
                            
                            {admins.length > 0 ? (
                              <div className="space-y-3">
                                {admins.map((admin) => (
                                  <div
                                    key={admin._id}
                                    className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                          {admin.name ? admin.name.charAt(0).toUpperCase() : admin.email.charAt(0).toUpperCase()}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.name || 'Admin'}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{admin.email}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                          Created: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                    {admins.length > 1 && (
                                      <button
                                        onClick={() => deleteAdminUser(admin._id, admin.email)}
                                        className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
                                      >
                                        Delete
                                      </button>
                                    )}
                                    {admins.length === 1 && (
                                      <div className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium cursor-not-allowed">
                                        Cannot Delete
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>No admins found</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && hostToReject && (
        <div className="fixed inset-0 bg-black dark:bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reject Host Application</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You are about to reject the application from <strong>{hostToReject.hostName || hostToReject.name || 'Unknown'}</strong>
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection *
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejecting this application..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400"
                rows="4"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {rejectionReason.length}/500 characters
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setHostToReject(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={rejectHost}
                disabled={!rejectionReason.trim() || processingHost === hostToReject._id}
                className="flex-1 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {processingHost === hostToReject._id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Admin</h3>
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setNewAdminName('');
                  setNewAdminEmail('');
                  setNewAdminPassword('');
                  setError('');
                  setAdminSuccess('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {adminSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300 text-sm">{adminSuccess}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={addNewAdmin} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Admin name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="founder@chargeloop.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength="6"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setNewAdminName('');
                    setNewAdminEmail('');
                    setNewAdminPassword('');
                    setError('');
                    setAdminSuccess('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAdmin || !newAdminEmail || !newAdminPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {addingAdmin ? 'Creating...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}