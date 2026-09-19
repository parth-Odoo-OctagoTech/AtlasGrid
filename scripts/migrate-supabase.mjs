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
