'use client';

import React from 'react';
import Link from 'next/link';
import { InaPdriMeta, ProvinceSummary } from '@/lib/types';
import {
  Search,
  RotateCcw,
  Layers,
  ChevronDown,
  Filter,
  Activity,
  ShieldAlert,
  MapPin,
  TrendingUp,
  X,
} from 'lucide-react';

interface SidebarProps {
  meta: InaPdriMeta | null;
  summaryData: ProvinceSummary[] | null;
  totalFilteredPoints: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProvince: string | null;
  onProvinceChange: (province: string | null) => void;
  selectedKabupaten: string | null;
  onKabupatenChange: (kabupaten: string | null) => void;
  selectedDisasters: string[];
  onDisasterToggle: (disaster: string) => void;
  onClearDisasterFilters: () => void;
  altitudeRange?: [number, number];
  onAltitudeChange?: (range: [number, number]) => void;
  basemapStyle: 'voyager' | 'dark' | 'satellite';
  onBasemapChange: (style: 'voyager' | 'dark' | 'satellite') => void;
  onOpenRekapModal?: () => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  meta,
  summaryData,
  totalFilteredPoints,
  searchQuery,
  onSearchChange,
  selectedProvince,
  onProvinceChange,
  selectedKabupaten,
  onKabupatenChange,
  selectedDisasters,
  onDisasterToggle,
  onClearDisasterFilters,
  altitudeRange,
  onAltitudeChange,
  basemapStyle,
  onBasemapChange,
  onOpenRekapModal,
  onCloseMobile,
}: SidebarProps) {
  // Available Kabupaten in selected province
  const availableKabupaten = React.useMemo(() => {
    if (!summaryData) return [];
    if (!selectedProvince) {
      // All unique kabupatens
      const set = new Set<string>();
      summaryData.forEach((p) => p.kabupatenList.forEach((k) => set.add(k)));
      return Array.from(set).sort();
    }
    const prov = summaryData.find(
      (p) => p.provinsi.toLowerCase() === selectedProvince.toLowerCase()
    );
    return prov ? prov.kabupatenList : [];
  }, [summaryData, selectedProvince]);

  // Selected province rekap info
  const selectedProvinceSummary = React.useMemo(() => {
    if (!summaryData || !selectedProvince) return null;
    return summaryData.find(
      (p) => p.provinsi.toLowerCase() === selectedProvince.toLowerCase()
    );
  }, [summaryData, selectedProvince]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedProvince) ||
    Boolean(selectedKabupaten) ||
    selectedDisasters.length > 0;

  const handleResetFilters = () => {
    onSearchChange('');
    onProvinceChange(null);
    onKabupatenChange(null);
    onClearDisasterFilters();
    if (onAltitudeChange) {
      onAltitudeChange([-210, 1600]);
    }
  };

  return (
    <aside className="w-[88vw] max-w-sm md:w-96 h-full bg-slate-50 border-r border-slate-200/90 flex flex-col text-slate-800 z-30 shadow-2xl overflow-hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 bg-white/70">
        {/* Mobile Top Bar with Close Action */}
        <div className="flex items-center justify-between mb-2.5 md:hidden">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Menu & Filter Peta
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 text-xs font-semibold shadow-2xs border border-slate-200"
              aria-label="Tutup Menu"
            >
              <X className="w-4 h-4 text-slate-600" />
              <span>Tutup</span>
            </button>
          )}
        </div>

        {/* Partnership Logos: BNPB & USK - Balanced 3/4 Size */}
        <div className="flex items-center justify-around gap-3 mb-3 bg-white p-2.5 rounded-xl w-full shadow-2xs border border-slate-200">
          <img
            src="/images/logo-bnpb.png"
            alt="Logo Badan Nasional Penanggulangan Bencana (BNPB)"
            className="h-14 w-auto max-w-[42%] object-contain"
          />
          <img
            src="/images/logo-usk.webp"
            alt="Logo Universitas Syiah Kuala (USK)"
            className="h-11 w-auto max-w-[50%] object-contain"
          />
        </div>

        <div>
          <h1 className="font-bold text-base text-slate-900 tracking-wide">
            Ina PDRI 2026
          </h1>
          <p className="text-[11px] text-slate-500">
            Indeks Pemulihan Pascabencana Indonesia
          </p>
        </div>

        {/* Navigation Mode Switcher */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 text-xs font-semibold">
          <span className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white text-blue-600 shadow-2xs">
            <MapPin className="w-3.5 h-3.5" />
            <span>Peta GIS</span>
          </span>
          <Link
            href="/kenaikan"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rekap Kenaikan</span>
          </Link>
        </div>

        {/* KPI Counter Pill */}
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <span className="block text-xs text-slate-500">Titik Aktif</span>
            <span className="font-bold text-blue-600 text-sm">
              {totalFilteredPoints}
              <span className="text-[10px] text-slate-400 font-normal">
                /{meta?.totalPoints || 887}
              </span>
            </span>
          </div>
          <div className="border-x border-slate-200">
            <span className="block text-xs text-slate-500">Provinsi</span>
            <span className="font-bold text-slate-800 text-sm">
              {meta?.totalProvinces || (meta?.provinces?.length ?? 19)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Kab/Kota</span>
            <span className="font-bold text-slate-800 text-sm">
              {meta?.totalKabupaten || 44}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Filters */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Search Input */}
        <div>
          <label className="text-slate-600 font-medium block mb-1.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            Cari Lokasi / Desa / Petugas
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Contoh: Tandurusa, Bitung, Banjir..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Filter Administrative: Provinsi & Kabupaten */}
        <div className="space-y-2.5">
          <label className="text-slate-600 font-medium block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Wilayah Administratif
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </label>

          {/* Provinsi Select */}
          <div className="relative">
            <select
              value={selectedProvince || ''}
              onChange={(e) => {
                const val = e.target.value || null;
                onProvinceChange(val);
                onKabupatenChange(null);
              }}
              className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer pr-8 shadow-2xs"
            >
              <option value="">Semua Provinsi ({meta?.provinces?.length || 19} Provinsi)</option>
              {meta?.provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Kabupaten Select */}
          <div className="relative">
            <select
              value={selectedKabupaten || ''}
              onChange={(e) => onKabupatenChange(e.target.value || null)}
              className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer pr-8 shadow-2xs"
            >
              <option value="">
                {selectedProvince
                  ? `Semua Kab/Kota di ${selectedProvince}`
                  : 'Semua Kabupaten / Kota'}
              </option>
              {availableKabupaten.map((kab) => (
                <option key={kab} value={kab}>
                  {kab}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Disaster Type Multi-Filter Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-600 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Jenis Bencana
            </label>
            {selectedDisasters.length > 0 && (
              <button
                onClick={onClearDisasterFilters}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Pilih Semua
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {meta?.disasterTypes.slice(0, 8).map((d) => {
              const active = selectedDisasters.includes(d.name);
              return (
                <button
                  key={d.name}
                  onClick={() => onDisasterToggle(d.name)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span>{d.name}</span>
                  <span className="text-[10px] opacity-70">({d.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Basemap Switcher */}
        <div>
          <label className="text-slate-600 font-medium block mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Gaya Peta Dasar (Basemap)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onBasemapChange('voyager')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition ${
                basemapStyle === 'voyager'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              Jalan (Esri)
            </button>
            <button
              onClick={() => onBasemapChange('dark')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition ${
                basemapStyle === 'dark'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              Gelap (Dark)
            </button>
            <button
              onClick={() => onBasemapChange('satellite')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition ${
                basemapStyle === 'satellite'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              Satelit (Esri)
            </button>
          </div>
        </div>

        {/* Active Rekap Card (Kabupaten/Kota Only) */}
        {(() => {
          if (!selectedProvinceSummary || !selectedKabupaten) return null;
          const rekapObj = selectedProvinceSummary.kabupatenRekap?.[selectedKabupaten];
          if (!rekapObj) return null;

          return (
            <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">
                    Indeks Rekap {selectedKabupaten}
                  </span>
                </span>
                {(() => {
                  const statusVal = rekapObj.statusSeries?.t_0 || 'Pulih';
                  const isPulih = !statusVal.toLowerCase().includes('belum');
                  return (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 border ${
                        isPulih
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-700 border-rose-300'
                      }`}
                    >
                      {statusVal}
                    </span>
                  );
                })()}
              </div>

              <p className="text-[11px] text-slate-600">
                Evaluasi pemulihan 5 sektor wilayah {selectedKabupaten}.
              </p>

              {onOpenRekapModal && (
                <button
                  onClick={onOpenRekapModal}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Lihat Detail Indeks & Grafik</span>
                  <span>&rarr;</span>
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between bg-slate-100/70">
        <span>
          <a
            href="https://lifeofrifai.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 hover:underline transition-colors font-medium text-slate-700"
          >
            lifeofrifai
          </a>{' '}
          &copy; 2026
        </span>
        <span>MapLibre GL Vector Engine</span>
      </div>
    </aside>
  );
}
