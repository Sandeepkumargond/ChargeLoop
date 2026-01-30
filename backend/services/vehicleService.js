const validateVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber || typeof vehicleNumber !== 'string') {
    return { valid: false, reason: 'Vehicle number is required' };
  }

  const cleanedNumber = vehicleNumber.replace(/\s+/g, '').toUpperCase();

  const indianVehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;

  if (!indianVehicleRegex.test(cleanedNumber)) {
    return {
      valid: false,
      reason: 'Invalid format. Use format like BR29AB1234'
    };
  }

  const stateCode = cleanedNumber.substring(0, 2);
  const districtCode = cleanedNumber.substring(2, 4);
  const seriesCode = cleanedNumber.substring(4, cleanedNumber.length - 4);
  const uniqueNumber = cleanedNumber.substring(cleanedNumber.length - 4);

  const formattedNumber = `${stateCode}${districtCode}${seriesCode}${uniqueNumber}`;

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

const checkVehicleExists = async (vehicleNumber) => {
  try {

    await new Promise(resolve => setTimeout(resolve, 500));

    const validation = validateVehicleNumber(vehicleNumber);

    if (!validation.valid) {
      return validation;
    }

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
