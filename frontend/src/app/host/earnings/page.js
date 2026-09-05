'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingCard from '@/components/LoadingCard';

export default function EarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    availableBalance: 0,
    totalPaidOut: 0,
    totalSessions: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payoutMethod: 'upi',
    upiId: '',
    bankDetails: { accountNumber: '', ifsc: '', accountHolderName: '' }
  });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState(null);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/host/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching host earnings:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutMessage(null);

    const amountNum = parseFloat(payoutForm.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount');
      setPayoutLoading(false);
      return;
    }

    if (amountNum > stats.availableBalance) {
      alert(`Requested amount exceeds available balance of ₹${stats.availableBalance}`);
      setPayoutLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/host/payout-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum,
          payoutMethod: payoutForm.payoutMethod,
          upiId: payoutForm.upiId,
          bankDetails: payoutForm.bankDetails
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPayoutMessage({ type: 'success', text: data.msg });
        setPayoutForm({
          amount: '',
          payoutMethod: 'upi',
          upiId: '',
          bankDetails: { accountNumber: '', ifsc: '', accountHolderName: '' }
        });
        fetchEarnings();
        setTimeout(() => setIsPayoutModalOpen(false), 2000);
      } else {
        setPayoutMessage({ type: 'error', text: data.msg || 'Payout failed' });
      }
    } catch (err) {
      setPayoutMessage({ type: 'error', text: err.message || 'Error requesting payout' });
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <LoadingCard variant="table" title="Loading host earnings..." />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Earnings & Payouts</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Live earnings from your hosted charging stations
            </p>
          </div>
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            disabled={stats.availableBalance <= 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition shadow-sm flex items-center gap-2"
          >
            <span>💸</span> Request Payout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700/70 p-6">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Total Earnings</p>
            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">₹{stats.totalEarnings.toLocaleString('en-IN')}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">All time platform income</p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700/70 p-6">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">This Month</p>
            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">₹{stats.thisMonth.toLocaleString('en-IN')}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Current billing month</p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700/70 p-6">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Available Balance</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{stats.availableBalance.toLocaleString('en-IN')}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Ready for withdrawal</p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700/70 p-6">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Sessions Completed</p>
            <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{stats.totalSessions}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Total successful charges</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700/70 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700/70 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Earnings History</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Transactions credited from completed charging bookings</p>
            </div>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {transactions.length} Records
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ⚡
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">No Earnings Yet</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
                When users book your charger and complete charging sessions, your earnings will automatically be credited here.
              </p>
              <button
                onClick={() => router.push('/host/bookings')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition"
              >
                View Incoming Bookings
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 dark:bg-neutral-700/60 font-semibold text-neutral-700 dark:text-neutral-300">
                  <tr>
                    <th className="px-6 py-3.5">Customer & Vehicle</th>
                    <th className="px-6 py-3.5">Energy (kWh)</th>
                    <th className="px-6 py-3.5">Total Paid</th>
                    <th className="px-6 py-3.5">Your Share</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700/60 text-neutral-800 dark:text-neutral-200">
                  {transactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-900 dark:text-white">{txn.customerName}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {txn.vehicleNumber} {txn.vehicleModel && `• ${txn.vehicleModel}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {txn.energyKwh} kWh
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-600 dark:text-neutral-400">
                        ₹{txn.totalBill}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        +₹{txn.hostEarning}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        {new Date(txn.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Credited
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payout Withdrawal Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Withdraw Earnings</h3>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            {payoutMessage && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${
                payoutMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
              }`}>
                {payoutMessage.text}
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                <span className="text-xs text-neutral-500">Available Balance:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">₹{stats.availableBalance.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={stats.availableBalance}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={`Max ₹${stats.availableBalance}`}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Payout Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutForm(prev => ({ ...prev, payoutMethod: 'upi' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                      payoutForm.payoutMethod === 'upi'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutForm(prev => ({ ...prev, payoutMethod: 'bank' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                      payoutForm.payoutMethod === 'bank'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              {payoutForm.payoutMethod === 'upi' ? (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutForm.upiId}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="e.g., yourname@okaxis"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Account Holder Name"
                    value={payoutForm.bankDetails.accountHolderName}
                    onChange={(e) => setPayoutForm(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Bank Account Number"
                    value={payoutForm.bankDetails.accountNumber}
                    onChange={(e) => setPayoutForm(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="IFSC Code"
                    value={payoutForm.bankDetails.ifsc}
                    onChange={(e) => setPayoutForm(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, ifsc: e.target.value.toUpperCase() }
                    }))}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading || stats.availableBalance <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow"
                >
                  {payoutLoading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
