'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { RekapKenaikanDoc, KenaikanWilayah } from '@/lib/types';
import {
  MapPin,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Building2,
  Truck,
  Users,
  Coins,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BarChart3,
  Sparkles,
  RotateCcw,
  X,
} from 'lucide-react';

interface KenaikanDashboardProps {
  kenaikanData: RekapKenaikanDoc;
}

export default function KenaikanDashboard({ kenaikanData }: KenaikanDashboardProps) {
  const { nationalSummary, data } = kenaikanData;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('kenaikan-desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Check if any filter or custom sort is currently applied
  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      selectedStatus !== 'ALL' ||
      selectedProvinsi !== 'ALL' ||
      sortBy !== 'kenaikan-desc'
    );
  }, [searchQuery, selectedStatus, selectedProvinsi, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedProvinsi('ALL');
    setSortBy('kenaikan-desc');
  };

  // Distinct province list for filter
  const provinces = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      if (item.provinsi) set.add(item.provinsi);
    });
    return Array.from(set).sort();
  }, [data]);

  // Sector average increase across all 42 regions
  const sectorAverages = useMemo(() => {
    const totals = { permukiman: 0, infrastruktur: 0, sosial: 0, ekonomi: 0, multisektor: 0 };
    const counts = { permukiman: 0, infrastruktur: 0, sosial: 0, ekonomi: 0, multisektor: 0 };

    data.forEach((d) => {
      (['permukiman', 'infrastruktur', 'sosial', 'ekonomi', 'multisektor'] as const).forEach((sec) => {
        const val = d.kenaikan[sec];
        if (typeof val === 'number') {
          totals[sec] += val;
          counts[sec] += 1;
        }
      });
    });

    return {
      permukiman: counts.permukiman ? (totals.permukiman / counts.permukiman).toFixed(2) : '0',
      infrastruktur: counts.infrastruktur ? (totals.infrastruktur / counts.infrastruktur).toFixed(2) : '0',
      sosial: counts.sosial ? (totals.sosial / counts.sosial).toFixed(2) : '0',
      ekonomi: counts.ekonomi ? (totals.ekonomi / counts.ekonomi).toFixed(2) : '0',
      multisektor: counts.multisektor ? (totals.multisektor / counts.multisektor).toFixed(2) : '0',
    };
  }, [data]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            item.kabupaten.toLowerCase().includes(q) ||
            item.provinsi.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === 'Pulih' && item.kesimpulan.toLowerCase() !== 'pulih') return false;
          if (selectedStatus === 'Belum Pulih' && !item.kesimpulan.toLowerCase().includes('belum')) return false;
        }

        // Provinsi filter
        if (selectedProvinsi !== 'ALL') {
          if (item.provinsi.toLowerCase() !== selectedProvinsi.toLowerCase()) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const kenaikanA = a.kenaikan.rataRata ?? -999;
        const kenaikanB = b.kenaikan.rataRata ?? -999;
        const akhirA = a.nilaiTAkhir.rataRata ?? -999;
        const akhirB = b.nilaiTAkhir.rataRata ?? -999;

        switch (sortBy) {
          case 'kenaikan-desc':
            return kenaikanB - kenaikanA;
          case 'kenaikan-asc':
            return kenaikanA - kenaikanB;
          case 'akhir-desc':
            return akhirB - akhirA;
          case 'akhir-asc':
            return akhirA - akhirB;
          case 'nama-asc':
            return a.kabupaten.localeCompare(b.kabupaten);
          default:
            return 0;
        }
      });
  }, [data, searchQuery, selectedStatus, selectedProvinsi, sortBy]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <img
                src="/images/logo-bnpb.png"
                alt="BNPB"
                className="h-6 sm:h-8 w-auto object-contain"
              />
              <img
                src="/images/logo-usk.webp"
                alt="USK"
                className="h-5 sm:h-7 w-auto object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-sm sm:text-base md:text-lg text-slate-900 leading-tight truncate">
                  Ina PDRI 2026
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Rekap Kenaikan
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden sm:block">
                Rekapitulasi Kenaikan Nilai Indeks Pemulihan Pascabencana ((T+n) - T0)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>
                <span className="hidden sm:inline">Buka </span>Peta GIS
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* National KPI Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight truncate">
              Total Wilayah Dikaji
            </span>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
                {nationalSummary.totalWilayah}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                Kab / Kota
              </span>
            </div>
            <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
              17 Provinsi Indonesia
            </span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight truncate">
              Rata2 Kenaikan Nasional
            </span>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600">
                +{nationalSummary.rataRataKenaikan}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-700 font-medium truncate">
                Poin
              </span>
            </div>
            <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
              ((T+n) - T0) Positif
            </span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight truncate">
              Rata2 Indeks T-Akhir
            </span>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                {nationalSummary.rataRataPerSektorTAkhir}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                Indeks
              </span>
            </div>
            <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
              Baseline T-1 = 100
            </span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight truncate">
              Status Pemulihan Akhir
            </span>
            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900">
                  {nationalSummary.totalPulih}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Pulih
                </span>
              </div>
              <span className="text-slate-300">&bull;</span>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-xl font-bold text-rose-600">
                  {nationalSummary.totalBelumPulih}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                  Belum
                </span>
              </div>
            </div>
            <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
              {((nationalSummary.totalPulih / nationalSummary.totalWilayah) * 100).toFixed(0)}% wilayah pulih
            </span>
          </div>
        </div>

        {/* Sector Increase Highlights Cards */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span>Rata-Rata Kenaikan per Sektor ((T+n) - T0)</span>
            </h3>
            <span className="text-[10px] sm:text-[11px] text-slate-500">42 Kab/Kota</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
            <div className="bg-blue-50/70 p-2.5 sm:p-3 rounded-xl border border-blue-200/80">
              <div className="flex items-center gap-1.5 text-blue-700 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Permukiman</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-blue-900">+{sectorAverages.permukiman}</span>
              <span className="block text-[9px] sm:text-[10px] text-blue-600">Kenaikan Poin</span>
            </div>

            <div className="bg-orange-50/70 p-2.5 sm:p-3 rounded-xl border border-orange-200/80">
              <div className="flex items-center gap-1.5 text-orange-700 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Infrastruktur</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-orange-900">+{sectorAverages.infrastruktur}</span>
              <span className="block text-[9px] sm:text-[10px] text-orange-600">Kenaikan Poin</span>
            </div>

            <div className="bg-emerald-50/70 p-2.5 sm:p-3 rounded-xl border border-emerald-200/80">
              <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sosial</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-emerald-900">+{sectorAverages.sosial}</span>
              <span className="block text-[9px] sm:text-[10px] text-emerald-600">Kenaikan Poin</span>
            </div>

            <div className="bg-purple-50/70 p-2.5 sm:p-3 rounded-xl border border-purple-200/80">
              <div className="flex items-center gap-1.5 text-purple-700 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Ekonomi</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-purple-900">+{sectorAverages.ekonomi}</span>
              <span className="block text-[9px] sm:text-[10px] text-purple-600">Kenaikan Poin</span>
            </div>

            <div className="bg-pink-50/70 p-2.5 sm:p-3 rounded-xl border border-pink-200/80 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-pink-700 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Multisektor</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-pink-900">+{sectorAverages.multisektor}</span>
              <span className="block text-[9px] sm:text-[10px] text-pink-600">Kenaikan Poin</span>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          {/* Filter Header with Reset Button (Header only) */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Filter &amp; Urutan Tabel
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Filter Controls: Stacked on Mobile, Single Row on Desktop (lg+) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
            {/* 1. Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Kabupaten atau Provinsi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  aria-label="Hapus teks pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Tab Select (Status Filter) */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setSelectedStatus('ALL')}
                className={`flex-1 lg:flex-initial px-2.5 py-1.5 rounded-lg font-medium transition text-center ${
                  selectedStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({data.length})
              </button>
              <button
                onClick={() => setSelectedStatus('Pulih')}
                className={`flex-1 lg:flex-initial px-2.5 py-1.5 rounded-lg font-medium transition text-center ${
                  selectedStatus === 'Pulih'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pulih ({nationalSummary.totalPulih})
              </button>
              <button
                onClick={() => setSelectedStatus('Belum Pulih')}
                className={`flex-1 lg:flex-initial px-2.5 py-1.5 rounded-lg font-medium transition text-center ${
                  selectedStatus === 'Belum Pulih'
                    ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum ({nationalSummary.totalBelumPulih})
              </button>
            </div>

            {/* 3. Provinsi Dropdown & 4. Kenaikan Sort Dropdown */}
            <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center shrink-0">
              {/* Provinsi Dropdown */}
              <div className="relative w-full lg:w-48">
                <select
                  value={selectedProvinsi}
                  onChange={(e) => setSelectedProvinsi(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs truncate"
                >
                  <option value="ALL">Semua Provinsi (17)</option>
                  {provinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative w-full lg:w-52">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs truncate"
                >
                  <option value="kenaikan-desc">Kenaikan Tertinggi &darr;</option>
                  <option value="kenaikan-asc">Kenaikan Terendah &uarr;</option>
                  <option value="akhir-desc">Indeks Akhir Tertinggi &darr;</option>
                  <option value="akhir-asc">Indeks Akhir Terendah &uarr;</option>
                  <option value="nama-asc">Nama Kabupaten (A-Z)</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 px-1 gap-1">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredData.length}</strong> dari {data.length} Kabupaten/Kota
          </span>
          <span className="text-[11px] text-slate-400">
            Geser tabel ke samping &rarr; &bull; Klik baris untuk deret waktu (T-1 s/d T+4)
          </span>
        </div>

        {/* Main Comprehensive Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold text-[11px] whitespace-nowrap">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-4">Kabupaten / Kota</th>
                  <th className="py-3 px-3">Provinsi</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Permukiman</th>
                  <th className="py-3 px-3 text-center">Infrastruktur</th>
                  <th className="py-3 px-3 text-center">Sosial</th>
                  <th className="py-3 px-3 text-center">Ekonomi</th>
                  <th className="py-3 px-3 text-center">Multisektor</th>
                  <th className="py-3 px-3 text-center bg-blue-50/50 text-blue-900 font-bold">
                    Rata2 Akhir
                  </th>
                  <th className="py-3 px-3 text-center bg-emerald-50/50 text-emerald-900 font-bold">
                    Kenaikan ((T+n)-T0)
                  </th>
                  <th className="py-3 px-3 text-center w-12">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white whitespace-nowrap">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <p>Tidak ada wilayah yang cocok dengan filter pencarian.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold border border-blue-200 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Semua Filter</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => {
                    const isExpanded = expandedId === item.id;
                    const isPulih = item.kesimpulan.toLowerCase() === 'pulih';
                    const kenaikanVal = item.kenaikan.rataRata ?? 0;

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => toggleExpand(item.id)}
                          className={`hover:bg-slate-50 transition cursor-pointer ${
                            isExpanded ? 'bg-slate-50/80 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {item.kabupaten}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {item.provinsi}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isPulih
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {item.kesimpulan}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            {item.nilaiTAkhir.permukiman ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            {item.nilaiTAkhir.infrastruktur ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            {item.nilaiTAkhir.sosial ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            {item.nilaiTAkhir.ekonomi ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            {item.nilaiTAkhir.multisektor ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/30">
                            {item.nilaiTAkhir.rataRata ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold bg-emerald-50/30">
                            <span
                              className={`inline-block px-2 py-0.5 rounded ${
                                kenaikanVal >= 0
                                  ? 'text-emerald-700 bg-emerald-100/60'
                                  : 'text-rose-700 bg-rose-100/60'
                              }`}
                            >
                              {kenaikanVal >= 0 ? `+${kenaikanVal.toFixed(2)}` : kenaikanVal.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-blue-600 inline" />
                            ) : (
                              <ChevronDown className="w-4 h-4 inline" />
                            )}
                          </td>
                        </tr>

                        {/* Expanded Time Series Details */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90">
                            <td colSpan={12} className="p-4 sm:p-5 border-y border-slate-200">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-900">
                                      Rincian Deret Waktu Pemulihan: {item.kabupaten} ({item.provinsi})
                                    </h4>
                                    <span className="text-[11px] text-slate-500">
                                      Perkembangan indeks per sektor dari masa Pra-Bencana (T-1) hingga Pasca Bencana (T+4)
                                    </span>
                                  </div>
                                  <Link
                                    href={`/?provinsi=${encodeURIComponent(item.provinsi)}&kabupaten=${encodeURIComponent(item.kabupaten)}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Tampilkan di Peta GIS</span>
                                  </Link>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                                    <thead>
                                      <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 text-[11px]">
                                        <th className="py-2 px-3">Sektor</th>
                                        <th className="py-2 px-2 text-center">T-1 (Pra)</th>
                                        <th className="py-2 px-2 text-center">T0 (Tanggap)</th>
                                        <th className="py-2 px-2 text-center">T+1</th>
                                        <th className="py-2 px-2 text-center">T+2</th>
                                        <th className="py-2 px-2 text-center">T+3</th>
                                        <th className="py-2 px-2 text-center">T+4</th>
                                        <th className="py-2 px-2 text-center bg-blue-50/50 font-bold text-blue-900">
                                          Nilai T-Akhir
                                        </th>
                                        <th className="py-2 px-2 text-center bg-emerald-50/50 font-bold text-emerald-900">
                                          Kenaikan ((T+n)-T0)
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(
                                        [
                                          { key: 'permukiman', label: '1. Permukiman' },
                                          { key: 'infrastruktur', label: '2. Infrastruktur' },
                                          { key: 'sosial', label: '3. Sosial' },
                                          { key: 'ekonomi', label: '4. Ekonomi' },
                                          { key: 'multisektor', label: '5. Multisektor' },
                                        ] as const
                                      ).map((sec) => {
                                        const sData = item.series[sec.key];
                                        const tAkhir = item.nilaiTAkhir[sec.key];
                                        const kenaikanSec = item.kenaikan[sec.key];

                                        return (
                                          <tr key={sec.key} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 font-medium text-slate-800">
                                              {sec.label}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-500">
                                              {sData.t_min_1 ?? '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-500">
                                              {sData.t_0 ?? '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-500">
                                              {sData.t_plus_1 ?? '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-500">
                                              {sData.t_plus_2 ?? '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-500">
                                              {sData.t_plus_3 ?? '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-500">
                                              {sData.t_plus_4 ?? '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                                              {tAkhir ?? '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono font-bold bg-emerald-50/20">
                                              {kenaikanSec !== null && kenaikanSec !== undefined ? (
                                                <span
                                                  className={
                                                    kenaikanSec >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                                  }
                                                >
                                                  {kenaikanSec >= 0
                                                    ? `+${kenaikanSec.toFixed(2)}`
                                                    : kenaikanSec.toFixed(2)}
                                                </span>
                                              ) : (
                                                '-'
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informational Guidance Note */}
        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 text-xs text-slate-600 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-800">Catatan Metodologi Kenaikan Indeks Ina PDRI:</span>
            <p>
              Nilai kenaikan dihitung dari selisih antara nilai pemulihan pada periode akhir evaluasi $(T+n)$ dengan periode tanggap darurat bencana $(T_0)$. Nilai baseline pra-bencana $(T_{-1})$ bernilai 100. Wilayah dengan status <strong>Pulih</strong> mencapai rata-rata indeks akhir &ge; 100.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span>Ina PDRI 2026 &bull; Rekap Kenaikan</span>
        </div>
        <div>
          <a
            href="https://lifeofrifai.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 hover:underline transition-colors font-medium text-slate-700"
          >
            lifeofrifai
          </a>{' '}
          &copy; 2026
        </div>
      </footer>
    </div>
  );
}
