'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function HostRegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
    numberOfChargers: 1,
    chargerTypes: [],
    location: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    businessDescription: ''
  });

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const chargerTypeOptions = [
    { label: 'AC Level 1 (120V)', value: 'ac_level_1' },
    { label: 'AC Level 2 (240V)', value: 'ac_level_2' },
    { label: 'DC Fast Charging', value: 'dc_fast' },
    { label: 'Tesla Supercharger', value: 'tesla' },
    { label: 'CCS Type 1', value: 'ccs_type_1' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleChargerTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      chargerTypes: prev.chargerTypes.includes(type)
        ? prev.chargerTypes.filter(t => t !== type)
        : [...prev.chargerTypes, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!isLoggedIn && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.chargerTypes.length === 0) {
      setError('Please select at least one charger type');
      setLoading(false);
      return;
    }

    try {
      let token = localStorage.getItem('token');

      if (!isLoggedIn) {
        const signupResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          }),
        });

        if (!signupResponse.ok) {
          const errorData = await signupResponse.json();
          throw new Error(errorData.msg || 'Failed to create account');
        }

        const signupResult = await signupResponse.json();
        token = signupResult.token;
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userRole', 'user');
        window.dispatchEvent(new Event('authChange'));
      }

      const registrationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/request-host-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          phone: formData.phone,
          numberOfChargers: parseInt(formData.numberOfChargers),
          chargerTypes: formData.chargerTypes,
          location: formData.location,
          businessDescription: formData.businessDescription
        }),
      });

      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json();
        throw new Error(errorData.msg || 'Failed to submit registration');
      }

      setSuccess('✓ Registration submitted! Redirecting...');
      setTimeout(() => {
        router.push('/host?tab=registration-status');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2"> Become a Host</h1>
            <p className="text-orange-100">Register your charging station and start earning</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-300 font-semibold text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-300 font-semibold text-sm">{success}</p>
              </div>
            )}

            {!isLoggedIn && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📧 Create Account</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏢 Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Number of Chargers *</label>
                    <input
                      type="number"
                      name="numberOfChargers"
                      value={formData.numberOfChargers}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Charger Types *</label>
                  <div className="space-y-2">
                    {chargerTypeOptions.map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.chargerTypes.includes(option.value)}
                          onChange={() => handleChargerTypeChange(option.value)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📍 Location</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
                    <input
                      type="text"
                      name="location.state"
                      value={formData.location.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pincode</label>
                    <input
                      type="text"
                      name="location.pincode"
                      value={formData.location.pincode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4"> Additional Information</h2>
              <textarea
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleInputChange}
                rows="3"
                maxLength="1000"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Tell us about your business..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.businessDescription.length}/1000 characters
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                {loading ? 'Submitting...' : (isLoggedIn ? 'Submit Registration' : 'Create Account & Register')}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
