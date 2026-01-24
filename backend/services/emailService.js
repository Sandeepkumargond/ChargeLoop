const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'errorincode404@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password-here' // You need to set this
  }
});

// Send host onboarding email
const sendHostOnboardingEmail = async (hostData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'errorincode404@gmail.com',
      to: hostData.email,
      subject: 'Welcome to ChargeLoop - Host Registration Successful!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .success-badge { background: #10B981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
            .info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10B981; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .btn { background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ChargeLoop!</h1>
              <p>Your charging station has been successfully registered</p>
            </div>
            
            <div class="content">
              <div class="success-badge">
                 Registration Successful
              </div>
              
              <h2>Hello ${hostData.hostName}!</h2>
              <p>Congratulations! Your charging station has been successfully registered on ChargeLoop. You're now part of our growing network of EV charging hosts.</p>
              
              <div class="info-card">
                <h3> Your Registration Details:</h3>
                <ul>
                  <li><strong>Host Name:</strong> ${hostData.hostName}</li>
                  <li><strong>Email:</strong> ${hostData.email}</li>
                  <li><strong>Phone:</strong> ${hostData.phone}</li>
                  <li><strong>Charger Type:</strong> ${hostData.chargerType}</li>
                  <li><strong>Price per Hour:</strong> ₹${hostData.pricePerHour}</li>
                  <li><strong>Address:</strong> ${hostData.location.address}</li>
                </ul>
              </div>
              
              <div class="info-card">
                <h3>What's Next?</h3>
                <ul>
                  <li>Your charger is now visible to EV owners in your area</li>
                  <li>You'll receive booking notifications via email and SMS</li>
                  <li>Track your earnings through the Host Dashboard</li>
                  <li>Update availability anytime through your profile</li>
                </ul>
              </div>
              
              <div class="info-card">
                <h3>Tips for Success:</h3>
                <ul>
                  <li>Keep your charger available during peak hours (8 AM - 8 PM)</li>
                  <li>Respond promptly to booking requests</li>
                  <li>Maintain your charging equipment regularly</li>
                  <li>Provide clear instructions for accessing your charger</li>
                </ul>
              </div>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/host?tab=dashboard" class="btn">
                  Go to Host Dashboard
                </a>
              </center>
            </div>
            
            <div class="footer">
              <p>Thank you for joining ChargeLoop!</p>
              <p>Need help? Contact us at errorincode404@gmail.com</p>
              <p>© 2025 ChargeLoop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Host onboarding email sent successfully to:', hostData.email);
    return { success: true };
  } catch (error) {
    console.error('Error sending host onboarding email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking notification to host
const sendBookingNotificationToHost = async (hostData, bookingData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'errorincode404@gmail.com',
      to: hostData.email,
      subject: 'New Charging Request - ChargeLoop',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .urgent-badge { background: #F59E0B; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
            .info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #3B82F6; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .btn { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .btn-success { background: #10B981; }
            .btn-danger { background: #EF4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Charging Request</h1>
              <p>Someone wants to use your charger</p>
            </div>
            
            <div class="content">
              <div class="urgent-badge">
                 Action Required
              </div>
              
              <h2>Hello ${hostData.hostName}!</h2>
              <p>You have received a new charging request. Please review the details below and respond promptly.</p>
              
              <div class="info-card">
                <h3>👤 Customer Details:</h3>
                <ul>
                  <li><strong>Name:</strong> ${bookingData.customerName}</li>
                  <li><strong>Phone:</strong> ${bookingData.customerPhone}</li>
                  <li><strong>Vehicle:</strong> ${bookingData.vehicleNumber}</li>
                  <li><strong>Vehicle Type:</strong> ${bookingData.vehicleType}</li>
                </ul>
              </div>
              
              <div class="info-card">
                <h3> Booking Details:</h3>
                <ul>
                  <li><strong>Requested Time:</strong> ${new Date(bookingData.startTime).toLocaleString()}</li>
                  <li><strong>Duration:</strong> ${bookingData.duration} minutes</li>
                  <li><strong>Estimated Cost:</strong> ₹${bookingData.estimatedCost}</li>
                  <li><strong>Charging Type:</strong> ${bookingData.chargingType}</li>
                </ul>
              </div>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/host?tab=dashboard" class="btn btn-success">
                  Accept Booking
                </a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/host?tab=dashboard" class="btn btn-danger">
                  Decline Booking
                </a>
              </center>
              
              <p><strong> Please respond within 15 minutes to maintain your host rating.</strong></p>
            </div>
            
            <div class="footer">
              <p>ChargeLoop - Powering the future of EV charging</p>
              <p>Need help? Contact us at errorincode404@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Booking notification sent successfully to:', hostData.email);
    return { success: true };
  } catch (error) {
    console.error('Error sending booking notification:', error);
    return { success: false, error: error.message };
  }
};

// Verify email address format and check if it exists
const verifyEmailAddress = async (email) => {
  try {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Check for common disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
      'mailinator.com', 'temp-mail.org', 'throwaway.email'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
      return { valid: false, reason: 'Disposable email addresses are not allowed' };
    }

    // For production, you could use a service like Hunter.io or ZeroBounce API
    // For now, we'll do basic validation
    return { valid: true, reason: 'Email format is valid' };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { valid: false, reason: 'Unable to verify email' };
  }
};

// Send contact form email
const sendContactEmail = async (contactData) => {
  try {
    const { name, email, subject, message, type, to } = contactData;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'errorincode404@gmail.com',
      to: to || 'errorincode404@gmail.com',
      replyTo: email,
      subject: `ChargeLoop Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Type:</strong> ${type || 'general'}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #059669; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Message</h3>
            <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888;">
            <p>This message was sent through the ChargeLoop contact form.</p>
            <p>Reply directly to this email to respond to the sender.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Contact email sent successfully from:', email);
    return true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
};

// Send host approval email
const sendHostApprovalEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'errorincode404@gmail.com',
      to: email,
      subject: ' Your Host Registration Request Has Been Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .success-badge { background: #10B981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
            .info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10B981; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .btn { background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1> Registration Approved!</h1>
              <p>Your host registration has been approved</p>
            </div>
            
            <div class="content">
              <div class="success-badge">
                 Approved
              </div>
              
              <h2>Hello ${name}!</h2>
              <p>Great news! Your host registration request has been reviewed and <strong>approved by our admin team</strong>. You can now log in to ChargeLoop and start listing your charging stations.</p>
              
              <div class="info-card">
                <h3> Next Steps:</h3>
                <ul>
                  <li>Log in to your ChargeLoop account</li>
                  <li>Complete your host profile</li>
                  <li>Add your charging stations</li>
                  <li>Start earning money!</li>
                </ul>
              </div>
              
              <div class="info-card">
                <h3> Login Information:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p>Use the same password you created during signup to log in.</p>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/host" class="btn">Go to Host Dashboard</a>
              
              <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
              <p>Happy hosting!</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 ChargeLoop. All rights reserved.</p>
              <p>If you did not request this approval, please contact us immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Host approval email sent to:', email);
  } catch (error) {
    console.error('Error sending host approval email:', error);
    throw error;
  }
};

// Send host denial email
const sendHostDenialEmail = async (email, name, denialReason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'errorincode404@gmail.com',
      to: email,
      subject: ' Your Host Registration Request - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .denial-badge { background: #EF4444; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
            .info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #EF4444; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .btn { background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Host Registration Status Update</h1>
              <p>Your registration request requires attention</p>
            </div>
            
            <div class="content">
              <div class="denial-badge">
                 Action Required
              </div>
              
              <h2>Hello ${name}!</h2>
              <p>Thank you for your interest in becoming a host on ChargeLoop. Unfortunately, your host registration request was not approved at this time.</p>
              
              <div class="info-card">
                <h3> Reason for Denial:</h3>
                <p><strong>${denialReason}</strong></p>
              </div>
              
              <div class="info-card">
                <h3> What You Can Do:</h3>
                <p>Please review the denial reason above and address the issues mentioned. Once you've resolved these concerns, you can submit a new registration request.</p>
                <p>We're here to help! If you need clarification on why your request was denied, please contact our support team.</p>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/host/register" class="btn">Submit New Request</a>
              
              <p style="margin-top: 30px;">We look forward to having you join the ChargeLoop community!</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 ChargeLoop. All rights reserved.</p>
              <p>If you have questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Host denial email sent to:', email);
  } catch (error) {
    console.error('Error sending host denial email:', error);
    throw error;
  }
};

module.exports = {
  sendHostOnboardingEmail,
  sendBookingNotificationToHost,
  sendContactEmail,
  verifyEmailAddress,
  sendHostApprovalEmail,
  sendHostDenialEmail
};
