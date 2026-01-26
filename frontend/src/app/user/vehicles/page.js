'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VehiclesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: '',
    model: '',
    batteryCapacity: ''
  });
  const router = useRouter();

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
        setUser(userData);
        setVehicles(userData.vehicles || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const resetForm = () => {
    setVehicleForm({
      vehicleNumber: '',
      vehicleType: 'sedan',
      model: '',
      batteryCapacity: ''
    });
    setEditingId(null);
  };

  const handleAddVehicle = async () => {
    if (!vehicleForm.vehicleNumber || !vehicleForm.vehicleType) {
      alert('Please fill in vehicle number and type');
      return;
    }

    setSavingVehicle(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/vehicles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleForm)
      });

      if (response.ok) {
        const newVehicle = await response.json();
        setVehicles([...vehicles, newVehicle.vehicle]);
        resetForm();
        setShowAddForm(false);
        alert('Vehicle added successfully!');
      } else {
        alert('Failed to add vehicle');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Error adding vehicle');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setVehicles(vehicles.filter(v => v._id !== vehicleId));
        alert('Vehicle deleted successfully!');
      } else {
        alert('Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Error deleting vehicle');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="w-full flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 mt-4">Loading vehicles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Vehicles</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your electric vehicles for quick booking</p>
            </div>

            {/* Add Vehicle Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mb-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                + Add New Vehicle
              </button>
            )}

            {/* Add Vehicle Form */}
            {showAddForm && (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Vehicle</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle Number *</label>
                    <input
                      type="text"
                      placeholder="e.g., MH02AB1234"
                      value={vehicleForm.vehicleNumber}
                      onChange={(e) => setVehicleForm({...vehicleForm, vehicleNumber: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle Type *</label>
                    <select
                      value={vehicleForm.vehicleType}
                      onChange={(e) => setVehicleForm({...vehicleForm, vehicleType: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="truck">Truck</option>
                      <option value="bike">Bike</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Model</label>
                    <input
                      type="text"
                      placeholder="e.g., Tesla Model 3"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Battery Capacity (kWh)</label>
                    <input
                      type="number"
                      placeholder="e.g., 60"
                      value={vehicleForm.batteryCapacity}
                      onChange={(e) => setVehicleForm({...vehicleForm, batteryCapacity: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddVehicle}
                    disabled={savingVehicle}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {savingVehicle ? 'Saving...' : 'Save Vehicle'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Vehicles List */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Vehicles ({vehicles.length})</h2>
              
              {vehicles.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No vehicles added yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Add your first vehicle to quickly select it during booking</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{vehicle.vehicleNumber}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)}
                          </p>
                        </div>
                        <span className="text-3xl"></span>
                      </div>

                      <div className="space-y-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        {vehicle.model && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Model</p>
                            <p className="text-gray-900 dark:text-white font-semibold">{vehicle.model}</p>
                          </div>
                        )}
                        {vehicle.batteryCapacity && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Battery Capacity</p>
                            <p className="text-gray-900 dark:text-white font-semibold">{vehicle.batteryCapacity} kWh</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteVehicle(vehicle._id)}
                        className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 py-2 rounded-lg font-semibold transition"
                      >
                        Delete Vehicle
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
  );
}
