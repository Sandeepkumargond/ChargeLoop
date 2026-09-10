/**
 * ChargeLoop Unified Client Pricing Service
 * Synchronized with backend services/pricingService.js
 */

export const PLATFORM_FEE = 10; // ₹10 default platform fee
export const KM_PER_UNIT = 7; // Average 1 kWh = 7km for EVs

export function validateSafety(userChargerPowerKw, socketMaxCapacityKw) {
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

export function calculateNewPricing({
  userChargerPowerKw,
  socketMaxCapacityKw,
  bookingDurationMinutes,
  pricePerKwh,
  convenienceFee = 0,
  platformFee = PLATFORM_FEE,
  chargerType = 'AC'
}) {
  const safety = validateSafety(userChargerPowerKw, socketMaxCapacityKw);
  const durationHours = bookingDurationMinutes / 60;
  const totalUnitsKwh = parseFloat((userChargerPowerKw * durationHours).toFixed(2));
  const energyCost = parseFloat((totalUnitsKwh * pricePerKwh).toFixed(2));
  const estimatedRange = parseFloat((totalUnitsKwh * KM_PER_UNIT).toFixed(2));
  const totalBill = parseFloat((energyCost + convenienceFee + platformFee).toFixed(2));

  return {
    isSafeToBook: safety.isSafe,
    safetyAlert: safety.alert,
    safetyAlertMessage: safety.message,
    userChargerPowerKw,
    socketMaxCapacityKw,
    bookingDurationMinutes,
    bookingDurationHours: parseFloat(durationHours.toFixed(2)),
    totalUnitsKwh,
    pricePerKwh,
    energyCost,
    convenienceFee,
    platformFee,
    totalBill,
    estimatedRange
  };
}

export function formatPrice(price) {
  return `₹${Math.round(price)}`;
}

export function formatEnergy(energy) {
  return `${Number(energy).toFixed(2)} kWh`;
}
