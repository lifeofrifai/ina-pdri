# Ina PDRI (Indonesia Post-Disaster Recovery Index) GIS Web Platform

An interactive GIS Web Dashboard built with [Next.js 16](https://nextjs.org), [React 19](https://react.dev), and Tailwind CSS to map and analyze post-disaster recovery survey data across Indonesia.

For full architectural details, dataset schema analysis, and feature roadmap, please see [PROJECT_SPEC.md](file:///Users/rifai/ngoding/ina-pdri/PROJECT_SPEC.md).

---

## 📌 Project Overview
- **Data Source**: Field survey data from `data/Ina PDRI 2026.xlsx` containing **762 geo-tagged survey points** across **17 provinces** and **42 regencies/cities (Kabupaten/Kota)**.
- **Key Indicators**: Multi-temporal post-disaster recovery indicators from $T_{-1}$ (pre-disaster baseline) up to $T_{+4}$ (4 years post-disaster) across 5 core sectors:
  1. Pemukiman (Housing & Settlements)
  2. Infrastruktur (Infrastructure: roads, electricity, water, sanitation)
  3. Sosial (Health, education, security, village services)
  4. Ekonomi (Livelihood, informal sector, income, aid programs)
  5. Lintas Sektor / Lingkungan (Water quality, environment, natural resource usage)
- **Visual Features**: Interactive vector map with dynamic clustering, disaster-type color coding, altitude filtering, detail slide-over drawer, photo viewer for field survey water quality evidence, and recovery radar charts.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## 📂 Project Structure
```
├── app/                  # Next.js App Router pages and layouts
├── components/           # React UI components (Map, Sidebar, Filters, Charts)
├── data/                 # Raw data files (e.g. Ina PDRI 2026.xlsx)
├── public/data/          # Processed GeoJSON and JSON datasets for map view
├── scripts/              # Data extraction & conversion scripts
├── PROJECT_SPEC.md       # Complete architectural spec & dataset analysis
└── README.md             # Project introduction & setup
```
