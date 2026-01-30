'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [stats, setStats] = useState({
    totalRecharged: 0,
    totalSpent: 0,
    transactionCount: 0
  });
  const router = useRouter();

  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }

          const contentType = profileResponse.headers.get('content-type');
          if (contentType?.includes('text/html')) {
            throw new Error('Backend server is not running. Please start the backend server first.');
          }
          throw new Error('Failed to fetch wallet data');
        }

        const userData = await profileResponse.json();
        setUser(userData);

        await fetchTransactions(token);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactions = async (token) => {
      try {
        setTransactionsLoading(true);

        const transactionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/transactions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData.transactions || []);

          const totalRecharged = transactionsData.transactions
            ?.filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0) || 0;

          const totalSpent = transactionsData.transactions
            ?.filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0) || 0;

          setStats({
            totalRecharged,
            totalSpent,
            transactionCount: transactionsData.transactions?.length || 0
          });
        } else {

          setTransactions([]);
          setStats({ totalRecharged: 0, totalSpent: 0, transactionCount: 0 });
        }
      } catch (error) {

        setTransactions([]);
        setStats({ totalRecharged: 0, totalSpent: 0, transactionCount: 0 });
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchWalletData();
  }, [router]);

  const handleRecharge = async (e) => {
    e.preventDefault();

    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(rechargeAmount) < 10) {
      alert('Minimum recharge amount is ₹10');
      return;
    }

    if (parseFloat(rechargeAmount) > 50000) {
      alert('Maximum recharge amount is ₹50,000');
      return;
    }

    setRechargeLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/recharge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(rechargeAmount),
          paymentMethod: selectedPaymentMethod
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Recharge failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorMessage;
        } catch (parseError) {

          if (response.status === 404 || response.headers.get('content-type')?.includes('text/html')) {
            errorMessage = 'Backend server is not running. Please start the backend server first.';
          } else {
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUser(prev => ({
        ...prev,
        walletBalance: result.newBalance
      }));

      const newTransaction = {
        id: Date.now(),
        type: 'credit',
        amount: parseFloat(rechargeAmount),
        description: `Wallet Recharge via ${selectedPaymentMethod.toUpperCase()}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => [newTransaction, ...prev]);

      setStats(prev => ({
        totalRecharged: prev.totalRecharged + parseFloat(rechargeAmount),
        totalSpent: prev.totalSpent,
        transactionCount: prev.transactionCount + 1
      }));

      setRechargeAmount('');
      alert(`Wallet recharged successfully! New balance: ₹${result.newBalance}`);

    } catch (error) {
      alert(`Recharge failed: ${error.message}`);
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleQuickAmount = (amount) => {
    setRechargeAmount(amount.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-lg">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-600 dark:text-neutral-300 mt-4">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-lg flex flex-col items-center">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mb-4"
          >
            ←
          </button>
          <p className="text-red-600 dark:text-red-400 mb-4 text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">My Wallet</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Manage your balance, transactions, and recharges</p>
            </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-neutral-200 dark:border-neutral-700 pb-8">
          <div className="md:col-span-1">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Current Balance</h2>
            <p className="text-4xl font-bold text-neutral-900 dark:text-white">₹{user?.walletBalance || 0}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Available for charging</p>
          </div>
          <div className="md:col-span-1">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Total Recharged</h2>
            <p className="text-4xl font-bold text-green-600">₹{stats.totalRecharged}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Lifetime recharges</p>
          </div>
          <div className="md:col-span-1">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Total Spent</h2>
            <p className="text-4xl font-bold text-red-600">₹{stats.totalSpent}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{stats.transactionCount} transactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-6 border border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Add Funds</h2>

              {}
              <div className="mb-6">
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Quick Select</p>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="bg-neutral-100 dark:bg-neutral-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-neutral-800 dark:text-white py-2 px-3 rounded text-sm font-medium transition"
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <form onSubmit={handleRecharge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white text-sm"
                    placeholder="Min: ₹10, Max: ₹50,000"
                    min="10"
                    max="50000"
                    required
                  />
                </div>

                {}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Payment Method</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['upi', 'card', 'netbanking'].map((method) => (
                      <label key={method} className={`border rounded-lg p-3 cursor-pointer transition ${ selectedPaymentMethod === method ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-neutral-300 dark:border-neutral-600' }`}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="payment"
                            value={method}
                            checked={selectedPaymentMethod === method}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="mr-2"
                          />
                          <div>
                            <p className="font-medium text-sm text-neutral-900 dark:text-white">{method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Net Banking'}</p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{method === 'upi' ? 'Google Pay, PhonePe' : method === 'card' ? 'Visa, Mastercard' : 'All banks'}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={rechargeLoading}
                  className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium text-sm disabled:opacity-50"
                >
                  {rechargeLoading ? 'Processing...' : `Recharge ₹${rechargeAmount || '0'}`}
                </button>
              </form>
            </div>

            {}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Recent Transactions</h2>

              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-600 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">Loading...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">No transactions yet</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id || transaction._id} className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0">
                      <div className="flex items-center flex-1">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{transaction.description}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {transaction.timestamp
                              ? new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : transaction.date
                            }
                          </p>
                        </div>
                      </div>
                      <div className={`font-semibold text-sm ml-2 ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
