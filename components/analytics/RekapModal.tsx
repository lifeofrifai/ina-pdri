'use client';

import React, { useState } from 'react';
import { ProvinceSummary, RekapData } from '@/lib/types';
import { X, Activity, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react';
import RekapChart from './RekapChart';
import { exportRekapToImage } from '@/lib/exportRekapImage';

interface RekapModalProps {
  title?: string;
  level?: 'provinsi' | 'kabupaten';
  rekap?: RekapData | null;
  totalSurveyPoints?: number;
  summary?: ProvinceSummary | null;
  onClose: () => void;
}

export default function RekapModal({
  title,
  level = 'provinsi',
  rekap: propRekap,
  totalSurveyPoints: propTotalPoints,
  summary,
  onClose,
}: RekapModalProps) {
  // Resolve rekap data and title
  const activeRekap = propRekap || summary?.rekap;
  if (!activeRekap) return null;

  const displayTitle =
    title ||
    (summary ? `Provinsi ${summary.provinsi}` : 'Rekap Indeks Pemulihan');

  const totalPoints =
    propTotalPoints !== undefined
      ? propTotalPoints
      : summary?.totalSurveyPoints || 0;

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!activeRekap) return;
    try {
      setIsDownloading(true);
      await exportRekapToImage({
        title: displayTitle,
        level,
        rekap: activeRekap,
        totalSurveyPoints: totalPoints,
      });
    } catch (err) {
      console.error('Failed to export rekap image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const { sectors, overallSeries, statusSeries } = activeRekap;
  const timeLabels = ['T-1', 'T-0', 'T+1', 'T+2', 'T+3', 'T+4'];
  const timeKeys = [
    't_min_1',
    't_0',
    't_plus_1',
    't_plus_2',
    't_plus_3',
    't_plus_4',
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  Indeks Pemulihan Pascabencana: {displayTitle}
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {level === 'kabupaten' ? 'Kab / Kota' : 'Provinsi'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan multi-sektoral per tahun pemulihan (T-1 hingga T+4)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800 text-xs">
          {/* Status Progression Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-slate-500 block text-[11px] mb-0.5">
                Status Pemulihan Keseluruhan:
              </span>
              {(() => {
                const overallStatus = statusSeries?.t_0 || 'Pulih';
                const isPulih = !overallStatus.toLowerCase().includes('belum');
                return (
                  <div className="flex items-center gap-2">
                    {isPulih ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span
                      className={`font-bold text-sm ${
                        isPulih ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {overallStatus}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px] mb-0.5">
                Total Titik Survey Lapangan:
              </span>
              <span className="font-bold text-sm text-blue-600">
                {totalPoints} Titik Terdata
              </span>
            </div>
          </div>

          {/* Graphical Visualization (From Excel) */}
          <RekapChart rekap={activeRekap} />

          {/* Sector Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold text-[11px]">
                  <th className="py-2 px-3">Sektor</th>
                  {timeLabels.map((t) => (
                    <th key={t} className="py-2 px-2 text-center">
                      {t}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center">Rata-rata</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {Object.entries(sectors).map(([sectorName, s]) => (
                  <tr key={sectorName} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {sectorName}
                    </td>
                    {timeKeys.map((k) => (
                      <td
                        key={k}
                        className="py-2 px-2 text-center font-mono text-slate-600"
                      >
                        {s[k] !== null && s[k] !== undefined ? s[k] : '-'}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center font-mono font-bold text-blue-600">
                      {s.avg !== null && s.avg !== undefined ? s.avg : '-'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.status?.toLowerCase().includes('belum')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {s.status || 'Pulih'}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Overall Row */}
                {overallSeries && (
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td className="py-2.5 px-3 text-blue-700">
                      Indeks Rata2 Pertahun
                    </td>
                    {timeKeys.map((k) => (
                      <td
                        key={k}
                        className="py-2.5 px-2 text-center font-mono text-blue-700"
                      >
                        {overallSeries[k] !== null &&
                        overallSeries[k] !== undefined
                          ? overallSeries[k]
                          : '-'}
                      </td>
                    ))}
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700">
                      -
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        !(statusSeries?.t_0 || 'Pulih').toLowerCase().includes('belum')
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {statusSeries?.t_0 || 'Pulih'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200/80 text-[11px] text-slate-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Nilai indeks baseline T-1 bernilai 100 sebagai patokan pra-bencana. Nilai setelahnya (T0 hingga T+4)
              menggambarkan pemulihan kondisi perumahan, akses fasilitas umum, roda perekonomian warga, serta keharmonisan sosial.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Ina PDRI 2026 &bull; Evaluasi Pemulihan Bencana Indonesia
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? 'Menyiapkan...' : 'Unduh Gambar (PNG)'}</span>
            </button>
            <button
              onClick={onClose}
              className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition shadow-2xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
