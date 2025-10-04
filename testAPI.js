// Simple test to verify API routes work
const testAPI = async () => {
  try {
    console.log('Testing Next.js API routes...');
    
    // Test /api/hosts/all
    console.log('Testing /api/hosts/all...');
    const allResponse = await fetch('http://localhost:3000/api/hosts/all');
    console.log('All hosts response status:', allResponse.status);
    
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log('All hosts data:', allData);
    } else {
      const errorText = await allResponse.text();
      console.log('All hosts error:', errorText);
    }
    
    // Test /api/hosts/nearby
    console.log('Testing /api/hosts/nearby...');
    const nearbyResponse = await fetch('http://localhost:3000/api/hosts/nearby?latitude=28.6139&longitude=77.2090&radius=10');
    console.log('Nearby hosts response status:', nearbyResponse.status);
    
    if (nearbyResponse.ok) {
      const nearbyData = await nearbyResponse.json();
      console.log('Nearby hosts data:', nearbyData);
    } else {
      const errorText = await nearbyResponse.text();
      console.log('Nearby hosts error:', errorText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run test
testAPI();