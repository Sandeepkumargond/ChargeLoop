'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../../../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

export default function MapPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 w-full">
      {/* Map Container - Fills remaining space without sidebar */}
      <div className="w-full h-[calc(100vh-200px)]">
        <div className="w-full h-full">
          <MapView />
        </div>
      </div>
    </div>
  );
}
