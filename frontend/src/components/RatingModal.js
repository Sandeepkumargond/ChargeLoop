'use client';

import React, { useState } from 'react';

const RatingModal = ({ isOpen, onClose, chargingSession, onSubmitReview }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReview({
        sessionId: chargingSession?.id,
        hostId: chargingSession?.hostId,
        rating,
        review,
        chargerLocation: chargingSession?.location
      });

      setRating(0);
      setReview('');
      onClose();
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">★</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Rate Your Experience</h2>
            <p className="text-neutral-600">
              How was your charging session at {chargingSession?.location || 'this location'}?
            </p>
          </div>

          {}
          {chargingSession && (
            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-600">Session ID:</span>
                <span className="text-sm font-mono text-neutral-800">#{chargingSession.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-600">Duration:</span>
                <span className="text-sm text-neutral-800">{chargingSession.duration || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Amount Charged:</span>
                <span className="text-sm text-neutral-800">{chargingSession.energyDelivered || 'N/A'} kWh</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-3">
                Rate your experience (1-5 stars)
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-3xl transition-all duration-200 transform hover:scale-110 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-neutral-300'
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-neutral-500 mt-2">
                {rating === 0 ? 'Click to rate' :
                 rating === 1 ? 'Poor' :
                 rating === 2 ? 'Fair' :
                 rating === 3 ? 'Good' :
                 rating === 4 ? 'Very Good' : 'Excellent'}
              </p>
            </div>

            {}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Share your experience (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell others about your charging experience..."
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows="4"
                maxLength="500"
              />
              <p className="text-right text-xs text-neutral-500 mt-1">
                {review.length}/500 characters
              </p>
            </div>

            {}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 transition-all duration-300"
                disabled={isSubmitting}
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="flex-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
