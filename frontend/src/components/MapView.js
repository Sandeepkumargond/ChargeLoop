  'use client';

  import { useEffect, useState, useRef } from 'react';
  import { useRouter } from 'next/navigation';

  export default function MapView() {
    const router = useRouter();
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
          console.log("User marker was missing - restoring it!");
          userMarkerRef.current.addTo(map);
        }
        if (!userCircleExists && userCircleRef.current) {
          console.log("User circle was missing - restoring it!");
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
              /* Custom scrollbar styling */
              .charger-scroll::-webkit-scrollbar {
                width: 8px;
              }
              .charger-scroll::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 10px;
              }
              .charger-scroll::-webkit-scrollbar-thumb {
                background: #3b82f6;
                border-radius: 10px;
              }
              .charger-scroll::-webkit-scrollbar-thumb:hover {
                background: #2563eb;
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

          // Create map - Check if map container already has a map
          if (mapElement && mapElement._leaflet_map) {
            // Map already initialized, remove it first
            mapElement._leaflet_map.remove();
          }
          
          map = window.L.map('map').setView(center, 13);
          setMapInstance(map);

          // Add tiles with error handling
          const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            crossOrigin: 'anonymous',
            maxZoom: 19
          });
          
          tileLayer.on('tileerror', function(error) {
            console.warn('Tile loading error:', error);
          });
          
          tileLayer.addTo(map);

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
          console.log("User location marker created and protected");
          
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
          console.log("User location circle created and protected");
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
        try {
          if (map) {
            map.remove();
            map = null;
          }
          // Also try to clean up map instance from DOM element
          const mapElement = document.getElementById('map');
          if (mapElement && mapElement._leaflet_map) {
            mapElement._leaflet_map.remove();
            delete mapElement._leaflet_map;
          }
        } catch (error) {
          console.error('Error cleaning up map:', error);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/host/all`);
        
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
            console.log(" User location marker protected from removal");
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
      <div className="">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            
            {/* Back Button */}
            <div className="mb-3 sm:mb-2">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
            
            {/* Search Controls - Mobile and Desktop */}
            <div className="space-y-2 sm:space-y-3">
              {/* Address Search Bar */}
              <form onSubmit={handleAddressSearch} className="flex gap-2 sm:gap-3">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search address or city..."
                  className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                />
                <button 
                  type="submit" 
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg font-medium transition duration-200 text-sm sm:text-base"
                >
                  Search
                </button>
              </form>

              {/* Radius Filter - Responsive Grid */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Search Radius</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[5, 10, 25, 50, 100, 'all'].map((radius) => (
                    <button
                      key={radius}
                      onClick={() => updateSearchRadius(radius)}
                      disabled={loading}
                      className={`py-1.5 px-2 sm:px-2.5 rounded-lg text-xs font-medium transition duration-200 ${
                        searchRadius === radius 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {radius === 'all' ? 'All India' : `${radius}km`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Summary */}
              {!loading && availableChargers.length > 0 && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">{availableChargers.length}</span> charging station{availableChargers.length !== 1 ? 's' : ''} found
                  {searchRadius !== 'all' ? ` within ${searchRadius}km` : ' across India'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            {/* Map Container - Takes full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 order-2 lg:order-1 w-full h-full">
              <div 
                id="map" 
                className="w-full h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-xl shadow-lg overflow-hidden"
              ></div>
            </div>

            {/* Charger List Sidebar - Mobile bottom, desktop right */}
            <div className="lg:col-span-1 order-1 lg:order-2 w-full">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
                {/* Header with Location Info */}
                <div className="p-3.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 flex-shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    {/* Chargers Info */}
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white text-base">Available Chargers</h2>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{availableChargers.length} stations found</p>
                    </div>
                    
                    {/* Your Location Info - Compact Inline */}
                    {userLocation && (
                      <div className="text-right">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-xs mb-1">Your Location</h3>
                        <div className="space-y-0.5 text-xs">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Coordinates</p>
                            <p className="font-mono text-gray-800 dark:text-gray-200 text-xs">{userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
                          </div>
                          {locationAccuracy > 0 && (
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
                              <p className={`font-medium text-xs ${locationAccuracy <= 100 ? 'text-green-600 dark:text-green-400' : locationAccuracy <= 1000 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                ±{Math.round(locationAccuracy)}m
                              </p>
                            </div>
                          )}
                          <button 
                            onClick={() => {
                              if (mapInstance && window.updateUserLocation) {
                                window.updateUserLocation();
                              }
                            }}
                            className="w-full px-2 py-0.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs font-medium rounded transition mt-1"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Charger List - Scrollable */}
                <div className="flex-1 overflow-y-auto charger-scroll pr-2">
                  {availableChargers.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {availableChargers.map(charger => (
                        <div key={charger._id} className={`p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${charger.available ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{charger.hostName}</h3>
                              <div className="flex gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${charger.available ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                                  {charger.available ? 'Available' : 'Occupied'}
                                </span>
                                {charger.distance && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    {charger.distance}km
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mb-2.5">
                            <p className="line-clamp-2">{charger.location.address}</p>
                            <p className="font-medium text-gray-900 dark:text-white">₹{charger.pricePerHour}/hr • {charger.chargerType}</p>
                            <p className="flex items-center">{typeof charger.rating === 'object' ? charger.rating.average : charger.rating}/5</p>
                          </div>

                          <button 
                            onClick={() => {
                              if (charger.available) {
                                setSelectedCharger(charger);
                                setBookingModal(true);
                              }
                            }}
                            disabled={!charger.available}
                            className={`w-full py-1.5 px-3 text-xs font-medium rounded-lg transition ${
                              charger.available 
                                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white' 
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {charger.available ? 'Book Now' : 'Occupied'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No chargers found</p>
                      {!loading && <p className="text-xs mt-2">Try adjusting the search radius</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                <p className="text-gray-700 dark:text-gray-200 font-medium">Loading map...</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Getting your location</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-sm">
              <div className="text-center">
                <div className="text-4xl mb-3"></div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Unable to Load Map</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    setMapReady(false);
                    setTimeout(() => setMapReady(true), 100);
                  }} 
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {bookingModal && selectedCharger && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
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
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center border-b border-blue-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Book Charger</h2>
            <p className="text-blue-100 text-sm">{charger.hostName}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-blue-100 hover:text-white text-3xl font-light transition"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Charger Details */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Station Details</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Type</div>
                <div className="font-semibold text-gray-900">{charger.chargerType}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Power</div>
                <div className="font-semibold text-gray-900">{charger.powerOutput}kW</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Price</div>
                <div className="font-semibold text-blue-600">₹{charger.pricePerHour}/hr</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Rating</div>
                <div className="font-semibold text-yellow-600"> {typeof charger.rating === 'object' ? charger.rating.average : charger.rating}/5</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Address</div>
              <p className="text-sm text-gray-800 line-clamp-2">{charger.location.address}</p>
            </div>
            {charger.amenities && charger.amenities.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-600 uppercase font-semibold mb-2">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {charger.amenities.map((amenity, index) => (
                    <span key={index} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="space-y-4">
            {/* Vehicle Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., BR-1AB1234"
                value={bookingDetails.vehicleNumber}
                onChange={(e) => {
                  setBookingDetails({...bookingDetails, vehicleNumber: e.target.value.toUpperCase()});
                  if (errors.vehicleNumber) {
                    setErrors({...errors, vehicleNumber: ''});
                  }
                }}
                className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.vehicleNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'}`}
                required
              />
              {errors.vehicleNumber && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.vehicleNumber}</p>
              )}
            </div>

            {/* Vehicle Type and Charging Speed */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={bookingDetails.vehicleType}
                  onChange={(e) => setBookingDetails({...bookingDetails, vehicleType: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="car">Car</option>
                  <option value="bike">E-Bike</option>
                  <option value="scooter">E-Scooter</option>
                  <option value="bus">Bus</option>
                  <option value="truck">Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Charging Speed
                </label>
                <select
                  value={bookingDetails.chargingType}
                  onChange={(e) => setBookingDetails({...bookingDetails, chargingType: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="fast">Fast</option>
                  <option value="standard">Standard</option>
                  <option value="slow">Slow</option>
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Duration
              </label>
              <select
                value={bookingDetails.duration}
                onChange={(e) => setBookingDetails({...bookingDetails, duration: Number(e.target.value)})}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.startTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'}`}
                min={new Date().toISOString().slice(0, 16)}
              />
              {errors.startTime && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.startTime}</p>
              )}
            </div>

            {/* Cost Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4 rounded-xl">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-gray-700 font-semibold">Estimated Cost:</span>
                <span className="text-3xl font-bold text-green-600">₹{calculateCost()}</span>
              </div>
              <div className="text-sm text-gray-600">
                {bookingDetails.duration} min × ₹{charger.pricePerHour}/hr
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }