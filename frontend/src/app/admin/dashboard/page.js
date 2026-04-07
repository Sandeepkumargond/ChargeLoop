'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

const DetailItem = ({ label, value }) => (
  <div className="mb-1">
    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">{label}</span>
    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug break-words">{value || 'N/A'}</p>
  </div>
);

const AdminCard = ({ admin, onDelete }) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4 overflow-hidden">
      <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm uppercase">
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts?limit=100`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/list`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/pending`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/${hostId}/approve`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hosts/${hostToReject._id}/reject`, {
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
      setError('Network error: ' + err.message); 
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/add`, {
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
    } catch (err) { setError('Connection error'); }
    finally { setAddingAdmin(false); }
  };

  const deleteAdminUser = async (id, email) => {
    if(!window.confirm(`Delete admin ${email}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/${id}`, {
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
    <div className="w-full min-h-screen bg-neutral-50 dark:bg-neutral-900 flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">{activeTab}</h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Dashboard Overview</p>
          </div>

          {activeTab === 'admins' && (
            <button
              onClick={() => { setShowAddAdminModal(true); setError(''); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              Add New Admin
            </button>
          )}

          {activeTab !== 'admins' && adminStats && (
             <div className="hidden md:flex gap-6">
                <div className="text-right">
                   <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Hosts</span>
                   <span className="text-lg font-black text-neutral-900 dark:text-white">{adminStats.totalHosts}</span>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-bold text-neutral-400 uppercase block">Pending</span>
                   <span className="text-lg font-black text-blue-500">{adminStats.pendingHosts}</span>
                </div>
             </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8">

          {activeTab === 'pending' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-180px)]">
              <div className="xl:col-span-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-700 border-b dark:border-neutral-700 flex justify-between items-center">
                   <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Incoming Queue</span>
                   <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{registrationRequests.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y dark:divide-neutral-700">
                  {registrationRequests.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 text-xs italic">No pending requests</div>
                  ) : (
                    registrationRequests.map((reg) => (
                      <button
                        key={reg._id}
                        onClick={() => setSelectedRegistration(reg)}
                        className={`w-full text-left p-5 transition-all relative group ${
                          selectedRegistration?._id === reg._id
                            ? 'bg-blue-50 dark:bg-blue-900/10'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                      >
                        {selectedRegistration?._id === reg._id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                        <p className={`font-bold text-sm leading-none ${selectedRegistration?._id === reg._id ? 'text-blue-700 dark:text-blue-400' : 'text-neutral-900 dark:text-white'}`}>
                          {reg.hostName || reg.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-wider">{reg.chargerType}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="xl:col-span-8 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col shadow-xl overflow-hidden relative">
                {selectedRegistration ? (
                  <>
                    <div className="p-10 overflow-y-auto flex-1">
                      <div className="flex justify-between items-start mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-700">
                        <div>
                          <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">
                            {selectedRegistration.hostName || selectedRegistration.name}
                          </h2>
                          <div className="flex gap-2">
                             <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded">
                               {selectedRegistration.chargerType}
                             </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Applied On</span>
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {new Date(selectedRegistration.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-10">
                        <DetailItem label="Email Address" value={selectedRegistration.email} />
                        <DetailItem label="Phone Number" value={selectedRegistration.phone || selectedRegistration.mobile} />
                        <div className="col-span-2">
                          <DetailItem label="Full Address" value={selectedRegistration.location?.address || selectedRegistration.address} />
                        </div>
                        <div className="col-span-2">
                           <DetailItem label="GPS Coordinates" value={`${selectedRegistration.location?.latitude || ''}, ${selectedRegistration.location?.longitude || ''}`} />
                        </div>
                      </div>

                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        Verification Documents
                      </h4>
                      <div className="grid gap-4">
                        {['addressProofUrl', 'aadharCardUrl', 'lightConnectionProofUrl'].map((docKey) => {
                          const url = selectedRegistration[docKey] || selectedRegistration.documents?.[docKey];
                          if(!url) return null;
                          return (
                            <div key={docKey} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 border border-neutral-100 dark:border-neutral-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center text-blue-500 shadow-sm text-xl"></div>
                                <div>
                                  <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase block">
                                    {docKey.replace('Url', '').replace(/([A-Z])/g, ' $1')}
                                  </span>
                                  <span className="text-[10px] font-medium text-neutral-400">PDF / Image File</span>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <a href={url} target="_blank" className="px-3 py-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40">Open</a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-6 bg-neutral-50 dark:bg-neutral-700 border-t border-neutral-200 dark:border-neutral-700 flex gap-4">
                       <button
                         onClick={() => approveHost(selectedRegistration._id)}
                         disabled={processingHost === selectedRegistration._id}
                         className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                       >
                         {processingHost === selectedRegistration._id ? 'Processing...' : 'Approve Application'}
                       </button>
                       <button
                         onClick={() => openRejectModal(selectedRegistration)}
                         disabled={processingHost === selectedRegistration._id}
                         className="px-8 py-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all disabled:opacity-50"
                       >
                         Reject
                       </button>
                    </div>
                  </>
                ) : (

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-neutral-50/50 dark:bg-neutral-800">
                    <div className="w-full h-full max-h-[400px] border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-3xl flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-white dark:bg-neutral-700 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <svg className="w-10 h-10 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No Request Selected</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                        Click on an applicant from the list on the left to view their details, documents, and verify their status.
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
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl bg-neutral-50/50 dark:bg-neutral-700/50">
                  <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">No admins found</p>
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
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-neutral-100 dark:border-neutral-700">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">Create Admin</h3>
               <button onClick={() => setShowAddAdminModal(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>

            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg">{error}</div>}

            <form onSubmit={addNewAdmin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full p-3 bg-neutral-100 dark:bg-neutral-700 border-none rounded-xl text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full p-3 bg-neutral-100 dark:bg-neutral-700 border-none rounded-xl text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@chargeloop.com"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Password</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full p-3 bg-neutral-100 dark:bg-neutral-700 border-none rounded-xl text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600">Cancel</button>
                <button type="submit" disabled={addingAdmin} className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {addingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showRejectModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm p-8 border border-neutral-100 dark:border-neutral-700">
            <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">Reject Application</h3>
            <p className="text-xs text-neutral-500 mb-6">This action cannot be undone. Please provide a reason.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-32 p-4 bg-neutral-100 dark:bg-neutral-700 border-none rounded-xl text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 mb-6 resize-none"
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} disabled={rejectingHost} className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50">Cancel</button>
              <button onClick={rejectHost} disabled={!rejectionReason.trim() || rejectingHost} className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {rejectingHost ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
