'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  NavigationControl,
  ScaleControl,
  LngLatBounds,
  GeoJSONSource,
  Popup,
  MapMouseEvent,
  setWorkerUrl,
} from 'maplibre-gl';
import { InaPdriFeature, InaPdriGeoJSON } from '@/lib/types';

// Set absolute worker URL to prevent Next.js webpack relative chunk loading failure
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.mjs`);
  } catch {
    // Ignore in SSR
  }
}

interface MapLibreViewProps {
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

const GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

const BASEMAP_STYLES = {
  voyager: {
    version: 8 as const,
    glyphs: GLYPHS_URL,
    sources: {
      'esri-streets': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 16,
        attribution: '&copy; Esri &mdash; Sources: Esri, DeLorme, NAVTEQ, USGS, TomTom',
      },
    },
    layers: [
      {
        id: 'esri-streets-layer',
        type: 'raster' as const,
        source: 'esri-streets',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  dark: {
    version: 8 as const,
    glyphs: GLYPHS_URL,
    sources: {
      'esri-dark-base': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 16,
        attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
      },
      'esri-dark-reference': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 16,
      },
    },
    layers: [
      {
        id: 'esri-dark-base-layer',
        type: 'raster' as const,
        source: 'esri-dark-base',
        minzoom: 0,
        maxzoom: 22,
      },
      {
        id: 'esri-dark-ref-layer',
        type: 'raster' as const,
        source: 'esri-dark-reference',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  satellite: {
    version: 8 as const,
    glyphs: GLYPHS_URL,
    sources: {
      'esri-satellite': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 16,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN',
      },
      'esri-satellite-labels': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 16,
      },
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster' as const,
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22,
      },
      {
        id: 'esri-satellite-labels-layer',
        type: 'raster' as const,
        source: 'esri-satellite-labels',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
};

export default function MapLibreView({
  geojsonData,
  selectedFeature,
  onSelectFeature,
  filterProvince,
  filterKabupaten,
  filterDisasters,
  filterAltitudeRange,
  searchQuery,
  basemapStyle,
}: MapLibreViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const currentBasemapRef = useRef<string>(basemapStyle);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter GeoJSON features
  const filteredData = React.useMemo<InaPdriGeoJSON>(() => {
    if (!geojsonData || !geojsonData.features) {
      return { type: 'FeatureCollection', features: [] };
    }

    const q = searchQuery.trim().toLowerCase();
    const pFilter = filterProvince?.trim().toLowerCase();
    const kFilter = filterKabupaten?.trim().toLowerCase();

    const filtered = geojsonData.features.filter((f) => {
      const p = f.properties;

      // Province filter
      if (pFilter && p.provinsi.trim().toLowerCase() !== pFilter) {
        return false;
      }

      // Kabupaten filter
      if (kFilter && p.kabupaten.trim().toLowerCase() !== kFilter) {
        return false;
      }

      // Disaster type filter (if non-empty)
      if (filterDisasters.length > 0 && !filterDisasters.includes(p.jenisBencana)) {
        return false;
      }

      // Altitude range filter
      if (p.altitude < filterAltitudeRange[0] || p.altitude > filterAltitudeRange[1]) {
        return false;
      }

      // Search query filter
      if (q) {
        const text = `${p.desa} ${p.kecamatan} ${p.kabupaten} ${p.provinsi} ${p.alamat} ${p.petugas}`.toLowerCase();
        if (!text.includes(q)) {
          return false;
        }
      }

      return true;
    });

    return {
      type: 'FeatureCollection',
      features: filtered,
    };
  }, [geojsonData, filterProvince, filterKabupaten, filterDisasters, filterAltitudeRange, searchQuery]);

  // Keep a ref to latest filteredData for event handlers
  const filteredDataRef = useRef<InaPdriGeoJSON>(filteredData);
  useEffect(() => {
    filteredDataRef.current = filteredData;
  }, [filteredData]);

  // Setup layers helper
  const setupLayers = useCallback((map: Map, data: InaPdriGeoJSON) => {
    try {
      // If source already exists, just update data
      if (map.getSource('ina-pdri')) {
        (map.getSource('ina-pdri') as GeoJSONSource).setData(data);
        return;
      }

      // Add source with native clustering enabled up to zoom 9
      map.addSource('ina-pdri', {
        type: 'geojson',
        data: data,
        cluster: true,
        clusterMaxZoom: 9, // Points uncluster at zoom 10+
        clusterRadius: 40,
      });

      // 1. Unclustered point glow
      map.addLayer({
        id: 'unclustered-point-glow',
        type: 'circle',
        source: 'ina-pdri',
        filter: ['!has', 'point_count'],
        paint: {
          'circle-color': ['coalesce', ['get', 'color'], '#2563EB'],
          'circle-radius': 12,
          'circle-opacity': 0.35,
        },
      });

      // 2. Unclustered individual points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'ina-pdri',
        filter: ['!has', 'point_count'],
        paint: {
          'circle-color': ['coalesce', ['get', 'color'], '#2563EB'],
          'circle-radius': 8,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.95,
        },
      });

      // 3. Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'ina-pdri',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#2563EB', // Blue < 10
            10,
            '#D97706', // Amber 10-25
            25,
            '#DC2626', // Red 25+
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            10,
            22,
            25,
            28,
          ],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // 4. Cluster count text
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'ina-pdri',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        },
        paint: {
          'text-color': '#FFFFFF',
        },
      });

      // Event: Cluster click zooms in
      map.on('click', 'clusters', async (e: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource('ina-pdri') as GeoJSONSource;
        try {
          const zoom = await source.getClusterExpansionZoom(clusterId);
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.easeTo({
            center: [coords[0], coords[1]],
            zoom: Math.min(zoom + 1, 15),
            duration: 500,
          });
        } catch (err) {
          console.error('Cluster expand error:', err);
        }
      });

      // Event: Unclustered point click opens detail drawer
      map.on('click', 'unclustered-point', (e: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (!features || !features.length) return;
        const feat = features[0];
        const props = feat.properties as unknown as InaPdriFeature['properties'];
        const coords = (feat.geometry as GeoJSON.Point).coordinates;

        const fullFeature: InaPdriFeature = {
          type: 'Feature',
          id: Number(feat.id || props.id),
          geometry: {
            type: 'Point',
            coordinates: [coords[0], coords[1], coords[2] || 0],
          },
          properties: props,
        };

        onSelectFeature(fullFeature);
      });

      // Event: Hover tooltip on point
      map.on('mouseenter', 'unclustered-point', (e: MapMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (!features || !features.length) return;
        const feat = features[0];
        const p = feat.properties as unknown as InaPdriFeature['properties'];
        const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        if (popupRef.current) popupRef.current.remove();

        const html = `
          <div style="font-family: sans-serif; font-size: 11px; color: #0f172a; line-height: 1.3;">
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 2px;">${p.desa || 'Titik Survey'}, ${p.kecamatan}</div>
            <div style="color: #475569; margin-bottom: 4px;">${p.kabupaten}, ${p.provinsi}</div>
            <div style="display: flex; gap: 4px; align-items: center; margin-top: 4px;">
              <span style="background: ${p.color || '#2563EB'}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px;">${p.jenisBencana}</span>
              <span style="background: #f1f5f9; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${p.altitude}m dpl</span>
            </div>
          </div>
        `;

        popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
    } catch (err) {
      console.error('Error during setupLayers:', err);
    }
  }, [onSelectFeature]);

  // 1. Initialize Map once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialStyle = BASEMAP_STYLES[basemapStyle] || BASEMAP_STYLES.voyager;

    if (typeof window !== 'undefined') {
      try {
        setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.mjs`);
      } catch {
        // ignore
      }
    }

    const map = new Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [118.0, -2.5], // Center of Indonesia
      zoom: 4.8,
      minZoom: 3.5,
      maxZoom: 17, // Cap zoom at ~50 m scale view
    });

    map.on('error', (e) => {
      // Suppress minor tile 404 or request aborts from breaking React UI
      const msg = e?.error?.message || '';
      if (msg.includes('abort') || msg.includes('404')) return;
      console.warn('MapLibre:', msg || e);
    });

    map.addControl(new NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      setupLayers(map, filteredDataRef.current);
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run once on mount

  // 2. Update source data when filteredData changes (DO NOT reload style)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('ina-pdri') as GeoJSONSource | undefined;
    if (source) {
      source.setData(filteredData);
    } else {
      setupLayers(map, filteredData);
    }
  }, [filteredData, mapLoaded, setupLayers]);

  // 3. Switch basemap style ONLY when basemapStyle actually changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (currentBasemapRef.current === basemapStyle) return;

    currentBasemapRef.current = basemapStyle;
    const targetStyle = BASEMAP_STYLES[basemapStyle];
    if (targetStyle) {
      map.setStyle(targetStyle);
      map.once('style.load', () => {
        setupLayers(map, filteredDataRef.current);
      });
    }
  }, [basemapStyle, mapLoaded, setupLayers]);

  // 4. Fly to selected point feature
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedFeature) return;

    const [lng, lat] = selectedFeature.geometry.coordinates;
    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      pitch: 25,
      duration: 1000,
    });
  }, [selectedFeature, mapLoaded]);

  // 5. Fit bounds to selected Kabupaten OR selected Provinsi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // A. If a specific Kabupaten is selected
    if (filterKabupaten) {
      const kabPoints = filteredData.features.filter(
        (f) => f.properties.kabupaten.trim().toLowerCase() === filterKabupaten.trim().toLowerCase()
      );

      if (kabPoints.length > 0) {
        const bounds = new LngLatBounds();
        kabPoints.forEach((f) => {
          const [lng, lat] = f.geometry.coordinates;
          bounds.extend([lng, lat]);
        });
        map.fitBounds(bounds, {
          padding: 80,
          maxZoom: 13, // High zoom so points are immediately unclustered and visible!
          duration: 900,
        });
        return;
      }
    }

    // B. If only a Province is selected
    if (filterProvince) {
      const provPoints = filteredData.features.filter(
        (f) => f.properties.provinsi.trim().toLowerCase() === filterProvince.trim().toLowerCase()
      );

      if (provPoints.length > 0) {
        const bounds = new LngLatBounds();
        provPoints.forEach((f) => {
          const [lng, lat] = f.geometry.coordinates;
          bounds.extend([lng, lat]);
        });
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: 9.5,
          duration: 900,
        });
        return;
      }
    }

    // C. When both filters are cleared, reset view to all Indonesia
    if (!filterProvince && !filterKabupaten) {
      map.easeTo({
        center: [118.0, -2.5],
        zoom: 4.8,
        pitch: 0,
        duration: 800,
      });
    }
  }, [filterProvince, filterKabupaten, mapLoaded, filteredData]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
