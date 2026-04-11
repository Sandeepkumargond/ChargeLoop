/**
 * ChargeLoop Complete Pricing & Safety Service
 * 
 * New Workflow:
 * 1. Safety Validation: Check if user charger power exceeds host socket capacity
 * 2. Power Consumption: Calculate total units (kWh) = User_Charger_kW × Duration_Hours
 * 3. Final Price: Energy_Cost + Convenience_Fee + Platform_Fee
 * 4. Estimated Range: Total_Units × 7km (avg EV efficiency)
 */

const PLATFORM_FEE = 10; // ₹10 default platform fee
const KM_PER_UNIT = 7; // Average 1 kWh = 7km for EVs

/**
 * Get efficiency based on charger type
 * @param {string} chargerType - 'AC' or 'DC'
 * @returns {number} efficiency value between 0.5-1.0
 */
function getDefaultEfficiency(chargerType) {
  const efficiencyMap = {
    'AC': 0.87,    // 0.85-0.90 average
    'DC': 0.92,    // 0.90-0.95 average
    'Both': 0.87   // Default to AC
  };
  return efficiencyMap[chargerType] || 0.87;
}

/**
 * STEP A: Safety Validation
 * Check if user's charger power exceeds host socket capacity
 * 
 * @param {number} userChargerPowerKw - User's portable charger power (kW)
 * @param {number} socketMaxCapacityKw - Host socket max capacity (kW)
 * @returns {object} { isSafe: boolean, alert: string|null, message: string|null }
 */
function validateSafety(userChargerPowerKw, socketMaxCapacityKw) {
  if (userChargerPowerKw > socketMaxCapacityKw) {
    return {
      isSafe: false,
      alert: 'charger_too_powerful',
      message: `Safety Alert: Your charger (${userChargerPowerKw}kW) is too powerful for this socket (${socketMaxCapacityKw}kW). Please select a different charger or socket.`
    };
  }
  return {
    isSafe: true,
    alert: null,
    message: null
  };
}

/**
 * STEP B: Calculate total power consumption in kWh
 * Formula: Total_Units_kWh = User_Charger_kW × Booking_Duration_Hours
 * 
 * @param {number} userChargerPowerKw - User's charger power (kW)
 * @param {number} bookingDurationMinutes - Booking duration in minutes
 * @returns {number} Total units in kWh
 */
function calculateTotalUnits(userChargerPowerKw, bookingDurationMinutes) {
  const durationHours = bookingDurationMinutes / 60;
  return parseFloat((userChargerPowerKw * durationHours).toFixed(2));
}

/**
 * Calculate energy cost
 * Formula: Energy_Cost = Total_Units_kWh × Host_Price_Per_Unit
 * 
 * @param {number} totalUnitsKwh - Total units in kWh
 * @param {number} pricePerUnit - Host price per kWh (₹)
 * @returns {number} Energy cost in ₹
 */
function calculateEnergyCost(totalUnitsKwh, pricePerUnit) {
  return parseFloat((totalUnitsKwh * pricePerUnit).toFixed(2));
}

/**
 * Calculate estimated range
 * Formula: Estimated_Range = Total_Units_kWh × 7 (avg EV 1 unit = 7km)
 * 
 * @param {number} totalUnitsKwh - Total units in kWh
 * @returns {number} Estimated range in km
 */
function calculateEstimatedRange(totalUnitsKwh) {
  return parseFloat((totalUnitsKwh * KM_PER_UNIT).toFixed(2));
}

/**
 * STEP C: Calculate final price with all components
 * Formula: Total_Bill = Energy_Cost + Convenience_Fee + Platform_Fee
 * 
 * @param {number} energyCost - Energy cost in ₹
 * @param {number} convenienceFee - Host convenience fee in ₹ (optional)
 * @param {number} platformFee - ChargeLoop platform fee in ₹
 * @returns {number} Final total bill in ₹
 */
function calculateTotalBill(energyCost, convenienceFee = 0, platformFee = PLATFORM_FEE) {
  return parseFloat((energyCost + convenienceFee + platformFee).toFixed(2));
}

/**
 * Calculate maximum deliverable energy (for legacy Approach A compatibility)
 * @param {number} chargerPowerKw - Charger power in kW
 * @param {number} bookingDurationMinutes - Booking duration in minutes
 * @param {number} efficiency - Charger efficiency (0.5-1.0)
 * @returns {number} Maximum energy in kWh
 */
function calculateMaxEnergy(chargerPowerKw, bookingDurationMinutes, efficiency) {
  const durationHours = bookingDurationMinutes / 60;
  return parseFloat((chargerPowerKw * durationHours * efficiency).toFixed(2));
}

/**
 * Calculate actual energy delivered (legacy)
 * @param {number} requiredEnergy - User's required energy in kWh
 * @param {number} maxEnergy - Maximum deliverable energy in kWh
 * @returns {number} Actual energy delivered in kWh
 */
function calculateEnergyDelivered(requiredEnergy, maxEnergy) {
  return Math.min(requiredEnergy, maxEnergy);
}

/**
 * Calculate total cost (legacy)
 * @param {number} energyDelivered - Energy delivered in kWh
 * @param {number} pricePerKwh - Price per kWh in ₹
 * @returns {number} Total cost in ₹
 */
function calculateTotalCost(energyDelivered, pricePerKwh) {
  return parseFloat((energyDelivered * pricePerKwh).toFixed(2));
}

/**
 * Complete new pricing calculation with safety validation
 * NEW WORKFLOW VERSION:
 * 
 * @param {object} params
 *   - userChargerPowerKw: User's charger power (kW) - REQUIRED
 *   - socketMaxCapacityKw: Host socket capacity (kW) - REQUIRED
 *   - bookingDurationMinutes: Duration in minutes - REQUIRED
 *   - pricePerKwh: Price per kWh (₹) - REQUIRED
 *   - convenienceFee: Optional convenience fee (₹)
 *   - platformFee: Optional platform fee (₹, default 10)
 *   - chargerType: For efficiency calculation (optional)
 * 
 * @returns {object} Complete pricing breakdown with safety checks
 */
function calculateNewPricing(params) {
  const {
    userChargerPowerKw,
    socketMaxCapacityKw,
    bookingDurationMinutes,
    pricePerKwh,
    convenienceFee = 0,
    platformFee = PLATFORM_FEE,
    chargerType = 'AC'
  } = params;

  // Validate inputs
  if (!userChargerPowerKw || userChargerPowerKw <= 0) {
    throw new Error('userChargerPowerKw must be positive');
  }
  if (!socketMaxCapacityKw || socketMaxCapacityKw <= 0) {
    throw new Error('socketMaxCapacityKw must be positive');
  }
  if (!bookingDurationMinutes || bookingDurationMinutes <= 0) {
    throw new Error('bookingDurationMinutes must be positive');
  }
  if (!pricePerKwh || pricePerKwh < 0) {
    throw new Error('pricePerKwh must be non-negative');
  }

  // STEP A: Safety Validation
  const safetyValidation = validateSafety(userChargerPowerKw, socketMaxCapacityKw);
  
  // STEP B: Calculate total units
  const totalUnitsKwh = calculateTotalUnits(userChargerPowerKw, bookingDurationMinutes);
  
  // STEP C: Calculate final price
  const energyCost = calculateEnergyCost(totalUnitsKwh, pricePerKwh);
  const estimatedRange = calculateEstimatedRange(totalUnitsKwh);
  const totalBill = calculateTotalBill(energyCost, convenienceFee, platformFee);

  return {
    // Safety validation
    safetyAlert: safetyValidation.alert,
    safetyAlertMessage: safetyValidation.message,
    isSafeToBook: safetyValidation.isSafe,
    
    // Input parameters
    userChargerPowerKw,
    socketMaxCapacityKw,
    bookingDurationMinutes,
    bookingDurationHours: parseFloat((bookingDurationMinutes / 60).toFixed(2)),
    
    // Calculated values
    totalUnitsKwh,
    energyCost,
    estimatedRange,
    
    // Pricing breakdown
    convenienceFee,
    platformFee,
    totalBill,
    
    // Price per unit
    pricePerKwh,
    
    // Additional info
    chargerType,
    efficiency: getDefaultEfficiency(chargerType),
    
    // Legacy fields for backward compatibility
    estimatedCost: totalBill,
    estimatedDuration: bookingDurationMinutes
  };
}

/**
 * Complete pricing calculation (legacy Approach A - for backward compatibility)
 * @param {object} params
 *   - chargerPowerKw: Charger power in kW
 *   - chargerType: 'AC' or 'DC' (for auto-efficiency)
 *   - efficiency: Optional override for efficiency
 *   - bookingDuration: Booking duration in minutes
 *   - requiredEnergy: Required energy in kWh
 *   - pricePerKwh: Price per kWh
 * @returns {object} Pricing details
 */
function calculatePricing(params) {
  const {
    chargerPowerKw,
    chargerType,
    efficiency: customEfficiency,
    bookingDuration,
    requiredEnergy,
    pricePerKwh
  } = params;

  // Validate inputs
  if (!chargerPowerKw || chargerPowerKw <= 0) {
    throw new Error('chargerPowerKw must be positive');
  }
  if (!bookingDuration || bookingDuration <= 0) {
    throw new Error('bookingDuration must be positive');
  }
  if (!requiredEnergy || requiredEnergy <= 0) {
    throw new Error('requiredEnergy must be positive');
  }
  if (!pricePerKwh || pricePerKwh < 0) {
    throw new Error('pricePerKwh must be non-negative');
  }

  // Auto-calculate efficiency if not provided
  const efficiency = customEfficiency || getDefaultEfficiency(chargerType);

  // Calculate values
  const maxEnergy = calculateMaxEnergy(chargerPowerKw, bookingDuration, efficiency);
  const energyDelivered = calculateEnergyDelivered(requiredEnergy, maxEnergy);
  const totalCost = calculateTotalCost(energyDelivered, pricePerKwh);

  return {
    chargerPowerKw,
    chargerType,
    efficiency: parseFloat(efficiency.toFixed(2)),
    bookingDuration,
    requiredEnergy,
    pricePerKwh,
    maxEnergy,
    energyDelivered,
    totalCost,
    // Additional bookings info
    estimatedDuration: bookingDuration,
    estimatedCost: totalCost
  };
}

module.exports = {
  // New workflow functions
  validateSafety,
  calculateNewPricing,
  calculateTotalUnits,
  calculateEnergyCost,
  calculateEstimatedRange,
  calculateTotalBill,
  
  // Legacy functions (backward compatibility)
  getDefaultEfficiency,
  calculateMaxEnergy,
  calculateEnergyDelivered,
  calculateTotalCost,
  calculatePricing,
  
  // Constants
  PLATFORM_FEE,
  KM_PER_UNIT
};

