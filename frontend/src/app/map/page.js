'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../../components/MapView'), {
  ssr: false
});

export default function MapPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 w-full">
      {/* Map Container - Fills remaining space without footer overlap */}
      <div className="w-full h-[calc(100vh-200px)]">
        <div className="w-full h-full">
          <MapView />
        </div>
      </div>
    </div>
  );
}
