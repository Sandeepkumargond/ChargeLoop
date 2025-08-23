'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '../../../contexts/NotificationContext';

export default function HostRegistrationPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressValidation, setAddressValidation] = useState({ valid: null, message: '' });
  const [formData, setFormData] = useState({
    name: '',
    location: {
      address: '',
      coordinates: { lat: '', lng: '' },
      city: '',
      state: '',
      pincode: ''
    },
  chargerType: 'Regular Charging (22kW)',
    powerOutput: '',
    connectorTypes: [],
    pricePerUnit: '',
    amenities: [],
    operatingHours: {
      start: '09:00',
      end: '18:00',
      is24x7: false
    },
    images: []
  });
  const [userProfile, setUserProfile] = useState({ email: '', phone: '' });
  
  const router = useRouter();
  const { showError, showSuccess, showInfo } = useNotification();

  useEffect(() => {
    setMounted(true);
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please login to register as a host');
      router.push('/login');
    } else {
      // Fetch user profile for email/phone
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setUserProfile({ email: data.email || '', phone: data.phone || '' });
        })
        .catch(() => setUserProfile({ email: '', phone: '' }));
    }
  }, []);

  const amenityOptions = [
    'Parking', 'WiFi', 'Cafe', 'Restaurant', 'Security',
    '24/7 Available', 'CCTV', 'Washroom', 'Waiting Area', 'Food Court'
  ];

  const connectorOptions = [
    'Type 2', 'CCS', 'CHAdeMO', 'Bharat AC001', 'Bharat DC001'
  ];

  const chargerTypeOptions = [
  'Regular Charging (22kW)',
  'Fast Charging (50kW)',
  'Super Fast (100kW)',
  'Ultra Fast (150kW)',
  'Tesla Supercharger'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (arrayName, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: checked 
        ? [...prev[arrayName], value]
        : prev[arrayName].filter(item => item !== value)
    }));
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
            showInfo('Getting your current location...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                lat: latitude,
                lng: longitude
              }
            }
          }));

          // Reverse geocoding to get address
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                address: data.locality || data.city || 'Current Location',
                city: data.city || data.locality,
                state: data.principalSubdivision
              }
            }));
            
            showSuccess('Location detected successfully!');
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            showInfo('Location detected, please enter address manually');
          }
          
          setLocationLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
            showError('Failed to get location. Please enter manually.');
          setLocationLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
            showError('Geolocation is not supported by your browser');
      setLocationLoading(false);
    }
  };

  const validateAddress = async (address) => {
    if (!address || address.length < 10) {
      setAddressValidation({ valid: null, message: '' });
      return;
    }

    try {
      // Simple validation - check if address has basic components
      const hasStreet = /\d/.test(address);
      const hasArea = address.split(',').length >= 2;
      
      if (hasStreet && hasArea) {
        setAddressValidation({ valid: true, message: 'Address format looks good' });
      } else {
        setAddressValidation({ valid: false, message: 'Please provide a complete address with street number and area' });
      }
    } catch (error) {
      setAddressValidation({ valid: false, message: 'Unable to validate address' });
    }
  };

  const handleAddressChange = (e) => {
    const address = e.target.value;
    handleInputChange(e);
    
    // Debounce address validation
    setTimeout(() => {
      validateAddress(address);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Please login to register as a host');
        return;
      }

      // Validate required fields
      if (!formData.name || !formData.location.address || !formData.powerOutput || !formData.pricePerUnit) {
        showError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (addressValidation.valid === false) {
        showError('Please provide a valid address');
        setLoading(false);
        return;
      }

      // Prepare host registration payload
      // Validate coordinates
      const coords = formData.location.coordinates;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number' || isNaN(coords.lat) || isNaN(coords.lng)) {
        showError('Please provide a valid location with latitude and longitude.');
        setLoading(false);
        return;
      }

      const payload = {
        hostName: formData.name,
        email: userProfile.email,
        phone: userProfile.phone || formData.phone,
        address: formData.location.address,
        city: formData.location.city,
        state: formData.location.state,
        pincode: formData.location.pincode,
        coordinates: coords,
        chargerType: formData.chargerType,
        pricePerHour: formData.pricePerUnit,
        amenities: formData.amenities,
        description: '',
        availableFrom: formData.operatingHours.start,
        availableTo: formData.operatingHours.end,
        isActive: true // Ensure host is discoverable
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

  showSuccess('Host registration successful! You will receive a confirmation email shortly.');
      router.push('/host/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      showError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Register Your Charging Station</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Join our network and start earning from your EV charger</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Station Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Station Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  placeholder="Enter station name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Charger Type *
                </label>
                <select
                  name="chargerType"
                  value={formData.chargerType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  required
                >
                  {chargerTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Location Details</h3>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {locationLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Address *
                </label>
                <textarea
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleAddressChange}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                    addressValidation.valid === null 
                      ? 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                      : addressValidation.valid 
                        ? 'border-green-300 focus:ring-green-500 bg-green-50 dark:bg-green-900'
                        : 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900'
                  }`}
                  placeholder="Enter complete address including street, area, landmarks"
                  
                />
                {addressValidation.valid !== null && (
                  <div className={`mt-1 text-sm flex items-center ${addressValidation.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <span className="mr-1">
                      {addressValidation.valid ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    {addressValidation.message}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pincode</label>
                  <input
                    type="text"
                    name="location.pincode"
                    value={formData.location.pincode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Power Output (kW) *
                </label>
                <input
                  type="number"
                  name="powerOutput"
                  value={formData.powerOutput}
                  onChange={handleInputChange}
                  min="1"
                  max="350"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  placeholder="e.g., 22, 50, 150"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price per Unit (₹/kWh) *
                </label>
                <input
                  type="number"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleInputChange}
                  min="1"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  placeholder="e.g., 8.5, 12.0"
                  required
                />
              </div>
            </div>

            {/* Connector Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connector Types (Select all available)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {connectorOptions.map((connector) => (
                  <label key={connector} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.connectorTypes.includes(connector)}
                      onChange={(e) => handleArrayChange('connectorTypes', connector, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{connector}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenityOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={(e) => handleArrayChange('amenities', amenity, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Operating Hours</h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="operatingHours.is24x7"
                    checked={formData.operatingHours.is24x7}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available 24x7</span>
                </label>

                {!formData.operatingHours.is24x7 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Opening Time
                      </label>
                      <input
                        type="time"
                        name="operatingHours.start"
                        value={formData.operatingHours.start}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Closing Time
                      </label>
                      <input
                        type="time"
                        name="operatingHours.end"
                        value={formData.operatingHours.end}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Number - required if not in user profile */}
            {!userProfile.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || addressValidation.valid === false}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Registering...' : 'Register Station'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
