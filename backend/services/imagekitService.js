const axios = require('axios');
const FormData = require('form-data');

// Check if all required environment variables are set
const hasImageKitCredentials = 
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_ID;

/**
 * Upload file to ImageKit using HTTP API directly
 * @param {Buffer} fileBuffer - The file buffer
 * @param {String} fileName - The original file name
 * @param {String} folder - The destination folder in ImageKit
 * @returns {Promise<String>} - The URL of the uploaded file
 */
async function uploadFile(fileBuffer, fileName, folder, retryCount = 0) {
    const maxRetries = 2;
    const timeout = 60000; // 60 seconds

    try {
        // Validate input
        if (!fileBuffer) {
            throw new Error('No file buffer provided');
        }

        if (!Buffer.isBuffer(fileBuffer)) {
            throw new Error('File buffer must be a Buffer instance');
        }

        // Check credentials
        if (!hasImageKitCredentials) {
            throw new Error('ImageKit credentials not configured');
        }

        if (fileBuffer.length === 0) {
            throw new Error('File buffer is empty');
        }

        const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);

        // Create form data
        const formData = new FormData();
        formData.append('file', fileBuffer, fileName);
        formData.append('fileName', `${Date.now()}-${fileName}`);
        formData.append('folder', folder || 'chargeloop');
        formData.append('isPrivateFile', 'false');

        // Create auth header using Base64 encoding
        const authString = `${process.env.IMAGEKIT_PRIVATE_KEY}:`;
        const authBase64 = Buffer.from(authString).toString('base64');

        // Make HTTP request to ImageKit API
        const response = await axios.post(
            'https://upload.imagekit.io/api/v1/files/upload',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Basic ${authBase64}`
                },
                timeout: timeout,
                maxRedirects: 5,
                validateStatus: () => true // Don't throw on any status code
            }
        );

        // Handle error responses
        if (response.status !== 200) {
            if (response.data && response.data.message) {
                throw new Error(`ImageKit error: ${response.data.message}`);
            }
            
            throw new Error(`ImageKit upload failed with status ${response.status}`);
        }

        // Check response data
        if (!response.data || !response.data.url) {
            throw new Error('ImageKit upload returned no URL');
        }

        return response.data.url;

    } catch (error) {
        // Check if it's a timeout or network error
        const isNetworkError = 
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ECONNREFUSED' ||
            error.message.includes('timeout') ||
            error.message.includes('ENOTFOUND');

        // Retry on network errors
        if (isNetworkError && retryCount < maxRetries) {
            const delayMs = 2000 * (retryCount + 1); // 2s, 4s delays
            
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return uploadFile(fileBuffer, fileName, folder, retryCount + 1);
        }

        // Don't retry on authentication or validation errors
        if (error.message.includes('401') || error.message.includes('Authentication')) {
            throw error;
        }

        throw error;
    }
}

module.exports = {
    uploadFile,
    hasImageKitCredentials
};
