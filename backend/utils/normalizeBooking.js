/**
 * Utility to normalize booking data formats across the application.
 * Reconciles legacy aliases with canonical fields to ensure backward compatibility
 * while migrating to standard naming.
 */
function normalizeBooking(b) {
  if (!b) return b;
  
  return {
    ...b,
    totalUnitsKwh: b.totalUnitsKwh ?? b.desiredKwh ?? b.energyConsumed ?? 0,
    desiredKwh: b.totalUnitsKwh ?? b.desiredKwh ?? b.energyConsumed ?? 0,
    energyConsumed: b.energyConsumed ?? b.totalUnitsKwh ?? b.desiredKwh ?? 0,
    
    totalBill: b.totalBill ?? b.estimatedCost ?? b.actualCost ?? b.energyCost ?? 0,
    estimatedCost: b.totalBill ?? b.estimatedCost ?? b.actualCost ?? b.energyCost ?? 0,
    actualCost: b.actualCost ?? b.totalBill ?? b.estimatedCost ?? b.energyCost ?? 0,
    
    pricePerUnit: b.pricePerKwh ?? b.pricePerUnit ?? 0,
    pricePerKwh: b.pricePerKwh ?? b.pricePerUnit ?? 0,
    
    requestedDuration: b.requestedDuration ?? b.estimatedDuration ?? b.actualDuration ?? 0,
    estimatedDuration: b.requestedDuration ?? b.estimatedDuration ?? b.actualDuration ?? 0
  };
}

/**
 * Normalize an array of bookings.
 */
function normalizeBookings(bookings) {
  if (!Array.isArray(bookings)) return [];
  return bookings.map(normalizeBooking);
}

module.exports = {
  normalizeBooking,
  normalizeBookings
};
