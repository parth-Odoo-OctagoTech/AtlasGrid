-- =============================================================================
-- GridPulse Enterprise Infrastructure Observability - PostgreSQL / PostGIS Spatial Schema
-- =============================================================================

-- Enable PostGIS extension for high-performance spatial queries & indexing
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE fuel_type_enum AS ENUM (
  'nuclear', 'hydro', 'gas', 'coal', 'solar', 'wind',
  'storage', 'geothermal', 'biomass', 'oil', 'other'
);

CREATE TYPE station_status_enum AS ENUM (
  'online', 'ramping', 'curtailed', 'outage'
);

CREATE TYPE interconnector_type_enum AS ENUM (
  'HVDC', 'HVAC'
);

CREATE TYPE alert_severity_enum AS ENUM (
  'critical', 'warning', 'info'
);

-- Power Plants Table
CREATE TABLE IF NOT EXISTS power_plants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  operator VARCHAR(255) NOT NULL,
  country VARCHAR(8) NOT NULL,
  country_name VARCHAR(128) NOT NULL,
  fuel_type fuel_type_enum NOT NULL,
  capacity_mw NUMERIC(10, 2) NOT NULL,
  commissioning_year INT,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  location GEOMETRY(Point, 4326),
  grid_region VARCHAR(64) NOT NULL,
  co2_intensity_g_kwh NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
  substation_name VARCHAR(255),
  cooling_type VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate spatial geometry column automatically
CREATE OR REPLACE FUNCTION update_power_plant_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_power_plants_geom
BEFORE INSERT OR UPDATE ON power_plants
FOR EACH ROW EXECUTE FUNCTION update_power_plant_geom();

-- Spatial & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_power_plants_location ON power_plants USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_power_plants_fuel_type ON power_plants(fuel_type);
CREATE INDEX IF NOT EXISTS idx_power_plants_capacity ON power_plants(capacity_mw DESC);
CREATE INDEX IF NOT EXISTS idx_power_plants_grid_region ON power_plants(grid_region);
CREATE INDEX IF NOT EXISTS idx_power_plants_country ON power_plants(country);

-- Real-Time Telemetry & Nodal LMP Timeseries Table (Hypertable / TimescaleDB compatible)
CREATE TABLE IF NOT EXISTS station_telemetry (
  id UUID DEFAULT uuid_generate_v4(),
  station_id VARCHAR(64) REFERENCES power_plants(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_output_mw NUMERIC(10, 2) NOT NULL,
  capacity_factor NUMERIC(5, 4) NOT NULL,
  status station_status_enum NOT NULL DEFAULT 'online',
  spot_price_mwh NUMERIC(8, 2) NOT NULL,
  energy_price_component NUMERIC(8, 2) NOT NULL,
  congestion_price_component NUMERIC(8, 2) NOT NULL,
  loss_price_component NUMERIC(8, 2) NOT NULL,
  co2_emission_tons_per_hour NUMERIC(10, 4) NOT NULL,
  PRIMARY KEY (station_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_station_time ON station_telemetry(station_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON station_telemetry(recorded_at DESC);

-- Transmission Interconnectors
CREATE TABLE IF NOT EXISTS interconnectors (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  source_longitude NUMERIC(10, 6) NOT NULL,
  source_latitude NUMERIC(10, 6) NOT NULL,
  target_longitude NUMERIC(10, 6) NOT NULL,
  target_latitude NUMERIC(10, 6) NOT NULL,
  geom GEOMETRY(LineString, 4326),
  from_region VARCHAR(64) NOT NULL,
  to_region VARCHAR(64) NOT NULL,
  capacity_mw NUMERIC(10, 2) NOT NULL,
  current_flow_mw NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
  voltage_kv NUMERIC(6, 2) NOT NULL,
  type interconnector_type_enum NOT NULL DEFAULT 'HVDC',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interconnectors_geom ON interconnectors USING GIST(geom);

-- Grid Anomaly & Operational Alerts
CREATE TABLE IF NOT EXISTS grid_alerts (
  id VARCHAR(64) PRIMARY KEY,
  station_id VARCHAR(64) REFERENCES power_plants(id) ON DELETE SET NULL,
  region VARCHAR(64) NOT NULL,
  severity alert_severity_enum NOT NULL,
  alert_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metric_value NUMERIC(10, 2),
  unit VARCHAR(32),
  longitude NUMERIC(10, 6),
  latitude NUMERIC(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON grid_alerts(created_at DESC);

-- =============================================================================
-- Historical Earthquakes (USGS ComCat & ISC-GEM)
-- =============================================================================
CREATE TABLE IF NOT EXISTS historical_earthquakes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  magnitude NUMERIC(3, 1) NOT NULL,
  depth_km NUMERIC(6, 2) NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  location GEOMETRY(Point, 4326),
  place TEXT,
  significance INT,
  mmi NUMERIC(3, 1),
  tsunami BOOLEAN DEFAULT false,
  felt_reports INT,
  source VARCHAR(32) DEFAULT 'USGS_COMCAT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historical_earthquakes_location ON historical_earthquakes USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_historical_earthquakes_mag ON historical_earthquakes(magnitude DESC);
CREATE INDEX IF NOT EXISTS idx_historical_earthquakes_time ON historical_earthquakes(occurred_at DESC);

-- =============================================================================
-- Historical Severe Storms (NOAA SPC & HURDAT2)
-- =============================================================================
CREATE TABLE IF NOT EXISTS historical_severe_storms (
  id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  intensity VARCHAR(16) NOT NULL,
  category_num INT NOT NULL DEFAULT 1,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  center_geom GEOMETRY(Point, 4326),
  path_geom GEOMETRY(LineString, 4326),
  max_wind_mph NUMERIC(6, 2),
  damages_usd_millions NUMERIC(12, 2),
  state_or_region VARCHAR(128),
  country VARCHAR(8) NOT NULL,
  source VARCHAR(32) DEFAULT 'NOAA_SPC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historical_storms_center ON historical_severe_storms USING GIST(center_geom);
CREATE INDEX IF NOT EXISTS idx_historical_storms_path ON historical_severe_storms USING GIST(path_geom);
CREATE INDEX IF NOT EXISTS idx_historical_storms_type ON historical_severe_storms(event_type);
CREATE INDEX IF NOT EXISTS idx_historical_storms_time ON historical_severe_storms(occurred_at DESC);

-- =============================================================================
-- Historical Climate Records (NASA POWER & Open-Meteo 10-Year Normals)
-- =============================================================================
CREATE TABLE IF NOT EXISTS historical_climate_records (
  region_code VARCHAR(64) PRIMARY KEY,
  region_name VARCHAR(255) NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  location GEOMETRY(Point, 4326),
  period VARCHAR(64) NOT NULL,
  annual_avg_dry_bulb_c NUMERIC(4, 1) NOT NULL,
  annual_avg_wet_bulb_c NUMERIC(4, 1) NOT NULL,
  peak_wet_bulb_c NUMERIC(4, 1) NOT NULL,
  total_annual_free_cooling_hours INT NOT NULL,
  free_cooling_efficiency_pct NUMERIC(5, 2) NOT NULL,
  extreme_heat_days_per_year INT NOT NULL,
  source VARCHAR(32) DEFAULT 'NASA_POWER',
  monthly_normals JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historical_climate_location ON historical_climate_records USING GIST(location);

-- =============================================================================
-- Historical Data Center Fleet Growth (1998–2026 Evolution)
-- =============================================================================
CREATE TABLE IF NOT EXISTS historical_datacenter_growth (
  year INT PRIMARY KEY,
  total_power_mw NUMERIC(10, 2) NOT NULL,
  operational_facilities INT NOT NULL,
  hyperscale_count INT NOT NULL,
  colocation_count INT NOT NULL,
  enterprise_count INT NOT NULL,
  avg_pue NUMERIC(4, 2) NOT NULL,
  clean_energy_share_pct NUMERIC(5, 2) NOT NULL,
  cumulative_tflops_compute_est NUMERIC(14, 2) NOT NULL,
  key_milestone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

