'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EarningsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsLoggedIn(true);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Earnings & Payouts</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Earnings</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">₹0</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All time</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">This Month</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">₹0</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Current period</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Available Balance</p>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">₹0</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Ready to withdraw</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Earning Transactions</h2>
          <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
        </div>
      </div>
    </div>
  );
}
