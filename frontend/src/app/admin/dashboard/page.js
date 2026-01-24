'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  useEffect(() => {
    fetchAdminData();
    fetchHosts();
    fetchAdmins();
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
      console.error('Error fetching hosts:', err);
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
      console.error('Error fetching admins:', err);
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
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminName('');
        await fetchAdmins();
      } else {
        setError(data.message || 'Failed to create admin');
      }
    } catch (err) {
      console.error('Error adding admin:', err);
      setError('Error creating admin');
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
        await fetchAdmins();
      } else {
        setError(data.message || 'Failed to delete admin');
      }
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError('Error deleting admin');
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
        alert('Host approved successfully!');
      } else {
        setError(data.error || 'Failed to approve host');
      }
    } catch (err) {
      console.error('Error approving host:', err);
      setError('Failed to approve host');
    } finally {
      setProcessingHost(null);
    }
  };

  const openRejectModal = (host) => {
    setHostToReject(host);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const rejectHost = async () => {
    if (!hostToReject || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
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
        alert('Host rejected successfully!');
      } else {
        setError(data.error || 'Failed to reject host');
      }
    } catch (err) {
      console.error('Error rejecting host:', err);
      setError('Failed to reject host');
    } finally {
      setProcessingHost(null);
    }
  };

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to admin login');
        router.push('/admin/login');
        return;
      }

      console.log('Token found, fetching admin data...');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch admin stats first (most important)
      console.log('Fetching admin stats...');
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, { headers });
      console.log('Stats response status:', statsResponse.status);
      
      if (statsResponse.status === 403) {
        console.log('Access forbidden - not admin');
        setError('Admin access required. Please login with admin credentials.');
        setTimeout(() => router.push('/admin/login'), 3000);
        return;
      }
      
      if (statsResponse.status === 401) {
        console.log('Unauthorized - invalid token');
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        router.push('/admin/login');
        return;
      }
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('Admin stats loaded:', stats);
        setAdminStats(stats);
        setLoading(false);
        setError(''); // Clear any errors
      } else {
        throw new Error(`Failed to fetch admin stats: ${statsResponse.status}`);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Manage host verifications, users, and monitor platform health</p>
        </div>

        {/* Stats Cards */}
        {adminStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl"></span>
                <span className="bg-blue-400 bg-opacity-30 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full">HOSTS</span>
              </div>
              <p className="text-4xl font-bold">{adminStats.totalHosts || 0}</p>
              <p className="text-blue-100 text-sm mt-2">Total Host Registrations</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl"></span>
                <span className="bg-yellow-400 bg-opacity-30 text-yellow-100 text-xs font-semibold px-3 py-1 rounded-full">PENDING</span>
              </div>
              <p className="text-4xl font-bold">{adminStats.pendingHosts || 0}</p>
              <p className="text-yellow-100 text-sm mt-2">Awaiting Approval</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">👥</span>
                <span className="bg-green-400 bg-opacity-30 text-green-100 text-xs font-semibold px-3 py-1 rounded-full">USERS</span>
              </div>
              <p className="text-4xl font-bold">{adminStats.totalUsers || 0}</p>
              <p className="text-green-100 text-sm mt-2">Registered Users</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl"></span>
                <span className="bg-purple-400 bg-opacity-30 text-purple-100 text-xs font-semibold px-3 py-1 rounded-full">APPROVED</span>
              </div>
              <p className="text-4xl font-bold">{approvedHosts.length || 0}</p>
              <p className="text-purple-100 text-sm mt-2">Approved Hosts</p>
            </div>
          </div>
        )}

        {/* Host Management Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tab Header */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6 py-4" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pending'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                   Pending Hosts ({pendingHosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'approved'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                   Approved Hosts ({approvedHosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'rejected'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Rejected Hosts ({rejectedHosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'admins'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  👥 Admins ({admins.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {hostsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading host details...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'pending' && (
                    <div>
                      {pendingHosts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {pendingHosts.map((host, index) => (
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
                                    <div className="text-sm font-medium text-gray-900">{host.hostName || 'Not provided'}</div>
                                    <div className="text-sm text-gray-500">{host.chargerType || 'Not specified'}</div>
                                    <div className="text-xs text-blue-600">₹{host.pricePerHour}/hour</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{host.location?.address || 'Not provided'}</div>
                                    <div className="text-sm text-gray-500">{host.location?.city || ''} {host.location?.state || ''}</div>
                                    <div className="text-xs text-gray-400">{host.location?.pincode || ''}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col space-y-1">
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        {host.verificationStatus || 'pending'}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        {host.createdAt ? `Applied ${new Date(host.createdAt).toLocaleDateString()}` : 'Date unknown'}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {host.createdAt ? new Date(host.createdAt).toLocaleDateString() : 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex space-x-2 justify-end">
                                      <button
                                        onClick={() => approveHost(host._id)}
                                        disabled={processingHost === host._id}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                      >
                                        {processingHost === host._id ? 'Processing...' : '✓ Approve'}
                                      </button>
                                      <button
                                        onClick={() => openRejectModal(host)}
                                        disabled={processingHost === host._id}
                                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                      >
                                        {processingHost === host._id ? 'Processing...' : '✗ Reject'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No pending host applications</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'approved' && (
                    <div>
                      {approvedHosts.length > 0 ? (
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
                              {approvedHosts.map((host, index) => (
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
                                    <div className="text-sm font-medium text-gray-900">{host.hostName || 'Not provided'}</div>
                                    <div className="text-sm text-gray-500">{host.chargerType || 'Not specified'}</div>
                                    <div className="text-xs text-blue-600">₹{host.pricePerHour}/hour</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{host.location?.address || 'Not provided'}</div>
                                    <div className="text-sm text-gray-500">{host.location?.city || ''} {host.location?.state || ''}</div>
                                    <div className="text-xs text-gray-400">{host.location?.pincode || ''}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col space-y-1">
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        {host.verificationStatus || 'approved'}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        {host.createdAt ? `Approved ${new Date(host.createdAt).toLocaleDateString()}` : 'Date unknown'}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      <div className="text-xs text-green-600">Active: {host.isActive ? 'Yes' : 'No'}</div>
                                      <div className="text-xs text-gray-500">Bookings: {host.totalBookings || 0}</div>
                                      <div className="text-xs text-gray-500">Rating: {host.rating?.average || 'N/A'}/5</div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No approved hosts yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'rejected' && (
                    <div>
                      {rejectedHosts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Info</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {rejectedHosts.map((host, index) => (
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
                                    <div className="text-sm font-medium text-gray-900">{host.hostName || 'Not provided'}</div>
                                    <div className="text-sm text-gray-500">{host.chargerType || 'Not specified'}</div>
                                    <div className="text-xs text-blue-600">₹{host.pricePerHour}/hour</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{host.location?.address || 'Not provided'}</div>
                                    <div className="text-sm text-gray-500">{host.location?.city || ''} {host.location?.state || ''}</div>
                                    <div className="text-xs text-gray-400">{host.location?.pincode || ''}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      {host.verificationStatus || 'rejected'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      <div className="text-xs text-red-600 font-medium">Rejected</div>
                                      <div className="text-xs text-gray-500">
                                        {host.createdAt ? `On ${new Date(host.createdAt).toLocaleDateString()}` : 'Date unknown'}
                                      </div>
                                      {host.rejectionReason && (
                                        <div className="text-xs text-gray-600 mt-1 max-w-xs truncate" title={host.rejectionReason}>
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
                        <div className="text-center py-8 text-gray-500">
                          <p>No rejected hosts</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'admins' && (
                    <div>
                      {/* Add New Admin Form */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">➕ Add New Admin</h3>
                        
                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                          </div>
                        )}

                        {adminSuccess && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 text-sm">{adminSuccess}</p>
                          </div>
                        )}

                        <form onSubmit={addNewAdmin} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={newAdminName}
                                onChange={(e) => setNewAdminName(e.target.value)}
                                placeholder="Admin name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                              </label>
                              <input
                                type="password"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength="6"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={addingAdmin || !newAdminEmail || !newAdminPassword}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            {addingAdmin ? 'Creating Admin...' : '✚ Add Admin'}
                          </button>
                        </form>
                      </div>

                      {/* Admin List */}
                      <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Admins</h3>
                          
                          {admins.length > 0 ? (
                            <div className="space-y-3">
                              {admins.map((admin) => (
                                <div
                                  key={admin._id}
                                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 h-12 w-12">
                                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                                        {admin.name ? admin.name.charAt(0).toUpperCase() : admin.email.charAt(0).toUpperCase()}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{admin.name || 'Admin'}</p>
                                      <p className="text-sm text-gray-600">{admin.email}</p>
                                      <p className="text-xs text-gray-500">
                                        Created: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  {admins.length > 1 && (
                                    <button
                                      onClick={() => deleteAdminUser(admin._id, admin.email)}
                                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  )}
                                  {admins.length === 1 && (
                                    <div className="px-3 py-1 bg-gray-300 text-gray-600 rounded-md text-sm font-medium cursor-not-allowed">
                                      Cannot Delete
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
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

        {/* All Hosts (Legacy Section) */}
        <div className="bg-white rounded-lg shadow mb-8" style={{display: 'none'}}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Host Details ({adminStats?.totalHosts || 0} Registered)</h2>
            {hostsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading host details...</p>
              </div>
            ) : allHosts.length > 0 ? (
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
                    {allHosts.map((host, index) => (
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
                <p>No hosts registered yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900">User Registration Summary</h3>
                <p className="text-blue-700 mt-2">
                  Total of <strong>{(adminStats.totalUsers || 0) + (adminStats.totalAdmins || 0)}</strong> accounts created
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {adminStats.totalUsers || 0} regular users, {adminStats.totalAdmins || 0} administrators
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900">Host Registration Summary</h3>
                <p className="text-green-700 mt-2">
                  <strong>{adminStats.totalHosts || 0}</strong> host applications received
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {adminStats.approvedHosts || 0} approved, {adminStats.pendingHosts || 0} pending review
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Reject Modal */}
      {showRejectModal && hostToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reject Host Application</h3>
              <p className="text-sm text-gray-600 mt-1">
                You are about to reject the application from <strong>{hostToReject.userId?.name || 'Unknown'}</strong>
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection *
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejecting this application..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="4"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={rejectHost}
                disabled={!rejectionReason.trim() || processingHost === hostToReject._id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {processingHost === hostToReject._id ? 'Processing...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}