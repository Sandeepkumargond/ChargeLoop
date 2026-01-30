const express = require('express');
const router = express.Router();
const BookingRequest = require('../models/BookingRequest');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { sessionId, hostId, rating, review, chargerLocation } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({
        error: 'Session ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    const session = await BookingRequest.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Booking request not found'
      });
    }

    session.rating = rating;
    if (review) {
      session.review = review;
    }
    if (chargerLocation) {
      session.chargerLocation = chargerLocation;
    }
    session.reviewSubmitted = true;
    session.reviewSubmittedAt = new Date();

    await session.save();

    return res.status(200).json({
      message: 'Review submitted successfully',
      success: true,
      review: {
        id: session._id,
        sessionId: session._id,
        hostId: session.hostId,
        rating: session.rating,
        review: session.review,
        chargerLocation: session.chargerLocation,
        submittedAt: session.reviewSubmittedAt,
        userName: session.userId
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to submit review',
      details: error.message
    });
  }
});

router.get('/host/:hostId', async (req, res) => {
  try {
    const { hostId } = req.params;

    const reviews = await BookingRequest.find({
      hostId: hostId,
      reviewSubmitted: true
    }).select('rating review chargerLocation reviewSubmittedAt userId');

    return res.status(200).json({
      success: true,
      reviews: reviews || [],
      totalReviews: reviews.length,
      averageRating: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : 0
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch reviews',
      details: error.message
    });
  }
});

router.get('/my-reviews', auth, async (req, res) => {
  try {
    const reviews = await BookingRequest.find({
      userId: req.user.id,
      reviewSubmitted: true
    }).select('rating review chargerLocation reviewSubmittedAt hostId');

    return res.status(200).json({
      success: true,
      reviews: reviews || [],
      totalReviews: reviews.length
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch reviews',
      details: error.message
    });
  }
});

module.exports = router;
