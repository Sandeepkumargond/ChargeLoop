'use client';

import { useEffect, useState } from 'react';

export default function MapView() {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [locationSource, setLocationSource] = useState('default');
  const [mapInstance, setMapInstance] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(0);
  const [availableChargers, setAvailableChargers] = useState([]);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [searchRadius, setSearchRadius] = useState(2); // 2km radius

  useEffect(() => {
    let map;
    
    const initMap = async () => {
      try {
        // Wait a moment for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if map container exists
        const mapElement = document.getElementById('map');
        if (!mapElement) {
          throw new Error('Map container not found in DOM');
        }

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Add custom CSS for marker animation and modal z-index
        if (!document.querySelector('#map-marker-styles')) {
          const style = document.createElement('style');
          style.id = 'map-marker-styles';
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
            .custom-div-icon {
              background: transparent !important;
              border: none !important;
            }
            .leaflet-container {
              z-index: 1 !important;
            }
            .leaflet-control-container {
              z-index: 2 !important;
            }
            .leaflet-popup {
              z-index: 3 !important;
            }
          `;
          document.head.appendChild(style);
        }

        // Load Leaflet JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
            setTimeout(reject, 5000);
          });
        }

        // Get user location with multiple fallback methods
        let center = [23.2599, 77.4126]; // Default to India
        let locationSource = 'default';
        let accuracy = 0;
        
        console.log('Starting location detection...');
        
        if (navigator.geolocation) {
          // Method 1: High accuracy GPS
          try {
            console.log('Trying high accuracy GPS...');
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  console.log('GPS success:', pos.coords);
                  console.log('Accuracy:', pos.coords.accuracy, 'meters');
                  resolve(pos);
                },
                (err) => {
                  console.log('GPS error:', err.message);
                  reject(err);
                },
                {
                  timeout: 15000,
                  enableHighAccuracy: true,
                  maximumAge: 0 // Always get fresh location
                }
              );
            });
            center = [position.coords.latitude, position.coords.longitude];
            setUserLocation(center);
            locationSource = 'gps';
            setLocationSource('gps');
            accuracy = position.coords.accuracy;
            setLocationAccuracy(accuracy);
            console.log('High accuracy GPS location found:', center, 'Accuracy:', accuracy + 'm');
          } catch (gpsError) {
            console.log('High accuracy GPS failed, trying network location...');
            
            // Method 2: Network-based location (less accurate but faster)
            try {
              const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    console.log('Network location success:', pos.coords);
                    console.log('Network accuracy:', pos.coords.accuracy, 'meters');
                    resolve(pos);
                  },
                  (err) => {
                    console.log('Network location error:', err.message);
                    reject(err);
                  },
                  {
                    timeout: 8000,
                    enableHighAccuracy: false,
                    maximumAge: 60000 // Allow 1 minute old location
                  }
                );
              });
              center = [position.coords.latitude, position.coords.longitude];
              setUserLocation(center);
              locationSource = 'network';
              setLocationSource('network');
              accuracy = position.coords.accuracy;
              setLocationAccuracy(accuracy);
              console.log('Network location found:', center, 'Accuracy:', accuracy + 'm');
            } catch (networkError) {
              console.log('Network location failed, trying IP-based location...');
              
              // Method 3: IP-based geolocation API
              try {
                const ipResponse = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city,country');
                const ipData = await ipResponse.json();
                if (ipData.status === 'success') {
                  center = [ipData.lat, ipData.lon];
                  setUserLocation(center);
                  locationSource = 'ip';
                  setLocationSource('ip');
                  accuracy = 10000; // IP location is typically 10km+ accuracy
                  setLocationAccuracy(accuracy);
                  console.log('IP-based location found:', center, 'City:', ipData.city, ipData.country);
                } else {
                  throw new Error('IP location failed');
                }
              } catch (ipError) {
                console.log('All location methods failed, using default location');
                setUserLocation(center);
                locationSource = 'default';
                setLocationSource('default');
              }
            }
          }
        } else {
          console.log('Geolocation not supported by browser');
          setUserLocation(center);
          setLocationSource('default');
        }

        // Create map
        map = window.L.map('map').setView(center, 13);
        setMapInstance(map);

        // Add tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add user marker with custom icon
        const userIcon = window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative;">
                   <div style="position: absolute; top: -5px; left: -5px; width: 30px; height: 30px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3); animation: pulse 2s infinite;"></div>
                 </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const userMarker = window.L.marker(center, { icon: userIcon }).addTo(map);
        userMarker.bindPopup(`
          <div style="text-align: center; padding: 10px;">
            <strong>📍 Your Location</strong><br>
            <small>Source: ${locationSource === 'gps' ? 'GPS' : locationSource === 'network' ? 'Network' : locationSource === 'ip' ? 'IP Location' : 'Default'}</small><br>
            ${accuracy > 0 ? `<small>Accuracy: ±${Math.round(accuracy)}m</small><br>` : ''}
            <button onclick="window.updateUserLocation()" style="margin-top: 8px; background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
              📍 Get Precise Location
            </button>
          </div>
        `).openPopup();

        // Enhanced global function to update location
        window.updateUserLocation = async () => {
          console.log('Manual location update requested...');
          try {
            // First try: High accuracy GPS with longer timeout
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  console.log('Manual GPS update success:', pos.coords);
                  resolve(pos);
                },
                (err) => {
                  console.log('Manual GPS update failed:', err.message);
                  reject(err);
                },
                {
                  timeout: 20000, // 20 second timeout for manual update
                  enableHighAccuracy: true,
                  maximumAge: 0 // Force completely fresh location
                }
              );
            });
            
            const newCenter = [position.coords.latitude, position.coords.longitude];
            const newAccuracy = position.coords.accuracy;
            
            setUserLocation(newCenter);
            setLocationSource('gps');
            setLocationAccuracy(newAccuracy);
            userMarker.setLatLng(newCenter);
            map.setView(newCenter, 16); // Zoom in more for updated location
            
            userMarker.bindPopup(`
              <div style="text-align: center; padding: 10px;">
                <strong>📍 Location Updated!</strong><br>
                <small>Source: GPS (High Precision)</small><br>
                <small>Accuracy: ±${Math.round(newAccuracy)}m</small><br>
                <small style="color: green;">✅ ${new Date().toLocaleTimeString()}</small><br>
                <button onclick="window.updateUserLocation()" style="margin-top: 8px; background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                  📍 Update Again
                </button>
              </div>
            `).openPopup();
            
            console.log('Location updated successfully:', newCenter, 'Accuracy:', newAccuracy + 'm');
          } catch (error) {
            console.error('Failed to update location:', error);
            alert(`Failed to get precise location: ${error.message}\n\nTips:\n- Enable location services\n- Allow location access for this website\n- Try going outside for better GPS signal`);
          }
        };

        // Fetch and display available chargers
        await fetchAndDisplayChargers(map, center);

        setLoading(false);
        console.log('Map loaded successfully');

      } catch (error) {
        console.error('Map loading error:', error);
        setError(error.message || 'Failed to load map');
        setLoading(false);
      }
    };

    // Only initialize once the component is mounted
    if (typeof window !== 'undefined' && mapReady) {
      initMap();
    }

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [mapReady]);

  // Function to fetch available chargers within radius
  const fetchAndDisplayChargers = async (map, userCenter) => {
    try {
      // First try to fetch from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/host/nearby?lat=${userCenter[0]}&lng=${userCenter[1]}&radius=${searchRadius}`);
      let chargersData = [];
      
      if (response.ok) {
        const data = await response.json();
        chargersData = data.hosts || [];
      } else {
        // Mock data for demonstration
        chargersData = generateMockChargers(userCenter);
      }
      
      setAvailableChargers(chargersData);
      displayChargersOnMap(map, chargersData);
    } catch (error) {
      console.error('Error fetching chargers:', error);
      // Use mock data as fallback
      const mockChargers = generateMockChargers(userCenter);
      setAvailableChargers(mockChargers);
      displayChargersOnMap(map, mockChargers);
    }
  };

  // Generate mock chargers for demonstration
  const generateMockChargers = (center) => {
    const chargers = [];
    const chargerTypes = ['Type 2 AC', 'CCS DC Fast', 'CHAdeMO', 'Type 1 AC'];
    const brands = ['Tesla Supercharger', 'ChargePoint', 'EVgo', 'Electrify America', 'Local Station'];
    
    for (let i = 0; i < 8; i++) {
      // Generate random locations within 2km radius
      const latOffset = (Math.random() - 0.5) * 0.036; // ~2km in lat
      const lngOffset = (Math.random() - 0.5) * 0.036; // ~2km in lng
      
      chargers.push({
        _id: `charger_${i}`,
        hostName: `${brands[Math.floor(Math.random() * brands.length)]} Station ${i + 1}`,
        location: {
          coordinates: [center[1] + lngOffset, center[0] + latOffset],
          address: `Station Address ${i + 1}, Local Area`
        },
        chargerType: chargerTypes[Math.floor(Math.random() * chargerTypes.length)],
        pricePerHour: 50 + Math.floor(Math.random() * 100),
        available: Math.random() > 0.3, // 70% availability
        powerOutput: [22, 50, 150, 350][Math.floor(Math.random() * 4)],
        amenities: ['WiFi', 'Parking', 'Restroom', 'Cafe'].slice(0, Math.floor(Math.random() * 4) + 1),
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        distance: (Math.random() * 2).toFixed(1)
      });
    }
    return chargers;
  };

  // Display chargers on map
  const displayChargersOnMap = (map, chargers) => {
    chargers.forEach(charger => {
      const lat = charger.location.coordinates[1];
      const lng = charger.location.coordinates[0];
      
      // Create custom charger icon based on availability and type
      const chargerIcon = window.L.divIcon({
        className: 'charger-marker',
        html: `
          <div style="
            background-color: ${charger.available ? '#10b981' : '#ef4444'}; 
            width: 24px; 
            height: 24px; 
            border-radius: 6px; 
            border: 2px solid white; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
          ">
            ⚡
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = window.L.marker([lat, lng], { icon: chargerIcon }).addTo(map);
      
      marker.bindPopup(`
        <div style="min-width: 250px; padding: 10px;">
          <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
            <div>
              <strong style="color: #1f2937; font-size: 14px;">${charger.hostName}</strong>
              <div style="background: ${charger.available ? '#10b981' : '#ef4444'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; margin-left: 8px;">
                ${charger.available ? 'AVAILABLE' : 'OCCUPIED'}
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 8px; font-size: 12px; color: #6b7280;">
            <div>📍 ${charger.location.address}</div>
            <div>⚡ ${charger.chargerType} - ${charger.powerOutput}kW</div>
            <div>💰 ₹${charger.pricePerHour}/hour</div>
            <div>📍 ${charger.distance}km away</div>
            <div>⭐ ${charger.rating} rating</div>
          </div>

          <div style="margin-bottom: 8px;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Amenities:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${charger.amenities.map(amenity => 
                `<span style="background: #e5e7eb; color: #374151; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${amenity}</span>`
              ).join('')}
            </div>
          </div>

          ${charger.available ? `
            <button onclick="window.bookCharger('${charger._id}')" 
                    style="width: 100%; background: #3b82f6; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">
              📱 Book Now
            </button>
          ` : `
            <button disabled style="width: 100%; background: #9ca3af; color: white; border: none; padding: 8px; border-radius: 4px; cursor: not-allowed;">
              ⏰ Currently Occupied
            </button>
          `}
        </div>
      `);
    });

    // Global function to handle booking
    window.bookCharger = (chargerId) => {
      const charger = chargers.find(c => c._id === chargerId);
      if (charger) {
        setSelectedCharger(charger);
        setBookingModal(true);
      }
    };
  };

  // Function to update charger search radius
  const updateSearchRadius = async (newRadius) => {
    setSearchRadius(newRadius);
    if (mapInstance && userLocation) {
      await fetchAndDisplayChargers(mapInstance, userLocation);
    }
  };

  // Set map ready after component mounts
  useEffect(() => {
    setMapReady(true);
  }, []);

  return (
    <div className="w-full relative">
      {/* Map container - always rendered */}
      <div 
        id="map" 
        className="w-full h-96 rounded-lg shadow-lg"
        style={{ minHeight: '400px' }}
      ></div>
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                setMapReady(false);
                setTimeout(() => setMapReady(true), 100);
              }} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Location info */}
      {userLocation && !loading && !error && (
        <div className="mt-4 space-y-2">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">
                  📍 Your location: {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                </p>
                <p className="text-xs text-blue-500">
                  Source: {locationSource === 'gps' ? '🛰️ GPS (High Accuracy)' : 
                           locationSource === 'network' ? '📶 Network (Approximate)' : 
                           locationSource === 'ip' ? '� IP Location (City Level)' :
                           '�🌍 Default Location'}
                </p>
                {locationAccuracy > 0 && (
                  <p className="text-xs text-blue-500">
                    Accuracy: ±{Math.round(locationAccuracy)}m {locationAccuracy > 1000 ? '(Low accuracy - try GPS update)' : locationAccuracy > 100 ? '(Medium accuracy)' : '(High accuracy)'}
                  </p>
                )}
              </div>
              <button 
                onClick={() => {
                  if (mapInstance && window.updateUserLocation) {
                    window.updateUserLocation();
                  }
                }}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition duration-200"
              >
                📍 Get Precise Location
              </button>
            </div>
          </div>
          {(locationSource === 'default' || locationSource === 'ip' || locationAccuracy > 1000) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⚠️ {locationSource === 'default' ? 'Using default location.' : 
                     locationSource === 'ip' ? 'Using approximate IP-based location.' :
                     'Low accuracy location detected.'} 
                <br/>
                💡 Tips for better accuracy:
                <br/>• Click "Get Precise Location" to use GPS
                <br/>• Enable location services in your browser
                <br/>• Go outside for better GPS signal
                <br/>• Allow location access when prompted
              </p>
            </div>
          )}
          {locationSource === 'gps' && locationAccuracy <= 100 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                ✅ High accuracy GPS location detected! Your location is precise within {Math.round(locationAccuracy)} meters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Charger Search Controls */}
      {userLocation && !loading && !error && (
        <div className="mt-4 p-4 text-black bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">⚡ Available Chargers</h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Search Radius:</label>
              <select 
                value={searchRadius} 
                onChange={(e) => updateSearchRadius(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={1}>1km</option>
                <option value={2}>2km</option>
                <option value={5}>5km</option>
                <option value={10}>10km</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            Found {availableChargers.length} chargers • {availableChargers.filter(c => c.available).length} available
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{availableChargers.filter(c => c.available).length}</div>
              <div className="text-xs text-green-600">Available</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">{availableChargers.filter(c => !c.available).length}</div>
              <div className="text-xs text-red-600">Occupied</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                ₹{availableChargers.length > 0 ? Math.min(...availableChargers.map(c => c.pricePerHour)) : 0}
              </div>
              <div className="text-xs text-blue-600">Min Price/hr</div>
            </div>
          </div>

          {/* Charger List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableChargers.map(charger => (
              <div key={charger._id} className={`p-3 border rounded-lg ${charger.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{charger.hostName}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${charger.available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {charger.available ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ⚡ {charger.chargerType} • {charger.powerOutput}kW • ₹{charger.pricePerHour}/hr • {charger.distance}km
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-yellow-600">⭐ {charger.rating}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (charger.available) {
                        setSelectedCharger(charger);
                        setBookingModal(true);
                      }
                    }}
                    disabled={!charger.available}
                    className={`px-3 py-1 text-xs rounded ${
                      charger.available 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {charger.available ? 'Book' : 'Occupied'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingModal && selectedCharger && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <BookingModal 
            charger={selectedCharger}
            onClose={() => {
              setBookingModal(false);
              setSelectedCharger(null);
            }}
            userLocation={userLocation}
          />
        </div>
      )}
    </div>
  );
}

// Booking Modal Component
function BookingModal({ charger, onClose, userLocation }) {
  const [bookingDetails, setBookingDetails] = useState({
    vehicleNumber: '',
    duration: 60,
    startTime: new Date().toISOString().slice(0, 16),
    vehicleType: 'car',
    chargingType: 'fast'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!bookingDetails.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required';
    } else if (!/^[A-Z]{2}\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}$/i.test(bookingDetails.vehicleNumber.replace(/\s/g, ''))) {
      newErrors.vehicleNumber = 'Please enter a valid vehicle number (e.g., MH 01 AB 1234)';
    }
    
    if (new Date(bookingDetails.startTime) < new Date()) {
      newErrors.startTime = 'Start time cannot be in the past';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBooking = async () => {
    // Validate form first
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // Calculate estimated cost
      const hours = bookingDetails.duration / 60;
      const estimatedCost = Math.round(hours * charger.pricePerHour);
      
      // Prepare booking data to match backend ChargingSession model
      const bookingData = {
        hostId: charger._id,
        hostName: charger.hostName,
        hostLocation: charger.location.address,
        chargerType: charger.chargerType,
        scheduledTime: new Date(bookingDetails.startTime).toISOString(),
        estimatedDuration: bookingDetails.duration,
        estimatedCost: estimatedCost,
        vehicleType: bookingDetails.vehicleType,
        powerOutput: charger.powerOutput,
        pricePerKwh: charger.pricePerHour / charger.powerOutput, // Convert price per hour to price per kWh
        vehicleNumber: bookingDetails.vehicleNumber,
        chargingType: bookingDetails.chargingType,
        metadata: {
          chargerId: charger._id,
          powerOutput: charger.powerOutput,
          vehicleType: bookingDetails.vehicleType,
          vehicleNumber: bookingDetails.vehicleNumber,
          chargingType: bookingDetails.chargingType,
          userLocation: userLocation,
          amenities: charger.amenities,
          rating: charger.rating,
          distance: charger.distance
        }
      };

      console.log('Sending booking data:', bookingData);

      // Send to backend
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to book a charger');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charging/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const responseData = await response.json();
      console.log('Booking response:', responseData);

      if (response.ok) {
        alert(`🎉 Booking Confirmed Successfully!

📋 Booking Details:
• Charger: ${charger.hostName}
• Vehicle: ${bookingDetails.vehicleNumber} (${bookingDetails.vehicleType})
• Duration: ${bookingDetails.duration} minutes
• Start Time: ${new Date(bookingDetails.startTime).toLocaleString()}
• Estimated Cost: ₹${estimatedCost}
• Reservation ID: ${responseData.reservationId}

✅ Your booking has been saved and you can view it in the Charging History page.
📱 You will receive a confirmation SMS shortly.`);
        
        onClose();
      } else {
        // Handle specific error messages
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        } else if (response.status === 400 && responseData.msg?.includes('Insufficient wallet balance')) {
          alert(`❌ Booking Failed: Insufficient wallet balance.

Required Amount: ₹${estimatedCost}
Please add money to your wallet and try again.

Go to Wallet page to add funds.`);
        } else {
          alert(`❌ Booking Failed: ${responseData.msg || responseData.error || 'Unknown error occurred'}

Please try again or contact support if the issue persists.`);
        }
      }
      
    } catch (error) {
      console.error('Booking error:', error);
      
      // Check if it's a network error
      if (error.message.includes('fetch')) {
        alert(`❌ Network Error: Unable to connect to server.


Error: ${error.message}`);
      } else {
        alert(`❌ Booking Error: ${error.message}

Please try again or contact support if the issue persists.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    const hours = bookingDetails.duration / 60;
    return Math.round(hours * charger.pricePerHour);
  };

  return (
    <div className="bg-white text-black rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
      <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Book Charger</h2>
              <p className="text-sm text-gray-600">{charger.hostName}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Charger Details */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Type:</strong> {charger.chargerType}</div>
              <div><strong>Power:</strong> {charger.powerOutput}kW</div>
              <div><strong>Price:</strong> ₹{charger.pricePerHour}/hour</div>
              <div><strong>Rating:</strong> ⭐ {charger.rating}</div>
            </div>
            <div className="mt-2 text-sm">
              <strong>Address:</strong> {charger.location.address}
            </div>
            <div className="mt-2">
              <strong className="text-sm">Amenities:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {charger.amenities.map((amenity, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Number *
              </label>
              <input
                type="text"
                placeholder="e.g. MH 01 AB 1234"
                value={bookingDetails.vehicleNumber}
                onChange={(e) => {
                  setBookingDetails({...bookingDetails, vehicleNumber: e.target.value.toUpperCase()});
                  if (errors.vehicleNumber) {
                    setErrors({...errors, vehicleNumber: ''});
                  }
                }}
                className={`w-full p-2 border rounded-md text-sm ${errors.vehicleNumber ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.vehicleNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.vehicleNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={bookingDetails.vehicleType}
                  onChange={(e) => setBookingDetails({...bookingDetails, vehicleType: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="car">Car</option>
                  <option value="bike">Electric Bike</option>
                  <option value="scooter">Electric Scooter</option>
                  <option value="bus">Electric Bus</option>
                  <option value="truck">Electric Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charging Speed
                </label>
                <select
                  value={bookingDetails.chargingType}
                  onChange={(e) => setBookingDetails({...bookingDetails, chargingType: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="fast">Fast Charging</option>
                  <option value="standard">Standard Charging</option>
                  <option value="slow">Slow Charging</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                value={bookingDetails.duration}
                onChange={(e) => setBookingDetails({...bookingDetails, duration: Number(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={bookingDetails.startTime}
                onChange={(e) => {
                  setBookingDetails({...bookingDetails, startTime: e.target.value});
                  if (errors.startTime) {
                    setErrors({...errors, startTime: ''});
                  }
                }}
                className={`w-full p-2 border rounded-md text-sm ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`}
                min={new Date().toISOString().slice(0, 16)}
              />
              {errors.startTime && (
                <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
              )}
            </div>

            {/* Cost Summary */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Estimated Cost:</span>
                <span className="text-xl font-bold text-green-600">₹{calculateCost()}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {bookingDetails.duration} minutes × ₹{charger.pricePerHour}/hour
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
