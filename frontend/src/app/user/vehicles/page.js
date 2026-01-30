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
      alert('Error deleting vehicle');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 min-h-screen flex items-center justify-center">
        <div className="w-full flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded border border-neutral-200 dark:border-neutral-700">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-neutral-600 dark:text-neutral-300 mt-3 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

            {}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">My Vehicles</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage your vehicles</p>
            </div>

            {}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition"
              >
                Add New Vehicle
              </button>
            )}

            {}
            {showAddForm && (
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded border border-neutral-200 dark:border-neutral-700 mb-6">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Add New Vehicle</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      placeholder="e.g., MH02AB1234"
                      value={vehicleForm.vehicleNumber}
                      onChange={(e) => setVehicleForm({...vehicleForm, vehicleNumber: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Vehicle Type *</label>
                    <select
                      value={vehicleForm.vehicleType}
                      onChange={(e) => setVehicleForm({...vehicleForm, vehicleType: e.target.value})}
                      className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="truck">Truck</option>
                      <option value="bike">Bike</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Model</label>
                    <input
                      type="text"
                      placeholder="e.g., Tesla Model 3"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                      className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Battery Capacity (kWh)</label>
                    <input
                      type="number"
                      placeholder="e.g., 60"
                      value={vehicleForm.batteryCapacity}
                      onChange={(e) => setVehicleForm({...vehicleForm, batteryCapacity: e.target.value})}
                      className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddVehicle}
                    disabled={savingVehicle}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm font-medium transition disabled:opacity-50"
                  >
                    {savingVehicle ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="flex-1 bg-neutral-400 hover:bg-neutral-500 text-white py-1.5 rounded text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Your Vehicles ({vehicles.length})</h2>

              {vehicles.length === 0 ? (
                <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded border border-neutral-200 dark:border-neutral-700 text-center">
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">No vehicles added yet</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Add your first vehicle</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white">{vehicle.vehicleNumber}</h3>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                            {vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700 text-sm">
                        {vehicle.model && (
                          <div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400\">Model</p>
                            <p className="text-neutral-900 dark:text-white font-medium">{vehicle.model}</p>
                          </div>
                        )}
                        {vehicle.batteryCapacity && (
                          <div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">Battery</p>
                            <p className="text-neutral-900 dark:text-white font-medium">{vehicle.batteryCapacity} kWh</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteVehicle(vehicle._id)}
                        className="w-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 py-1.5 rounded text-xs font-medium transition"
                      >
                        Delete
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
