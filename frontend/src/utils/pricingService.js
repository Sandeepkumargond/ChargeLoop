/**
 * Frontend Pricing Service - Energy-Based Approach (Approach A)
 * Mirrors backend pricing logic for client-side calculations
 */

/**
 * Get efficiency based on charger type
 * @param {string} chargerType - 'AC' or 'DC'
 * @returns {number} efficiency value
 */
export function getDefaultEfficiency(chargerType) {
  const efficiencyMap = {
    'AC': 0.87,   // 0.85-0.90 average
    'DC': 0.92,   // 0.90-0.95 average
    'Both': 0.87   // Default to AC
  };
  return efficiencyMap[chargerType] || 0.87;
}

/**
 * Calculate maximum deliverable energy
 * @param {number} chargerPowerKw - Power in kW
 * @param {number} durationMinutes - Duration in minutes
 * @param {number} efficiency - Efficiency (0.5-1.0)
 * @returns {number} Max energy in kWh
 */
export function calculateMaxEnergy(chargerPowerKw, durationMinutes, efficiency) {
  const durationHours = durationMinutes / 60;
  return parseFloat((chargerPowerKw * durationHours * efficiency).toFixed(2));
}

/**
 * Calculate actual energy that will be delivered
 * @param {number} requiredEnergy - User requested energy (kWh)
 * @param {number} maxEnergy - Maximum capable of delivering (kWh)
 * @returns {number} Actual energy to be delivered (kWh)
 */
export function calculateEnergyDelivered(requiredEnergy, maxEnergy) {
  return Math.min(requiredEnergy, maxEnergy);
}

/**
 * Calculate total cost
 * @param {number} energyDelivered - Energy delivered (kWh)
 * @param {number} pricePerKwh - Price per kWh (₹)
 * @returns {number} Total cost (₹)
 */
export function calculateTotalCost(energyDelivered, pricePerKwh) {
  return parseFloat((energyDelivered * pricePerKwh).toFixed(2));
}

/**
 * Complete pricing calculation
 * @param {object} params
 *   - chargerPowerKw: Charger power (kW)
 *   - chargerType: 'AC' or 'DC' for auto-efficiency
 *   - efficiency: Optional override efficiency
 *   - bookingDuration: Duration in minutes
 *   - requiredEnergy: Required energy (kWh)
 *   - pricePerKwh: Price per kWh (₹)
 * @returns {object} Complete pricing breakdown
 */
export function calculatePricing(params) {
  const {
    chargerPowerKw = 7.4,
    chargerType = 'AC',
    efficiency: customEfficiency,
    bookingDuration = 60,
    requiredEnergy = 20,
    pricePerKwh = 12
  } = params;

  // Validate
  if (chargerPowerKw <= 0 || bookingDuration <= 0 || requiredEnergy <= 0 || pricePerKwh < 0) {
    return null;
  }

  const efficiency = customEfficiency || getDefaultEfficiency(chargerType);
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
    estimatedCost: totalCost // Alias for booking context
  };
}

/**
 * Format price for display
 * @param {number} price - Price in rupees
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
  return `₹${Math.round(price)}`;
}

/**
 * Format energy for display
 * @param {number} energy - Energy in kWh
 * @returns {string} Formatted energy string
 */
export function formatEnergy(energy) {
  return `${energy.toFixed(2)} kWh`;
}
