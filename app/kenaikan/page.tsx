import fs from 'fs/promises';
import path from 'path';
import type { Metadata } from 'next';
import KenaikanDashboard from '@/components/kenaikan/KenaikanDashboard';
import { RekapKenaikanDoc } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Rekap Kenaikan Indeks Pemulihan - Ina PDRI 2026',
  description:
    'Rekapitulasi Kenaikan Nilai Indeks Pemulihan Pascabencana Per Sektor dan Wilayah Kabupaten/Kota di Indonesia',
};

export default async function KenaikanPage() {
  'use cache';
  const filePath = path.join(process.cwd(), 'public', 'data', 'ina_pdri_kenaikan.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const kenaikanData: RekapKenaikanDoc = JSON.parse(raw);

  return <KenaikanDashboard kenaikanData={kenaikanData} />;
}
