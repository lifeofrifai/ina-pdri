import fs from 'fs/promises';
import path from 'path';
import InaPdriDashboard from '@/components/InaPdriDashboard';
import { InaPdriGeoJSON, InaPdriMeta, ProvinceSummary } from '@/lib/types';
export default async function Home() {
  'use cache';
  const dataDir = path.join(process.cwd(), 'public', 'data');

  const [geojsonRaw, metaRaw, summaryRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, 'ina_pdri_points.geojson'), 'utf-8'),
    fs.readFile(path.join(dataDir, 'ina_pdri_meta.json'), 'utf-8'),
    fs.readFile(path.join(dataDir, 'ina_pdri_summary.json'), 'utf-8'),
  ]);

  const geojsonData: InaPdriGeoJSON = JSON.parse(geojsonRaw);
  const metaData: InaPdriMeta = JSON.parse(metaRaw);
  const summaryObj = JSON.parse(summaryRaw);
  const summaryData: ProvinceSummary[] = summaryObj.provinces || [];

  return (
    <InaPdriDashboard
      geojsonData={geojsonData}
      metaData={metaData}
      summaryData={summaryData}
    />
  );
}
