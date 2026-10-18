export interface InaPdriFeatureProperties {
  id: number;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  latitude: number;
  longitude: number;
  altitude: number;
  precision: number;
  tahunBencana: number;
  jenisBencana: string;
  color: string;
  tanggalSurvey: string;
  petugas: string;
  fotoKualitasAirUrl: string | null;
  tandaTanganPetugasUrl: string | null;
}

export interface InaPdriFeature {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, alt]
  };
  properties: InaPdriFeatureProperties;
}

export interface InaPdriGeoJSON {
  type: 'FeatureCollection';
  features: InaPdriFeature[];
}

export interface SectorScore {
  t_min_1: number | null;
  t_0: number | null;
  t_plus_1: number | null;
  t_plus_2: number | null;
  t_plus_3: number | null;
  t_plus_4: number | null;
  avg: number | null;
  status: string;
}

export interface RekapData {
  sectors: Record<string, SectorScore>;
  overallSeries: Record<string, number | null>;
  statusSeries: Record<string, string>;
}

export type ProvinceRekap = RekapData;

export interface ProvinceSummary {
  provinsi: string;
  totalSurveyPoints: number;
  kabupatenList: string[];
  disasterBreakdown: Record<string, number>;
  altitudeStats: {
    min: number;
    max: number;
    avg: number;
  };
  rekap?: RekapData;
  kabupatenRekap?: Record<string, RekapData>;
}

export interface InaPdriMeta {
  totalPoints: number;
  totalProvinces: number;
  totalKabupaten: number;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  altitudeRange: [number, number];
  disasterTypes: Array<{
    name: string;
    count: number;
    color: string;
  }>;
  years: number[];
  provinces: string[];
}
