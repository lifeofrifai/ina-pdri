'use client';

import React from 'react';
import { InaPdriFeature } from '@/lib/types';
import {
  X,
  MapPin,
  Mountain,
  Calendar,
  User,
  Copy,
  Check,
  Compass,
} from 'lucide-react';

interface DetailDrawerProps {
  feature: InaPdriFeature | null;
  onClose: () => void;
}

export default function DetailDrawer({ feature, onClose }: DetailDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!feature) return null;

  const p = feature.properties;
  const [lng, lat, alt] = feature.geometry.coordinates;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl flex flex-col text-slate-800 transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: p.color || '#3B82F6' }}
          />
          <h2 className="font-semibold text-lg text-slate-900 truncate">
            {p.desa || 'Titik Survey'}, {p.kabupaten}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Tutup Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Disaster & Year Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-xs"
            style={{ backgroundColor: p.color || '#3B82F6' }}
          >
            {p.jenisBencana}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Tahun Bencana: {p.tahunBencana}
          </span>
          {p.altitude !== undefined && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs">
              <Mountain className="w-3.5 h-3.5 text-amber-600" />
              Elevasi: {p.altitude} m dpl
            </span>
          )}
        </div>

        {/* Location Section */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
            <MapPin className="w-4 h-4" />
            <span>Lokasi Administratif</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Provinsi:</span>
              <span className="text-slate-800 font-medium text-right">{p.provinsi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kabupaten/Kota:</span>
              <span className="text-slate-800 font-medium text-right">{p.kabupaten}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kecamatan:</span>
              <span className="text-slate-800 font-medium text-right">{p.kecamatan || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Desa/Kelurahan:</span>
              <span className="text-slate-800 font-medium text-right">{p.desa || '-'}</span>
            </div>
            {p.alamat && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-xs mb-1">Alamat/Kampung:</span>
                <p className="text-slate-700 text-xs italic bg-white p-2.5 rounded border border-slate-200 shadow-2xs">
                  {p.alamat}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coordinates Section */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
              <Compass className="w-4 h-4" />
              <span>Koordinat Geografis</span>
            </div>
            <button
              onClick={handleCopyCoords}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">Latitude</span>
              <span className="font-mono text-slate-800 font-semibold">{lat.toFixed(6)}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">Longitude</span>
              <span className="font-mono text-slate-800 font-semibold">{lng.toFixed(6)}</span>
            </div>
          </div>
        </div>

        {/* Survey Metadata */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium mb-1">
            <User className="w-3.5 h-3.5" />
            <span>Petugas & Verifikasi Survey</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Petugas Survey:</span>
            <span className="text-slate-800 font-medium">{p.petugas || 'Tidak tercatat'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal Survey:</span>
            <span className="text-slate-800 font-medium">{p.tanggalSurvey || '-'}</span>
          </div>
          {p.precision > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Akurasi GPS:</span>
              <span className="text-slate-800 font-medium">&plusmn;{p.precision} meter</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
