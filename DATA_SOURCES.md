# AtlasGrid Data Governance & Source Registry

This document establishes the official data governance framework, refresh cadences, SLA commitments, and technical specifications for all primary and secondary datasets powering **AtlasGrid**.

---

## 1. Data Source Inventory & SLA Overview

| Source Identifier | Provider / Authority | Geographic Scope | Ingestion Protocol | Refresh Frequency | Target SLA Uptime | Verified Latency | Data Freshness Policy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WRI-GPPD-V1** | World Resources Institute | Global (167 Countries) | Static Ingestion / S3 Mirror | Semi-annual | 99.95% | < 50ms (Edge Cache) | Gold Standard baseline for 5,400+ major power stations (>50MW) |
| **ENTSO-E-TP** | European Network of TSOs | Pan-European Synchronous Area | REST / XML API [16.1.A, 12.1.D] | 5 Minutes | 99.80% | < 450ms (Origin) | Real-time generation per unit & Day-Ahead spot pricing |
| **US-EIA-V2** | U.S. Energy Information Administration | US Balancing Authorities (CAISO, ERCOT, PJM, MISO, NYISO) | REST JSON API v2 | 5 Minutes (Hourly Aggregated) | 99.90% | < 350ms (Origin) | 5-minute fuel mix, balancing authority demand, and nodal LMP |
| **TELEGEOGRAPHY-CABLES** | TeleGeography | Global Subsea Corridors | GeoJSON FeatureCollection | Monthly | 99.99% | < 40ms (Edge Cache) | Global subsea fiber conduits and 400+ Cable Landing Stations (CLS) |
| **USGS-COMCAT** | U.S. Geological Survey | Global Seismology | GeoJSON / FDSN Event Web Service | 15 Minutes | 99.90% | < 180ms | M5.0+ earthquake epicenters, depth, MMI, and shockwave buffers |
| **NOAA-SPC-HURDAT2** | NOAA Storm Prediction Center | North America & Global Oceans | Shapefile / NetCDF conversion | 6 Hours | 99.90% | < 200ms | Historical storm tracks, Category 1–5 hurricanes, tornado swarms |
| **NASA-POWER-CLIMATE** | NASA Langley Research Center | Global Gridded (0.5° × 0.5°) | NetCDF4 / REST API | Annual Normals | 99.99% | < 60ms | 10-year wet-bulb temperatures and free-cooling hours |
| **ATLAS-SIMULATOR** | GridPulse Physics Simulation Engine | Global Synthetic Nodes | In-memory 2.5s Ticks | Real-time (2.5s) | 99.99% | < 5ms (SSE Local) | Continuous frequency stabilization, peaker ramp-up, and synthetic LMP |

---

## 2. Ingestion & Caching Strategy

```
[ External APIs (ENTSO-E, EIA) ]
              │
              ▼ (3x Exponential Backoff Retry)
[ Memory / Redis Cache (5-Min TTL) ]
              │
              ├── Cache Hit  ──► Serves downstream client (< 10ms)
              └── Cache Miss ──► Polling upstream origin
                                      │
                                      ▼ (Fallback on Timeout/429)
                        [ High-Fidelity Physics Engine ]
```

1. **Live Tier (5-Minute TTL)**:
   - ENTSO-E Day-Ahead electricity prices and actual generation per unit.
   - EIA balancing authority demand, fuel mix, and ISO nodal prices.
2. **Historical Tier (15-Minute TTL)**:
   - Rolling 24-hour historical time machine snapshots.
   - Interconnection queue status summaries.
3. **Static Spatial Tier (30-Day TTL)**:
   - Submarine cables, terrestrial fiber conduits, FAA Part 77 obstacle cones, FEMA flood zones.

---

## 3. Data Governance & Regulatory Disclaimers

> [!IMPORTANT]
> **Locational Marginal Pricing (LMP) Verification Delay**:
> All live wholesale electricity prices, congestion components, and loss factors presented across AtlasGrid are subject to a **15-minute verification delay** to comply with regional wholesale transmission confidentiality rules.

> [!NOTE]
> **Zero-Trust Audit Log**:
> In compliance with ISO 27001 and SOC 2 Type II observability standards, all API queries to `/api/stations`, `/api/telemetry/*`, and `/api/auth/*` are written to the immutable `public.audit_log` table with endpoint, HTTP status code, latency, and client fingerprint. Sensitive API keys and authentication tokens are strictly redacted prior to logging.

---

## 4. Disaster Recovery & Fallback Policy

If any primary API provider encounters downtime:
1. AtlasGrid engages exponential backoff with jitter (initial delay: 500ms, factor: 2x, max attempts: 3).
2. If the provider remains unreachable, the system automatically transitions to the **GridPulse Physics Engine**, providing continuous synthetic operational telemetry without user interruption.
3. A client-side notification is issued indicating that data is served from the fallback resilience tier.
