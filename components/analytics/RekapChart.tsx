'use client';

import React, { useState } from 'react';
import { RekapData } from '@/lib/types';
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';

export const SECTOR_META: Record<
  string,
  { label: string; color: string; lightBg: string; textClass: string }
> = {
  PEMUKIMAN: {
    label: 'Pemukiman',
    color: '#2563EB', // Blue
    lightBg: 'bg-blue-50 border-blue-200 text-blue-700',
    textClass: 'text-blue-600',
  },
  INFRASTRUKTUR: {
    label: 'Infrastruktur',
    color: '#EA580C', // Orange
    lightBg: 'bg-orange-50 border-orange-200 text-orange-700',
    textClass: 'text-orange-600',
  },
  SOSIAL: {
    label: 'Sosial',
    color: '#059669', // Emerald
    lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    textClass: 'text-emerald-600',
  },
  EKONOMI: {
    label: 'Ekonomi',
    color: '#7C3AED', // Purple
    lightBg: 'bg-purple-50 border-purple-200 text-purple-700',
    textClass: 'text-purple-600',
  },
  'LINTAS SEKTOR': {
    label: 'Lintas Sektor',
    color: '#DB2777', // Pink
    lightBg: 'bg-pink-50 border-pink-200 text-pink-700',
    textClass: 'text-pink-600',
  },
};

interface RekapChartProps {
  rekap: RekapData;
}

export default function RekapChart({ rekap }: RekapChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [hoveredPoint, setHoveredPoint] = useState<{
    sector: string;
    period: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const periods = [
    { label: 'T-1', key: 't_min_1' as const },
    { label: 'T-0', key: 't_0' as const },
    { label: 'T+1', key: 't_plus_1' as const },
    { label: 'T+2', key: 't_plus_2' as const },
    { label: 'T+3', key: 't_plus_3' as const },
    { label: 'T+4', key: 't_plus_4' as const },
  ];

  const sectorKeys = Object.keys(SECTOR_META);

  // Find min and max values to set Y-axis scale
  let minVal = 80;
  let maxVal = 120;

  for (const sKey of sectorKeys) {
    const sData = rekap.sectors[sKey];
    if (sData) {
      for (const p of periods) {
        const val = sData[p.key];
        if (typeof val === 'number') {
          if (val < minVal) minVal = Math.floor(val - 5);
          if (val > maxVal) maxVal = Math.ceil(val + 5);
        }
      }
    }
  }

  // Ensure 100 baseline is well-positioned
  minVal = Math.max(0, Math.floor(minVal / 10) * 10);
  maxVal = Math.max(120, Math.ceil(maxVal / 10) * 10);

  // Dimensions
  const svgWidth = 640;
  const svgHeight = 260;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const getY = (val: number) => {
    return paddingTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
  };

  const baselineY = getY(100);

  // Y-axis grid ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = minVal + ((maxVal - minVal) / tickCount) * i;
    return Math.round(v);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
      {/* Chart Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            Grafik Indeks Pemulihan Pasca Bencana
          </h4>
          <span className="text-[11px] text-slate-500">
            Perbandingan 5 sektor (Baseline Pra-bencana T-1 = 100)
          </span>
        </div>

        {/* View Switcher: Bar vs Line */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              chartType === 'bar'
                ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Batang (Excel)</span>
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              chartType === 'line'
                ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Garis Tren</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={tick === 100 ? 'none' : '3,3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  className="fill-slate-400 font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Baseline Reference Line (100) */}
          <line
            x1={paddingLeft}
            y1={baselineY}
            x2={svgWidth - paddingRight}
            y2={baselineY}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
          <text
            x={svgWidth - paddingRight - 4}
            y={baselineY - 4}
            textAnchor="end"
            fontSize="9"
            fontWeight="bold"
            className="fill-slate-500"
          >
            Baseline 100
          </text>

          {/* Grouped Bar Chart Mode */}
          {chartType === 'bar' && (
            <>
              {periods.map((p, pIdx) => {
                const groupWidth = chartW / periods.length;
                const groupX = paddingLeft + pIdx * groupWidth;
                const barWidth = (groupWidth * 0.76) / sectorKeys.length;
                const startX = groupX + (groupWidth * 0.24) / 2;

                return (
                  <g key={p.key}>
                    {sectorKeys.map((sKey, sIdx) => {
                      const sMeta = SECTOR_META[sKey];
                      const val = rekap.sectors[sKey]?.[p.key];
                      if (typeof val !== 'number') return null;

                      const barX = startX + sIdx * barWidth;
                      const barY = getY(val);
                      const baseZeroY = getY(minVal);
                      const barH = Math.max(2, baseZeroY - barY);

                      return (
                        <rect
                          key={sKey}
                          x={barX}
                          y={barY}
                          width={barWidth - 1.5}
                          height={barH}
                          fill={sMeta.color}
                          rx="1.5"
                          className="transition-all duration-150 hover:opacity-85 cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              sector: sMeta.label,
                              period: p.label,
                              value: val,
                              x: barX + barWidth / 2,
                              y: barY,
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    })}

                    {/* Period Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - paddingBottom + 16}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      className="fill-slate-700"
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Line Chart Mode */}
          {chartType === 'line' && (
            <>
              {/* Category X labels */}
              {periods.map((p, pIdx) => {
                const stepX = chartW / (periods.length - 1);
                const x = paddingLeft + pIdx * stepX;
                return (
                  <text
                    key={p.key}
                    x={x}
                    y={svgHeight - paddingBottom + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    className="fill-slate-700"
                  >
                    {p.label}
                  </text>
                );
              })}

              {/* Series Lines & Dots */}
              {sectorKeys.map((sKey) => {
                const sMeta = SECTOR_META[sKey];
                const sData = rekap.sectors[sKey];
                if (!sData) return null;

                const stepX = chartW / (periods.length - 1);
                const points: { x: number; y: number; val: number; pLabel: string }[] = [];

                periods.forEach((p, pIdx) => {
                  const val = sData[p.key];
                  if (typeof val === 'number') {
                    points.push({
                      x: paddingLeft + pIdx * stepX,
                      y: getY(val),
                      val,
                      pLabel: p.label,
                    });
                  }
                });

                if (points.length < 2) return null;

                const pathData = points
                  .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                  .join(' ');

                return (
                  <g key={sKey}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={sMeta.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((pt) => (
                      <circle
                        key={pt.pLabel}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="#FFFFFF"
                        stroke={sMeta.color}
                        strokeWidth="2"
                        className="cursor-pointer transition hover:scale-125"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            sector: sMeta.label,
                            period: pt.pLabel,
                            value: pt.val,
                            x: pt.x,
                            y: pt.y,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Rata-Rata Overall Line (Dashed) */}
              {rekap.overallSeries && (
                (() => {
                  const stepX = chartW / (periods.length - 1);
                  const pts: { x: number; y: number }[] = [];
                  periods.forEach((p, pIdx) => {
                    const val = rekap.overallSeries[p.key];
                    if (typeof val === 'number') {
                      pts.push({
                        x: paddingLeft + pIdx * stepX,
                        y: getY(val),
                      });
                    }
                  });
                  if (pts.length < 2) return null;
                  const pathData = pts
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                    .join(' ');

                  return (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      className="opacity-60"
                    />
                  );
                })()
              )}
            </>
          )}

          {/* Floating Tooltip */}
          {hoveredPoint && (
            <g
              transform={`translate(${Math.min(
                svgWidth - 110,
                Math.max(50, hoveredPoint.x - 50)
              )}, ${Math.max(10, hoveredPoint.y - 38)})`}
            >
              <rect
                width="100"
                height="32"
                rx="6"
                fill="#0F172A"
                className="shadow-md"
              />
              <text
                x="50"
                y="13"
                textAnchor="middle"
                fontSize="9"
                fontWeight="medium"
                fill="#CBD5E1"
              >
                {hoveredPoint.sector} ({hoveredPoint.period})
              </text>
              <text
                x="50"
                y="26"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#FFFFFF"
              >
                {hoveredPoint.value.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1 border-t border-slate-100 text-[11px]">
        {sectorKeys.map((sKey) => {
          const sMeta = SECTOR_META[sKey];
          return (
            <div key={sKey} className="flex items-center gap-1.5 font-medium text-slate-700">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: sMeta.color }}
              />
              <span>{sMeta.label}</span>
            </div>
          );
        })}
        {chartType === 'line' && (
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-900 shrink-0" />
            <span>Rata-Rata</span>
          </div>
        )}
      </div>
    </div>
  );
}
