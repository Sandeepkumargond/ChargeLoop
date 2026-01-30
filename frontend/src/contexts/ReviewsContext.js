'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ReviewsContext = createContext();

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};

export const ReviewsProvider = ({ children }) => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('pendingReviews');
    if (saved) {
      setPendingReviews(JSON.parse(saved));
    }

    const savedReviews = localStorage.getItem('userReviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pendingReviews', JSON.stringify(pendingReviews));
  }, [pendingReviews]);

  useEffect(() => {
    localStorage.setItem('userReviews', JSON.stringify(reviews));
  }, [reviews]);

  const addChargingSession = (sessionData) => {
    const session = {
      id: sessionData.id || Date.now().toString(),
      hostId: sessionData.hostId,
      location: sessionData.location,
      duration: sessionData.duration,
      energyDelivered: sessionData.energyDelivered,
      cost: sessionData.cost,
      completedAt: new Date().toISOString(),
      needsReview: true
    };

    setPendingReviews(prev => [...prev, session]);

    setTimeout(() => {
      setCurrentSession(session);
      setShowRatingModal(true);
    }, 1000);
  };

  const submitReview = async (reviewData) => {
    try {

      const newReview = {
        id: Date.now().toString(),
        sessionId: reviewData.sessionId,
        hostId: reviewData.hostId,
        rating: reviewData.rating,
        review: reviewData.review,
        chargerLocation: reviewData.chargerLocation,
        submittedAt: new Date().toISOString(),
        userName: localStorage.getItem('userEmail') || 'Anonymous'
      };

      setReviews(prev => [...prev, newReview]);

      setPendingReviews(prev =>
        prev.filter(session => session.id !== reviewData.sessionId)
      );

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newReview)
      });

      return newReview;
    } catch (error) {
      throw error;
    }
  };

  const skipReview = (sessionId) => {
    setPendingReviews(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, needsReview: false }
          : session
      )
    );
  };

  const triggerRatingForSession = (sessionData) => {
    setCurrentSession(sessionData);
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setCurrentSession(null);
  };

  const simulateChargingSession = (location = "Test Charger Location") => {
    const mockSession = {
      id: `session_${Date.now()}`,
      hostId: 'host_123',
      location: location,
      duration: '2h 15m',
      energyDelivered: '45.2',
      cost: '₹285',
      completedAt: new Date().toISOString()
    };

    addChargingSession(mockSession);
  };

  const value = {
    pendingReviews,
    reviews,
    showRatingModal,
    currentSession,
    addChargingSession,
    submitReview,
    skipReview,
    triggerRatingForSession,
    closeRatingModal,
    simulateChargingSession
  };

  return (
    <ReviewsContext.Provider value={value}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const ClientReviewsProvider = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <ReviewsProvider>{children}</ReviewsProvider>;
};
