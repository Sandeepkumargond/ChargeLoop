'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StationsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Chargers</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Add and manage your charging stations</p>
          </div>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all">
            Add Charger
          </button>
        </div>

        {stations.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-8 text-center">
            <p className="text-blue-800 dark:text-blue-300 font-semibold mb-4">No charging stations yet</p>
            <p className="text-blue-700 dark:text-blue-400 text-sm mb-6">Add your first charging station to start hosting</p>
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all">
              Add Your First Charger
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stations.map(station => (
              <div key={station._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{station.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{station.location}</p>
                <div className="flex gap-3">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-sm">
                    Edit
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
