'use client';

import { useState, useEffect } from 'react';

export default function ReceiptModal({ bookingId, isOpen = true, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    const fetchReceipt = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/receipt/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setReceipt(data.receipt);
        } else {
          setError(data.msg || 'Failed to load receipt');
        }
      } catch (err) {
        setError(err.message || 'Error fetching receipt');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold tracking-tight">ChargeLoop</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Official Receipt</span>
            </div>
            <p className="text-xs text-blue-100 font-mono">
              {receipt?.receiptNumber || 'Charging Session Receipt'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none p-1 rounded-lg hover:bg-white/10 transition"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading receipt details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center">
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          ) : receipt ? (
            <div className="space-y-5 text-sm">
              {/* Payment Status Banner */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">Payment Completed</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {receipt.payment?.method?.toUpperCase() || 'ONLINE'} • ID: {receipt.payment?.paymentId?.slice(-12)}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{receipt.breakdown?.totalBill || 0}
                </span>
              </div>

              {/* Station & Customer Details */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Station & Host</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">{receipt.hostName}</p>
                  <p className="text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-0.5">{receipt.hostLocation}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Vehicle</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">{receipt.vehicleNumber || 'N/A'}</p>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">{receipt.vehicleModel || receipt.chargerType}</p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                  Price Breakdown
                </div>
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Energy ({receipt.energyUnits} kWh @ ₹{receipt.ratePerKwh}/kWh)</span>
                    <span className="font-medium text-neutral-900 dark:text-white">₹{receipt.breakdown?.energyCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Host Convenience Fee</span>
                    <span className="font-medium text-neutral-900 dark:text-white">₹{receipt.breakdown?.convenienceFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>ChargeLoop Platform Fee</span>
                    <span className="font-medium text-neutral-900 dark:text-white">₹{receipt.breakdown?.platformFee?.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-sm font-bold text-neutral-900 dark:text-white">
                    <span>Total Paid</span>
                    <span className="text-emerald-600 dark:text-emerald-400">₹{receipt.breakdown?.totalBill}</span>
                  </div>
                </div>
              </div>

              {/* Timestamp Info */}
              <div className="flex justify-between items-center text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                <span>Date: {new Date(receipt.date).toLocaleString()}</span>
                <span>Order: {receipt.payment?.orderId?.slice(-10)}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            🖨️ Print / Save
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
