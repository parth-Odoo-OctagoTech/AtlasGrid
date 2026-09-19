import https from 'https';
import fs from 'fs';
import path from 'path';

const SUPABASE_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'pamvopgliynzmoamdvkp';

if (!SUPABASE_TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_TOKEN environment variable.");
  process.exit(1);
}

async function executeSql(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function escapeSql(str) {
  if (str == null) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function seedSubstations() {
  console.log('--- Seeding Substations ---');
  const subsPath = path.join(process.cwd(), 'data', 'substations.json');
  const subs = JSON.parse(fs.readFileSync(subsPath, 'utf-8'));
  console.log(`Total substations to seed: ${subs.length}`);

  const chunkSize = 150;
  for (let i = 0; i < subs.length; i += chunkSize) {
    const chunk = subs.slice(i, i + chunkSize);
    const values = chunk.map(s => {
      const lat = s.latitude || s.lat || 0;
      const lng = s.longitude || s.lng || 0;
      const loc = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
      return `(${escapeSql(s.id)}, ${escapeSql(s.name)}, ${s.voltageKv || 345}, ${lat}, ${lng}, ${loc}, ${escapeSql(s.gridRegion || s.region || 'GLOBAL_OTHER')}, ${escapeSql(s.country || 'US')}, ${escapeSql(s.countryName || 'Global')}, ${escapeSql(s.type || 'switchyard')}, ${escapeSql(s.operator || 'Utility')}, ${s.connectedCapacityMw || 1500}, ${s.connectedPlantsCount || 1})`;
    }).join(',\n');

    const sql = `
      INSERT INTO substations (id, name, voltage_kv, latitude, longitude, location, grid_region, country, country_name, type, operator, connected_capacity_mw, connected_plants_count)
      VALUES ${values}
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        voltage_kv = EXCLUDED.voltage_kv,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location = EXCLUDED.location,
        grid_region = EXCLUDED.grid_region,
        country = EXCLUDED.country,
        country_name = EXCLUDED.country_name,
        type = EXCLUDED.type,
        operator = EXCLUDED.operator,
        connected_capacity_mw = EXCLUDED.connected_capacity_mw,
        connected_plants_count = EXCLUDED.connected_plants_count,
        updated_at = NOW();
    `;

    await executeSql(sql);
    console.log(`  Seeded substations ${i + 1} to ${Math.min(i + chunkSize, subs.length)}`);
  }
}

async function seedPowerPlants() {
  console.log('--- Seeding Power Plants ---');
  const plantsPath = path.join(process.cwd(), 'data', 'power-plants.json');
  const plants = JSON.parse(fs.readFileSync(plantsPath, 'utf-8'));
  console.log(`Total power plants to seed: ${plants.length}`);

  const chunkSize = 150;
  for (let i = 0; i < plants.length; i += chunkSize) {
    const chunk = plants.slice(i, i + chunkSize);
    const values = chunk.map(p => {
      const lat = p.latitude;
      const lng = p.longitude;
      const loc = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
      const lmpJson = p.lmpBreakdown ? escapeSql(JSON.stringify(p.lmpBreakdown)) : 'NULL';
      return `(${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.operator)}, ${escapeSql(p.country)}, ${escapeSql(p.countryName)}, ${escapeSql(p.fuelType)}, ${p.capacityMw}, ${p.commissioningYear || 'NULL'}, ${lat}, ${lng}, ${loc}, ${escapeSql(p.gridRegion)}, ${p.co2IntensityGPerKwh || 'NULL'}, ${escapeSql(p.substationName)}, ${escapeSql(p.coolingType)}, ${escapeSql(p.status || 'online')}, ${p.currentOutputMw || 0}, ${p.capacityFactor || 0.85}, ${p.spotPriceMwh || 45.0}, ${lmpJson}::jsonb, ${escapeSql(p.climateTraceAssetId)}, ${p.annualCo2EmissionsTons || 0}, ${p.satelliteTracked ? 'true' : 'false'}, ${escapeSql(p.turbineManufacturer)})`;
    }).join(',\n');

    const sql = `
      INSERT INTO power_plants (id, name, operator, country, country_name, fuel_type, capacity_mw, commissioning_year, latitude, longitude, location, grid_region, co2_intensity_g_per_kwh, substation_name, cooling_type, status, current_output_mw, capacity_factor, spot_price_mwh, lmp_breakdown, climate_trace_asset_id, annual_co2_emissions_tons, satellite_tracked, turbine_manufacturer)
      VALUES ${values}
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        operator = EXCLUDED.operator,
        capacity_mw = EXCLUDED.capacity_mw,
        current_output_mw = EXCLUDED.current_output_mw,
        spot_price_mwh = EXCLUDED.spot_price_mwh,
        updated_at = NOW();
    `;

    await executeSql(sql);
    console.log(`  Seeded power plants ${i + 1} to ${Math.min(i + chunkSize, plants.length)}`);
  }
}

async function seedDataCenters() {
  console.log('--- Seeding Data Centers ---');
  const dcsPath = path.join(process.cwd(), 'data', 'datacenters.json');
  const dcs = JSON.parse(fs.readFileSync(dcsPath, 'utf-8'));
  console.log(`Total data centers to seed: ${dcs.length}`);

  const chunkSize = 150;
  for (let i = 0; i < dcs.length; i += chunkSize) {
    const chunk = dcs.slice(i, i + chunkSize);
    const values = chunk.map(d => {
      const lat = d.latitude;
      const lng = d.longitude;
      const loc = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
      return `(${escapeSql(d.id)}, ${escapeSql(d.name)}, ${escapeSql(d.operator)}, ${escapeSql(d.category || 'Hyperscale')}, ${escapeSql(d.country)}, ${escapeSql(d.countryName || d.country)}, ${escapeSql(d.region)}, ${lat}, ${lng}, ${loc}, ${d.estimatedPowerMw}, ${d.pue || 1.25}, ${escapeSql(d.tier)}, ${escapeSql(d.coolingType)}, ${escapeSql(d.peeringDbId)}, ${escapeSql(d.peeringDbUrl)}, ${escapeSql(d.officialWebsite)}, ${d.localCleanEnergyPercent || 50.0}, ${d.estimatedAnnualCo2Tons || 0})`;
    }).join(',\n');

    const sql = `
      INSERT INTO data_centers (id, name, operator, category, country, country_name, region, latitude, longitude, location, estimated_power_mw, pue, tier, cooling_type, peering_db_id, peering_db_url, official_website, local_clean_energy_percent, estimated_annual_co2_tons)
      VALUES ${values}
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        estimated_power_mw = EXCLUDED.estimated_power_mw,
        local_clean_energy_percent = EXCLUDED.local_clean_energy_percent,
        peering_db_url = EXCLUDED.peering_db_url,
        updated_at = NOW();
    `;

    await executeSql(sql);
    console.log(`  Seeded data centers ${i + 1} to ${Math.min(i + chunkSize, dcs.length)}`);
  }
}

async function seedCrawlerLogs() {
  console.log('--- Seeding Crawler Logs ---');
  const auditPath = path.join(process.cwd(), 'data', 'crawler-audit-log.json');
  if (fs.existsSync(auditPath)) {
    const logs = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    for (const log of logs) {
      const sql = `
        INSERT INTO crawler_logs (id, timestamp, source, status, discovered_candidates, verified_new_nodes, repaired_links, maritime_points_rejected, duration_ms, details)
        VALUES (${escapeSql(log.runId)}, ${escapeSql(log.timestamp)}, ${escapeSql(log.source)}, ${escapeSql(log.status)}, ${log.discoveredCandidates || 0}, ${log.verifiedNewNodes || 0}, ${log.repairedLinks || 0}, ${log.maritimePointsRejected || 0}, ${log.durationMs || 0}, ${escapeSql(log.details)})
        ON CONFLICT (id) DO NOTHING;
      `;
      await executeSql(sql);
    }
    console.log(`✓ Seeded ${logs.length} crawler audit log records`);
  }
}

async function main() {
  console.log('🚀 Starting Supabase Database Seeding...');
  try {
    await seedSubstations();
    await seedPowerPlants();
    await seedDataCenters();
    await seedCrawlerLogs();
    console.log('🎉 ALL DATASETS SEEDED TO SUPABASE SUCCESSFULLY!');
  } catch (e) {
    console.error('Seeding error:', e);
  }
}

main();
