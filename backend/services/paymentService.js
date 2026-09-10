const crypto = require('crypto');

let razorpayInstance = null;

function getRazorpayInstance() {
  if (razorpayInstance) return razorpayInstance;

  if (paymentService.isConfigured()) {
    try {
      const Razorpay = require('razorpay');
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('✅ Razorpay Payment Gateway Initialized');
    } catch (err) {
      console.error('⚠️ Failed to initialize Razorpay:', err.message);
    }
  } else {
    console.log('ℹ️ Razorpay keys not provided or using placeholders. Running in Payment Simulation / Sandbox mode.');
  }

  return razorpayInstance;
}

const paymentService = {
  isConfigured() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    return Boolean(
      keyId &&
      keySecret &&
      keyId.trim() !== '' &&
      !keyId.includes('your_key') &&
      !keySecret.includes('your_razorpay')
    );
  },

  getKeyId() {
    return paymentService.isConfigured() ? process.env.RAZORPAY_KEY_ID : 'rzp_test_chargeloop_sim';
  },

  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    const amountInPaise = Math.round(Number(amount) * 100);

    if (amountInPaise <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const rzp = getRazorpayInstance();

    if (rzp) {
      try {
        const order = await rzp.orders.create({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes
        });
        return {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          isSimulation: false
        };
      } catch (error) {
        throw new Error(`Razorpay API error: ${error.message || error.error?.description}`);
      }
    }

    throw new Error('Payment Gateway is not configured for production environment');
  },

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId) {
      return false;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (paymentService.isConfigured() && keySecret) {
      try {
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(body.toString())
          .digest('hex');

        return expectedSignature === signature;
      } catch (err) {
        console.error('Error verifying signature:', err.message);
        return false;
      }
    }

    return false;
  }
};

module.exports = paymentService;
