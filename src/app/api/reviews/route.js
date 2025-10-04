import { NextResponse } from 'next/server';

// In-memory storage for demo (in production, use a database)
let reviews = [];

export async function POST(request) {
  try {
    const reviewData = await request.json();
    
    // Validate required fields
    if (!reviewData.rating || !reviewData.sessionId) {
      return NextResponse.json(
        { error: 'Rating and session ID are required' },
        { status: 400 }
      );
    }

    // Create review object
    const review = {
      id: Date.now().toString(),
      sessionId: reviewData.sessionId,
      hostId: reviewData.hostId,
      rating: reviewData.rating,
      review: reviewData.review || '',
      chargerLocation: reviewData.chargerLocation,
      userName: reviewData.userName || 'Anonymous',
      submittedAt: new Date().toISOString(),
      verified: true // Mark as verified since it comes from a completed session
    };

    // Add to reviews array
    reviews.push(review);

    console.log('New review submitted:', review);

    return NextResponse.json({
      success: true,
      review: review,
      message: 'Review submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('hostId');
    const limit = parseInt(searchParams.get('limit')) || 10;

    let filteredReviews = reviews;

    // Filter by hostId if provided
    if (hostId) {
      filteredReviews = reviews.filter(review => review.hostId === hostId);
    }

    // Sort by most recent first
    filteredReviews = filteredReviews
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, limit);

    // Calculate average rating
    const avgRating = filteredReviews.length > 0
      ? filteredReviews.reduce((sum, review) => sum + review.rating, 0) / filteredReviews.length
      : 0;

    return NextResponse.json({
      reviews: filteredReviews,
      totalReviews: filteredReviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingDistribution: {
        5: filteredReviews.filter(r => r.rating === 5).length,
        4: filteredReviews.filter(r => r.rating === 4).length,
        3: filteredReviews.filter(r => r.rating === 3).length,
        2: filteredReviews.filter(r => r.rating === 2).length,
        1: filteredReviews.filter(r => r.rating === 1).length,
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
