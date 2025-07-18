// lib/emailService.js
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
// You need to sign up at https://www.emailjs.com/ and get these values
const EMAIL_SERVICE_ID = 'your_service_id';
const EMAIL_TEMPLATE_ID = 'your_template_id';
const EMAIL_PUBLIC_KEY = 'your_public_key';

export const sendContactEmail = async (formData) => {
  try {
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      subject: formData.subject,
      message: formData.message,
      type: formData.type,
      to_email: 'errorincode404@gmail.com',
      reply_to: formData.email,
    };

    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID,
      templateParams,
      EMAIL_PUBLIC_KEY
    );

    return response;
  } catch (error) {
    console.error('EmailJS Error:', error);
    throw error;
  }
};

// Alternative: Simple API approach for demo
export const sendEmailViaAPI = async (formData) => {
  try {
    // This is a demo implementation
    // In production, you would send this to your backend
    console.log('Sending email with data:', formData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just log the email data
    console.log(`
      📧 Email would be sent to: errorincode404@gmail.com
      From: ${formData.name} (${formData.email})
      Subject: ChargeLoop Contact: ${formData.subject}
      Type: ${formData.type}
      Message: ${formData.message}
    `);
    
    return { success: true };
  } catch (error) {
    throw new Error('Failed to send email');
  }
};
