'use client';

import React, { useState } from 'react';
import { InaPdriFeature, InaPdriGeoJSON, InaPdriMeta, ProvinceSummary } from '@/lib/types';
import MapContainer from '@/components/map/MapContainer';
import Sidebar from '@/components/sidebar/Sidebar';
import DetailDrawer from '@/components/detail/DetailDrawer';
import RekapModal from '@/components/analytics/RekapModal';
import { Menu, X, ShieldAlert } from 'lucide-react';

interface InaPdriDashboardProps {
  geojsonData: InaPdriGeoJSON;
  metaData: InaPdriMeta;
  summaryData: ProvinceSummary[];
}

export default function InaPdriDashboard({
  geojsonData,
  metaData,
  summaryData,
}: InaPdriDashboardProps) {
  const [selectedFeature, setSelectedFeature] = useState<InaPdriFeature | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedKabupaten, setSelectedKabupaten] = useState<string | null>(null);
  const [selectedDisasters, setSelectedDisasters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [altitudeRange, setAltitudeRange] = useState<[number, number]>([-210, 1600]);
  const [basemapStyle, setBasemapStyle] = useState<'voyager' | 'dark' | 'satellite'>('voyager');
  const [isRekapModalOpen, setIsRekapModalOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Toggle disaster filter
  const handleDisasterToggle = (disasterName: string) => {
    setSelectedDisasters((prev) =>
      prev.includes(disasterName)
        ? prev.filter((d) => d !== disasterName)
        : [...prev, disasterName]
    );
  };

  const handleClearDisasters = () => {
    setSelectedDisasters([]);
  };

  // Compute total filtered points count for the sidebar counter
  const totalFilteredPoints = React.useMemo(() => {
    if (!geojsonData || !geojsonData.features) return 0;
    const q = searchQuery.trim().toLowerCase();
    return geojsonData.features.filter((f) => {
      const p = f.properties;
      if (selectedProvince && p.provinsi.toLowerCase() !== selectedProvince.toLowerCase()) {
        return false;
      }
      if (selectedKabupaten && p.kabupaten.toLowerCase() !== selectedKabupaten.toLowerCase()) {
        return false;
      }
      if (selectedDisasters.length > 0 && !selectedDisasters.includes(p.jenisBencana)) {
        return false;
      }
      if (p.altitude < altitudeRange[0] || p.altitude > altitudeRange[1]) {
        return false;
      }
      if (q) {
        const text = `${p.desa} ${p.kecamatan} ${p.kabupaten} ${p.provinsi} ${p.alamat} ${p.petugas}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    }).length;
  }, [geojsonData, selectedProvince, selectedKabupaten, selectedDisasters, altitudeRange, searchQuery]);

  // Selected province summary object
  const activeProvinceSummary = React.useMemo(() => {
    if (!selectedProvince) return null;
    return summaryData.find(
      (p) => p.provinsi.toLowerCase() === selectedProvince.toLowerCase()
    ) || null;
  }, [summaryData, selectedProvince]);

  // Active rekap target (Kabupaten or Province level)
  const activeRekapInfo = React.useMemo(() => {
    if (!activeProvinceSummary) return null;
    if (selectedKabupaten && activeProvinceSummary.kabupatenRekap?.[selectedKabupaten]) {
      const kabRekap = activeProvinceSummary.kabupatenRekap[selectedKabupaten];
      const count =
        geojsonData?.features.filter(
          (f) =>
            f.properties.provinsi.toLowerCase() === selectedProvince?.toLowerCase() &&
            f.properties.kabupaten.toLowerCase() === selectedKabupaten.toLowerCase()
        ).length || 0;
      return {
        title: selectedKabupaten,
        level: 'kabupaten' as const,
        rekap: kabRekap,
        totalPoints: count,
      };
    }
    if (activeProvinceSummary.rekap) {
      return {
        title: `Provinsi ${activeProvinceSummary.provinsi}`,
        level: 'provinsi' as const,
        rekap: activeProvinceSummary.rekap,
        totalPoints: activeProvinceSummary.totalSurveyPoints,
      };
    }
    return null;
  }, [activeProvinceSummary, selectedKabupaten, selectedProvince, geojsonData]);

  return (
    <main className="relative w-screen h-screen overflow-hidden flex bg-slate-100 font-sans">
      {/* Mobile Top Navbar */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 p-2.5 flex items-center justify-between text-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <img
              src="/images/logo-bnpb.png"
              alt="BNPB"
              className="h-7 w-auto object-contain"
            />
            <img
              src="/images/logo-usk.webp"
              alt="USK"
              className="h-6 w-auto object-contain"
            />
          </div>
          <div>
            <span className="font-semibold text-xs block text-slate-900 leading-tight">Ina PDRI 2026</span>
            <span className="text-[10px] text-blue-600 font-medium">
              {totalFilteredPoints} Titik
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarMobileOpen((prev) => !prev)}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition"
        >
          {isSidebarMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop always visible, Mobile toggleable) */}
      <div
        className={`${
          isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 fixed md:relative inset-y-0 left-0 z-40 md:z-auto h-full flex`}
      >
        <Sidebar
          meta={metaData}
          summaryData={summaryData}
          totalFilteredPoints={totalFilteredPoints}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedProvince={selectedProvince}
          onProvinceChange={setSelectedProvince}
          selectedKabupaten={selectedKabupaten}
          onKabupatenChange={setSelectedKabupaten}
          selectedDisasters={selectedDisasters}
          onDisasterToggle={handleDisasterToggle}
          onClearDisasterFilters={handleClearDisasters}
          altitudeRange={altitudeRange}
          onAltitudeChange={setAltitudeRange}
          basemapStyle={basemapStyle}
          onBasemapChange={setBasemapStyle}
          onOpenRekapModal={() => setIsRekapModalOpen(true)}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarMobileOpen && (
        <div
          onClick={() => setIsSidebarMobileOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs"
        />
      )}

      {/* Map View Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          geojsonData={geojsonData}
          selectedFeature={selectedFeature}
          onSelectFeature={setSelectedFeature}
          filterProvince={selectedProvince}
          filterKabupaten={selectedKabupaten}
          filterDisasters={selectedDisasters}
          filterAltitudeRange={altitudeRange}
          searchQuery={searchQuery}
          basemapStyle={basemapStyle}
        />

        {/* Floating Quick Legend (Bottom Right) */}
        <div className="absolute bottom-6 right-6 z-20 hidden lg:flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs text-slate-700 pointer-events-auto">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-[11px] mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span>Legenda Bencana</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="text-slate-700">Banjir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <span className="text-slate-700">Tanah Longsor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              <span className="text-slate-700">Gempa Bumi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0891B2]" />
              <span className="text-slate-700">Banjir + Longsor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
              <span className="text-slate-700">Kekeringan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
              <span className="text-slate-700">Tsunami / Likuefaksi</span>
            </div>
          </div>
        </div>

        {/* Detail Slide-Over Drawer */}
        {selectedFeature && (
          <DetailDrawer
            feature={selectedFeature}
            onClose={() => setSelectedFeature(null)}
          />
        )}
      </div>

      {/* Provincial or Kabupaten Rekap Analytics Modal */}
      {isRekapModalOpen && activeRekapInfo && (
        <RekapModal
          title={activeRekapInfo.title}
          level={activeRekapInfo.level}
          rekap={activeRekapInfo.rekap}
          totalSurveyPoints={activeRekapInfo.totalPoints}
          onClose={() => setIsRekapModalOpen(false)}
        />
      )}
    </main>
  );
}
