'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../../../components/MapView'), {
  ssr: false
});

export default function MapPage() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 w-full">
      {}
      <div className="w-full h-[calc(100vh-200px)]">
        <div className="w-full h-full">
          <MapView />
        </div>
      </div>
    </div>
  );
}
