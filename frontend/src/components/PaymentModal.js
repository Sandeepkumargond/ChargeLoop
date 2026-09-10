'use client';

import { useState, useEffect, useCallback } from 'react';

export default function PaymentModal({ booking, isOpen = true, onClose, onSuccess }) {
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [error, setError] = useState(null);

  const bId = booking?._id || booking?.id;

  const createOrder = useCallback(async () => {
    if (!bId) return;
    setLoadingOrder(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to complete your payment.');
        setLoadingOrder(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: bId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data);
      } else {
        setError(data.msg || 'Could not initiate payment order.');
      }
    } catch (err) {
      setError(err.message || 'Payment service unreachable. Please check your connection.');
    } finally {
      setLoadingOrder(false);
    }
  }, [bId]);

  // Load order details when modal opens
  useEffect(() => {
    if (!isOpen || !booking || !bId) {
      setOrder(null);
      setPaymentSuccess(null);
      setError(null);
      return;
    }

    createOrder();
  }, [isOpen, booking, bId, createOrder]);

  if (!isOpen || !booking) return null;

  // Verify payment on backend
  const verifyPaymentOnServer = async ({ orderId, paymentId, signature, method }) => {
    setProcessingPayment(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: bId,
          orderId,
          paymentId,
          signature,
          paymentMethod: method || paymentMethod
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentSuccess(data);
        if (onSuccess) {
          onSuccess(data.booking);
        }
      } else {
        setError(data.msg || 'Payment verification failed on server.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with payment server.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Helper to load Razorpay Checkout script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Launch Razorpay or handle developer simulation safely
  const handlePay = async () => {
    if (!order) {
      // If order isn't ready yet, attempt to create it
      await createOrder();
      return;
    }

    const isRealRazorpay = order.keyId && !order.keyId.includes('sim') && !order.keyId.includes('mock');

    if (isRealRazorpay && typeof window !== 'undefined') {
      setProcessingPayment(true);
      setError(null);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setProcessingPayment(false);
        setError('Failed to load Razorpay payment gateway. Please disable ad-blockers and try again.');
        return;
      }

      try {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'ChargeLoop EV Charging',
          description: `Booking #${booking.requestId || booking._id?.slice(-8)}`,
          order_id: order.orderId,
          handler: function (response) {
            verifyPaymentOnServer({
              orderId: response.razorpay_order_id || order.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              method: paymentMethod
            });
          },
          prefill: {
            name: booking.userId?.name || '',
            email: booking.userId?.email || '',
            contact: booking.userPhone || '',
            method: paymentMethod === 'card' ? 'card' : paymentMethod === 'upi' ? 'upi' : undefined
          },
          theme: { color: '#2563eb' },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setProcessingPayment(false);
          setError(resp.error?.description || 'Payment was cancelled or unsuccessful.');
        });
        rzp.open();
      } catch (err) {
        setProcessingPayment(false);
        setError('Could not open Razorpay checkout: ' + err.message);
      }
      return;
    }

    // Gated simulation for local development only
    if (order.isSimulation) {
      if (process.env.NODE_ENV === 'production') {
        setError('Simulated payment is disabled in production environment.');
        return;
      }

      setProcessingPayment(true);
      const simPaymentId = `pay_${paymentMethod}_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const simSignature = `sim_sig_${order.orderId}_${simPaymentId}`;

      await verifyPaymentOnServer({
        orderId: order.orderId,
        paymentId: simPaymentId,
        signature: simSignature,
        method: paymentMethod
      });
      return;
    }

    setError('Payment gateway configuration is missing. Please contact support.');
  };

  const billAmount = order?.booking?.totalBill || booking.totalBill || booking.actualCost || booking.energyCost || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Complete Payment</h2>
            <p className="text-xs text-blue-100">
              Booking: <span className="font-mono font-medium">{booking.requestId || booking._id?.slice(-8)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={processingPayment}
            className="text-white/80 hover:text-white text-2xl leading-none p-1 rounded-lg hover:bg-white/10 transition"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {paymentSuccess ? (
            /* Success View */
            <div className="text-center py-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                ✓
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                Payment Successful!
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
                Your charging session payment of <span className="font-bold text-neutral-800 dark:text-neutral-200">₹{billAmount}</span> has been confirmed.
              </p>

              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left text-xs space-y-2 mb-6 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{paymentSuccess.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">PAID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment Mode:</span>
                  <span className="uppercase text-neutral-900 dark:text-white">{paymentMethod}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition shadow-md"
              >
                Done
              </button>
            </div>
          ) : loadingOrder ? (
            /* Loading View */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Preparing payment session...</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Contacting payment gateway</p>
            </div>
          ) : (
            /* Checkout View */
            <div className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold">Error: </span>
                    {error}
                  </div>
                  {!order && (
                    <button
                      onClick={createOrder}
                      className="shrink-0 text-xs text-blue-600 dark:text-blue-400 font-bold underline hover:no-underline ml-2"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Order Summary Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-700">
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{booking.hostName || 'EV Charging Station'}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{booking.vehicleNumber || 'EV Charging'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{billAmount}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Energy Cost ({booking.totalUnitsKwh || booking.desiredKwh || 0} kWh)</span>
                    <span className="font-medium text-neutral-900 dark:text-white">₹{booking.energyCost || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Fee</span>
                    <span className="font-medium text-neutral-900 dark:text-white">₹{booking.convenienceFee || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span className="font-medium text-neutral-900 dark:text-white">₹{booking.platformFee ?? 10}</span>
                  </div>
                </div>
              </div>

              {/* Development Simulation Banner */}
              {order?.isSimulation && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Test Mode Active:</span> Razorpay keys not configured; using sandbox simulation.
                </div>
              )}

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Payment Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'upi'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="text-lg">⚡</span>
                    <span className="text-xs">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="text-lg">💳</span>
                    <span className="text-xs">Cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'razorpay'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="text-lg">🌐</span>
                    <span className="text-xs">NetBanking</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                  Protected by 256-bit SSL encrypted Razorpay checkout.
                </p>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={processingPayment || loadingOrder}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
                  processingPayment || loadingOrder
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
                }`}
              >
                {processingPayment ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Processing Payment...
                  </>
                ) : loadingOrder ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Preparing Order...
                  </>
                ) : !order ? (
                  'Retry Creating Order'
                ) : (
                  `Pay ₹${billAmount} Now`
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>🔒 PCI-DSS Compliant</span>
                <span>•</span>
                <span>Instant Receipt</span>
                <span>•</span>
                <span>100% Refund Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
