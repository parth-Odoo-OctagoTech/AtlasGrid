import https from 'https';

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

const MIGRATION_SQL = `
-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Power Plants Table
CREATE TABLE IF NOT EXISTS power_plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  operator TEXT,
  country TEXT NOT NULL,
  country_name TEXT,
  fuel_type TEXT NOT NULL,
  capacity_mw NUMERIC NOT NULL,
  commissioning_year INTEGER,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location GEOMETRY(Point, 4326),
  grid_region TEXT NOT NULL,
  co2_intensity_g_per_kwh NUMERIC,
  substation_name TEXT,
  cooling_type TEXT,
  status TEXT DEFAULT 'online',
  current_output_mw NUMERIC,
  capacity_factor NUMERIC,
  spot_price_mwh NUMERIC,
  lmp_breakdown JSONB,
  climate_trace_asset_id TEXT,
  annual_co2_emissions_tons NUMERIC,
  satellite_tracked BOOLEAN DEFAULT false,
  turbine_manufacturer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Data Centers Table
CREATE TABLE IF NOT EXISTS data_centers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  operator TEXT NOT NULL,
  category TEXT,
  country TEXT NOT NULL,
  country_name TEXT,
  region TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location GEOMETRY(Point, 4326),
  estimated_power_mw NUMERIC NOT NULL,
  pue NUMERIC,
  tier TEXT,
  cooling_type TEXT,
  peering_db_id TEXT,
  peering_db_url TEXT,
  official_website TEXT,
  local_clean_energy_percent NUMERIC,
  estimated_annual_co2_tons NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. High-Voltage Substations Table
CREATE TABLE IF NOT EXISTS substations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  voltage_kv INTEGER NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location GEOMETRY(Point, 4326),
  grid_region TEXT NOT NULL,
  country TEXT NOT NULL,
  country_name TEXT,
  type TEXT NOT NULL,
  operator TEXT NOT NULL,
  connected_capacity_mw NUMERIC,
  connected_plants_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Interconnectors Table
CREATE TABLE IF NOT EXISTS interconnectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  from_region TEXT NOT NULL,
  to_region TEXT NOT NULL,
  capacity_mw NUMERIC NOT NULL,
  current_flow_mw NUMERIC NOT NULL,
  voltage_kv INTEGER NOT NULL,
  type TEXT NOT NULL,
  source_coord GEOMETRY(Point, 4326),
  target_coord GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Autonomous Crawler Audit Logs Table
CREATE TABLE IF NOT EXISTS crawler_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  discovered_candidates INTEGER,
  verified_new_nodes INTEGER,
  repaired_links INTEGER,
  maritime_points_rejected INTEGER,
  duration_ms INTEGER,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Spatial GIST Indexes
CREATE INDEX IF NOT EXISTS idx_power_plants_location ON power_plants USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_data_centers_location ON data_centers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_substations_location ON substations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_power_plants_country ON power_plants(country);
CREATE INDEX IF NOT EXISTS idx_data_centers_country ON data_centers(country);
CREATE INDEX IF NOT EXISTS idx_substations_country ON substations(country);
CREATE INDEX IF NOT EXISTS idx_substations_voltage ON substations(voltage_kv);

-- 8. Historical Earthquakes (USGS ComCat & ISC-GEM)
CREATE TABLE IF NOT EXISTS historical_earthquakes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  magnitude NUMERIC NOT NULL,
  depth_km NUMERIC NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location GEOMETRY(Point, 4326),
  place TEXT,
  significance INTEGER,
  mmi NUMERIC,
  tsunami BOOLEAN DEFAULT false,
  felt_reports INTEGER,
  source TEXT DEFAULT 'USGS_COMCAT',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hist_earthquakes_location ON historical_earthquakes USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_hist_earthquakes_mag ON historical_earthquakes(magnitude DESC);

-- 9. Historical Severe Storms (NOAA SPC & HURDAT2)
CREATE TABLE IF NOT EXISTS historical_severe_storms (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  name TEXT NOT NULL,
  intensity TEXT NOT NULL,
  category_num INTEGER NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  center_geom GEOMETRY(Point, 4326),
  path_geom GEOMETRY(LineString, 4326),
  max_wind_mph NUMERIC,
  damages_usd_millions NUMERIC,
  state_or_region TEXT,
  country TEXT NOT NULL,
  source TEXT DEFAULT 'NOAA_SPC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hist_storms_center ON historical_severe_storms USING GIST(center_geom);
CREATE INDEX IF NOT EXISTS idx_hist_storms_path ON historical_severe_storms USING GIST(path_geom);
CREATE INDEX IF NOT EXISTS idx_hist_storms_type ON historical_severe_storms(event_type);

-- 10. Historical Climate Records (NASA POWER & Open-Meteo 10-Year Normals)
CREATE TABLE IF NOT EXISTS historical_climate_records (
  region_code TEXT PRIMARY KEY,
  region_name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location GEOMETRY(Point, 4326),
  period TEXT NOT NULL,
  annual_avg_dry_bulb_c NUMERIC NOT NULL,
  annual_avg_wet_bulb_c NUMERIC NOT NULL,
  peak_wet_bulb_c NUMERIC NOT NULL,
  total_annual_free_cooling_hours INTEGER NOT NULL,
  free_cooling_efficiency_pct NUMERIC NOT NULL,
  extreme_heat_days_per_year INTEGER NOT NULL,
  source TEXT DEFAULT 'NASA_POWER',
  monthly_normals JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hist_climate_location ON historical_climate_records USING GIST(location);

-- 11. Historical Data Center Fleet Growth (1998–2026)
CREATE TABLE IF NOT EXISTS historical_datacenter_growth (
  year INTEGER PRIMARY KEY,
  total_power_mw NUMERIC NOT NULL,
  operational_facilities INTEGER NOT NULL,
  hyperscale_count INTEGER NOT NULL,
  colocation_count INTEGER NOT NULL,
  enterprise_count INTEGER NOT NULL,
  avg_pue NUMERIC NOT NULL,
  clean_energy_share_pct NUMERIC NOT NULL,
  cumulative_tflops_compute_est NUMERIC NOT NULL,
  key_milestone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function main() {
  console.log(`Connecting to Supabase project: ${PROJECT_REF}...`);
  try {
    const result = await executeSql(MIGRATION_SQL);
    console.log('✓ Migration executed successfully:');
    console.log(result);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
