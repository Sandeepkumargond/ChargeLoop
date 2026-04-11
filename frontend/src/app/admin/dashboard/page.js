'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { fetchWithFriendlyError } from '@/utils/fetchWithFriendlyError';

const DetailItem = ({ label, value }) => (
  <div className="mb-1">
    <span className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 block mb-2">{label}</span>
    <p className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-snug break-words">{value || 'N/A'}</p>
  </div>
);

const AdminCard = ({ admin, onDelete }) => (
  <div className="bg-white dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700/50 rounded-2xl p-5 flex items-center justify-between shadow-lg hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600/30 transition-all duration-300">
    <div className="flex items-center gap-4 overflow-hidden">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-lg">
        {admin.name?.charAt(0) || admin.email?.charAt(0)}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{admin.name || 'Admin User'}</h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{admin.email}</p>
      </div>
    </div>
    <button
      onClick={() => onDelete(admin._id, admin.email)}
      className="p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
      title="Remove Admin"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
);

export default function AdminDashboard() {
  const [adminStats, setAdminStats] = useState(null);
  const [allHosts, setAllHosts] = useState([]);
  const [pendingHosts, setPendingHosts] = useState([]);
  const [approvedHosts, setApprovedHosts] = useState([]);
  const [rejectedHosts, setRejectedHosts] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [processingHost, setProcessingHost] = useState(null);

  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [currentAdminName, setCurrentAdminName] = useState('');
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [hostToReject, setHostToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingHost, setRejectingHost] = useState(false);

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();

  useEffect(() => {
    fetchAdminData();
    fetchHosts();
    fetchAdmins();
    fetchRegistrationRequests();
    fetchCurrentAdmin();
  }, []);

  const fetchHosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const hosts = data.hosts || [];
        setAllHosts(hosts);
        setPendingHosts(hosts.filter(h => h.verificationStatus === 'pending'));
        setApprovedHosts(hosts.filter(h => h.verificationStatus === 'approved'));
        setRejectedHosts(hosts.filter(h => h.verificationStatus === 'rejected'));
      }
    } catch (err) { console.error(err); }
  };

  const fetchAdmins = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchRegistrationRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const pending = data.hosts ? data.hosts.filter(h => h.verificationStatus === 'pending') : [];
        setRegistrationRequests(pending);
      }
    } catch (err) { console.error(err); }
  };

  const fetchCurrentAdmin = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentAdminEmail(payload.email);
      setCurrentAdminName(payload.name || payload.email?.split('@')[0]);
    } catch (e) { setCurrentAdminName('Admin'); }
  };

  const fetchAdminData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminStats(await res.json());
        setLoading(false);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (err) { setLoading(false); }
  };

  const approveHost = async (hostId) => {
    setProcessingHost(hostId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/${hostId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchHosts();
        await fetchRegistrationRequests();
        setSelectedRegistration(null);
      }
    } catch (err) { console.error('Failed to approve'); }
    finally { setProcessingHost(null); }
  };

  const rejectHost = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    
    if (!hostToReject || !hostToReject._id) {
      setError('Host information not found');
      return;
    }

    setRejectingHost(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/${hostToReject._id}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });
      
      if (res.ok) {
        setShowRejectModal(false);
        setHostToReject(null);
        setRejectionReason('');
        await fetchHosts();
        await fetchRegistrationRequests();
        setSelectedRegistration(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.msg || errorData.message || 'Failed to reject host');
      }
    } catch (err) { 
      console.error('Reject error:', err);
      setError('Error: ' + (err.message || 'Failed to reject host')); 
    } finally {
      setRejectingHost(false);
    }
  };

  const openRejectModal = (host) => {
    setHostToReject(host);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const addNewAdmin = async (e) => {
    e.preventDefault();
    setAddingAdmin(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/add`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword, name: newAdminName })
      });
      if (res.ok) {
        setShowAddAdminModal(false);
        setNewAdminEmail(''); setNewAdminPassword(''); setNewAdminName('');
        fetchAdmins();
      } else {
        const data = await res.json();
        setError(data.message || 'Error adding admin');
      }
    } catch (err) { setError(err.message || 'Error adding admin'); }
    finally { setAddingAdmin(false); }
  };

  const deleteAdminUser = async (id, email) => {
    if(!window.confirm(`Delete admin ${email}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdmins();
      }
    } catch(err) { console.error('Failed to delete'); }
  };

  const renderHostTable = (hosts, title, emptyMessage) => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
            {hosts.length} Total
          </span>
        </div>
        {hosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-700">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Host Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                  {title === 'Rejected Applications' && <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Reason</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {hosts.map((host, index) => (
                  <tr key={host._id || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-neutral-900 dark:text-white">{host.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-neutral-500">{host.userId?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-600 dark:text-neutral-300">{host.chargerType}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300 truncate max-w-[150px]">{host.address || host.location?.city}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide ${
                        host.verificationStatus === 'approved'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : host.verificationStatus === 'pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                      }`}>
                        {host.verificationStatus || 'pending'}
                      </span>
                    </td>
                    {title === 'Rejected Applications' && (
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300 max-w-[250px] truncate" title={host.rejectionReason}>
                        {host.rejectionReason || 'No reason provided'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-neutral-100 dark:border-neutral-700 rounded-lg">
            <p className="text-neutral-400 dark:text-neutral-500 font-medium text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner fullScreen size="lg" />;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex flex-col lg:flex-row font-sans">
      {/* Decorative background elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-green-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10"></div>
      
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0 lg:mt-0">
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
        <header className="h-auto bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10 px-4 sm:px-8 py-2 sm:py-3">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight capitalize leading-tight">
                {activeTab === 'pending' ? 'Pending Applications' : activeTab === 'approved' ? 'Approved Hosts' : activeTab === 'rejected' ? 'Rejected Applications' : activeTab === 'admins' ? 'Admin Users' : activeTab}
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-0.5 sm:mt-1">Dashboard Management</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              {activeTab === 'admins' && (
                <button
                  onClick={() => { setShowAddAdminModal(true); setError(''); }}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  Add Admin
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">

          {activeTab === 'pending' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
              <div className="xl:col-span-4 bg-white dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200 dark:border-neutral-700/50 overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-b dark:border-neutral-700/50 flex justify-between items-center">
                   <span className="text-xs sm:text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">Incoming Queue</span>
                   <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">{registrationRequests.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y dark:divide-neutral-700/50">
                  {registrationRequests.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm font-medium">No pending requests</div>
                  ) : (
                    registrationRequests.map((reg) => (
                      <button
                        key={reg._id}
                        onClick={() => setSelectedRegistration(reg)}
                        className={`w-full text-left p-4 transition-all relative group border-l-4 ${
                          selectedRegistration?._id === reg._id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-600'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-l-transparent'
                        }`}
                      >
                        <p className={`font-bold text-sm leading-none ${
                          selectedRegistration?._id === reg._id 
                            ? 'text-blue-700 dark:text-blue-400' 
                            : 'text-neutral-900 dark:text-white'
                        }`}>
                          {reg.hostName || reg.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-2 font-bold uppercase tracking-wider">{reg.chargerType}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="xl:col-span-8 bg-white dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200 dark:border-neutral-700/50 flex flex-col shadow-lg overflow-hidden relative max-h-[600px] sm:max-h-[700px] lg:max-h-[800px]">
                {selectedRegistration ? (
                  <>
                    <div className="p-6 sm:p-10 overflow-y-auto bg-gradient-to-br from-white/50 to-neutral-50/50 dark:from-neutral-800/50 dark:to-neutral-900/50">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-700/50">
                        <div>
                          <h2 className="text-xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-3">
                            {selectedRegistration.hostName || selectedRegistration.name}
                          </h2>
                          <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest rounded-full border border-blue-200 dark:border-blue-700/30">
                               {selectedRegistration.chargerType}
                             </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right px-4 py-3 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                          <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest block mb-1">Applied On</span>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                            {new Date(selectedRegistration.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/5 border border-blue-100 dark:border-blue-700/30">
                          <DetailItem label="Email Address" value={selectedRegistration.email} />
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5 border border-green-100 dark:border-green-700/30">
                          <DetailItem label="Phone Number" value={selectedRegistration.phone || selectedRegistration.mobile} />
                        </div>
                        <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/5 border border-purple-100 dark:border-purple-700/30">
                          <DetailItem label="Full Address" value={selectedRegistration.location?.address || selectedRegistration.address} />
                        </div>
                        <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/10 dark:to-indigo-800/5 border border-indigo-100 dark:border-indigo-700/30">
                           <DetailItem label="GPS Coordinates" value={`${selectedRegistration.location?.latitude || ''}, ${selectedRegistration.location?.longitude || ''}`} />
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/10 dark:to-cyan-800/5 border border-cyan-100 dark:border-cyan-700/30">
                          <DetailItem label="Power Output (kW)" value={selectedRegistration.powerOutput || selectedRegistration.kw || selectedRegistration.kwh || 'N/A'} />
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/10 dark:to-rose-800/5 border border-rose-100 dark:border-rose-700/30">
                          <DetailItem label="Number of Chargers" value={selectedRegistration.chargerCount || selectedRegistration.numberOfChargers || 'N/A'} />
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-lime-50 to-lime-100/50 dark:from-lime-900/10 dark:to-lime-800/5 border border-lime-100 dark:border-lime-700/30">
                          <DetailItem label="Station Name" value={selectedRegistration.stationName || 'N/A'} />
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/10 dark:to-violet-800/5 border border-violet-100 dark:border-violet-700/30">
                          <DetailItem label="Land Type" value={selectedRegistration.landType || 'N/A'} />
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/10 dark:to-teal-800/5 border border-teal-100 dark:border-teal-700/30">
                          <DetailItem label="Parking Spaces" value={selectedRegistration.parkingSpaces || 'N/A'} />
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-neutral-700 dark:text-neutral-300 mb-5 border-b-2 border-blue-200 dark:border-blue-700/30 pb-3 flex items-center gap-2">
                        Verification Documents
                      </h4>
                      <div className="grid gap-4">
                        {['addressProofUrl', 'aadharCardUrl', 'lightConnectionProofUrl'].map((docKey) => {
                          const url = selectedRegistration[docKey] || selectedRegistration.documents?.[docKey];
                          if(!url) return null;
                          return (
                            <div key={docKey} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-700/30 dark:to-neutral-800/20 border border-neutral-200 dark:border-neutral-700/50 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm">
                              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg text-lg font-bold">DOC</div>
                                <div>
                                  <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white uppercase block">
                                    {docKey.replace('Url', '').replace(/([A-Z])/g, ' $1')}
                                  </span>
                                  <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">PDF / Image File</span>
                                </div>
                              </div>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white uppercase bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all text-center shadow-md hover:shadow-lg">
                                View Document
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-800/60 dark:to-neutral-900/40 border-t border-neutral-200 dark:border-neutral-700/50 flex flex-col sm:flex-row gap-3">
                       <button
                         onClick={() => approveHost(selectedRegistration._id)}
                         disabled={processingHost === selectedRegistration._id}
                         className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-green-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                       >
                         {processingHost === selectedRegistration._id ? 'Processing...' : 'Approve Application'}
                       </button>
                       <button
                         onClick={() => openRejectModal(selectedRegistration)}
                         disabled={processingHost === selectedRegistration._id}
                         className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-neutral-700/60 border-2 border-neutral-300 dark:border-neutral-600/50 text-neutral-900 dark:text-white text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                       >
                          Reject
                       </button>
                    </div>
                  </>
                ) : (

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-neutral-50/70 to-blue-50/70 dark:from-neutral-900/70 dark:to-neutral-900/70">
                    <div className="w-full h-full max-h-[400px] border-2 border-dashed border-blue-200 dark:border-blue-700/30 rounded-3xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-neutral-800/30 backdrop-blur-sm">
                      
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No Application Selected</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto">
                        Select a host application from the queue to review their documents and make an approval decision.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {}
          {}
          {activeTab === 'admins' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {admins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {admins.map(admin => (
                    <AdminCard
                      key={admin._id}
                      admin={admin}
                      onDelete={deleteAdminUser}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-blue-200 dark:border-blue-700/30 rounded-2xl bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/5">
                  <span className="text-4xl mb-4">👥</span>
                  <p className="text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-widest text-sm">No admins added yet</p>
                </div>
              )}
            </div>
          )}

          {}
          {activeTab === 'approved' && renderHostTable(approvedHosts, 'Approved Host List', 'No approved hosts found')}
          {activeTab === 'rejected' && renderHostTable(rejectedHosts, 'Rejected Applications', 'No rejected hosts found')}

        </div>
      </main>

      {showAddAdminModal && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-800/90 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-neutral-200 dark:border-neutral-700/50 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
               <div>
                 <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Add New Admin</h3>
                 <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium uppercase tracking-widest">Create a new administrator account</p>
               </div>
               <button onClick={() => setShowAddAdminModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-2xl leading-none">✕</button>
            </div>

            {error && <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/30 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-lg flex items-center gap-2">⚠️ {error}</div>}

            <form onSubmit={addNewAdmin} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest block mb-2">Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 rounded-lg text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest block mb-2">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 rounded-lg text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@chargeloop.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest block mb-2">Password</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 rounded-lg text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 text-neutral-600 dark:text-neutral-400 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Cancel</button>
                <button type="submit" disabled={addingAdmin} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                  {addingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showRejectModal && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-800/90 rounded-2xl shadow-2xl w-full max-w-sm p-8 border border-neutral-200 dark:border-neutral-700/50 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-2xl">
                
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">Reject Application</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Provide a clear reason for rejection</p>
              </div>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-32 p-4 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 rounded-lg text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent mb-6 resize-none transition-all"
              placeholder="Reason for rejection..."
            />
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium mb-4 uppercase tracking-widest">This action cannot be undone</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} disabled={rejectingHost} className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 text-neutral-600 dark:text-neutral-400 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-60 transition-colors">Cancel</button>
              <button onClick={rejectHost} disabled={!rejectionReason.trim() || rejectingHost} className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-rose-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {rejectingHost ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
