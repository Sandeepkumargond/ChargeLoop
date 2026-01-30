'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';

let L;

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB in bytes
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB for PDFs

export default function HostRegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showDenialInfo, setShowDenialInfo] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('none'); // none, pending, approved, rejected
  const [registrationDetails, setRegistrationDetails] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    latitude: '',
    longitude: '',
    addressProof: null,
    aadharCard: null,
    lightConnectionProof: null
  });

  const router = useRouter();

  // Fetch registration status
  const fetchRegistrationStatus = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/host-registration-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrationStatus(data.status);
        setRegistrationDetails(data.host);
        if (data.host?.rejectionReason) {
          setRejectionReason(data.host.rejectionReason);
        }
      }
    } catch (err) {
    }
  };

  // Load OpenStreetMap/Leaflet
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch registration status on page load
    fetchRegistrationStatus(token);

    // Check if coming from denied status
    const denialFlag = localStorage.getItem('fromDeniedStatus');
    if (denialFlag === 'true') {
      setShowDenialInfo(true);
      localStorage.removeItem('fromDeniedStatus');
      // Refresh status after a moment
      setTimeout(() => {
        fetchRegistrationStatus(token);
      }, 500);
    }

    // Refresh status every 10 seconds for live updates
    const interval = setInterval(() => {
      fetchRegistrationStatus(token);
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  // Initialize map after component mounts
  useEffect(() => {
    if (mounted && mapRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const initializeMap = async () => {
    try {
      // Import Leaflet only when needed
      if (!L) {
        L = (await import('leaflet')).default;
      }

      if (!mapRef.current) {
        setError('Map container not initialized');
        return;
      }

      // Check if map is already initialized
      if (mapRef.current._leaflet_id) {
        return;
      }

      // Clear any existing content
      mapRef.current.innerHTML = '';

      // Default coordinates (Delhi, India)
      const defaultLat = 28.6139;
      const defaultLng = 77.2090;

      // Create Leaflet map
      const map = L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 12,
        layers: []
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create custom icon with CDN URLs
      const customIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        shadowAnchor: [12, 41]
      });

      // Create draggable marker with custom icon
      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        title: 'Your charging station location',
        icon: customIcon
      }).addTo(map);

      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        const lat = position.lat;
        const lng = position.lng;
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        fetchAddressFromCoordinates(lat, lng);
      });

      // Handle map click
      map.on('click', (event) => {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        marker.setLatLng([lat, lng]);
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        fetchAddressFromCoordinates(lat, lng);
      });

      // Store map reference for later use
      mapRef.current._leafletMap = map;
      setError('');
      setMapLoaded(true);
    } catch (error) {
      setError('Error initializing map: ' + error.message);
    }
  };

  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          setFormData(prev => ({
            ...prev,
            address: data.display_name || 'Address not found'
          }));
        }
      }
    } catch (error) {
    }
  };

  const handleLocationSearch = async (value) => {
    if (!value || !markerRef.current) return;

    try {
      // Use OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const result = results[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);

          // Update marker position
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }

          // Update form data
          setFormData(prev => ({
            ...prev,
            address: result.display_name,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));

          // Center map on new location
          if (mapRef.current && mapRef.current._leafletMap) {
            mapRef.current._leafletMap.setView([lat, lng], 15);
          }
        }
      }
    } catch (error) {
    }
  };

  const debouncedLocationSearch = useRef(
    (() => {
      let timeout;
      return (value) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => handleLocationSearch(value), 500);
      };
    })()
  ).current;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'address') {
      debouncedLocationSearch(value);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (name === 'addressProof' && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError('Address proof must be PDF, JPG, or PNG');
        return;
      }
      if (name === 'aadharCard' && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError('Aadhar card must be PDF, JPG, or PNG');
        return;
      }
      if (name === 'lightConnectionProof' && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError('Light connection proof must be PDF, JPG, or PNG');
        return;
      }

      // Validate file size
      const isImage = file.type.startsWith('image/');
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
      
      if (file.size > maxSize) {
        const maxSizeMB = isImage ? '500KB' : '10MB';
        setError(`File size exceeds ${maxSizeMB} limit`);
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      setError(''); // Clear any previous errors
    }
  };

  const uploadToCloudinary = async (file, resourceType = 'auto') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('resource_type', resourceType);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload file to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      throw new Error('Failed to upload file: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    if (!formData.mobile.trim()) {
      setError('Please enter your mobile number');
      setLoading(false);
      return;
    }

    if (!formData.address.trim()) {
      setError('Please select an address from the map');
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please mark your location on the map');
      setLoading(false);
      return;
    }

    if (!formData.addressProof) {
      setError('Please upload address proof');
      setLoading(false);
      return;
    }

    if (!formData.aadharCard) {
      setError('Please upload Aadhar card');
      setLoading(false);
      return;
    }

    if (!formData.lightConnectionProof) {
      setError('Please upload light connection proof');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      setSuccess('Uploading files...');

      // Upload files to Cloudinary
      let addressProofUrl = '';
      let aadharCardUrl = '';
      let lightConnectionProofUrl = '';

      try {
        addressProofUrl = await uploadToCloudinary(formData.addressProof);
        aadharCardUrl = await uploadToCloudinary(formData.aadharCard);
        lightConnectionProofUrl = await uploadToCloudinary(formData.lightConnectionProof);
      } catch (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      setSuccess('Files uploaded! Submitting registration...');

      // Send URLs to backend instead of files
      const requestData = {
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        addressProofUrl: addressProofUrl,
        aadharCardUrl: aadharCardUrl,
        lightConnectionProofUrl: lightConnectionProofUrl
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/request-host-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to submit registration';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.msg || errorData.message || 'Failed to submit registration';
          } catch (e) {
            errorMessage = `Backend error (${response.status}): ${response.statusText}`;
          }
        } else {
          errorMessage = `Backend error (${response.status}): ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      
      setSuccess('Registration submitted successfully! Updating status...');
      
      // Fetch updated status after submission
      setTimeout(() => {
        const token = localStorage.getItem('token');
        fetchRegistrationStatus(token);
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // If approved, show configured charger section
  if (registrationStatus === 'approved' && registrationDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-950 dark:to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Success Status */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold mb-2">✅ Registration Approved!</h1>
              <p className="text-green-100">Your charging station is now registered. Configure it to start accepting bookings.</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Approved Status Card */}
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">✅</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                      Your registration has been approved!
                    </h2>
                    <p className="text-green-800 dark:text-green-300 text-sm">
                      Now configure your charging station details like charger type, pricing, and amenities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Registered Details */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Registered Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{registrationDetails.hostName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{registrationDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{registrationDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{registrationDetails.location?.address}</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">Next Steps</h3>
                <ul className="space-y-2 text-blue-800 dark:text-blue-300 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-xl">1️⃣</span>
                    <span>Configure your charger type (22kW, 50kW, etc.)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-xl">2️⃣</span>
                    <span>Set your pricing per hour</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-xl">3️⃣</span>
                    <span>Add amenities (WiFi, Cafe, Parking, etc.)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-xl">4️⃣</span>
                    <span>Set your availability hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-xl">5️⃣</span>
                    <span>Start accepting bookings!</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => router.push('/host?tab=charger-setup')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Configure Charger →
                </button>
                <button
                  onClick={() => router.push('/host')}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Register Your Charging Station</h1>
            <p className="text-orange-100">Complete your host registration with required documents</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-300 font-semibold">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-300 font-semibold">{success}</p>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Charging Station Location
              </h2>

              {/* Address Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Search & Select Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Type address or search on map"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  You can search here or click on the map to mark your location
                </p>
              </div>

              {/* Map */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Map Location *
                </label>
                <div
                  ref={mapRef}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-md"
                  style={{ height: '400px', minHeight: '400px', width: '100%' }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Click on map or drag marker to mark your charging station location
                </p>
              </div>

              {/* Coordinates Display */}
              {formData.latitude && formData.longitude && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Location marked at coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            {/* Document Upload Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Required Documents
              </h2>

              <div className="space-y-3">
                {/* Address Proof */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Proof *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="addressProof"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700"
                      required
                    />
                    {formData.addressProof && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        File: {formData.addressProof.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Aadhar Card */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aadhar Card Copy *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="aadharCard"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700"
                      required
                    />
                    {formData.aadharCard && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        File: {formData.aadharCard.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Light Connection Proof */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Light Connection Proof *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="lightConnectionProof"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700"
                      required
                    />
                    {formData.lightConnectionProof && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        File: {formData.lightConnectionProof.name}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  PDF, JPG, PNG (Max 10MB for PDF, 500KB for images)
                </p>
              </div>
            </div>

            {/* Note */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-semibold">Note:</span> You can bring your own charger to your charging station. Our team will verify your documents and location within 24-48 hours.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
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
