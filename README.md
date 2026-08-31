# AtlasGrid: "God's Eye" Global Power Grid Observability Platform

A production-grade, full-stack real-time power grid and AI data center observability web application providing an enterprise-wide planetary view of 5,200+ global power stations, 4,380+ compute facilities, high-voltage transmission interconnectors, subsea telecommunications fiber, real-time dispatch telemetry, and Locational Marginal Pricing (LMP) formation.

---

## ⚡ Architecture & Tech Stack

- **Frontend Framework**: Next.js 15+ (App Router, TypeScript, React 19)
- **WebGL Geospatial Rendering**: [Deck.gl v9](https://deck.gl/) (`@deck.gl/react`, `@deck.gl/layers`, `@deck.gl/aggregation-layers`) integrated with [MapLibre GL JS](https://maplibre.org/)
- **State Management & Data Synchronization**: Zustand + TanStack React Query v5
- **Real-Time Streaming**: Server-Sent Events (SSE) streaming physics-informed grid telemetry at 2.5-second ticks
- **Data Ingestion Modules**:
  - **Module A**: Global Energy Monitor & WRI format power plant schema (5,200+ worldwide nodes)
  - **Module B**: ENTSO-E Transparency API client wrapper for European unit-level output [16.1.A] and Day-Ahead spot prices [12.1.D]
  - **Module C**: US ISO / EIA API v2 client wrapper for CAISO, ERCOT, and PJM 5-minute LMP and balancing authority fuel mix
  - **Module D**: Physics-informed telemetry simulator with diurnal solar irradiance, wind pressure waves, duck curves, peaker dispatch, and grid frequency micro-deviations (50Hz / 60Hz)
- **Spatial Storage & Schema**: PostgreSQL / PostGIS spatial schema definitions + high-speed in-memory cached repository

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Generate / Seed Global Dataset (5,200+ Stations)
```bash
node scripts/generate-plants.mjs
```

### 3. Environment Variables (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your live API keys for ENTSO-E and EIA if available. If keys are omitted, the built-in physics simulator automatically simulates live generation and pricing.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Key Features & Controls

### 1. High-Performance WebGL Layer (60 FPS)
- **2D Scatterplot View**: Dynamic bubble radii scaled proportionally to capacity (MW) with fuel-specific color keys:
  - 🟣 **Nuclear** (`#a855f7`)
  - 🔵 **Hydroelectric** (`#3b82f6`)
  - 🟠 **Natural Gas** (`#f97316`)
  - 🔘 **Coal** (`#64748b`)
  - 🟡 **Solar PV** (`#eab308`)
  - 💠 **Wind Power** (`#06b6d4`)
  - 🟢 **Battery Storage / Geothermal** (`#22c55e` / `#10b981`)
- **3D Extruded Columns**: Towers extruded vertically based on live dispatch (MW) with camera pitch control.
- **Nodal LMP Heatmap**: Smooth thermal heatmap color ramp highlighting negative pricing curtailment (green) to severe peaker spikes (crimson red > $150/MWh).
- **Transmission Intertie Arcs**: High-voltage interconnector flows (e.g. Pacific DC Intertie, IFA-2, NordLink, Baihetan UHVDC).

### 2. God's Eye HUD & Inspector
- **Top HUD**: Global live generation (GW), online capacity (GW), clean energy share (%), average LMP spot price ($/MWh), and real-time frequency monitors (US 60Hz & EU 50Hz).
- **Time Scrubber**: Toggle between **Real-Time Live Mode** and **24-Hour Replay** with interactive timeline scrubbing.
- **Side Inspector Drawer**: Click any station node to inspect nameplate capacity, live generation, capacity factor radial gauge, spot price breakdown (Energy, Congestion, Loss), and 24-hour dispatch & pricing curves.
- **Global Search (`Cmd+K`)**: Rapid fuzzy search across 5,200+ stations by name, operator, ISO, or country.
- **Grid Analytics Modal**: Global generation fuel mix donut chart, top generating stations leaderboard, and transmission interconnector matrix.
- **Alert Center**: Live notifications for localized LMP price spikes, offshore wind curtailments, and frequency deviations with instant "Locate on Map" navigation.

---

## 🗄️ Database & Spatial Storage (PostGIS)
For production PostgreSQL/PostGIS environments, execute the migration schema in:
```bash
lib/db/schema.sql
```
This includes spatial GiST indexes on plant coordinates, timeseries telemetry tables, and interconnector LineStrings.
