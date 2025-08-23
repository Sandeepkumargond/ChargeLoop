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

  // Predefined amounts for quick selection
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user profile data
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
          // Check if it's an HTML response (server not running)
          const contentType = profileResponse.headers.get('content-type');
          if (contentType?.includes('text/html')) {
            throw new Error('Backend server is not running. Please start the backend server first.');
          }
          throw new Error('Failed to fetch wallet data');
        }

        const userData = await profileResponse.json();
        setUser(userData);

        // Fetch transactions
        await fetchTransactions(token);

      } catch (error) {
        console.error('Error fetching wallet data:', error);
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
          
          // Calculate dynamic stats
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
          // If transactions endpoint doesn't exist, set empty array
          setTransactions([]);
          setStats({ totalRecharged: 0, totalSpent: 0, transactionCount: 0 });
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Don't throw error for transactions, just set empty state
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
          // If response is not JSON (like HTML error page), it means server is not running
          if (response.status === 404 || response.headers.get('content-type')?.includes('text/html')) {
            errorMessage = 'Backend server is not running. Please start the backend server first.';
          } else {
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Update user wallet balance with actual response
      setUser(prev => ({
        ...prev,
        walletBalance: result.newBalance
      }));

      // Add new transaction to the list
      const newTransaction = {
        id: Date.now(),
        type: 'credit',
        amount: parseFloat(rechargeAmount),
        description: `Wallet Recharge via ${selectedPaymentMethod.toUpperCase()}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => [newTransaction, ...prev]);

      // Update stats
      setStats(prev => ({
        totalRecharged: prev.totalRecharged + parseFloat(rechargeAmount),
        totalSpent: prev.totalSpent,
        transactionCount: prev.transactionCount + 1
      }));

      // Reset form
      setRechargeAmount('');
      alert(`Wallet recharged successfully! New balance: ₹${result.newBalance}`);

    } catch (error) {
      console.error('Error during recharge:', error);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center">
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
    <div className="min-h-screen text-black dark:text-white bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white text-center w-full">My Wallet</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Current Balance</h2>
              <div className="text-4xl font-bold mb-4">
                ₹{user?.walletBalance || 0}
              </div>
              <p className="text-blue-100">Available for charging sessions</p>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Recharged:</span>
                  <span className="font-semibold text-green-600">₹{stats.totalRecharged}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Spent:</span>
                  <span className="font-semibold text-red-600">₹{stats.totalSpent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Transactions:</span>
                  <span className="font-semibold text-blue-600">{stats.transactionCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recharge Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Recharge Wallet</h2>
              
              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-3">Quick Select Amount</label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="bg-gray-100 hover:bg-blue-100 text-gray-800 py-3 px-4 rounded-lg transition duration-200 font-medium"
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Form */}
              <form onSubmit={handleRecharge} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Custom Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Enter amount (Min: ₹10, Max: ₹50,000)"
                    min="10"
                    max="50000"
                    required
                  />
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-3">Payment Method</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition duration-200">
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="upi" 
                          checked={selectedPaymentMethod === 'upi'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3" 
                        />
                        <div>
                          <p className="font-medium">UPI</p>
                          <p className="text-sm text-gray-600">Google Pay, PhonePe, etc.</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition duration-200">
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="card" 
                          checked={selectedPaymentMethod === 'card'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3" 
                        />
                        <div>
                          <p className="font-medium">Debit/Credit Card</p>
                          <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition duration-200">
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="netbanking" 
                          checked={selectedPaymentMethod === 'netbanking'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3" 
                        />
                        <div>
                          <p className="font-medium">Net Banking</p>
                          <p className="text-sm text-gray-600">All major banks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={rechargeLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rechargeLoading ? 'Processing...' : `Recharge ₹${rechargeAmount || '0'}`}
                </button>
              </form>
            </div>

            {/* Transaction History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Recent Transactions</h2>
              
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">💳</div>
                  <p className="text-gray-600 dark:text-gray-300">No transactions yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id || transaction._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition duration-200">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{transaction.description}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
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
                      <div className={`font-semibold ${
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
