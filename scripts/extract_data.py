#!/usr/bin/env python3
"""
Extraction script for Ina PDRI 2026 dataset.
Converts 'data/Ina PDRI 2026.xlsx' into:
1. public/data/ina_pdri_points.geojson (RFC 7946 FeatureCollection for MapLibre GL)
2. public/data/ina_pdri_summary.json (Provincial & sector-level time series data)
3. public/data/ina_pdri_meta.json (Dataset metadata, bounds, filters)
"""

import os
import re
import json
import zipfile
import datetime
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

EXCEL_PATH = 'data/Ina PDRI 2026.xlsx'
OUTPUT_GEOJSON = 'public/data/ina_pdri_points.geojson'
OUTPUT_SUMMARY = 'public/data/ina_pdri_summary.json'
OUTPUT_META = 'public/data/ina_pdri_meta.json'

NS = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RELS_NS = {'ns': 'http://schemas.openxmlformats.org/package/2006/relationships'}

def get_shared_strings(z):
    if 'xl/sharedStrings.xml' not in z.namelist():
        return []
    tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
    strings = []
    for si in tree.findall('ns:si', NS):
        t = ''.join([node.text for node in si.iter() if node.text and node.tag.endswith('}t')])
        strings.append(t)
    return strings

def parse_col_letter(cell_ref):
    return ''.join([c for c in cell_ref if c.isalpha()])

def parse_row_num(cell_ref):
    return int(''.join([c for c in cell_ref if c.isdigit()]))

def excel_date_to_str(val):
    if val is None:
        return ''
    try:
        f = float(val)
        if 20000 < f < 70000:
            base = datetime.datetime(1899, 12, 30)
            dt = base + datetime.timedelta(days=f)
            return dt.strftime('%Y-%m-%d')
    except:
        pass
    return str(val).strip()

def clean_disaster_type(raw_val):
    if not raw_val:
        return 'Lainnya'
    val = str(raw_val).strip()
    return val

def disaster_color(jenis):
    j = jenis.lower()
    if 'tsunami' in j or 'likuefaksi' in j:
        return '#7C3AED' # Purple
    if 'gempa' in j and 'longsor' not in j and 'banjir' not in j:
        return '#DC2626' # Red
    if 'tanah longsor' in j or 'longsor' in j:
        if 'banjir' in j:
            return '#0891B2' # Teal compound
        return '#D97706' # Amber / Brown
    if 'banjir' in j:
        return '#2563EB' # Blue
    if 'kekeringan' in j:
        return '#EAB308' # Yellow
    return '#64748B' # Slate

def main():
    print(f"Reading {EXCEL_PATH} ...")
    with zipfile.ZipFile(EXCEL_PATH) as z:
        shared_strings = get_shared_strings(z)
        print(f"Loaded {len(shared_strings)} shared strings.")

        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = {
            s.attrib.get('name'): s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            for s in wb_tree.findall('.//ns:sheet', NS)
        }
        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        id_to_target = {
            r.attrib.get('Id'): r.attrib.get('Target')
            for r in rels_tree.findall('.//ns:Relationship', RELS_NS)
        }

        # 1. Process Sheet 1: Survey Ina PDRI Tahun 2026
        sheet1_target = id_to_target[sheets['Survey Ina PDRI Tahun 2026']]
        tree1 = ET.fromstring(z.read('xl/' + sheet1_target))
        rows1 = tree1.findall('.//ns:row', NS)
        print(f"Sheet 1 has {len(rows1)} rows.")

        # Map header columns
        header = {}
        for c in rows1[0].findall('ns:c', NS):
            col_letter = parse_col_letter(c.attrib.get('r'))
            t = c.attrib.get('t')
            v = c.find('ns:v', NS)
            val = v.text if v is not None else None
            if t == 's' and val is not None:
                val = shared_strings[int(val)]
            header[col_letter] = val

        rev_header = {v: k for k, v in header.items() if v}

        col_prov = rev_header.get('Provinsi', 'B')
        col_kab = rev_header.get('Kabupaten/Kota', 'C')
        col_kec = rev_header.get('Kecamatan', 'D')
        col_desa = rev_header.get('Desa/Kelurahan', 'E')
        col_alamat = rev_header.get('Alamat (Jalan/kampung)', 'F')
        col_lat = rev_header.get('_Titik Lokasi_latitude', 'H')
        col_lng = rev_header.get('_Titik Lokasi_longitude', 'I')
        col_alt = rev_header.get('_Titik Lokasi_altitude', 'J')
        col_prec = rev_header.get('_Titik Lokasi_precision', 'K')
        col_year = rev_header.get('Tahun terjadi bencana (T-0)', 'L')
        col_disaster = rev_header.get('Jenis Bencana', 'R')
        col_date = rev_header.get('Tanggal Survey', 'Z')
        col_petugas = rev_header.get('Pilih Petugas', 'AA')
        col_photo = rev_header.get('Ambil foto yang menunjukan kualitas air_URL', 'UX')
        col_sig = rev_header.get('Tanda Tangan Petugas_URL', 'AD')

        features = []
        lats, lngs, alts = [], [], []
        disaster_counts = Counter()
        prov_counts = Counter()
        kab_counts = defaultdict(int)
        prov_kabs = defaultdict(set)
        year_counts = Counter()

        for row_el in rows1[1:]:
            row_num = row_el.attrib.get('r')
            cells = {}
            for c in row_el.findall('ns:c', NS):
                col_letter = parse_col_letter(c.attrib.get('r'))
                t = c.attrib.get('t')
                v = c.find('ns:v', NS)
                val = v.text if v is not None else None
                if t == 's' and val is not None:
                    val = shared_strings[int(val)]
                cells[col_letter] = val

            lat_val = cells.get(col_lat)
            lng_val = cells.get(col_lng)
            if not lat_val or not lng_val:
                continue

            try:
                lat = float(lat_val)
                lng = float(lng_val)
            except ValueError:
                continue

            alt = 0.0
            if cells.get(col_alt):
                try:
                    alt = round(float(cells.get(col_alt)), 1)
                except:
                    alt = 0.0

            prec = 0.0
            if cells.get(col_prec):
                try:
                    prec = round(float(cells.get(col_prec)), 1)
                except:
                    prec = 0.0

            year_val = cells.get(col_year)
            try:
                year = int(float(year_val)) if year_val else 2024
            except:
                year = 2024

            prov = cells.get(col_prov, '').strip()
            kab = cells.get(col_kab, '').strip()
            kec = cells.get(col_kec, '').strip()
            desa = cells.get(col_desa, '').strip()
            alamat = cells.get(col_alamat, '').strip()
            disaster = clean_disaster_type(cells.get(col_disaster))
            date_str = excel_date_to_str(cells.get(col_date))
            petugas = cells.get(col_petugas, '').strip()
            photo_url = cells.get(col_photo)
            sig_url = cells.get(col_sig)

            lats.append(lat)
            lngs.append(lng)
            alts.append(alt)
            disaster_counts[disaster] += 1
            prov_counts[prov] += 1
            kab_counts[f"{prov} - {kab}"] += 1
            prov_kabs[prov].add(kab)
            year_counts[year] += 1

            feature_id = len(features) + 1
            color = disaster_color(disaster)

            feature = {
                "type": "Feature",
                "id": feature_id,
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat, alt]
                },
                "properties": {
                    "id": feature_id,
                    "provinsi": prov,
                    "kabupaten": kab,
                    "kecamatan": kec,
                    "desa": desa,
                    "alamat": alamat,
                    "latitude": lat,
                    "longitude": lng,
                    "altitude": alt,
                    "precision": prec,
                    "tahunBencana": year,
                    "jenisBencana": disaster,
                    "color": color,
                    "tanggalSurvey": date_str,
                    "petugas": petugas,
                    "fotoKualitasAirUrl": photo_url if photo_url and photo_url.startswith('http') else None,
                    "tandaTanganPetugasUrl": sig_url if sig_url and sig_url.startswith('http') else None
                }
            }
            features.append(feature)

        print(f"Extracted {len(features)} valid point features.")

        # 2. Process Rekap Sheets
        # We parse the 10 Rekap <Provinsi> sheets
        provincial_rekap = {}
        for sheet_name, r_id in sheets.items():
            if sheet_name.startswith('Rekap ') and sheet_name != 'Rekap Total Data':
                prov_name = sheet_name.replace('Rekap ', '').strip()
                target = id_to_target[r_id]
                tree = ET.fromstring(z.read('xl/' + target))
                rows = tree.findall('.//ns:row', NS)
                
                # Rows:
                # 3: SEKTOR, T-1, T-0, T+1, T+2, T+3, T+4, Indeks rata2 persektor, Status
                # 4: PEMUKIMAN
                # 5: INFRASTRUKTUR
                # 6: SOSIAL
                # 7: EKONOMI
                # 8: LINTAS SEKTOR
                # 9: Indeks Rata2 pertahun semua sektor
                # 10: Status
                sectors_data = {}
                overall_series = {}
                status_series = {}
                
                for r in rows:
                    r_num = int(r.attrib.get('r'))
                    cells = {}
                    for c in r.findall('ns:c', NS):
                        col_letter = parse_col_letter(c.attrib.get('r'))
                        t = c.attrib.get('t')
                        v = c.find('ns:v', NS)
                        val = v.text if v is not None else None
                        if t == 's' and val is not None:
                            val = shared_strings[int(val)]
                        cells[col_letter] = val
                    
                    sector_name = cells.get('B')
                    if not sector_name:
                        continue
                    
                    def safe_num(v):
                        try:
                            return round(float(v), 2)
                        except:
                            return None

                    if r_num in [4, 5, 6, 7, 8]:
                        sectors_data[sector_name.strip()] = {
                            "t_min_1": safe_num(cells.get('C')),
                            "t_0": safe_num(cells.get('D')),
                            "t_plus_1": safe_num(cells.get('E')),
                            "t_plus_2": safe_num(cells.get('F')),
                            "t_plus_3": safe_num(cells.get('G')),
                            "t_plus_4": safe_num(cells.get('H')),
                            "avg": safe_num(cells.get('I')),
                            "status": cells.get('J', '').strip()
                        }
                    elif 'indeks rata2' in sector_name.lower():
                        overall_series = {
                            "t_min_1": safe_num(cells.get('C')),
                            "t_0": safe_num(cells.get('D')),
                            "t_plus_1": safe_num(cells.get('E')),
                            "t_plus_2": safe_num(cells.get('F')),
                            "t_plus_3": safe_num(cells.get('G')),
                            "t_plus_4": safe_num(cells.get('H'))
                        }
                    elif sector_name.strip().lower() == 'status':
                        status_series = {
                            "t_min_1": cells.get('C', '').strip(),
                            "t_0": cells.get('D', '').strip(),
                            "t_plus_1": cells.get('E', '').strip(),
                            "t_plus_2": cells.get('F', '').strip(),
                            "t_plus_3": cells.get('G', '').strip(),
                            "t_plus_4": cells.get('H', '').strip()
                        }

                provincial_rekap[prov_name] = {
                    "sectors": sectors_data,
                    "overallSeries": overall_series,
                    "statusSeries": status_series
                }

        print(f"Extracted rekap data for {len(provincial_rekap)} provinces.")

        # 3. Process Individual Kabupaten/Kota Sheets
        def extract_kab_rekap(z, sheet_xml_path, shared_strings):
            tree = ET.fromstring(z.read('xl/' + sheet_xml_path))
            rows = tree.findall('.//ns:row', NS)
            
            sectors = {}
            overall = {}
            status = {}
            
            sector_map = {
                'pemukiman': 'PEMUKIMAN',
                'infrastruktur': 'INFRASTRUKTUR',
                'sosial': 'SOSIAL',
                'ekonomi': 'EKONOMI',
                'lintas sektor': 'LINTAS SEKTOR'
            }
            
            for r in rows:
                r_num = int(r.attrib.get('r'))
                if r_num < 45:
                    continue
                cells = {}
                for c in r.findall('ns:c', NS):
                    col_letter = parse_col_letter(c.attrib.get('r'))
                    t = c.attrib.get('t')
                    v = c.find('ns:v', NS)
                    val = v.text if v is not None else None
                    if t == 's' and val is not None:
                        val = shared_strings[int(val)]
                    cells[col_letter] = val
                
                col_a = str(cells.get('A') or '').strip().lower()
                
                matched_sec = None
                for k, v in sector_map.items():
                    if k in col_a:
                        matched_sec = v
                        break
                
                def safe_clean_num(v):
                    if v is None or v == '' or '#DIV' in str(v) or str(v).strip() == '-':
                        return None
                    try:
                        return round(float(v), 2)
                    except:
                        return None

                if matched_sec:
                    sec_scores = {
                        't_min_1': safe_clean_num(cells.get('B')),
                        't_0': safe_clean_num(cells.get('C')),
                        't_plus_1': safe_clean_num(cells.get('D')),
                        't_plus_2': safe_clean_num(cells.get('E')),
                        't_plus_3': safe_clean_num(cells.get('F')),
                        't_plus_4': safe_clean_num(cells.get('G')),
                    }
                    vals = [v for v in sec_scores.values() if v is not None]
                    sec_scores['avg'] = round(sum(vals)/len(vals), 2) if vals else None
                    latest = vals[-1] if vals else None
                    sec_scores['status'] = 'Pulih' if (latest and latest >= 100) else ('Belum Pulih' if latest else 'Belum Ada Data')
                    sectors[matched_sec] = sec_scores
                
                elif 'rata' in col_a:
                    overall = {
                        't_min_1': safe_clean_num(cells.get('B')),
                        't_0': safe_clean_num(cells.get('C')),
                        't_plus_1': safe_clean_num(cells.get('D')),
                        't_plus_2': safe_clean_num(cells.get('E')),
                        't_plus_3': safe_clean_num(cells.get('F')),
                        't_plus_4': safe_clean_num(cells.get('G')),
                    }
                elif 'keterangan' in col_a:
                    def clean_ket(v):
                        s = str(v or '').strip()
                        return s if s and '#DIV' not in s and s != '-' else None

                    status = {
                        't_min_1': clean_ket(cells.get('B')),
                        't_0': clean_ket(cells.get('C')),
                        't_plus_1': clean_ket(cells.get('D')),
                        't_plus_2': clean_ket(cells.get('E')),
                        't_plus_3': clean_ket(cells.get('F')),
                        't_plus_4': clean_ket(cells.get('G')),
                    }

            return {
                'sectors': sectors,
                'overallSeries': overall,
                'statusSeries': status
            }

        kabupaten_rekap_all = {}
        for sname, r_id in sheets.items():
            if sname not in ['Survey Ina PDRI Tahun 2026', 'Data Olah', 'Rekap Total Data'] and not sname.startswith('Rekap '):
                target = id_to_target[r_id]
                try:
                    kab_rekap = extract_kab_rekap(z, target, shared_strings)
                    if kab_rekap['sectors']:
                        kabupaten_rekap_all[sname] = kab_rekap
                except Exception as e:
                    print(f"Error parsing sheet {sname}: {e}")

        print(f"Extracted rekap data for {len(kabupaten_rekap_all)} Kabupaten/Kota sheets.")

        # Build Summary
        summary = {
            "provinces": []
        }

        for prov, count in prov_counts.most_common():
            kabs_in_prov = sorted(list(prov_kabs.get(prov, [])))
            # Compute stats for this province
            prov_features = [f for f in features if f["properties"]["provinsi"] == prov]
            prov_alts = [f["properties"]["altitude"] for f in prov_features]
            disasters_in_prov = Counter([f["properties"]["jenisBencana"] for f in prov_features])
            
            # Match with provincial rekap
            rekap_match = provincial_rekap.get(prov)
            if not rekap_match:
                # Try matching by substring (e.g. Jawa Barat -> Rekap Jawa Barat)
                for k, v in provincial_rekap.items():
                    if k.lower() in prov.lower() or prov.lower() in k.lower():
                        rekap_match = v
                        break

            # Match kabupaten rekap for each kabupaten in this province
            prov_kab_rekap = {}
            for kab in kabs_in_prov:
                # Direct match
                if kab in kabupaten_rekap_all:
                    prov_kab_rekap[kab] = kabupaten_rekap_all[kab]
                else:
                    # Fuzzy match
                    clean_kab = kab.replace('Kab.', '').replace('Kabupaten', '').replace('Kota', '').strip()
                    for sname, data in kabupaten_rekap_all.items():
                        if clean_kab.lower() in sname.lower() or sname.lower() in clean_kab.lower():
                            prov_kab_rekap[kab] = data
                            break

            summary["provinces"].append({
                "provinsi": prov,
                "totalSurveyPoints": count,
                "kabupatenList": kabs_in_prov,
                "disasterBreakdown": dict(disasters_in_prov.most_common()),
                "altitudeStats": {
                    "min": min(prov_alts) if prov_alts else 0,
                    "max": max(prov_alts) if prov_alts else 0,
                    "avg": round(sum(prov_alts) / len(prov_alts), 1) if prov_alts else 0
                },
                "rekap": rekap_match,
                "kabupatenRekap": prov_kab_rekap
            })

        # Build Metadata
        disaster_types_meta = []
        for d, c in disaster_counts.most_common():
            disaster_types_meta.append({
                "name": d,
                "count": c,
                "color": disaster_color(d)
            })

        meta = {
            "totalPoints": len(features),
            "totalProvinces": len(prov_counts),
            "totalKabupaten": len(kab_counts),
            "bounds": [
                round(min(lngs), 4),
                round(min(lats), 4),
                round(max(lngs), 4),
                round(max(lats), 4)
            ],
            "altitudeRange": [round(min(alts), 1), round(max(alts), 1)],
            "disasterTypes": disaster_types_meta,
            "years": sorted(list(year_counts.keys())),
            "provinces": [p["provinsi"] for p in summary["provinces"]]
        }

        # Write files
        geojson_doc = {
            "type": "FeatureCollection",
            "features": features
        }

        os.makedirs(os.path.dirname(OUTPUT_GEOJSON), exist_ok=True)

        with open(OUTPUT_GEOJSON, 'w', encoding='utf-8') as f:
            json.dump(geojson_doc, f, ensure_ascii=False)
        print(f"Wrote {OUTPUT_GEOJSON} ({os.path.getsize(OUTPUT_GEOJSON) / 1024:.1f} KB)")

        with open(OUTPUT_SUMMARY, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        print(f"Wrote {OUTPUT_SUMMARY} ({os.path.getsize(OUTPUT_SUMMARY) / 1024:.1f} KB)")

        with open(OUTPUT_META, 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        print(f"Wrote {OUTPUT_META} ({os.path.getsize(OUTPUT_META) / 1024:.1f} KB)")

if __name__ == '__main__':
    main()
