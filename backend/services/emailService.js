const nodemailer = require('nodemailer');

let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {

  console.warn('EMAIL_USER or EMAIL_PASS not configured. Using test mode for emails.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('[TEST MODE] Email would be sent to:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      return { success: true, messageId: 'test-' + Date.now() };
    }
  };
}

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
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

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
                <h3>Customer Details:</h3>
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
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const verifyEmailAddress = async (email) => {
  try {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'temp-mail.org', 'throwaway.email'
    ];

    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
      return { valid: false, reason: 'Disposable email addresses are not allowed' };
    }

    return { valid: true, reason: 'Email format is valid' };
  } catch (error) {
    return { valid: false, reason: 'Unable to verify email' };
  }
};

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
    return true;
  } catch (error) {
    throw error;
  }
};

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
  } catch (error) {
    throw error;
  }
};

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
  } catch (error) {
    throw error;
  }
};

const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'errorincode404@gmail.com',
      to: email,
      subject: 'ChargeLoop - Email Verification OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .otp-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #10B981; text-align: center; }
            .otp-code { font-size: 32px; font-weight: bold; color: #10B981; letter-spacing: 5px; font-family: monospace; }
            .warning { background: #FEF3C7; border: 1px solid #FBBF24; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
              <p>Complete your ChargeLoop registration</p>
            </div>

            <div class="content">
              <h2>Hello!</h2>
              <p>Thank you for signing up for ChargeLoop. Please verify your email address using the OTP code below:</p>

              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 10px;">Your verification code:</p>
                <div class="otp-code">${otp}</div>
              </div>

              <p>This OTP will expire in 10 minutes.</p>

              <div class="warning">
                <strong>Important:</strong> Never share this OTP with anyone. ChargeLoop support will never ask for your OTP code.
              </div>

              <p>If you didn't request this verification, please ignore this email or contact our support team immediately.</p>
            </div>

            <div class="footer">
              <p>© 2025 ChargeLoop. All rights reserved.</p>
              <p>Need help? Contact us at errorincode404@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    if (!process.env.EMAIL_PASS) {
      console.log('[TEST OTP] Email:', email, '| OTP:', otp);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error.message);

    if (!process.env.EMAIL_PASS) {
      console.log('[TEST OTP - FALLBACK] Email:', email, '| OTP:', otp);
      return { success: true };
    }
    return { success: false, error: error.message };
  }
};

const sendBookingConfirmationEmail = async (userEmail, bookingDetails) => {
  try {
    const {
      userName,
      chargerType,
      hostName,
      hostLocation,
      scheduledTime,
      estimatedDuration,
      estimatedCost,
      requestId,
      powerOutput,
      pricePerHour
    } = bookingDetails;

    const bookingDate = new Date(scheduledTime).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const bookingTime = new Date(scheduledTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'errorincode404@gmail.com',
      to: userEmail,
      subject: 'Booking Confirmed! - ChargeLoop Charging Station Reservation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .success-badge { background: #10B981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .booking-card { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10B981; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .booking-header { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #666; font-weight: 600; }
            .detail-value { color: #1f2937; font-weight: 500; }
            .cost-highlight { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #bfdbfe; }
            .cost-amount { font-size: 28px; font-weight: bold; color: #10B981; }
            .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
            .btn { background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: bold; }
            .warning-note { background: #FEF3C7; border: 1px solid #FBBF24; padding: 12px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Your charging station reservation is confirmed</p>
            </div>

            <div class="content">
              <div class="success-badge">
                ✓ Reservation Confirmed
              </div>

              <h2>Hello ${userName}!</h2>
              <p>Great news! Your booking has been accepted by the host. Your EV charging session is all set!</p>

              <div class="booking-card">
                <div class="booking-header">Charging Station Details</div>
                <div class="detail-row">
                  <span class="detail-label">Host Name:</span>
                  <span class="detail-value">${hostName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${hostLocation}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Charger Type:</span>
                  <span class="detail-value">${chargerType}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Power Output:</span>
                  <span class="detail-value">${powerOutput || 'N/A'}</span>
                </div>
              </div>

              <div class="booking-card">
                <div class="booking-header">Booking Schedule</div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${bookingDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${bookingTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${estimatedDuration} minutes</span>
                </div>
              </div>

              <div class="booking-card">
                <div class="booking-header">Cost Details</div>
                <div class="detail-row">
                  <span class="detail-label">Price per Hour:</span>
                  <span class="detail-value">₹${pricePerHour}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Estimated Duration:</span>
                  <span class="detail-value">${estimatedDuration} minutes</span>
                </div>
                <div class="cost-highlight">
                  <span class="detail-label">Estimated Total Cost:</span><br>
                  <span class="cost-amount">₹${Math.ceil(estimatedCost)}</span>
                </div>
              </div>

              <div class="booking-card">
                <div class="booking-header">Booking Reference</div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value" style="font-family: monospace; background: #f3f4f6; padding: 5px 10px; border-radius: 4px;">${requestId}</span>
                </div>
              </div>

              <div class="info-box">
                <strong>What's Next?</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Arrive 10 minutes before your scheduled time</li>
                  <li>Follow the host's instructions for charger access</li>
                  <li>The actual cost may vary based on actual charging duration</li>
                  <li>You'll receive a receipt after charging is completed</li>
                </ul>
              </div>

              <div class="warning-note">
                <strong>Tip:</strong> Make sure to complete your charging session on time to avoid any late fees. Contact the host if you need to reschedule.
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/charging-history" class="btn">
                  View Booking Details
                </a>
              </center>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                If you need to cancel or modify this booking, please contact the host or reach out to our support team.
              </p>
            </div>

            <div class="footer">
              <p>&copy; 2025 ChargeLoop. All rights reserved.</p>
              <p>Questions? Contact us at errorincode404@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error.message);

    if (!process.env.EMAIL_PASS) {
      console.log('[TEST MODE] Booking confirmation email would be sent to:', userEmail);
      return { success: true };
    }
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendHostOnboardingEmail,
  sendBookingNotificationToHost,
  sendContactEmail,
  verifyEmailAddress,
  sendHostApprovalEmail,
  sendHostDenialEmail,
  sendOtpEmail,
  sendBookingConfirmationEmail
};
