// Vehicle number validation for Indian format
const validateVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber || typeof vehicleNumber !== 'string') {
    return { valid: false, reason: 'Vehicle number is required' };
  }

  // Remove spaces and convert to uppercase
  const cleanedNumber = vehicleNumber.replace(/\s+/g, '').toUpperCase();

  // Indian vehicle number format: BR29AB1234 or MH01AB1234
  const indianVehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;

  if (!indianVehicleRegex.test(cleanedNumber)) {
    return { 
      valid: false, 
      reason: 'Invalid format. Use format like BR29AB1234' 
    };
  }

  // Format the vehicle number properly
  const stateCode = cleanedNumber.substring(0, 2);
  const districtCode = cleanedNumber.substring(2, 4);
  const seriesCode = cleanedNumber.substring(4, cleanedNumber.length - 4);
  const uniqueNumber = cleanedNumber.substring(cleanedNumber.length - 4);

  const formattedNumber = `${stateCode}${districtCode}${seriesCode}${uniqueNumber}`;

  // Check if it's a real state code (basic validation)
  const validStateCodes = [
    'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DN', 'DD', 'DL', 'GA', 'GJ', 'HR', 
    'HP', 'JK', 'JH', 'KA', 'KL', 'LD', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 
    'OD', 'PY', 'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB', 'AN'
  ];

  if (!validStateCodes.includes(stateCode)) {
    return { 
      valid: false, 
      reason: 'Invalid state code. Please use valid Indian state code' 
    };
  }

  return {
    valid: true,
    formatted: formattedNumber,
    reason: 'Valid vehicle number format'
  };
};

// Mock function to check if vehicle exists in database
// In real implementation, this would check with RTO database
const checkVehicleExists = async (vehicleNumber) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, we'll validate format and simulate some existing vehicles
    const validation = validateVehicleNumber(vehicleNumber);
    
    if (!validation.valid) {
      return validation;
    }

    // Simulate checking with RTO database
    // Some mock existing vehicles for demo
    // const mockExistingVehicles = [
    //   'DL01AB1234', 'MH12CD5678', 'KA03EF9012', 'TN07GH3456',
    //   'UP14IJ7890', 'GJ01KL2345', 'RJ14MN6789', 'BR01OP1234'
    // ];

    const exists = mockExistingVehicles.includes(validation.formatted);
    
    return {
      valid: true,
      exists: exists,
      formatted: validation.formatted,
      reason: exists ? 'Vehicle found in RTO database' : 'Vehicle format valid but not found in database'
    };

  } catch (error) {
    return {
      valid: false,
      exists: false,
      reason: 'Unable to verify vehicle with RTO database'
    };
  }
};

module.exports = {
  validateVehicleNumber,
  checkVehicleExists
};
