import * as fs from "fs";
import * as path from "path";
import { FuelType, GridRegion, Interconnector, PowerPlant, StationStatus } from "../lib/types/power-plant";

// Major real-world anchor power stations
interface AnchorStation {
  name: string;
  operator: string;
  country: string;
  countryName: string;
  fuelType: FuelType;
  capacityMw: number;
  commissioningYear: number;
  latitude: number;
  longitude: number;
  gridRegion: GridRegion;
  substationName?: string;
  coolingType?: string;
}

const ANCHOR_STATIONS: AnchorStation[] = [
  // North America
  { name: "Palo Verde Nuclear Generating Station", operator: "Arizona Public Service", country: "US", countryName: "United States", fuelType: "nuclear", capacityMw: 3937, commissioningYear: 1986, latitude: 33.3965, longitude: -112.868, gridRegion: "CAISO", substationName: "Hassayampa 500kV", coolingType: "Treated Effluent Water" },
  { name: "Grand Coulee Hydroelectric Dam", operator: "US Bureau of Reclamation", country: "US", countryName: "United States", fuelType: "hydro", capacityMw: 6809, commissioningYear: 1942, latitude: 47.957, longitude: -118.981, gridRegion: "CAISO", substationName: "Grand Coulee 500kV", coolingType: "Run-of-river" },
  { name: "Vogtle Electric Generating Plant", operator: "Georgia Power / Southern Co", country: "US", countryName: "United States", fuelType: "nuclear", capacityMw: 4536, commissioningYear: 1987, latitude: 33.1428, longitude: -81.7618, gridRegion: "PJM", substationName: "Vogtle 500kV Substation", coolingType: "Natural Draft Cooling Towers" },
  { name: "Diablo Canyon Power Plant", operator: "Pacific Gas & Electric", country: "US", countryName: "United States", fuelType: "nuclear", capacityMw: 2256, commissioningYear: 1985, latitude: 35.2115, longitude: -120.8548, gridRegion: "CAISO", substationName: "Diablo 500kV", coolingType: "Once-through Ocean" },
  { name: "Hoover Dam Hydroelectric Facility", operator: "US Bureau of Reclamation", country: "US", countryName: "United States", fuelType: "hydro", capacityMw: 2080, commissioningYear: 1936, latitude: 36.0156, longitude: -114.7378, gridRegion: "CAISO", substationName: "Mead 230kV / 500kV", coolingType: "Reservoir" },
  { name: "South Texas Project Nuclear", operator: "STP Nuclear Operating Co", country: "US", countryName: "United States", fuelType: "nuclear", capacityMw: 2700, commissioningYear: 1988, latitude: 28.795, longitude: -96.048, gridRegion: "ERCOT", substationName: "Hillje 345kV", coolingType: "Cooling Reservoir" },
  { name: "W.A. Parish Generating Station", operator: "NRG Energy", country: "US", countryName: "United States", fuelType: "gas", capacityMw: 3653, commissioningYear: 1977, latitude: 29.4802, longitude: -95.632, gridRegion: "ERCOT", substationName: "Parish 345kV", coolingType: "Cooling Lake" },
  { name: "Bruce Nuclear Generating Station", operator: "Bruce Power", country: "CA", countryName: "Canada", fuelType: "nuclear", capacityMw: 6430, commissioningYear: 1977, latitude: 44.325, longitude: -81.599, gridRegion: "PJM", substationName: "Bruce A/B 500kV", coolingType: "Lake Huron Once-through" },
  { name: "Robert-Bourassa Hydroelectric Generating Station", operator: "Hydro-Québec", country: "CA", countryName: "Canada", fuelType: "hydro", capacityMw: 5616, commissioningYear: 1979, latitude: 53.791, longitude: -77.531, gridRegion: "NYISO", substationName: "Radisson 735kV", coolingType: "Reservoir" },
  { name: "Topaz Solar Farm", operator: "BHE Renewables", country: "US", countryName: "United States", fuelType: "solar", capacityMw: 550, commissioningYear: 2014, latitude: 35.383, longitude: -120.066, gridRegion: "CAISO", substationName: "Midway-Morro Bay 230kV", coolingType: "None" },
  { name: "Alta Wind Energy Center", operator: "Terra-Gen Power", country: "US", countryName: "United States", fuelType: "wind", capacityMw: 1548, commissioningYear: 2010, latitude: 35.028, longitude: -118.328, gridRegion: "CAISO", substationName: "Windhub 500kV Substation", coolingType: "None" },
  { name: "Moss Landing Energy Storage Facility", operator: "Vistra Energy", country: "US", countryName: "United States", fuelType: "storage", capacityMw: 750, commissioningYear: 2021, latitude: 36.804, longitude: -121.785, gridRegion: "CAISO", substationName: "Moss Landing 500kV", coolingType: "Liquid Chilled HVAC" },
  { name: "The Geysers Geothermal Complex", operator: "Calpine Corporation", country: "US", countryName: "United States", fuelType: "geothermal", capacityMw: 1517, commissioningYear: 1960, latitude: 38.796, longitude: -122.755, gridRegion: "CAISO", substationName: "Fulton 230kV", coolingType: "Wet Evaporative" },
  { name: "Monroe Coal Power Plant", operator: "DTE Energy", country: "US", countryName: "United States", fuelType: "coal", capacityMw: 3280, commissioningYear: 1971, latitude: 41.8906, longitude: -83.3467, gridRegion: "MISO", substationName: "Monroe 345kV", coolingType: "Lake Erie Once-through" },
  { name: "James M. Barry Electric Generating Plant", operator: "Alabama Power", country: "US", countryName: "United States", fuelType: "gas", capacityMw: 2671, commissioningYear: 1954, latitude: 31.0064, longitude: -88.0108, gridRegion: "PJM", substationName: "Barry 500kV", coolingType: "Mobile River Once-through" },
  { name: "Roscoe Wind Farm", operator: "RWE Renewables", country: "US", countryName: "United States", fuelType: "wind", capacityMw: 781, commissioningYear: 2009, latitude: 32.265, longitude: -100.344, gridRegion: "ERCOT", substationName: "Sweetwater 345kV", coolingType: "None" },

  // Europe
  { name: "Gravelines Nuclear Power Station", operator: "EDF (Électricité de France)", country: "FR", countryName: "France", fuelType: "nuclear", capacityMw: 5706, commissioningYear: 1980, latitude: 51.015, longitude: 2.136, gridRegion: "ENTSOE_FR", substationName: "Gravelines 400kV", coolingType: "North Sea Once-through" },
  { name: "Cattenom Nuclear Power Plant", operator: "EDF", country: "FR", countryName: "France", fuelType: "nuclear", capacityMw: 5448, commissioningYear: 1986, latitude: 49.416, longitude: 6.218, gridRegion: "ENTSOE_FR", substationName: "Cattenom 400kV", coolingType: "Moselle River Cooling Towers" },
  { name: "Olkiluoto Nuclear Power Plant", operator: "Teollisuuden Voima (TVO)", country: "FI", countryName: "Finland", fuelType: "nuclear", capacityMw: 4380, commissioningYear: 1978, latitude: 61.236, longitude: 21.44, gridRegion: "NORDPOOL", substationName: "Olkiluoto 400kV", coolingType: "Baltic Sea Once-through" },
  { name: "Hornsea Offshore Wind Farm (Project One & Two)", operator: "Ørsted", country: "GB", countryName: "United Kingdom", fuelType: "wind", capacityMw: 2570, commissioningYear: 2019, latitude: 53.883, longitude: 1.833, gridRegion: "ENTSOE_GB", substationName: "Killingholme 400kV", coolingType: "None" },
  { name: "Drax Power Station", operator: "Drax Group", country: "GB", countryName: "United Kingdom", fuelType: "biomass", capacityMw: 3960, commissioningYear: 1974, latitude: 53.738, longitude: -0.998, gridRegion: "ENTSOE_GB", substationName: "Drax 400kV", coolingType: "Natural Draft Cooling Towers" },
  { name: "Neurath Power Station", operator: "RWE Power AG", country: "DE", countryName: "Germany", fuelType: "coal", capacityMw: 4400, commissioningYear: 1972, latitude: 51.037, longitude: 6.623, gridRegion: "ENTSOE_DE", substationName: "Neurath 380kV", coolingType: "Natural Draft Cooling Towers" },
  { name: "Irsching Gas Power Station", operator: "Uniper", country: "DE", countryName: "Germany", fuelType: "gas", capacityMw: 2150, commissioningYear: 1969, latitude: 48.766, longitude: 11.603, gridRegion: "ENTSOE_DE", substationName: "Irsching 380kV", coolingType: "Danube River Once-through" },
  { name: "Cestas Solar Park", operator: "Neoen", country: "FR", countryName: "France", fuelType: "solar", capacityMw: 300, commissioningYear: 2015, latitude: 44.717, longitude: -0.767, gridRegion: "ENTSOE_FR", substationName: "Pessac 225kV", coolingType: "None" },
  { name: "Grand'Maison Pumped Storage Hydro", operator: "EDF", country: "FR", countryName: "France", fuelType: "hydro", capacityMw: 1820, commissioningYear: 1985, latitude: 45.206, longitude: 6.126, gridRegion: "ENTSOE_FR", substationName: "Romanche 400kV", coolingType: "Pumped Storage Reservoir" },
  { name: "Bełchatów Power Station", operator: "PGE GiEK", country: "PL", countryName: "Poland", fuelType: "coal", capacityMw: 5102, commissioningYear: 1981, latitude: 51.266, longitude: 19.327, gridRegion: "ENTSOE_DE", substationName: "Rogowiec 400kV", coolingType: "Cooling Towers" },
  { name: "Almaraz Nuclear Power Plant", operator: "Centrales Nucleares Almaraz-Trillo", country: "ES", countryName: "Spain", fuelType: "nuclear", capacityMw: 2094, commissioningYear: 1981, latitude: 39.808, longitude: -5.697, gridRegion: "ENTSOE_ES", substationName: "Almaraz 400kV", coolingType: "Arrocampo Reservoir" },
  { name: "Núñez de Balboa Solar Plant", operator: "Iberdrola", country: "ES", countryName: "Spain", fuelType: "solar", capacityMw: 500, commissioningYear: 2020, latitude: 38.455, longitude: -6.444, gridRegion: "ENTSOE_ES", substationName: "Bienvenida 400kV", coolingType: "None" },
  { name: "Hellisheiði Geothermal Power Station", operator: "ON Power", country: "IS", countryName: "Iceland", fuelType: "geothermal", capacityMw: 303, commissioningYear: 2006, latitude: 64.038, longitude: -21.402, gridRegion: "NORDPOOL", substationName: "Kolviðarhóll 220kV", coolingType: "Direct Steam Injection" },

  // Asia & Oceania
  { name: "Three Gorges Dam Hydroelectric Facility", operator: "China Three Gorges Corporation", country: "CN", countryName: "China", fuelType: "hydro", capacityMw: 22500, commissioningYear: 2003, latitude: 30.827, longitude: 111.007, gridRegion: "CHINA_STATE_GRID", substationName: "Yichang 500kV / HVDC", coolingType: "Run-of-river" },
  { name: "Baihetan Dam Hydroelectric Power Station", operator: "China Three Gorges Corporation", country: "CN", countryName: "China", fuelType: "hydro", capacityMw: 16000, commissioningYear: 2021, latitude: 27.224, longitude: 102.901, gridRegion: "CHINA_STATE_GRID", substationName: "Baihetan ±800kV UHVDC", coolingType: "Reservoir" },
  { name: "Tuoketuo Coal Power Station", operator: "Datang Power", country: "CN", countryName: "China", fuelType: "coal", capacityMw: 6720, commissioningYear: 2001, latitude: 40.196, longitude: 111.365, gridRegion: "CHINA_STATE_GRID", substationName: "Tuoketuo 500kV", coolingType: "Air Cooled Condensers" },
  { name: "Taishan Nuclear Power Plant", operator: "Taishan Nuclear Power Joint Venture", country: "CN", countryName: "China", fuelType: "nuclear", capacityMw: 3500, commissioningYear: 2018, latitude: 21.918, longitude: 112.982, gridRegion: "CHINA_STATE_GRID", substationName: "Taishan 500kV", coolingType: "South China Sea Once-through" },
  { name: "Bhadla Solar Park", operator: "NTPC / Saurya Urja", country: "IN", countryName: "India", fuelType: "solar", capacityMw: 2245, commissioningYear: 2018, latitude: 27.539, longitude: 71.915, gridRegion: "INDIA_NREB", substationName: "Bhadla 765kV / 400kV", coolingType: "None" },
  { name: "Pavagada Solar Park (Shakti Sthala)", operator: "KSPDCL", country: "IN", countryName: "India", fuelType: "solar", capacityMw: 2050, commissioningYear: 2018, latitude: 14.281, longitude: 77.414, gridRegion: "INDIA_NREB", substationName: "Pavagada 400kV", coolingType: "None" },
  { name: "Kashiwazaki-Kariwa Nuclear Power Station", operator: "TEPCO", country: "JP", countryName: "Japan", fuelType: "nuclear", capacityMw: 8212, commissioningYear: 1985, latitude: 37.429, longitude: 138.601, gridRegion: "JAPAN_TEPCO", substationName: "Nishi-Gunma 500kV", coolingType: "Sea of Japan Once-through" },
  { name: "Futtsu Thermal Power Station", operator: "JERA", country: "JP", countryName: "Japan", fuelType: "gas", capacityMw: 5040, commissioningYear: 1985, latitude: 35.342, longitude: 139.839, gridRegion: "JAPAN_TEPCO", substationName: "Futtsu 500kV", coolingType: "Tokyo Bay Once-through" },
  { name: "Tengger Desert Solar Park", operator: "China National Energy", country: "CN", countryName: "China", fuelType: "solar", capacityMw: 1547, commissioningYear: 2017, latitude: 37.55, longitude: 105.05, gridRegion: "CHINA_STATE_GRID", substationName: "Zhongwei 330kV", coolingType: "None" },
  { name: "Hornsdale Power Reserve (Tesla Big Battery)", operator: "Neoen", country: "AU", countryName: "Australia", fuelType: "storage", capacityMw: 150, commissioningYear: 2017, latitude: -33.092, longitude: 138.544, gridRegion: "NEM_AUSTRALIA", substationName: "Hornsdale 275kV", coolingType: "Liquid Chilled" },
  { name: "Snowy Mountains Hydroelectric Scheme", operator: "Snowy Hydro", country: "AU", countryName: "Australia", fuelType: "hydro", capacityMw: 4100, commissioningYear: 1974, latitude: -36.299, longitude: 148.489, gridRegion: "NEM_AUSTRALIA", substationName: "Murray 330kV", coolingType: "Alpine Reservoirs" },
  { name: "Loy Yang A & B Power Station", operator: "AGL Energy / Alinta Energy", country: "AU", countryName: "Australia", fuelType: "coal", capacityMw: 3210, commissioningYear: 1984, latitude: -38.254, longitude: 146.577, gridRegion: "NEM_AUSTRALIA", substationName: "Loy Yang 500kV", coolingType: "Cooling Towers" },

  // Latin America, Middle East, Africa
  { name: "Itaipu Dam Hydroelectric Power Plant", operator: "Itaipu Binacional", country: "BR", countryName: "Brazil", fuelType: "hydro", capacityMw: 14000, commissioningYear: 1984, latitude: -25.409, longitude: -54.588, gridRegion: "BRAZIL_ONS", substationName: "Foz do Iguaçu 500kV / ±600kV HVDC", coolingType: "Paraná River Run-of-river" },
  { name: "Guri Dam (Simón Bolívar Hydroelectric)", operator: "Corpoelec", country: "VE", countryName: "Venezuela", fuelType: "hydro", capacityMw: 10235, commissioningYear: 1978, latitude: 7.766, longitude: -62.999, gridRegion: "GLOBAL_OTHER", substationName: "Guri 765kV", coolingType: "Caroní River Reservoir" },
  { name: "Barakah Nuclear Energy Plant", operator: "ENEC / Nawah Energy", country: "AE", countryName: "United Arab Emirates", fuelType: "nuclear", capacityMw: 5600, commissioningYear: 2020, latitude: 23.97, longitude: 52.26, gridRegion: "GLOBAL_OTHER", substationName: "Barakah 400kV", coolingType: "Persian Gulf Once-through" },
  { name: "Noor Ouarzazate Solar Complex", operator: "MASEN / ACWA Power", country: "MA", countryName: "Morocco", fuelType: "solar", capacityMw: 580, commissioningYear: 2016, latitude: 30.999, longitude: -6.861, gridRegion: "GLOBAL_OTHER", substationName: "Ouarzazate 225kV", coolingType: "Dry Air Cooled" },
  { name: "Koeberg Nuclear Power Station", operator: "Eskom", country: "ZA", countryName: "South Africa", fuelType: "nuclear", capacityMw: 1940, commissioningYear: 1984, latitude: -33.677, longitude: 18.431, gridRegion: "GLOBAL_OTHER", substationName: "Koeberg 400kV", coolingType: "Atlantic Ocean Once-through" },
  { name: "Aswan High Dam Hydroelectric Station", operator: "Egyptian Electricity Holding Co", country: "EG", countryName: "Egypt", fuelType: "hydro", capacityMw: 2100, commissioningYear: 1967, latitude: 23.97, longitude: 32.88, gridRegion: "GLOBAL_OTHER", substationName: "Aswan 500kV", coolingType: "Nile River Reservoir" },
];

// Major High-Voltage Interconnectors
const INTERCONNECTORS: Interconnector[] = [
  { id: "ic-1", name: "Pacific DC Intertie (PDCI)", source: [-121.13, 45.59], target: [-118.48, 34.31], fromRegion: "Northwest / BPA", toRegion: "CAISO (Sylmar LA)", capacityMw: 3100, currentFlowMw: 2450, voltageKv: 500, type: "HVDC" },
  { id: "ic-2", name: "Path 26 (Midway-Vincent)", source: [-119.5, 35.3], target: [-118.3, 34.4], fromRegion: "Northern CAISO", toRegion: "Southern CAISO", capacityMw: 4000, currentFlowMw: 1850, voltageKv: 500, type: "HVAC" },
  { id: "ic-3", name: "PJM - MISO Intertie", source: [-84.5, 41.5], target: [-83.0, 41.5], fromRegion: "MISO Midwest", toRegion: "PJM Interconnection", capacityMw: 6500, currentFlowMw: -1200, voltageKv: 765, type: "HVAC" },
  { id: "ic-4", name: "IFA-2 Interconnector (France - UK)", source: [-0.3, 49.3], target: [-1.2, 50.8], fromRegion: "ENTSO-E France", toRegion: "UK National Grid", capacityMw: 1000, currentFlowMw: 920, voltageKv: 320, type: "HVDC" },
  { id: "ic-5", name: "NordLink (Germany - Norway)", source: [9.1, 53.9], target: [7.2, 58.2], fromRegion: "ENTSO-E Germany", toRegion: "NordPool Norway", capacityMw: 1400, currentFlowMw: -1100, voltageKv: 525, type: "HVDC" },
  { id: "ic-6", name: "Biscay Gulf Interconnector (Spain - France)", source: [-2.9, 43.3], target: [-0.6, 44.8], fromRegion: "REE Spain", toRegion: "RTE France", capacityMw: 2000, currentFlowMw: 850, voltageKv: 400, type: "HVDC" },
  { id: "ic-7", name: "Baihetan - Jiangsu ±800kV UHVDC", source: [102.9, 27.2], target: [119.8, 31.8], fromRegion: "Sichuan Hydro Basin", toRegion: "East China Industrial Grid", capacityMw: 8000, currentFlowMw: 7600, voltageKv: 800, type: "HVDC" },
  { id: "ic-8", name: "Basslink (Tasmania - Victoria)", source: [146.9, -41.1], target: [146.6, -38.5], fromRegion: "Tasmania Hydro", toRegion: "NEM Victoria", capacityMw: 500, currentFlowMw: 320, voltageKv: 400, type: "HVDC" },
  { id: "ic-9", name: "Itaipu HVDC Transmission System", source: [-54.6, -25.4], target: [-46.6, -23.5], fromRegion: "Itaipu Binacional", toRegion: "São Paulo Industrial Hub", capacityMw: 6300, currentFlowMw: 5800, voltageKv: 600, type: "HVDC" },
  { id: "ic-10", name: "Texas-Mexico Interconnect (Eagle Pass / Laredo)", source: [-99.5, 27.5], target: [-99.5, 27.4], fromRegion: "ERCOT", toRegion: "CENACE Mexico", capacityMw: 400, currentFlowMw: 150, voltageKv: 138, type: "HVAC" },
];

// Generation zones for 5000+ realistic worldwide power plants
interface GeoZone {
  country: string;
  countryName: string;
  gridRegion: GridRegion;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  fuelWeights: Record<FuelType, number>;
  operators: string[];
  substations: string[];
}

const GEO_ZONES: GeoZone[] = [
  // US CAISO / Western US
  {
    country: "US",
    countryName: "United States",
    gridRegion: "CAISO",
    bounds: { minLat: 32.5, maxLat: 42.0, minLng: -124.5, maxLng: -114.0 },
    fuelWeights: { solar: 0.38, wind: 0.18, gas: 0.22, hydro: 0.12, storage: 0.06, geothermal: 0.03, nuclear: 0.01, biomass: 0.0, coal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["Pacific Gas & Electric", "Southern California Edison", "San Diego Gas & Electric", "NextEra Energy", "AES Clean Energy", "Pattern Energy", "BHE Renewables"],
    substations: ["Midway 500kV", "Vincent 500kV", "Moss Landing 230kV", "Devers 500kV", "Gates 500kV", "Table Mountain 230kV", "Lugo 500kV"]
  },
  // US Texas / ERCOT
  {
    country: "US",
    countryName: "United States",
    gridRegion: "ERCOT",
    bounds: { minLat: 26.0, maxLat: 36.5, minLng: -106.5, maxLng: -93.5 },
    fuelWeights: { wind: 0.32, solar: 0.28, gas: 0.28, storage: 0.06, coal: 0.04, nuclear: 0.02, hydro: 0.0, geothermal: 0.0, biomass: 0.0, oil: 0.0, other: 0.0 },
    operators: ["Vistra Corp", "NRG Energy", "NextEra Energy Resources", "Calpine", "Orsted North America", "Engie NA", "Avangrid"],
    substations: ["Hillje 345kV", "Singleton 345kV", "Sweetwater 345kV", "Edith Clarke 345kV", "Roanoke 345kV", "Nelson Sharpe 345kV"]
  },
  // US PJM / Mid-Atlantic & Rust Belt
  {
    country: "US",
    countryName: "United States",
    gridRegion: "PJM",
    bounds: { minLat: 36.5, maxLat: 42.5, minLng: -89.5, maxLng: -74.0 },
    fuelWeights: { gas: 0.42, nuclear: 0.28, coal: 0.16, solar: 0.06, wind: 0.05, hydro: 0.02, storage: 0.01, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["Exelon / Constellation", "American Electric Power (AEP)", "Public Service Enterprise Group (PSEG)", "Dominion Energy", "Duke Energy", "FirstEnergy"],
    substations: ["Doubs 500kV", "Kammer 765kV", "Peach Bottom 500kV", "Juniata 500kV", "Conemaugh 500kV", "Benton Harbor 345kV"]
  },
  // US MISO / Central
  {
    country: "US",
    countryName: "United States",
    gridRegion: "MISO",
    bounds: { minLat: 29.5, maxLat: 49.0, minLng: -98.0, maxLng: -84.0 },
    fuelWeights: { wind: 0.30, gas: 0.32, coal: 0.22, nuclear: 0.10, solar: 0.04, hydro: 0.01, storage: 0.01, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["DTE Energy", "Ameren", "Entergy", "Xcel Energy", "Consumers Energy", "CMS Energy", "Alliant Energy"],
    substations: ["Wilmarth 345kV", "Rock Creek 345kV", "Palisades 345kV", "Columbia 345kV", "Grand Gulf 500kV"]
  },
  // US NYISO & ISO-NE
  {
    country: "US",
    countryName: "United States",
    gridRegion: "NYISO",
    bounds: { minLat: 40.5, maxLat: 47.5, minLng: -79.5, maxLng: -67.0 },
    fuelWeights: { gas: 0.38, hydro: 0.24, nuclear: 0.18, wind: 0.10, solar: 0.08, storage: 0.02, coal: 0.0, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["New York Power Authority (NYPA)", "Con Edison", "National Grid USA", "Avangrid", "Eversource", "Brookfield Renewable"],
    substations: ["Marcy 765kV", "Coopers Corners 345kV", "Edic 345kV", "Millstone 345kV", "Sandy Pond 450kV HVDC"]
  },
  // Europe - Germany / Central Europe
  {
    country: "DE",
    countryName: "Germany",
    gridRegion: "ENTSOE_DE",
    bounds: { minLat: 47.5, maxLat: 54.8, minLng: 6.0, maxLng: 14.8 },
    fuelWeights: { wind: 0.38, solar: 0.32, gas: 0.14, coal: 0.10, biomass: 0.04, hydro: 0.02, storage: 0.0, nuclear: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["RWE AG", "Uniper", "EnBW", "Vattenfall", "LEAG", "E.ON", "Encavis"],
    substations: ["Wilster 380kV", "Wahle 380kV", "Uchtelfangen 380kV", "Kriegenbrunn 380kV", "Dörpen West 380kV"]
  },
  // Europe - France
  {
    country: "FR",
    countryName: "France",
    gridRegion: "ENTSOE_FR",
    bounds: { minLat: 42.5, maxLat: 50.8, minLng: -4.5, maxLng: 7.8 },
    fuelWeights: { nuclear: 0.62, hydro: 0.14, wind: 0.12, solar: 0.08, gas: 0.04, biomass: 0.0, coal: 0.0, geothermal: 0.0, storage: 0.0, oil: 0.0, other: 0.0 },
    operators: ["EDF (Électricité de France)", "Engie", "TotalEnergies Renewables", "Voltalia", "CNR (Compagnie Nationale du Rhône)"],
    substations: ["Chooz 400kV", "Villevaudé 400kV", "Avelin 400kV", "Lonny 400kV", "Boutre 400kV"]
  },
  // Europe - Great Britain
  {
    country: "GB",
    countryName: "United Kingdom",
    gridRegion: "ENTSOE_GB",
    bounds: { minLat: 50.0, maxLat: 58.5, minLng: -6.0, maxLng: 1.8 },
    fuelWeights: { wind: 0.44, gas: 0.32, nuclear: 0.12, solar: 0.06, biomass: 0.04, hydro: 0.02, storage: 0.0, coal: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["SSE Renewables", "ScottishPower", "Centrica", "RWE Generation UK", "EDF Energy UK", "Drax Group"],
    substations: ["Bramford 400kV", "Grain 400kV", "Bicker Fen 400kV", "Blackhill 400kV", "Torness 400kV"]
  },
  // Europe - Spain & Portugal
  {
    country: "ES",
    countryName: "Spain",
    gridRegion: "ENTSOE_ES",
    bounds: { minLat: 36.0, maxLat: 43.5, minLng: -9.0, maxLng: 3.0 },
    fuelWeights: { solar: 0.35, wind: 0.32, gas: 0.15, hydro: 0.10, nuclear: 0.06, storage: 0.02, coal: 0.0, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["Iberdrola", "Endesa / Enel", "Naturgy", "Acciona Energía", "EDP Renováveis"],
    substations: ["Vic 400kV", "Morata 400kV", "Tordesillas 400kV", "Guillena 400kV", "Grijota 400kV"]
  },
  // Europe - Nordics (Norway, Sweden, Finland)
  {
    country: "NO",
    countryName: "Norway / Sweden",
    gridRegion: "NORDPOOL",
    bounds: { minLat: 56.0, maxLat: 69.0, minLng: 5.0, maxLng: 28.0 },
    fuelWeights: { hydro: 0.55, wind: 0.22, nuclear: 0.18, biomass: 0.03, solar: 0.02, gas: 0.0, coal: 0.0, geothermal: 0.0, storage: 0.0, oil: 0.0, other: 0.0 },
    operators: ["Statkraft", "Vattenfall Nordic", "Fortum", "Uniper Nordic", "Sydkraft Hydropower"],
    substations: ["Hasle 420kV", "Grundfors 400kV", "Forsmark 400kV", "Petäjäskoski 400kV", "Ringhals 400kV"]
  },
  // China
  {
    country: "CN",
    countryName: "China",
    gridRegion: "CHINA_STATE_GRID",
    bounds: { minLat: 22.0, maxLat: 42.0, minLng: 85.0, maxLng: 122.0 },
    fuelWeights: { coal: 0.45, solar: 0.20, wind: 0.16, hydro: 0.13, nuclear: 0.05, storage: 0.01, gas: 0.0, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["China Huaneng Group", "China Datang", "China Huadian", "China National Energy", "State Power Investment Corp (SPIC)", "CGN Nuclear"],
    substations: ["Changji ±1100kV UHVDC", "Zhundong 750kV", "Yibin 500kV", "Fengxian 500kV", "Ximeng 1000kV"]
  },
  // Japan
  {
    country: "JP",
    countryName: "Japan",
    gridRegion: "JAPAN_TEPCO",
    bounds: { minLat: 31.0, maxLat: 44.0, minLng: 130.0, maxLng: 142.0 },
    fuelWeights: { gas: 0.38, solar: 0.24, coal: 0.22, nuclear: 0.08, hydro: 0.06, wind: 0.02, storage: 0.0, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["Tokyo Electric Power (TEPCO)", "Kansai Electric Power (KEPCO)", "Chubu Electric", "JERA", "Kyushu Electric"],
    substations: ["Shin-Koga 500kV", "Higashi-Yamanashi 500kV", "Shin-Toyota 500kV", "Kita-Tokyo 500kV"]
  },
  // India
  {
    country: "IN",
    countryName: "India",
    gridRegion: "INDIA_NREB",
    bounds: { minLat: 8.5, maxLat: 31.5, minLng: 70.0, maxLng: 88.0 },
    fuelWeights: { coal: 0.48, solar: 0.26, wind: 0.12, hydro: 0.10, nuclear: 0.03, gas: 0.01, storage: 0.0, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["NTPC Limited", "Adani Power", "Tata Power", "ReNew Power", "Azure Power", "NHPC Hydro"],
    substations: ["Bhadla 765kV", "Fatehgarh 765kV", "Vindhyachal 400kV", "Champa ±800kV HVDC", "Raigarh 765kV"]
  },
  // Australia (NEM)
  {
    country: "AU",
    countryName: "Australia",
    gridRegion: "NEM_AUSTRALIA",
    bounds: { minLat: -38.5, maxLat: -20.0, minLng: 138.0, maxLng: 153.0 },
    fuelWeights: { solar: 0.32, wind: 0.28, coal: 0.24, gas: 0.10, hydro: 0.04, storage: 0.02, nuclear: 0.0, biomass: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["AGL Energy", "Origin Energy", "EnergyAustralia", "Neoen Australia", "Acciona Australia"],
    substations: ["Loy Yang 500kV", "Bannaby 500kV", "South Morang 330kV", "Middle Ridge 330kV"]
  },
  // Latin America (Brazil)
  {
    country: "BR",
    countryName: "Brazil",
    gridRegion: "BRAZIL_ONS",
    bounds: { minLat: -30.0, maxLat: -2.0, minLng: -58.0, maxLng: -37.0 },
    fuelWeights: { hydro: 0.60, wind: 0.18, solar: 0.12, biomass: 0.06, gas: 0.03, nuclear: 0.01, coal: 0.0, storage: 0.0, geothermal: 0.0, oil: 0.0, other: 0.0 },
    operators: ["Eletrobras", "Engie Brasil", "CPFL Energia", "AES Brasil", "Neoenergia"],
    substations: ["Foz do Iguaçu 500kV", "Tucuruí 500kV", "Belo Monte ±800kV HVDC", "Xingu 500kV"]
  }
];

// Helper to choose weighted item
function chooseWeightedFuel(weights: Record<FuelType, number>): FuelType {
  const rand = Math.random();
  let cumulative = 0;
  for (const [fuel, weight] of Object.entries(weights) as [FuelType, number][]) {
    cumulative += weight;
    if (rand <= cumulative) {
      return fuel;
    }
  }
  return "gas";
}

// Pseudo random generator with deterministic seed for reproducibility
function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(1337);

function randomFloat(min: number, max: number): number {
  return min + rng() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1));
}

function generateCapacity(fuel: FuelType): number {
  switch (fuel) {
    case "nuclear":
      return randomInt(900, 3800);
    case "hydro":
      return rng() < 0.1 ? randomInt(2000, 12000) : randomInt(80, 1800);
    case "gas":
      return rng() < 0.25 ? randomInt(800, 2400) : randomInt(120, 750);
    case "coal":
      return randomInt(400, 3200);
    case "solar":
      return rng() < 0.05 ? randomInt(500, 2000) : randomInt(40, 450);
    case "wind":
      return rng() < 0.08 ? randomInt(400, 1800) : randomInt(50, 400);
    case "storage":
      return randomInt(25, 450);
    case "geothermal":
      return randomInt(30, 350);
    case "biomass":
      return randomInt(25, 250);
    case "oil":
      return randomInt(50, 450);
    default:
      return randomInt(50, 300);
  }
}

function generatePlantName(fuel: FuelType, zone: GeoZone, index: number): string {
  const prefixes = [
    "Riverbend", "Canyon Creek", "Highland", "Silver Ridge", "Valley Vista",
    "Blue Horizon", "Apex", "Prairie Wind", "Solaria", "Redwood", "Sierra",
    "Desert Sun", "Cascade", "Cedar Point", "Eagle Peak", "Falcon Crest",
    "Great Lakes", "Thunder Ridge", "Golden Gate", "Vanguard", "Titan",
    "Helios", "Aeolus", "Prometheus", "Hyperion", "Aurora", "Sentinel"
  ];
  const prefix = prefixes[randomInt(0, prefixes.length - 1)];

  const fuelLabels: Record<FuelType, string> = {
    nuclear: "Nuclear Energy Center",
    hydro: "Hydroelectric Plant",
    gas: "Combined Cycle Gas Turbines",
    coal: "Thermal Generation Station",
    solar: "Solar Energy Park",
    wind: "Wind Energy Facility",
    storage: "BESS Storage Hub",
    geothermal: "Geothermal Power Project",
    biomass: "Biomass Cogeneration Facility",
    oil: "Peaking Power Station",
    other: "Energy Project"
  };

  return `${prefix} Unit ${((index % 9) + 1)} ${fuelLabels[fuel]}`;
}

export function generateAllPlants(totalCount: number = 5200): PowerPlant[] {
  const plants: PowerPlant[] = [];

  // 1. Add all Anchor Stations
  ANCHOR_STATIONS.forEach((anchor, i) => {
    const cf = anchor.fuelType === "nuclear" ? randomFloat(0.88, 0.98) :
               anchor.fuelType === "hydro" ? randomFloat(0.40, 0.75) :
               anchor.fuelType === "gas" ? randomFloat(0.35, 0.70) :
               anchor.fuelType === "solar" ? randomFloat(0.15, 0.35) :
               anchor.fuelType === "wind" ? randomFloat(0.25, 0.55) :
               randomFloat(0.4, 0.8);
    const output = Math.round(anchor.capacityMw * cf);
    const spot = Math.round((35 + randomFloat(-15, 45)) * 10) / 10;

    plants.push({
      id: `station-anchor-${i + 1}`,
      name: anchor.name,
      operator: anchor.operator,
      country: anchor.country,
      countryName: anchor.countryName,
      fuelType: anchor.fuelType,
      capacityMw: anchor.capacityMw,
      commissioningYear: anchor.commissioningYear,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      gridRegion: anchor.gridRegion,
      co2IntensityGPerKwh: anchor.fuelType === "coal" ? 840 :
                           anchor.fuelType === "gas" ? 430 :
                           anchor.fuelType === "nuclear" ? 12 :
                           anchor.fuelType === "hydro" ? 22 :
                           anchor.fuelType === "solar" ? 45 : 15,
      substationName: anchor.substationName,
      coolingType: anchor.coolingType,
      status: "online",
      currentOutputMw: output,
      capacityFactor: Math.round(cf * 100) / 100,
      spotPriceMwh: spot,
      lmpBreakdown: {
        energy: Math.round(spot * 0.85 * 10) / 10,
        congestion: Math.round(spot * 0.10 * 10) / 10,
        loss: Math.round(spot * 0.05 * 10) / 10,
        total: spot
      },
      lastUpdated: new Date().toISOString()
    });
  });

  // 2. Synthesize remaining stations evenly across global zones
  const remaining = totalCount - plants.length;
  const countPerZone = Math.ceil(remaining / GEO_ZONES.length);

  let counter = plants.length + 1;

  for (const zone of GEO_ZONES) {
    for (let j = 0; j < countPerZone && plants.length < totalCount; j++) {
      const fuel = chooseWeightedFuel(zone.fuelWeights);
      const capacity = generateCapacity(fuel);
      const lat = Math.round(randomFloat(zone.bounds.minLat, zone.bounds.maxLat) * 10000) / 10000;
      const lng = Math.round(randomFloat(zone.bounds.minLng, zone.bounds.maxLng) * 10000) / 10000;
      const commYear = randomInt(1975, 2024);
      const operator = zone.operators[randomInt(0, zone.operators.length - 1)];
      const name = generatePlantName(fuel, zone, counter);
      const substation = zone.substations[randomInt(0, zone.substations.length - 1)];

      // Status probabilities
      const statusRand = rng();
      let status: StationStatus = "online";
      if (statusRand < 0.02) status = "outage";
      else if (statusRand < 0.06) status = "curtailed";
      else if (statusRand < 0.12) status = "ramping";

      let cf = 0;
      if (status === "outage") {
        cf = 0;
      } else if (status === "curtailed") {
        cf = randomFloat(0.05, 0.25);
      } else if (fuel === "nuclear") {
        cf = randomFloat(0.85, 0.99);
      } else if (fuel === "solar") {
        cf = randomFloat(0.10, 0.40);
      } else if (fuel === "wind") {
        cf = randomFloat(0.20, 0.65);
      } else if (fuel === "hydro") {
        cf = randomFloat(0.35, 0.80);
      } else if (fuel === "gas") {
        cf = randomFloat(0.25, 0.85);
      } else if (fuel === "coal") {
        cf = randomFloat(0.45, 0.80);
      } else {
        cf = randomFloat(0.2, 0.7);
      }

      const output = Math.round(capacity * cf);
      
      // Price calculation
      let spot = Math.round((38 + randomFloat(-15, 30)) * 10) / 10;
      // High renewable curtailment negative pricing
      if (status === "curtailed" || (cf > 0.6 && (fuel === "solar" || fuel === "wind") && rng() < 0.15)) {
        spot = Math.round(randomFloat(-15, -1) * 10) / 10;
      } else if (rng() < 0.03) {
        // Price spike
        spot = Math.round(randomFloat(160, 480) * 10) / 10;
      }

      const co2 = fuel === "coal" ? randomInt(750, 920) :
                  fuel === "gas" ? randomInt(380, 520) :
                  fuel === "oil" ? randomInt(600, 780) :
                  fuel === "biomass" ? randomInt(180, 260) :
                  fuel === "nuclear" ? randomInt(8, 16) :
                  fuel === "hydro" ? randomInt(15, 35) :
                  fuel === "solar" ? randomInt(35, 55) : randomInt(8, 20);

      plants.push({
        id: `station-${counter}`,
        name,
        operator,
        country: zone.country,
        countryName: zone.countryName,
        fuelType: fuel,
        capacityMw: capacity,
        commissioningYear: commYear,
        latitude: lat,
        longitude: lng,
        gridRegion: zone.gridRegion,
        co2IntensityGPerKwh: co2,
        substationName: substation,
        coolingType: fuel === "nuclear" ? "Cooling Towers" : fuel === "coal" || fuel === "gas" ? "Closed-loop Evaporative" : "N/A",
        status,
        currentOutputMw: output,
        capacityFactor: Math.round(cf * 100) / 100,
        spotPriceMwh: spot,
        lmpBreakdown: {
          energy: Math.round(spot * 0.85 * 10) / 10,
          congestion: Math.round(spot * 0.10 * 10) / 10,
          loss: Math.round(spot * 0.05 * 10) / 10,
          total: spot
        },
        lastUpdated: new Date().toISOString()
      });

      counter++;
    }
  }

  return plants;
}

// Write to disk
export function runGenerator() {
  console.log("Generating 5,200+ global power stations dataset...");
  const plants = generateAllPlants(5200);
  const outDir = path.join(process.cwd(), "data");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, "power-plants.json"), JSON.stringify(plants, null, 2));
  fs.writeFileSync(path.join(outDir, "interconnectors.json"), JSON.stringify(INTERCONNECTORS, null, 2));

  console.log(`Successfully generated ${plants.length} power stations and ${INTERCONNECTORS.length} interconnectors in ${outDir}`);
}

// Execute if run directly
if (require.main === module) {
  runGenerator();
}
