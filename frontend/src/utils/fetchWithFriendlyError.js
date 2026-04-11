/**
 * Wrapper around fetch that catches network errors and provides user-friendly messages
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - The fetch response
 * @throws {Error} - With user-friendly error message for network issues
 */
export async function fetchWithFriendlyError(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    // Network/server error - connection failed
    throw new Error("Internet issue or server is offline. Please check your connection and try again.");
  }
}
