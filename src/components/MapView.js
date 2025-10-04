'use client';

import { useEffect, useState, useRef } from 'react';

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
  const [searchRadius, setSearchRadius] = useState('all'); // Default to show all chargers
  const searchInputRef = useRef();
  const lastAlertRef = useRef(null); // Track last alert to prevent spam
  const userMarkerRef = useRef(null); // Track user location marker
  const userCircleRef = useRef(null); // Track user location circle

  // Function to ensure user location markers are always visible
  const ensureUserLocationVisible = (map) => {
    if (userLocation && map && userMarkerRef.current && userCircleRef.current) {
      // Check if user markers are still on the map
      let userMarkerExists = false;
      let userCircleExists = false;
      
      map.eachLayer((layer) => {
        if (layer === userMarkerRef.current) userMarkerExists = true;
        if (layer === userCircleRef.current) userCircleExists = true;
      });
      
      // Re-add user markers if they were accidentally removed
      if (!userMarkerExists && userMarkerRef.current) {
        console.log("🔴 User marker was missing - restoring it!");
        userMarkerRef.current.addTo(map);
      }
      if (!userCircleExists && userCircleRef.current) {
        console.log("🔴 User circle was missing - restoring it!");
        userCircleRef.current.addTo(map);
      }
    }
  };

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

        // Get user location with enhanced detection methods
        let center = [25.5943, 85.1352]; // Default to current IP location (Patna, Bihar)
        let locationSource = 'default';
        let accuracy = 0;
        

        
        if (navigator.geolocation) {
          // Check permissions first
          let permissionStatus = 'unknown';
          try {
            if (navigator.permissions) {
              const permission = await navigator.permissions.query({name: 'geolocation'});
              permissionStatus = permission.state;

              
              if (permission.state === 'denied') {

                alert(' Location Permission Denied\n\nTo show your accurate location:\n1. Click the location icon in your browser address bar\n2. Select "Allow" for location access\n3. Refresh the page\n\nUsing IP-based location as fallback.');
              }
            }
          } catch (permError) {

          }
          
          // Enhanced GPS detection with multiple attempts
          let gpsSuccess = false;
          
          if (permissionStatus !== 'denied') {
            for (let attempt = 1; attempt <= 2 && !gpsSuccess; attempt++) {
              try {

                const position = await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      resolve(pos);
                    },
                    (err) => {

                      
                      // Provide specific error messages
                      if (err.code === 1) {
                      } else if (err.code === 2) {
                      } else if (err.code === 3) {
                      }
                      reject(err);
                    },
                    {
                      timeout: attempt === 1 ? 25000 : 15000, // Longer timeout for first attempt
                      enableHighAccuracy: true,
                      maximumAge: attempt === 1 ? 0 : 5000 // Very fresh location
                    }
                  );
                });
                
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const posAccuracy = position.coords.accuracy;
                
                // More lenient accuracy acceptance for Indian conditions
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && posAccuracy < 10000) {
                  center = [lat, lng];
                  setUserLocation(center);
                  locationSource = 'gps';
                  setLocationSource('gps');
                  accuracy = posAccuracy;
                  setLocationAccuracy(accuracy);
                  gpsSuccess = true;

                  
                  // Show success message for good accuracy
                  if (posAccuracy <= 100) {
                  } else if (posAccuracy <= 1000) {
                  } else {
                  }
                  break;
                } else {
                  if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                  }
                }
              } catch (gpsError) {
                if (attempt < 2) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              }
            }
          }
          
          // If GPS failed, try IP-based location immediately (more reliable than network geolocation)
          if (!gpsSuccess) {
            try {
              const ipResponse = await fetch('https://ipapi.co/json/');
              const ipData = await ipResponse.json();
              
              if (ipData.latitude && ipData.longitude) {
                const lat = parseFloat(ipData.latitude);
                const lng = parseFloat(ipData.longitude);
                
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                  center = [lat, lng];
                  setUserLocation(center);
                  locationSource = 'ip';
                  setLocationSource('ip');
                  accuracy = 5000; // IP location typically 5km accuracy
                  setLocationAccuracy(accuracy);
                } else {
                  throw new Error('Invalid IP coordinates');
                }
              } else {
                throw new Error('No coordinates in IP response');
              }
            } catch (ipError) {
              setUserLocation(center);
              setLocationSource('default');
              setLocationAccuracy(0);
            }
          }
        } else {
          // Try IP location as fallback
          try {
            const ipResponse = await fetch('https://ipapi.co/json/');
            const ipData = await ipResponse.json();
            if (ipData.latitude && ipData.longitude) {
              center = [parseFloat(ipData.latitude), parseFloat(ipData.longitude)];
              setUserLocation(center);
              locationSource = 'ip';
              setLocationSource('ip');
              accuracy = 5000;
              setLocationAccuracy(accuracy);
            }
          } catch (error) {
            setUserLocation(center);
            setLocationSource('default');
            setLocationAccuracy(0);
          }
        }

        // Create map
        map = window.L.map('map').setView(center, 13);
        setMapInstance(map);

        // Add tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add user marker with enhanced red icon for better visibility
        const userIcon = window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); position: relative; z-index: 1000;">
                   <div style="position: absolute; top: -8px; left: -8px; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.3); animation: pulse 2s infinite; z-index: 999;"></div>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const userMarker = window.L.marker(center, { 
          icon: userIcon,
          isUserLocation: true,
          permanent: true
        }).addTo(map);
        userMarkerRef.current = userMarker;
        console.log("✅ User location marker created and protected");
        
        // Add backup circle marker for better visibility
        const circleMarker = window.L.circleMarker(center, {
          radius: 12,
          fillColor: '#ef4444',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.8,
          zIndexOffset: 1000,
          isUserLocation: true,
          permanent: true
        }).addTo(map);
        userCircleRef.current = circleMarker;
        console.log("✅ User location circle created and protected");
        userMarker.bindPopup(`
          <div style="text-align: center; padding: 10px;">
            <strong> Your Location</strong><br>
            <small>Source: ${locationSource === 'gps' ? 'GPS' : locationSource === 'network' ? 'Network' : locationSource === 'ip' ? 'IP Location' : 'Default'}</small><br>
            ${accuracy > 0 ? `<small>Accuracy: ±${Math.round(accuracy)}m</small><br>` : ''}
            <button onclick="window.updateUserLocation()" style="margin-top: 8px; background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
               Get Precise Location
            </button>
          </div>
        `).openPopup();

        // Enhanced global function to update location
        window.updateUserLocation = async () => {
          try {
            // First try: High accuracy GPS with longer timeout
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  resolve(pos);
                },
                (err) => {
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
                <strong> Location Updated!</strong><br>
                <small>Source: GPS (High Precision)</small><br>
                <small>Accuracy: ±${Math.round(newAccuracy)}m</small><br>
                <small style="color: green;"> ${new Date().toLocaleTimeString()}</small><br>
                <button onclick="window.updateUserLocation()" style="margin-top: 8px; background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                  Update Again
                </button>
              </div>
            `).openPopup();
            
          } catch (error) {
            alert(`Failed to get precise location: ${error.message}\n\nTips:\n- Enable location services\n- Allow location access for this website\n- Try going outside for better GPS signal`);
          }
        };

        // Fetch and display available chargers - show all initially, then user can filter
        setSearchRadius('all'); // Set initial radius to 'all'
        await fetchAndDisplayChargers(map, center, 'all', false);

        setLoading(false);

      } catch (error) {
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

  // Function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Function to fetch chargers based on radius
  const fetchAndDisplayChargers = async (map, userCenter = userLocation, radiusOverride = null, showAlert = true) => {
    try {
      // Fetch all hosts from API
      const response = await fetch('/api/hosts/all');
      
      let allHosts = [];
      if (response.ok) {
        const data = await response.json();
        allHosts = data.hosts || [];
        console.log(`Fetched ${allHosts.length} total hosts from API`);
      } else {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      // Use radiusOverride if provided, otherwise use current searchRadius
      const currentRadius = radiusOverride !== null ? radiusOverride : searchRadius;
      console.log(`Filtering with radius: ${currentRadius}, User location:`, userCenter);
      
      // Filter hosts based on radius if user location is available
      let filteredHosts = allHosts;
      if (userCenter && currentRadius !== 'all') {
        const [userLat, userLng] = userCenter;
        console.log(`User location: [${userLat}, ${userLng}], Filtering for ${currentRadius}km`);
        
        filteredHosts = allHosts.filter((host, index) => {
          // Get host coordinates
          let hostLat, hostLng;
          if (Array.isArray(host.location.coordinates)) {
            hostLng = host.location.coordinates[0];
            hostLat = host.location.coordinates[1];
          } else if (host.location.coordinates && typeof host.location.coordinates === 'object') {
            hostLat = host.location.coordinates.lat;
            hostLng = host.location.coordinates.lng;
          } else {
            console.log(`Host ${index} has invalid coordinates:`, host.location);
            return false; // Skip hosts without valid coordinates
          }

          // Calculate distance
          const distance = calculateDistance(userLat, userLng, hostLat, hostLng);
          host.distance = distance; // Add distance to host object for display
          
          if (index < 3) { // Log first 3 hosts for debugging
            console.log(`Host ${index}: ${host.hostName} at [${hostLat}, ${hostLng}] - Distance: ${distance.toFixed(2)}km`);
          }
          
          return distance <= currentRadius;
        });
      } else {
        // If no user location or 'all' selected, show all hosts
        filteredHosts = allHosts.map(host => {
          host.distance = userCenter ? (() => {
            const [userLat, userLng] = userCenter;
            let hostLat, hostLng;
            if (Array.isArray(host.location.coordinates)) {
              hostLng = host.location.coordinates[0];
              hostLat = host.location.coordinates[1];
            } else if (host.location.coordinates && typeof host.location.coordinates === 'object') {
              hostLat = host.location.coordinates.lat;
              hostLng = host.location.coordinates.lng;
            } else {
              return 0;
            }
            return calculateDistance(userLat, userLng, hostLat, hostLng);
          })() : 0;
          return host;
        });
      }

      // Sort by distance
      if (userCenter) {
        filteredHosts.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      setAvailableChargers(filteredHosts);
      displayChargersOnMap(map, filteredHosts);
      
      // Always ensure user location markers remain visible
      ensureUserLocationVisible(map);
      
      console.log(`Total hosts received: ${allHosts.length}`);
      console.log(`Filtered to ${filteredHosts.length} hosts within ${currentRadius}km radius`);
      
      if (filteredHosts.length > 0) {
        console.log("Sample filtered hosts:", filteredHosts.slice(0, 3).map(h => ({
          name: h.hostName,
          distance: h.distance ? h.distance.toFixed(2) + 'km' : 'N/A'
        })));
      } else {
        console.log("No hosts found within radius - checking data...");
        console.log("First 3 total hosts:", allHosts.slice(0, 3).map(h => ({
          name: h.hostName,
          coordinates: h.location?.coordinates,
          address: h.address
        })));
      }
      
      // Show alert only if there's real data but no matches within radius
      if (showAlert && allHosts.length > 0 && filteredHosts.length === 0 && currentRadius !== 'all') {
        const alertKey = `${currentRadius}-${userCenter?.[0]}-${userCenter?.[1]}`;
        if (!lastAlertRef.current || 
            (Date.now() - lastAlertRef.current.time > 5000 || 
             lastAlertRef.current.key !== alertKey)) {
          
          lastAlertRef.current = { key: alertKey, time: Date.now() };
          setTimeout(() => {
            alert(`No charging stations found within ${currentRadius}km radius. Try increasing the search radius or use "All India".`);
          }, 500);
        }
      }
    } catch (error) {
      setAvailableChargers([]);
      displayChargersOnMap(map, []);
      alert(`Unable to load charging stations: ${error.message}`);
    }
  };

  // Display chargers on map
  const displayChargersOnMap = (map, chargers) => {
    // Clear existing charger markers but ALWAYS preserve user location markers
    map.eachLayer((layer) => {
      if (layer instanceof window.L.Marker && 
          layer !== userMarkerRef.current && 
          !layer.options.isUserLocation) {
        map.removeLayer(layer);
      }
      // Also preserve user circle markers
      if (layer instanceof window.L.CircleMarker && 
          layer !== userCircleRef.current && 
          !layer.options.isUserLocation) {
        map.removeLayer(layer);
      }
    });
    
    chargers.forEach((charger, index) => {
      
      let lat, lng;
      // Support both array and object format
      if (Array.isArray(charger.location.coordinates)) {
        // API returns [lng, lat] format, so we swap for Leaflet [lat, lng]
        lng = charger.location.coordinates[0];
        lat = charger.location.coordinates[1];
      } else if (charger.location.coordinates && typeof charger.location.coordinates === 'object') {
        lat = charger.location.coordinates.lat;
        lng = charger.location.coordinates.lng;
      } else {
        return; // skip if no valid coordinates
      }
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return;
      }
      

      const chargerIcon = window.L.divIcon({
        className: 'charger-marker',
        html: `<div style="background-color: ${charger.available ? '#10b981' : '#ef4444'}; width: 24px; height: 24px; border-radius: 6px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">C</div>`,
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
            <div>Location: ${charger.location.address}</div>
            <div>Type: ${charger.chargerType} - ${charger.powerOutput || 'N/A'}kW</div>
            <div>Price: ₹${charger.pricePerHour}/hour</div>
            <div>Rating: ${charger.rating?.average || 'N/A'}/5</div>
            ${charger.distance ? `<div>Distance: ${charger.distance}km away</div>` : ''}
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Amenities:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${(charger.amenities || []).map(amenity => `<span style=\"background: #e5e7eb; color: #374151; padding: 2px 6px; border-radius: 3px; font-size: 10px;\">${amenity}</span>`).join('')}
            </div>
          </div>
          ${charger.available ? `<button onclick=\"window.bookCharger('${charger._id}')\" style=\"width: 100%; background: #3b82f6; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: 500;\">Book Now</button>` : `<button disabled style=\"width: 100%; background: #9ca3af; color: white; border: none; padding: 8px; border-radius: 4px; cursor: not-allowed;\">Currently Occupied</button>`}
        </div>
      `);
    });
    // Booking handler
    window.bookCharger = (chargerId) => {
      const charger = chargers.find(c => c._id === chargerId);
      if (charger) {
        setSelectedCharger(charger);
        setBookingModal(true);
      }
    };
  };

  // Function to update search radius with auto-refresh
  const updateSearchRadius = async (newRadius) => {
    console.log(`Updating search radius to: ${newRadius}`);
    
    // Update state immediately for real-time feedback
    setSearchRadius(newRadius);
    
    // Clear existing charger markers but ALWAYS preserve user location markers
    if (mapInstance) {
      mapInstance.eachLayer((layer) => {
        // Multiple checks to ensure user location markers NEVER get removed
        if (layer instanceof window.L.Marker && 
            layer !== userMarkerRef.current && 
            !layer.options?.isUserLocation && 
            !layer.options?.permanent) {
          mapInstance.removeLayer(layer);
        } else if (layer instanceof window.L.Marker && layer === userMarkerRef.current) {
          console.log("🛡️ User location marker protected from removal");
        }
        // Also clear circle markers except user location circle with multiple protections
        if (layer instanceof window.L.CircleMarker && 
            layer !== userCircleRef.current && 
            !layer.options?.isUserLocation && 
            !layer.options?.permanent) {
          mapInstance.removeLayer(layer);
        }
      });
    }
    
    // Refresh with new radius - pass radius directly to avoid state timing issues
    if (mapInstance && userLocation) {
      await fetchAndDisplayChargers(mapInstance, userLocation, newRadius, true);
      // Ensure user location markers are still visible after refresh
      ensureUserLocationVisible(mapInstance);
    }
  };



  // Set map ready after component mounts
  useEffect(() => {
    setMapReady(true);
  }, []);

  // Address search handler using Nominatim
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    const query = searchInputRef.current.value.trim();
    if (!query) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const results = await response.json();
      if (results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        setUserLocation([lat, lon]);
        setLocationSource('search');
        setLocationAccuracy(0);
        if (mapInstance) {
          mapInstance.setView([lat, lon], 15);
        }
        // Fetch and display chargers for new location
        if (typeof window !== 'undefined' && mapInstance) {
          await fetchAndDisplayChargers(mapInstance, [lat, lon], null, false);
        }
      } else {
        alert('No results found for that address.');
      }
    } catch (error) {
      alert('Failed to search address. Please try again.');
    }
  };

  return (
    <div className="w-full relative">
      {/* Search Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
        {/* Address Search Bar */}
        <form onSubmit={handleAddressSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search address or city..."
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '300px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Search
          </button>
        </form>

        {/* Radius Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Search Radius:</span>
          {[5, 10, 25, 50, 100, 'all'].map((radius) => (
            <button
              key={radius}
              onClick={() => updateSearchRadius(radius)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: searchRadius === radius ? '#3b82f6' : 'white',
                color: searchRadius === radius ? 'white' : '#374151',
                fontSize: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: searchRadius === radius ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
            >
              {radius === 'all' ? 'All India' : `${radius}km`}
            </button>
          ))}
        </div>

        {/* Results Summary */}
        {!loading && availableChargers.length > 0 && (
          <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            Found {availableChargers.length} charging station{availableChargers.length !== 1 ? 's' : ''} 
            {searchRadius !== 'all' ? ` within ${searchRadius}km` : ' across India'}
          </div>
        )}
      </div>
      
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
                   Your location: {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                </p>
                <p className="text-xs text-blue-500">
                  Source: {locationSource === 'gps' ? ' GPS (High Accuracy)' : 
                           locationSource === 'network' ? ' Network (Approximate)' : 
                           locationSource === 'ip' ? ' IP Location (City Level)' :
                           ' Default Location'}
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
                  } else {
                  }
                }}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition duration-200"
              >
                 Get Precise Location
              </button>
            </div>
          </div>
          {(locationSource === 'default' || locationSource === 'ip' || locationAccuracy > 1000) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                {locationSource === 'default' ? 'Using default location.' : 
                     locationSource === 'ip' ? 'Using approximate IP-based location.' :
                     'Low accuracy location detected.'} 
                <br/>
                 Tips for better accuracy:
                <br/>• Click "Get Precise Location" to use GPS
                <br/>• Enable location services in your browser
                <br/>• Go outside for better GPS signal
                <br/>• Allow location access when prompted
              </p>
            </div>
          )}
          {locationSource === 'gps' && locationAccuracy <= 100 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs text-blue-600">Min Price/hr</div>
            </div>
          )}

          {/* Charger List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableChargers.map(charger => (
              <div key={charger._id} className={`p-3 border rounded-lg ${charger.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-600 text-sm">{charger.hostName}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${charger.available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {charger.available ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Location: {charger.location.address}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {charger.chargerType} • ₹{charger.pricePerHour}/hr • {charger.distance ? `${charger.distance}km away` : 'Distance unknown'}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-yellow-600">{typeof charger.rating === 'object' ? charger.rating.average : charger.rating}</span>
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
      newErrors.vehicleNumber = 'Please enter a valid vehicle number (e.g., BR01AB1234)';
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

      if (response.ok) {
        alert(`Booking Confirmed Successfully!

 Booking Details:
• Charger: ${charger.hostName}
• Vehicle: ${bookingDetails.vehicleNumber} (${bookingDetails.vehicleType})
• Duration: ${bookingDetails.duration} minutes
• Start Time: ${new Date(bookingDetails.startTime).toLocaleString()}
• Estimated Cost: ₹${estimatedCost}
• Reservation ID: ${responseData.reservationId}

 Your booking has been saved and you can view it in the Charging History page.
 You will receive a confirmation SMS shortly.`);
        
        onClose();
      } else {
        // Handle specific error messages
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        } else if (response.status === 400 && responseData.msg?.includes('Insufficient wallet balance')) {
          alert(` Booking Failed: Insufficient wallet balance.

Required Amount: ₹${estimatedCost}
Please add money to your wallet and try again.

Go to Wallet page to add funds.`);
        } else {
          alert(` Booking Failed: ${responseData.msg || responseData.error || 'Unknown error occurred'}

Please try again or contact support if the issue persists.`);
        }
      }
      
    } catch (error) {
      
      // Check if it's a network error
      if (error.message.includes('fetch')) {
        alert(` Network Error: Unable to connect to server.


Error: ${error.message}`);
      } else {
        alert(` Booking Error: ${error.message}

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
              <div><strong>Rating:</strong> {typeof charger.rating === 'object' ? charger.rating.average : charger.rating}/5</div>
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
                placeholder="e.g. BR-1AB1234"
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
