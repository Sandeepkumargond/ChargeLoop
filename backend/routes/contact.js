const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/emailService');

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, type, to } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    await sendContactEmail({
      name,
      email,
      subject,
      message,
      type: type || 'general',
      to: to || process.env.EMAIL_USER || 'errorincode404@gmail.com'
    });

    return res.status(200).json({
      message: 'Email sent successfully',
      success: true
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

module.exports = router;
