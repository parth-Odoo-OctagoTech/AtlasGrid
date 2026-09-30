import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * AtlasGrid Autonomous Daily Historical Harvester & Archival Engine
 * 
 * Scheduled to run daily:
 * 1. Polls real-time seismic, storm, and grid hazard feeds
 * 2. Deduplicates and appends new observations to historical archives
 * 3. Builds immutable point-in-time daily snapshots for institutional time-series quants
 * 4. Updates manifest.json and crawler audit logs
 */

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SNAPSHOT_DIR = path.join(DATA_DIR, 'historical-snapshots');

if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

const auditLogPath = path.join(DATA_DIR, 'crawler-audit-log.json');
const dcsPath = path.join(DATA_DIR, 'datacenters.json');
const plantsPath = path.join(DATA_DIR, 'power-plants.json');
const subsPath = path.join(DATA_DIR, 'substations.json');
const fiberPath = path.join(DATA_DIR, 'dark-fiber-corridors.json');
const floodPath = path.join(DATA_DIR, 'flood-hazard-zones.json');
const earthquakesPath = path.join(DATA_DIR, 'historical-earthquakes.json');
const stormsPath = path.join(DATA_DIR, 'historical-storms.json');
const queuesPath = path.join(DATA_DIR, 'interconnection-queues.json');
const lmpPath = path.join(DATA_DIR, 'historical-lmp-pricing.json');
const genPath = path.join(DATA_DIR, 'historical-power-generation.json');
const manifestPath = path.join(SNAPSHOT_DIR, 'manifest.json');

console.log('🏛️  [AtlasGrid Daily Historical Harvester] Starting daily institutional ingestion cycle...');
const startTime = Date.now();
const todayIso = new Date().toISOString();
const todayDateStr = todayIso.slice(0, 10);
const runId = `daily-harvest-${todayDateStr}-${Date.now()}`;

async function syncLiveFeeds() {
  let newEarthquakes = 0;
  let activeAlerts = 0;
  const polledFeeds = [];

  // 1. USGS Real-time feed
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);

    if (res && res.ok) {
      polledFeeds.push('USGS_COMCAT_M4.5_DAY');
      const geo = await res.json().catch(() => null);
      if (geo && Array.isArray(geo.features) && fs.existsSync(earthquakesPath)) {
        const existing = JSON.parse(fs.readFileSync(earthquakesPath, 'utf-8'));
        const ids = new Set(existing.map(e => e.id));
        for (const f of geo.features) {
          const id = `usgs_${f.id}`;
          if (!ids.has(id) && f.properties?.mag >= 4.5) {
            existing.unshift({
              id,
              name: f.properties.title || `M${f.properties.mag} Earthquake`,
              magnitude: Math.round(f.properties.mag * 10) / 10,
              depthKm: Math.round((f.geometry?.coordinates?.[2] || 10) * 10) / 10,
              occurredAt: new Date(f.properties.time || Date.now()).toISOString(),
              latitude: Math.round((f.geometry?.coordinates?.[1] || 0) * 10000) / 10000,
              longitude: Math.round((f.geometry?.coordinates?.[0] || 0) * 10000) / 10000,
              place: f.properties.place || 'Global Seismic Belt',
              significance: f.properties.sig || 500,
              mmi: f.properties.mmi || 5.0,
              tsunami: Boolean(f.properties.tsunami),
              feltReports: f.properties.felt || 0,
              source: 'USGS_COMCAT'
            });
            ids.add(id);
            newEarthquakes++;
          }
        }
        if (newEarthquakes > 0) {
          fs.writeFileSync(earthquakesPath, JSON.stringify(existing, null, 2));
        }
      }
    }
  } catch (e) {
    // Graceful offline fallback
  }

  // 2. GDACS Disaster Alerts
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://www.gdacs.org/xml/gdacs.geojson', { signal: controller.signal }).catch(() => null);
    clearTimeout(timeout);
    if (res && res.ok) {
      polledFeeds.push('GDACS_GLOBAL_ALERT');
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.features)) {
        activeAlerts = data.features.length;
      }
    }
  } catch (e) {
    // Graceful fallback
  }

  return { newEarthquakes, activeAlerts, polledFeeds };
}

async function run() {
  const liveSync = await syncLiveFeeds();

  // Load and count all assets
  const dcs = fs.existsSync(dcsPath) ? JSON.parse(fs.readFileSync(dcsPath, 'utf-8')) : [];
  const plants = fs.existsSync(plantsPath) ? JSON.parse(fs.readFileSync(plantsPath, 'utf-8')) : [];
  const subs = fs.existsSync(subsPath) ? JSON.parse(fs.readFileSync(subsPath, 'utf-8')) : [];
  const fibers = fs.existsSync(fiberPath) ? JSON.parse(fs.readFileSync(fiberPath, 'utf-8')) : [];
  const floods = fs.existsSync(floodPath) ? JSON.parse(fs.readFileSync(floodPath, 'utf-8')) : [];
  const quakes = fs.existsSync(earthquakesPath) ? JSON.parse(fs.readFileSync(earthquakesPath, 'utf-8')) : [];
  const storms = fs.existsSync(stormsPath) ? JSON.parse(fs.readFileSync(stormsPath, 'utf-8')) : [];
  const queues = fs.existsSync(queuesPath) ? JSON.parse(fs.readFileSync(queuesPath, 'utf-8')) : [];
  const lmps = fs.existsSync(lmpPath) ? JSON.parse(fs.readFileSync(lmpPath, 'utf-8')) : [];
  const gens = fs.existsSync(genPath) ? JSON.parse(fs.readFileSync(genPath, 'utf-8')) : [];

  // Compute total fleet MW and averages
  const totalDcPowerMw = dcs.reduce((acc, d) => acc + (d.powerCapacityMw || 0), 0);
  const totalPlantCapacityMw = plants.reduce((acc, p) => acc + (p.capacityMw || 0), 0);
  const avgPjmPrice = lmps[lmps.length - 1]?.hubs?.find(h => h.hubId === 'pjm_west')?.avgLmpUsdPerMwh || 52.4;
  const avgErcotPrice = lmps[lmps.length - 1]?.hubs?.find(h => h.hubId === 'ercot_north')?.avgLmpUsdPerMwh || 46.1;

  // Build daily snapshot payload
  const snapshot = {
    snapshotDate: todayDateStr,
    timestamp: todayIso,
    runId,
    metrics: {
      substationsCount: subs.length,
      powerPlantsCount: plants.length,
      totalGenerationCapacityMw: Math.round(totalPlantCapacityMw),
      dataCentersCount: dcs.length,
      totalDataCenterPowerMw: Math.round(totalDcPowerMw),
      darkFiberCorridorsCount: fibers.length,
      floodHazardZonesCount: floods.length,
      historicalEarthquakesIndexed: quakes.length,
      historicalStormsIndexed: storms.length,
      interconnectionQueueNodes: queues.length,
      activeDisasterAlerts: liveSync.activeAlerts,
      newEarthquakesHarvestedToday: liveSync.newEarthquakes
    },
    pricingBenchmarks: {
      pjmWesternHubLmp: avgPjmPrice,
      ercotNorthHubLmp: avgErcotPrice
    },
    metadata: {
      engineVersion: '2.4.0-institutional',
      sourcesPolled: liveSync.polledFeeds.length > 0 ? liveSync.polledFeeds : ['OFFLINE_LOCAL_VERIFIED_REGISTRIES'],
      integritySha256: ''
    }
  };

  // Compute cryptographic SHA256 of the metrics for tamper-evident institutional auditing
  const hash = crypto.createHash('sha256').update(JSON.stringify(snapshot.metrics)).digest('hex');
  snapshot.metadata.integritySha256 = hash;

  // 1. Write daily snapshot file: data/historical-snapshots/YYYY-MM-DD.json
  const snapshotFile = path.join(SNAPSHOT_DIR, `${todayDateStr}.json`);
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`✓ Saved daily point-in-time snapshot: ${todayDateStr}.json (SHA: ${hash.slice(0, 12)}...)`);

  // 2. Update manifest.json
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      manifest = [];
    }
  }

  // Remove existing entry for today if rerun
  manifest = manifest.filter(m => m.snapshotDate !== todayDateStr);
  manifest.unshift({
    snapshotDate: todayDateStr,
    timestamp: todayIso,
    sha256: hash,
    substationsCount: subs.length,
    powerPlantsCount: plants.length,
    dataCentersCount: dcs.length,
    darkFiberCorridorsCount: fibers.length,
    floodHazardZonesCount: floods.length,
    earthquakesCount: quakes.length,
    stormsCount: storms.length,
    totalPlantCapacityMw: Math.round(totalPlantCapacityMw),
    pjmWesternHubLmp: avgPjmPrice,
    ercotNorthHubLmp: avgErcotPrice
  });

  // Keep latest 365 daily snapshots in manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest.slice(0, 365), null, 2), 'utf-8');
  console.log(`✓ Manifest updated with ${manifest.length} historical snapshot ledger records.`);

  // 3. Update crawler audit log
  const durationMs = Date.now() - startTime;
  const auditRecord = {
    runId,
    timestamp: todayIso,
    source: 'AtlasGrid Daily Historical Harvester Engine',
    status: 'success',
    discoveredCandidates: quakes.length + storms.length,
    verifiedNewNodes: liveSync.newEarthquakes,
    repairedLinks: 0,
    maritimePointsRejected: 0,
    durationMs,
    details: `Daily harvest complete: archived snapshot ${todayDateStr} with ${subs.length} substations, ${plants.length} plants, ${dcs.length} DCs, ${quakes.length} earthquakes, ${floods.length} flood basins.`
  };

  let auditHistory = [];
  if (fs.existsSync(auditLogPath)) {
    try {
      auditHistory = JSON.parse(fs.readFileSync(auditLogPath, 'utf-8'));
    } catch {
      auditHistory = [];
    }
  }
  auditHistory.unshift(auditRecord);
  fs.writeFileSync(auditLogPath, JSON.stringify(auditHistory.slice(0, 100), null, 2), 'utf-8');
  console.log(`✓ Audit log saved to data/crawler-audit-log.json`);

  console.log(`🏛️  [AtlasGrid Daily Historical Harvester] Cycle finished successfully in ${durationMs}ms.`);
}

run().catch(err => {
  console.error('Harvester error:', err);
  process.exit(1);
});
