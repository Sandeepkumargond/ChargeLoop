'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BookingFormContext = createContext();

export const useBookingForm = () => useContext(BookingFormContext);

export const BookingFormProvider = ({ children, charger, userLocation, onClose }) => {
  const [bookingDetails, setBookingDetails] = useState({
    vehicleNumber: '',
    startTime: new Date().toISOString().slice(0, 16),
    vehicleType: 'car',
    model: '',
    batteryCapacity: '',
    userChargerPowerKw: 3.3, // NEW: User's portable charger power (kW)
    bookingDurationMinutes: 60 // NEW: Duration in minutes
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [chargerDetails, setChargerDetails] = useState(null);
  const [pricingBreakdown, setPricingBreakdown] = useState(null);

  useEffect(() => {
    const fetchSavedVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSavedVehicles([]);
          setLoadingVehicles(false);
          return;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setSavedVehicles(data.vehicles || []);
        }
      } catch (err) {
        // Handle error silently
      } finally {
        setLoadingVehicles(false);
      }
    };

    // Use charger data directly - it already has all the pricing info
    const setChargerDetailsFromProp = () => {
      if (charger) {
        setChargerDetails({
          chargerPowerKw: charger.chargerPowerKw || charger.socketMaxCapacity || 7.4,
          socketMaxCapacity: charger.socketMaxCapacity || 3.3,
          pricePerKwh: charger.pricePerKwh || charger.pricePerUnit || 0,
          pricePerUnit: charger.pricePerUnit || charger.pricePerKwh || 0,
          convenienceFee: charger.convenienceFee || 0,
          chargerType: charger.chargerType,
          hostName: charger.hostName,
          available: charger.available
        });
      }
    };

    fetchSavedVehicles();
    setChargerDetailsFromProp();
  }, [charger]);

  // NEW: Calculate pricing with the comprehensive workflow
  useEffect(() => {
    if (bookingDetails.userChargerPowerKw && bookingDetails.bookingDurationMinutes && chargerDetails) {
      calculateNewPricing();
    } else {
      setPricingBreakdown(null);
    }
  }, [bookingDetails.userChargerPowerKw, bookingDetails.bookingDurationMinutes, chargerDetails]);

  const calculateNewPricing = () => {
    // Use real data from chargerDetails (which now comes directly from charger object)
    const socketMaxCapacity = chargerDetails?.socketMaxCapacity || 3.3;
    const pricePerUnit = chargerDetails?.pricePerKwh || chargerDetails?.pricePerUnit || 0;
    const convenienceFee = chargerDetails?.convenienceFee || 0;
    const platformFee = 10;
    const userChargerPower = parseFloat(bookingDetails.userChargerPowerKw);
    const duration = parseInt(bookingDetails.bookingDurationMinutes);

    // STEP A: Safety Validation
    let safetyAlert = null;
    let safetyAlertMessage = null;
    let isSafeToBook = true;

    if (userChargerPower > socketMaxCapacity) {
      safetyAlert = 'charger_too_powerful';
      safetyAlertMessage = `⚠️ Safety Alert: Your charger (${userChargerPower}kW) is too powerful for this socket (${socketMaxCapacity}kW). Please select a different charger or socket.`;
      isSafeToBook = false;
    }

    // STEP B: Calculate total units (kWh)
    const durationHours = parseFloat((duration / 60).toFixed(2));
    const totalUnitsKwh = parseFloat((userChargerPower * durationHours).toFixed(2));

    // STEP C: Calculate final pricing
    const energyCost = parseFloat((totalUnitsKwh * pricePerUnit).toFixed(2));
    const estimatedRange = parseFloat((totalUnitsKwh * 7).toFixed(2)); // 7km per unit avg
    const totalBill = parseFloat((energyCost + convenienceFee + platformFee).toFixed(2));

    setPricingBreakdown({
      // Safety validation
      safetyAlert,
      safetyAlertMessage,
      isSafeToBook,

      // Inputs
      userChargerPowerKw: userChargerPower,
      socketMaxCapacityKw: socketMaxCapacity,
      bookingDurationMinutes: duration,
      bookingDurationHours: durationHours,

      // Calculated values
      totalUnitsKwh,
      pricePerUnit,
      energyCost,
      convenienceFee,
      platformFee,
      totalBill,
      estimatedRange
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleVehicleSelect = (vehicle) => {
    setBookingDetails(prev => ({
      ...prev,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType || 'car',
      model: vehicle.model || '',
      batteryCapacity: vehicle.batteryCapacity || ''
    }));
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!bookingDetails.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required';
    } else if (!/^[A-Z]{2}\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}$/i.test(bookingDetails.vehicleNumber.replace(/\s/g, ''))) {
      newErrors.vehicleNumber = 'Please enter a valid vehicle number (e.g., BR01AB1234)';
    }

    if (!bookingDetails.userChargerPowerKw || parseFloat(bookingDetails.userChargerPowerKw) <= 0) {
      newErrors.userChargerPowerKw = 'Please enter your charger power (kW)';
    }

    if (!bookingDetails.bookingDurationMinutes || parseInt(bookingDetails.bookingDurationMinutes) <= 0) {
      newErrors.bookingDurationMinutes = 'Please enter booking duration (minutes)';
    }

    if (new Date(bookingDetails.startTime) < new Date()) {
      newErrors.startTime = 'Start time cannot be in the past';
    }

    // NEW: Check safety alert
    if (pricingBreakdown && !pricingBreakdown.isSafeToBook) {
      newErrors.safety = pricingBreakdown.safetyAlertMessage;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [bookingDetails, pricingBreakdown]);

  const handleBooking = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        chargerId: charger._id,
        hostId: charger.hostId || charger._id,
        hostName: charger.hostName,
        hostLocation: charger.location.address,
        chargerType: charger.chargerType,
        scheduledTime: new Date(bookingDetails.startTime).toISOString(),
        // Vehicle details
        vehicleType: bookingDetails.vehicleType,
        vehicleNumber: bookingDetails.vehicleNumber,
        vehicleModel: bookingDetails.model,
        vehicleBatteryCapacity: bookingDetails.batteryCapacity ? parseFloat(bookingDetails.batteryCapacity) : null,
        // Charging details
        userChargerPowerKw: parseFloat(bookingDetails.userChargerPowerKw),
        bookingDurationMinutes: parseInt(bookingDetails.bookingDurationMinutes),
        metadata: {
          chargerId: charger._id,
          vehicleType: bookingDetails.vehicleType,
          vehicleNumber: bookingDetails.vehicleNumber,
          vehicleModel: bookingDetails.model,
          vehicleBatteryCapacity: bookingDetails.batteryCapacity,
          userChargerPowerKw: parseFloat(bookingDetails.userChargerPowerKw),
          bookingDurationMinutes: parseInt(bookingDetails.bookingDurationMinutes),
          userLocation: userLocation,
          amenities: charger.amenities,
          rating: charger.rating,
          distance: charger.distance,
          pricingApproach: 'New Workflow - Power + Duration Based'
        }
      };

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to book a charger');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/bookings/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const responseData = await response.json();

      if (response.ok) {
        const booking = responseData.booking;
        alert(`✅ Booking Request Sent!\n\nRequest ID: ${booking.requestId}\n\nYou will receive confirmation shortly.`);
        onClose();
      } else {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          alert(`Booking Failed: ${responseData.msg || responseData.error || 'Unknown error occurred'}\n\nPlease try again or contact support if the issue persists.`);
        }
      }
    } catch (error) {
      alert(`Booking Error: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    bookingDetails,
    setBookingDetails,
    loading,
    errors,
    setErrors,
    savedVehicles,
    loadingVehicles,
    chargerDetails,
    pricingBreakdown,
    handleInputChange,
    handleVehicleSelect,
    handleBooking,
    onClose,
    charger
  };

  return (
    <BookingFormContext.Provider value={value}>
      {children}
    </BookingFormContext.Provider>
  );
};
