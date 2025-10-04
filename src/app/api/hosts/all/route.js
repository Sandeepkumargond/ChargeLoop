import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API: Fetching all hosts');
    
    // Make request to backend
    const backendResponse = await fetch('http://localhost:5000/api/host/all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch hosts from backend', details: errorText },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('Backend data received:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error fetching all hosts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}