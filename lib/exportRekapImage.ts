import { RekapData } from '@/lib/types';

interface ExportRekapImageOptions {
  title: string;
  level?: 'kabupaten' | 'provinsi';
  rekap: RekapData;
  totalSurveyPoints?: number;
}

export const SECTOR_PALETTE: Record<
  string,
  { label: string; color: string }
> = {
  PEMUKIMAN: { label: 'Pemukiman', color: '#2563EB' }, // Blue
  INFRASTRUKTUR: { label: 'Infrastruktur', color: '#EA580C' }, // Orange
  SOSIAL: { label: 'Sosial', color: '#059669' }, // Emerald
  EKONOMI: { label: 'Ekonomi', color: '#7C3AED' }, // Purple
  'LINTAS SEKTOR': { label: 'Lintas Sektor', color: '#DB2777' }, // Pink
};

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

/**
 * Draws an image preserving its exact natural aspect ratio (object-fit: contain).
 * Prevents stretching or squishing of vertical (BNPB) or horizontal (USK) logos.
 */
function drawImageAspectContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  if (!nw || !nh) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  const imgRatio = nw / nh;
  const targetRatio = w / h;

  let drawW = w;
  let drawH = h;
  if (imgRatio > targetRatio) {
    drawW = w;
    drawH = w / imgRatio;
  } else {
    drawH = h;
    drawW = h * imgRatio;
  }

  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function exportRekapToImage({
  title,
  level = 'kabupaten',
  rekap,
  totalSurveyPoints = 0,
}: ExportRekapImageOptions): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const scale = 2; // High-DPI 2x resolution
  const width = 1000;
  const height = 1030;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle border around entire canvas
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  const paddingX = 36;
  const contentWidth = width - paddingX * 2; // 928px

  // 2. Preload logos
  const [logoBnpb, logoUsk] = await Promise.all([
    loadImage('/images/logo-bnpb.png'),
    loadImage('/images/logo-usk.webp'),
  ]);

  // Top Logos Card
  const logoBoxWidth = 148;
  const logoBoxHeight = 52;
  const logoBoxX = paddingX;
  const logoBoxY = 28;

  ctx.fillStyle = '#FFFFFF';
  drawRoundRect(ctx, logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 10);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 10);
  ctx.stroke();

  // Draw BNPB Logo (Vertical shield ~0.8 aspect ratio, cleanly contained)
  if (logoBnpb) {
    drawImageAspectContain(ctx, logoBnpb, logoBoxX + 8, logoBoxY + 5, 46, 42);
  }

  // Divider between logos
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(logoBoxX + 60, logoBoxY + 10);
  ctx.lineTo(logoBoxX + 60, logoBoxY + 42);
  ctx.stroke();

  // Draw USK Logo (Horizontal wide ~2.17 aspect ratio, cleanly contained)
  if (logoUsk) {
    drawImageAspectContain(ctx, logoUsk, logoBoxX + 66, logoBoxY + 6, 74, 40);
  }

  // Header Title & Badge
  const titleX = logoBoxX + logoBoxWidth + 18;
  const titleY = logoBoxY + 22;

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px Inter, Arial, sans-serif';
  ctx.fillText(`Indeks Pemulihan Pascabencana: ${title}`, titleX, titleY);

  // Badge Kab/Kota
  const titleWidth = ctx.measureText(`Indeks Pemulihan Pascabencana: ${title}`).width;
  const badgeX = titleX + titleWidth + 12;
  const badgeY = titleY - 14;
  const badgeW = level === 'kabupaten' ? 76 : 68;
  const badgeH = 19;

  ctx.fillStyle = '#DBEAFE';
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 5);
  ctx.fill();
  ctx.strokeStyle = '#93C5FD';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 5);
  ctx.stroke();

  ctx.fillStyle = '#1E40AF';
  ctx.font = 'bold 10px Inter, Arial, sans-serif';
  ctx.fillText(
    level === 'kabupaten' ? 'KAB / KOTA' : 'PROVINSI',
    badgeX + (level === 'kabupaten' ? 8 : 10),
    badgeY + 13
  );

  // Subtitle
  ctx.fillStyle = '#64748B';
  ctx.font = '12px Inter, Arial, sans-serif';
  ctx.fillText(
    'Perbandingan multi-sektoral per tahun pemulihan (T-1 hingga T+4)',
    titleX,
    titleY + 20
  );

  // Header Divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, 94);
  ctx.lineTo(width - paddingX, 94);
  ctx.stroke();

  // 3. Status Progression & Points Banner
  const bannerY = 106;
  const bannerH = 54;
  ctx.fillStyle = '#F8FAFC';
  drawRoundRect(ctx, paddingX, bannerY, contentWidth, bannerH, 10);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, paddingX, bannerY, contentWidth, bannerH, 10);
  ctx.stroke();

  // Status Left
  ctx.fillStyle = '#64748B';
  ctx.font = '11px Inter, Arial, sans-serif';
  ctx.fillText('Status Pemulihan Keseluruhan:', paddingX + 16, bannerY + 20);

  const statusText = rekap.statusSeries?.t_0 || 'Pulih';
  const isPulih = !statusText.toLowerCase().includes('belum');
  ctx.fillStyle = isPulih ? '#059669' : '#DC2626';
  ctx.font = 'bold 15px Inter, Arial, sans-serif';
  ctx.fillText(statusText, paddingX + 16, bannerY + 41);

  // Total Points Right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748B';
  ctx.font = '11px Inter, Arial, sans-serif';
  ctx.fillText('Total Titik Survey Lapangan:', width - paddingX - 16, bannerY + 20);

  ctx.fillStyle = '#2563EB';
  ctx.font = 'bold 15px Inter, Arial, sans-serif';
  ctx.fillText(`${totalSurveyPoints} Titik Terdata`, width - paddingX - 16, bannerY + 41);
  ctx.textAlign = 'left';

  // 4. Chart Section
  const chartSectionY = 176;
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px Inter, Arial, sans-serif';
  ctx.fillText('Grafik Tren Pemulihan 5 Sektor (T-1 s/d T+4)', paddingX, chartSectionY);

  // Chart Legend
  const legendSectorEntries = Object.entries(SECTOR_PALETTE);
  let legendX = paddingX + 320;
  legendSectorEntries.forEach(([_, meta]) => {
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(legendX, chartSectionY - 4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '11px Inter, Arial, sans-serif';
    ctx.fillText(meta.label, legendX + 9, chartSectionY);
    legendX += ctx.measureText(meta.label).width + 24;
  });

  // Chart Box Container
  const chartBoxY = 190;
  const chartBoxH = 260;
  ctx.fillStyle = '#FFFFFF';
  drawRoundRect(ctx, paddingX, chartBoxY, contentWidth, chartBoxH, 10);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, paddingX, chartBoxY, contentWidth, chartBoxH, 10);
  ctx.stroke();

  // Plot Area inside chart box
  const plotX = paddingX + 50;
  const plotY = chartBoxY + 20;
  const plotW = contentWidth - 70; // 858px
  const plotH = chartBoxH - 52; // 208px

  // Calculate dynamic scale from data
  let minVal = 80;
  let maxVal = 120;
  const periods = [
    { label: 'T-1 (Pra)', key: 't_min_1' as const },
    { label: 'T-0 (Tanggap)', key: 't_0' as const },
    { label: 'T+1', key: 't_plus_1' as const },
    { label: 'T+2', key: 't_plus_2' as const },
    { label: 'T+3', key: 't_plus_3' as const },
    { label: 'T+4', key: 't_plus_4' as const },
  ];

  Object.values(rekap.sectors).forEach((s) => {
    periods.forEach((p) => {
      const v = s[p.key];
      if (typeof v === 'number') {
        if (v < minVal) minVal = Math.floor(v - 5);
        if (v > maxVal) maxVal = Math.ceil(v + 5);
      }
    });
  });

  minVal = Math.max(0, Math.floor(minVal / 20) * 20);
  maxVal = Math.max(120, Math.ceil(maxVal / 20) * 20);

  const getYCoord = (val: number) => {
    return plotY + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
  };

  // Horizontal Grid Lines & Y-axis labels
  const step = 20;
  for (let val = minVal; val <= maxVal; val += step) {
    const yPos = getYCoord(val);

    ctx.strokeStyle = val === 100 ? '#FCA5A5' : '#F1F5F9';
    ctx.lineWidth = val === 100 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(plotX, yPos);
    ctx.lineTo(plotX + plotW, yPos);
    ctx.stroke();

    ctx.fillStyle = val === 100 ? '#DC2626' : '#94A3B8';
    ctx.font = val === 100 ? 'bold 10px Inter, Arial, sans-serif' : '10px Inter, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${val}`, plotX - 8, yPos + 3.5);
    ctx.textAlign = 'left';
  }

  // Draw Baseline 100 label
  const baselineY = getYCoord(100);
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 9px Inter, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Baseline 100', plotX + plotW - 4, baselineY - 4);
  ctx.textAlign = 'left';

  // Grouped Bars for 6 periods
  const groupWidth = plotW / periods.length;
  const barWidth = 14;
  const barGap = 3;
  const totalGroupBarsWidth = 5 * barWidth + 4 * barGap; // 82px

  periods.forEach((p, pIdx) => {
    const groupCenterX = plotX + pIdx * groupWidth + groupWidth / 2;
    const startX = groupCenterX - totalGroupBarsWidth / 2;

    legendSectorEntries.forEach(([sKey, meta], sIdx) => {
      const sData = rekap.sectors[sKey];
      const val = sData ? sData[p.key] : null;

      if (typeof val === 'number') {
        const barX = startX + sIdx * (barWidth + barGap);
        const barY = getYCoord(val);
        const zeroY = getYCoord(Math.max(minVal, 0));
        const barH = zeroY - barY;

        ctx.fillStyle = meta.color;
        drawRoundRect(ctx, barX, barY, barWidth, Math.max(2, barH), 3);
        ctx.fill();
      }
    });

    // X Axis Label
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, groupCenterX, plotY + plotH + 18);
    ctx.textAlign = 'left';
  });

  // 5. Data Table Section
  const tableSectionY = 478;
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px Inter, Arial, sans-serif';
  ctx.fillText('Tabel Rincian Indeks Pemulihan per Sektor', paddingX, tableSectionY);

  const tableY = 492;
  const headerH = 32;
  const rowH = 31;
  const overallH = 34;
  const tableRowsCount = 5;
  const totalTableH = headerH + tableRowsCount * rowH + overallH;

  // Table Outer Box
  ctx.fillStyle = '#FFFFFF';
  drawRoundRect(ctx, paddingX, tableY, contentWidth, totalTableH, 10);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, paddingX, tableY, contentWidth, totalTableH, 10);
  ctx.stroke();

  // Columns definition (total = 928px)
  const cols = [
    { label: 'Sektor', width: 228, align: 'left' as const },
    { label: 'T-1', width: 75, align: 'center' as const },
    { label: 'T-0', width: 75, align: 'center' as const },
    { label: 'T+1', width: 75, align: 'center' as const },
    { label: 'T+2', width: 75, align: 'center' as const },
    { label: 'T+3', width: 75, align: 'center' as const },
    { label: 'T+4', width: 75, align: 'center' as const },
    { label: 'Rata-rata', width: 100, align: 'center' as const },
    { label: 'Status', width: 150, align: 'center' as const },
  ];

  // Table Header Background
  ctx.fillStyle = '#F1F5F9';
  drawRoundRect(ctx, paddingX, tableY, contentWidth, headerH, 10);
  ctx.fill();
  // Fill square bottom for header so top corners remain rounded
  ctx.fillRect(paddingX, tableY + headerH - 10, contentWidth, 10);

  // Table Header Text
  let colX = paddingX;
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 11px Inter, Arial, sans-serif';
  cols.forEach((col) => {
    if (col.align === 'left') {
      ctx.fillText(col.label, colX + 16, tableY + 20);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(col.label, colX + col.width / 2, tableY + 20);
      ctx.textAlign = 'left';
    }
    colX += col.width;
  });

  // Table Data Rows
  let curRowY = tableY + headerH;
  legendSectorEntries.forEach(([sKey, meta], idx) => {
    const sData = rekap.sectors[sKey];

    // Alternating background
    if (idx % 2 === 1) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(paddingX, curRowY, contentWidth, rowH);
    }

    // Border bottom
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, curRowY + rowH);
    ctx.lineTo(width - paddingX, curRowY + rowH);
    ctx.stroke();

    // Col 1: Sektor with colored bullet
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(paddingX + 18, curRowY + rowH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E293B';
    ctx.font = '500 12px Inter, Arial, sans-serif';
    ctx.fillText(meta.label, paddingX + 30, curRowY + 19.5);

    // Period values
    let cellX = paddingX + cols[0].width;
    const timeKeys = ['t_min_1', 't_0', 't_plus_1', 't_plus_2', 't_plus_3', 't_plus_4'] as const;

    timeKeys.forEach((tKey, tIdx) => {
      const colW = cols[1 + tIdx].width;
      const val = sData ? sData[tKey] : null;

      ctx.fillStyle = '#475569';
      ctx.font = '11.5px monospace, Courier, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        val !== null && val !== undefined ? `${val}` : '-',
        cellX + colW / 2,
        curRowY + 19.5
      );
      ctx.textAlign = 'left';
      cellX += colW;
    });

    // Average
    const avgVal = sData ? sData.avg : null;
    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 12px monospace, Courier, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      avgVal !== null && avgVal !== undefined ? `${avgVal}` : '-',
      cellX + cols[7].width / 2,
      curRowY + 19.5
    );
    ctx.textAlign = 'left';
    cellX += cols[7].width;

    // Status Pill
    const rowStatus = sData?.status || 'Pulih';
    const rowIsPulih = !rowStatus.toLowerCase().includes('belum');
    const pillW = 74;
    const pillH = 19;
    const pillX = cellX + (cols[8].width - pillW) / 2;
    const pillY = curRowY + (rowH - pillH) / 2;

    ctx.fillStyle = rowIsPulih ? '#ECFDF5' : '#FFF1F2';
    drawRoundRect(ctx, pillX, pillY, pillW, pillH, 5);
    ctx.fill();
    ctx.strokeStyle = rowIsPulih ? '#A7F3D0' : '#FECDD3';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, pillX, pillY, pillW, pillH, 5);
    ctx.stroke();

    ctx.fillStyle = rowIsPulih ? '#065F46' : '#9F1239';
    ctx.font = 'bold 10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rowStatus, pillX + pillW / 2, pillY + 13);
    ctx.textAlign = 'left';

    curRowY += rowH;
  });

  // Overall Row: Indeks Rata2 Pertahun
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(paddingX, curRowY, contentWidth, overallH);
  ctx.strokeStyle = '#BFDBFE';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(paddingX, curRowY);
  ctx.lineTo(width - paddingX, curRowY);
  ctx.stroke();

  // Title Overall
  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 12px Inter, Arial, sans-serif';
  ctx.fillText('Indeks Rata2 Pertahun', paddingX + 16, curRowY + 21);

  let overallCellX = paddingX + cols[0].width;
  const timeKeys = ['t_min_1', 't_0', 't_plus_1', 't_plus_2', 't_plus_3', 't_plus_4'] as const;

  timeKeys.forEach((tKey, tIdx) => {
    const colW = cols[1 + tIdx].width;
    const val = rekap.overallSeries ? rekap.overallSeries[tKey] : null;

    ctx.fillStyle = '#1D4ED8';
    ctx.font = 'bold 12px monospace, Courier, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      val !== null && val !== undefined ? `${val}` : '-',
      overallCellX + colW / 2,
      curRowY + 21
    );
    ctx.textAlign = 'left';
    overallCellX += colW;
  });

  // Overall avg dash
  ctx.fillStyle = '#1D4ED8';
  ctx.textAlign = 'center';
  ctx.fillText('-', overallCellX + cols[7].width / 2, curRowY + 21);
  ctx.textAlign = 'left';
  overallCellX += cols[7].width;

  // Overall Status
  const overallStatus = rekap.statusSeries?.t_0 || 'Pulih';
  const overallIsPulih = !overallStatus.toLowerCase().includes('belum');
  ctx.fillStyle = overallIsPulih ? '#059669' : '#DC2626';
  ctx.font = 'bold 12px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(overallStatus, overallCellX + cols[8].width / 2, curRowY + 21);
  ctx.textAlign = 'left';

  // 6. Methodology Note Box
  const noteY = tableY + totalTableH + 18;
  const noteH = 50;
  ctx.fillStyle = '#EFF6FF';
  drawRoundRect(ctx, paddingX, noteY, contentWidth, noteH, 8);
  ctx.fill();
  ctx.strokeStyle = '#BFDBFE';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, paddingX, noteY, contentWidth, noteH, 8);
  ctx.stroke();

  ctx.fillStyle = '#1E40AF';
  ctx.font = 'bold 11px Inter, Arial, sans-serif';
  ctx.fillText('Catatan Metodologi Ina PDRI:', paddingX + 14, noteY + 18);

  ctx.fillStyle = '#475569';
  ctx.font = '10.5px Inter, Arial, sans-serif';
  ctx.fillText(
    'Nilai baseline T-1 bernilai 100 sebagai patokan pra-bencana. Nilai setelahnya (T0 hingga T+4) menggambarkan pemulihan kondisi perumahan,',
    paddingX + 14,
    noteY + 32
  );
  ctx.fillText(
    'akses infrastruktur umum, roda perekonomian warga, serta keharmonisan sosial di tingkat kabupaten/kota.',
    paddingX + 14,
    noteY + 44
  );

  // 7. Footer Watermark
  const footerY = height - 20;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px Inter, Arial, sans-serif';
  ctx.fillText(
    'Ina PDRI 2026 • Badan Nasional Penanggulangan Bencana (BNPB) & Universitas Syiah Kuala (USK)',
    paddingX,
    footerY
  );

  ctx.textAlign = 'right';
  ctx.fillText('lifeofrifai © 2026', width - paddingX, footerY);
  ctx.textAlign = 'left';

  // 8. Convert to blob and trigger download
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Ina-PDRI-2026-${safeTitle}-Rekap.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}
