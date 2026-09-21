import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

// 1. Dark Fiber Corridors (Transcontinental & Major Metro Express Routes)
const darkFiberCorridors = [
  {
    id: "df-ashburn-atlanta",
    name: "Mid-Atlantic to Southeast Express (Ashburn - Charlotte - Atlanta)",
    operator: "Zayo / Lumen Dark Fiber",
    type: "long_haul",
    status: "active",
    fiberPairs: 432,
    coordinates: [
      [-77.4875, 39.0438], // Ashburn, VA (Data Center Alley)
      [-77.4600, 38.7500], // Manassas, VA
      [-77.5000, 38.3000], // Fredericksburg, VA
      [-77.4360, 37.5407], // Richmond, VA
      [-78.8986, 35.9940], // Durham / RTP, NC
      [-80.8431, 35.2271], // Charlotte, NC
      [-82.3940, 34.8526], // Greenville, SC
      [-84.3880, 33.7490]  // Atlanta, GA (56 Marietta)
    ]
  },
  {
    id: "df-chicago-ashburn",
    name: "Low-Latency Financial Trunk (Chicago 350 E Cermak - Ashburn)",
    operator: "Lumen / Bandwidth IG",
    type: "long_haul",
    status: "active",
    fiberPairs: 864,
    coordinates: [
      [-87.6298, 41.8781], // Chicago, IL (350 E Cermak)
      [-85.1394, 41.0793], // Fort Wayne, IN
      [-83.5552, 41.6528], // Toledo, OH
      [-81.6944, 41.4993], // Cleveland, OH
      [-79.9959, 40.4406], // Pittsburgh, PA
      [-78.0000, 39.7500], // Hagerstown, MD
      [-77.4875, 39.0438]  // Ashburn, VA
    ]
  },
  {
    id: "df-silicon-valley-seattle",
    name: "Pacific Northwest West Coast Corridor (San Jose - Portland - Seattle)",
    operator: "Zayo / Electric Lightwave",
    type: "long_haul",
    status: "active",
    fiberPairs: 576,
    coordinates: [
      [-121.8863, 37.3382], // San Jose / Santa Clara, CA
      [-122.4194, 37.7749], // San Francisco, CA
      [-122.2711, 37.8044], // Oakland, CA
      [-121.4944, 38.5816], // Sacramento, CA
      [-122.3917, 40.5865], // Redding, CA
      [-122.8756, 42.3265], // Medford, OR
      [-123.0868, 44.0521], // Eugene, OR
      [-122.6784, 45.5152], // Portland / Hillsboro, OR
      [-122.9007, 47.0379], // Olympia, WA
      [-122.3321, 47.6062]  // Seattle, WA (Westin Building)
    ]
  },
  {
    id: "df-dallas-phoenix-la",
    name: "Southern Transcon (Dallas Infomart - Phoenix - Los Angeles One Wilshire)",
    operator: "Lumen / Crown Castle",
    type: "long_haul",
    status: "active",
    fiberPairs: 432,
    coordinates: [
      [-96.8150, 32.7980], // Dallas, TX (Infomart)
      [-97.3308, 32.7555], // Fort Worth, TX
      [-101.8552, 33.5779], // Lubbock, TX
      [-106.4850, 31.7619], // El Paso, TX
      [-110.9747, 32.2226], // Tucson, AZ
      [-112.0740, 33.4484], // Phoenix / Mesa, AZ
      [-115.1398, 36.1699], // Las Vegas, NV
      [-117.3961, 33.9533], // Riverside, CA
      [-118.2570, 34.0498]  // Los Angeles, CA (One Wilshire)
    ]
  },
  {
    id: "df-trans-europe-flap",
    name: "Europe FLAP Interconnect (Frankfurt - London - Amsterdam - Paris)",
    operator: "Arelion (Telia Carrier) / EXA Infrastructure",
    type: "long_haul",
    status: "active",
    fiberPairs: 864,
    coordinates: [
      [8.6821, 50.1109],  // Frankfurt am Main, DE
      [6.1296, 49.6116],  // Luxembourg
      [4.3517, 50.8503],  // Brussels, BE
      [4.9041, 52.3676],  // Amsterdam Science Park, NL
      [1.8587, 50.9513],  // Calais / Channel Tunnel, FR
      [0.1278, 51.5074],  // London Telehouse Docklands, GB
      [2.3522, 48.8566],  // Paris Telehouse Voltaire, FR
      [7.7521, 48.5734],  // Strasbourg, FR
      [8.6821, 50.1109]   // Return Loop Frankfurt
    ]
  },
  {
    id: "df-japan-tokyo-osaka",
    name: "Japan Tokaido Bullet Dark Fiber (Tokyo - Nagoya - Osaka)",
    operator: "NTT Communications / Arteria",
    type: "long_haul",
    status: "active",
    fiberPairs: 576,
    coordinates: [
      [139.7671, 35.6812], // Tokyo Otemachi IX
      [139.6380, 35.4437], // Yokohama
      [138.3831, 34.9756], // Shizuoka
      [136.9066, 35.1815], // Nagoya
      [135.8686, 35.0116], // Kyoto
      [135.5023, 34.6937]  // Osaka Dojima IX
    ]
  },
  {
    id: "df-korea-seoul-busan",
    name: "South Korea Gyeongbu Backbone (Seoul - Daejeon - Daegu - Busan)",
    operator: "KT / LG Uplus / SK Broadband",
    type: "long_haul",
    status: "active",
    fiberPairs: 576,
    coordinates: [
      [126.9780, 37.5665], // Seoul KINX / Mokdong
      [127.1054, 37.3595], // Pangyo Techno Valley
      [127.3845, 36.3504], // Daejeon
      [128.6014, 35.8714], // Daegu
      [129.0756, 35.1796]  // Busan Subsea Cable Landing Hub
    ]
  },
  {
    id: "df-india-mumbai-delhi",
    name: "India Golden Quadrilateral Fiber (Mumbai - Gujarat - Delhi NCR)",
    operator: "Tata Communications / Reliance Jio",
    type: "long_haul",
    status: "active",
    fiberPairs: 432,
    coordinates: [
      [72.8777, 19.0760], // Mumbai BKC / Chandivali
      [72.9982, 19.1828], // Thane / Navi Mumbai
      [73.1812, 22.3072], // Vadodara, Gujarat
      [72.5714, 23.0225], // Ahmedabad / GIFT City
      [75.7873, 26.9124], // Jaipur, Rajasthan
      [77.0266, 28.4595], // Gurgaon, Haryana
      [77.2090, 28.6139], // New Delhi
      [77.3910, 28.5355]  // Noida Data Center Hub
    ]
  }
];

// 2. Quaternary Seismic Fault Lines (USGS & GEM Active Faults)
const seismicFaults = [
  {
    id: "fault-san-andreas",
    name: "San Andreas Fault Zone (Northern & Southern Traces)",
    source: "USGS Quaternary Faults (Layer 21)",
    slipRateMmPerYr: 24.5,
    slipSense: "strike_slip",
    riskTier: "High",
    age: "Historic (< 150 years)",
    coordinates: [
      [-124.00, 40.25], // Cape Mendocino
      [-123.00, 38.30], // Point Reyes
      [-122.50, 37.70], // San Francisco Peninsula
      [-121.80, 36.90], // Santa Cruz Mountains
      [-120.80, 35.80], // Parkfield
      [-119.50, 34.80], // Carrizo Plain
      [-118.10, 34.40], // Palmdale
      [-117.30, 34.10], // San Bernardino
      [-116.00, 33.50], // Coachella Valley
      [-115.50, 33.00]  // Salton Sea
    ]
  },
  {
    id: "fault-hayward",
    name: "Hayward Fault (East Bay)",
    source: "USGS Quaternary Faults",
    slipRateMmPerYr: 9.0,
    slipSense: "strike_slip",
    riskTier: "High",
    age: "Historic (1868 M6.8)",
    coordinates: [
      [-122.38, 37.95], // San Pablo Bay
      [-122.27, 37.87], // Berkeley
      [-122.20, 37.80], // Oakland
      [-122.08, 37.67], // Hayward
      [-121.98, 37.55], // Fremont
      [-121.88, 37.43]  // San Jose foothills
    ]
  },
  {
    id: "fault-cascadia",
    name: "Cascadia Megathrust Subduction Zone",
    source: "USGS / GEM GAF-DB",
    slipRateMmPerYr: 40.0,
    slipSense: "thrust",
    riskTier: "High",
    age: "Holocene (1700 M9.0)",
    coordinates: [
      [-126.00, 49.50], // Vancouver Island Offshore
      [-125.50, 47.50], // Washington Offshore (Seattle Basin)
      [-125.00, 45.00], // Oregon Offshore (Portland)
      [-124.50, 42.00], // Cape Blanco
      [-124.30, 40.50]  // Mendocino Triple Junction
    ]
  },
  {
    id: "fault-new-madrid",
    name: "New Madrid Seismic Zone (Midwest Interplate Fault)",
    source: "USGS National Seismic Hazard",
    slipRateMmPerYr: 1.8,
    slipSense: "strike_slip",
    riskTier: "Moderate",
    age: "Historic (1811-1812 M7.5+)",
    coordinates: [
      [-90.50, 35.50], // Marked Tree, AR
      [-89.90, 36.10], // Caruthersville, MO
      [-89.50, 36.60], // New Madrid, MO
      [-89.10, 37.00]  // Cairo, IL
    ]
  },
  {
    id: "fault-nankai-trough",
    name: "Nankai Trough Megathrust",
    source: "GEM Global Active Faults",
    slipRateMmPerYr: 55.0,
    slipSense: "thrust",
    riskTier: "High",
    age: "Historic (1944/1946 M8.0+)",
    coordinates: [
      [138.50, 34.50], // Suruga Bay
      [137.00, 33.50], // Enshu-nada
      [135.50, 33.00], // Kii Peninsula Offshore
      [133.50, 32.50], // Tosa Bay
      [131.50, 31.50]  // Hyuga-nada
    ]
  },
  {
    id: "fault-north-anatolian",
    name: "North Anatolian Fault Zone (Turkey - Europe Interface)",
    source: "GEM GAF-DB",
    slipRateMmPerYr: 22.0,
    slipSense: "strike_slip",
    riskTier: "High",
    age: "Historic (1999 Izmit M7.6)",
    coordinates: [
      [27.00, 40.80],  // Marmara Sea
      [29.97, 40.76],  // Izmit
      [31.17, 40.84],  // Duzce
      [33.50, 40.90],  // Bolu
      [36.50, 40.50],  // Erzincan
      [40.50, 39.75]   // Karlıova
    ]
  },
  {
    id: "fault-himalayan-frontal",
    name: "Main Himalayan Frontal Thrust (MFT)",
    source: "GEM Active Faults / Wadia",
    slipRateMmPerYr: 18.0,
    slipSense: "thrust",
    riskTier: "High",
    age: "Historic (2015 Gorkha M7.8)",
    coordinates: [
      [77.00, 30.50],  // Himachal / Chandigarh foothills
      [80.00, 29.00],  // Uttarakhand
      [83.50, 27.80],  // Western Nepal
      [85.30, 27.70],  // Kathmandu Valley perimeter
      [88.50, 26.80]   // Sikkim / Bengal foothills
    ]
  }
];

// 3. Flight Approach Corridors (Part 77 Imaginary Surfaces & Runway Approach Cones)
const flightCorridors = [
  {
    id: "flight-iad-runway-01r",
    airportCode: "IAD",
    airportName: "Washington Dulles International Airport (Northern Virginia)",
    runway: "01R/19L",
    corridorType: "approach_slope",
    clearanceFloorMeters: 45,
    polygon: [
      [-77.4450, 38.9000],
      [-77.4200, 38.8000],
      [-77.4800, 38.8000],
      [-77.4600, 38.9000],
      [-77.4450, 38.9000]
    ]
  },
  {
    id: "flight-iad-runway-01c",
    airportCode: "IAD",
    airportName: "Dulles North Approach Corridor (Near Data Center Alley)",
    runway: "01C/19C",
    corridorType: "approach_slope",
    clearanceFloorMeters: 60,
    polygon: [
      [-77.4600, 38.9800],
      [-77.4350, 39.0800],
      [-77.4950, 39.0800],
      [-77.4700, 38.9800],
      [-77.4600, 38.9800]
    ]
  },
  {
    id: "flight-sfo-runway-28",
    airportCode: "SFO",
    airportName: "San Francisco International Airport (Bay Approach)",
    runway: "28L/28R",
    corridorType: "approach_slope",
    clearanceFloorMeters: 30,
    polygon: [
      [-122.3750, 37.6189],
      [-122.2500, 37.5800],
      [-122.2400, 37.6400],
      [-122.3650, 37.6250],
      [-122.3750, 37.6189]
    ]
  },
  {
    id: "flight-lhr-runway-27",
    airportCode: "LHR",
    airportName: "London Heathrow Airport (West London / Slough Corridor)",
    runway: "27L/27R",
    corridorType: "approach_slope",
    clearanceFloorMeters: 50,
    polygon: [
      [-0.4614, 51.4700],
      [-0.6000, 51.4650], // Towards Slough Data Center Cluster
      [-0.6000, 51.5200],
      [-0.4614, 51.4900],
      [-0.4614, 51.4700]
    ]
  },
  {
    id: "flight-fra-runway-07",
    airportCode: "FRA",
    airportName: "Frankfurt Airport (Rhine-Main Airspace)",
    runway: "07R/25L",
    corridorType: "approach_slope",
    clearanceFloorMeters: 50,
    polygon: [
      [8.5705, 50.0379],
      [8.3500, 50.0100],
      [8.3500, 50.0600],
      [8.5705, 50.0500],
      [8.5705, 50.0379]
    ]
  }
];

// 4. Man-Made Hazard Corridors (EIA High-Pressure Natural Gas Pipelines & Hazmat Rail)
const hazardCorridors = [
  {
    id: "hazard-transco-pipeline",
    name: "Transco Interstate Natural Gas Pipeline (36-42 inch, 1000 psi)",
    type: "gas_pipeline",
    operator: "Williams Companies",
    nominalDiameterInches: 42,
    operatingPressurePsi: 1000,
    pirBlastRadiusMeters: 400, // ~1,300 ft Potential Impact Radius blast zone
    coordinates: [
      [-95.3698, 29.7604], // Texas Gulf Coast
      [-90.0715, 29.9511], // Louisiana
      [-86.8025, 33.5186], // Alabama
      [-84.3880, 33.7490], // Georgia
      [-80.8431, 35.2271], // Carolinas
      [-77.4875, 39.0438], // Northern Virginia Corridor
      [-75.1652, 39.9526], // Pennsylvania
      [-74.0060, 40.7128]  // New York City Gate
    ]
  },
  {
    id: "hazard-columbia-gas",
    name: "Columbia Gas Transmission System (30-inch High Pressure)",
    type: "gas_pipeline",
    operator: "TC Energy",
    nominalDiameterInches: 30,
    operatingPressurePsi: 900,
    pirBlastRadiusMeters: 310,
    coordinates: [
      [-82.9988, 39.9612], // Ohio
      [-81.6326, 38.3498], // West Virginia
      [-78.1633, 39.1857], // Winchester, VA
      [-77.7169, 39.1374], // Loudoun County West
      [-77.4500, 39.0200]  // Northern Virginia interconnect
    ]
  },
  {
    id: "hazard-norfolk-southern-rail",
    name: "Class I Mainline Freight Rail (Toxic Inhalation Hazard TIH Transport)",
    type: "hazmat_rail",
    operator: "Norfolk Southern / CSX",
    pirBlastRadiusMeters: 800, // 0.5-mile toxic inhalation / derailment evacuation buffer
    coordinates: [
      [-87.6298, 41.8781], // Chicago
      [-83.5552, 41.6528], // Toledo
      [-81.6944, 41.4993], // Cleveland
      [-79.9959, 40.4406], // Pittsburgh
      [-77.0369, 38.9072], // Washington DC Corridor
      [-76.2859, 36.8508]  // Norfolk Port
    ]
  }
];

// Write files
fs.writeFileSync(path.join(dataDir, "dark-fiber-corridors.json"), JSON.stringify(darkFiberCorridors, null, 2), "utf-8");
fs.writeFileSync(path.join(dataDir, "seismic-faults.json"), JSON.stringify(seismicFaults, null, 2), "utf-8");
fs.writeFileSync(path.join(dataDir, "flight-corridors.json"), JSON.stringify(flightCorridors, null, 2), "utf-8");
fs.writeFileSync(path.join(dataDir, "hazard-corridors.json"), JSON.stringify(hazardCorridors, null, 2), "utf-8");

console.log("Successfully generated all Sections 2-6 GIS hazard and telecom layers in data/");
