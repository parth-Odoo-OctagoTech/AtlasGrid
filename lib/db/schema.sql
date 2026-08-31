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
