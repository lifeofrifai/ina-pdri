'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { InaPdriFeature, InaPdriGeoJSON } from '@/lib/types';

const MapLibreView = dynamic(() => import('./MapLibreView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-sm font-medium">Memuat Peta Ina PDRI...</p>
    </div>
  ),
});

interface MapContainerProps {
  geojsonData: InaPdriGeoJSON;
  selectedFeature: InaPdriFeature | null;
  onSelectFeature: (feature: InaPdriFeature | null) => void;
  filterProvince: string | null;
  filterKabupaten: string | null;
  filterDisasters: string[];
  filterAltitudeRange: [number, number];
  searchQuery: string;
  basemapStyle: 'voyager' | 'dark' | 'satellite';
}

export default function MapContainer(props: MapContainerProps) {
  return <MapLibreView {...props} />;
}
