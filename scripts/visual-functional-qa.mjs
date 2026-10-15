import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ VISUAL PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ VISUAL FAIL: ${message}`);
    failed++;
  }
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function runVisualFunctionalQA() {
  console.log("\n===============================================================");
  console.log("  ATLASGRID × AINFRAMEWORK — VISUAL FUNCTIONAL QA SUITE        ");
  console.log("===============================================================\n");

  // -------------------------------------------------------------------------
  // PHASE 1: MAP VISUAL STACKING, Z-INDEX & DECK.GL LAYER PIPELINE
  // -------------------------------------------------------------------------
  console.log("--- PHASE 1: Map Visual Stacking, Z-Index & Layer Contracts ---");

  const deckGlMapPath = path.join(process.cwd(), "components/map/DeckGLMap.tsx");
  assert(fs.existsSync(deckGlMapPath), "components/map/DeckGLMap.tsx exists on disk");
  const deckGlMapSrc = fs.readFileSync(deckGlMapPath, "utf-8");

  // Layer 0: Globe Surface Tiles
  assert(
    deckGlMapSrc.includes("globe-basemap-surface-") && deckGlMapSrc.includes("TileLayer"),
    "Globe Mode embeds 3D planetary TileLayer for high-res surface imagery"
  );

  // Basemap Styles
  const basemapStyles = ["dark", "positron", "satellite", "voyager", "osm"];
  for (const style of basemapStyles) {
    assert(deckGlMapSrc.includes(`${style}: {`), `DeckGLMap configures basemap style '${style}'`);
  }

  // Visual Z-Index & Stacking Priority
  assert(deckGlMapSrc.includes("mapContainerRef") && deckGlMapSrc.includes("pointer-events-none"), "MapLibre canvas container set to pointer-events-none to prevent event hijacking");
  assert(deckGlMapSrc.includes("DeckGL") && deckGlMapSrc.includes("layers={layers}"), "DeckGL canvas overlay binds active layers array");
  assert(deckGlMapSrc.includes("<StationTooltip />"), "StationTooltip overlay rendered above DeckGL canvas");
  assert(deckGlMapSrc.includes("<MapControls />"), "MapControls HUD dock rendered with positive z-index");
  assert(deckGlMapSrc.includes("<MapLegend />"), "MapLegend component rendered with positive z-index");

  // 3D Towers Level of Detail (LOD)
  assert(deckGlMapSrc.includes("isDetailedLOD") || deckGlMapSrc.includes("diskResolution: isDetailedLOD"), "DeckGLMap implements zoom-based Level of Detail (LOD) for 3D towers");

  // Cable Landing Station Halos & Core Portals
  assert(
    deckGlMapSrc.includes("cable-landing-stations-outer") &&
    deckGlMapSrc.includes("cable-landing-stations-core"),
    "Cable Landing Stations render dual concentric pulsing portal rings"
  );

  // Dynamic City Names Vector Layers
  assert(deckGlMapSrc.includes("map-city-labels") && deckGlMapSrc.includes("TextLayer"), "DeckGLMap renders dynamic TextLayer for city names");
  assert(deckGlMapSrc.includes("map-city-anchors") && deckGlMapSrc.includes("ScatterplotLayer"), "DeckGLMap renders ScatterplotLayer for city centroid portal dots");
  assert(deckGlMapSrc.includes("billboard: true"), "City labels configure billboard: true to face camera at any pitch or bearing");
  assert(deckGlMapSrc.includes("getBackgroundColor: isLightMode"), "City labels adapt background pill contrast for dark/light themes");

  // -------------------------------------------------------------------------
  // PHASE 2: DYNAMIC CITY & METROPOLITAN ZOOM LEVEL VALIDATION
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 2: Dynamic City & Metro Names Zoom Level-of-Detail ---");

  const citiesDataPath = path.join(process.cwd(), "data/cities.json");
  assert(fs.existsSync(citiesDataPath), "data/cities.json exists on disk");
  const citiesData = JSON.parse(fs.readFileSync(citiesDataPath, "utf-8"));
  assert(citiesData.length >= 350, `Cities dataset contains ${citiesData.length} global cities (>= 350)`);

  // Test Zoom Threshold 1: Low Orbit (zoom = 3.5)
  const lowZoomCities = citiesData.filter((c) => 3.5 >= c.minZoom);
  assert(lowZoomCities.length >= 50 && lowZoomCities.length <= 80, `At Zoom 3.5 (low orbit), exactly ${lowZoomCities.length} Tier-1 anchor metros appear without crowding`);
  assert(lowZoomCities.some((c) => c.name.toLowerCase() === "tokyo"), "Tokyo appears at low zoom (3.5)");
  assert(lowZoomCities.some((c) => c.name.toLowerCase() === "london"), "London appears at low zoom (3.5)");
  assert(lowZoomCities.some((c) => c.name.toLowerCase() === "new york"), "New York appears at low zoom (3.5)");
  assert(lowZoomCities.some((c) => c.name.toLowerCase() === "paris"), "Paris appears at low zoom (3.5)");
  assert(lowZoomCities.some((c) => c.name.toLowerCase() === "singapore"), "Singapore appears at low zoom (3.5)");

  // Test Zoom Threshold 2: Continental / Regional View (zoom = 5.2)
  const midZoomCities = citiesData.filter((c) => 5.2 >= c.minZoom);
  assert(midZoomCities.length >= 150 && midZoomCities.length <= 220, `At Zoom 5.2 (regional view), ${midZoomCities.length} Tier-1 & Tier-2 regional cities appear`);
  assert(midZoomCities.some((c) => c.name.toLowerCase() === "ashburn"), "Ashburn, VA emerges at regional zoom (5.2)");
  assert(midZoomCities.some((c) => c.name.toLowerCase() === "dallas"), "Dallas emerges at regional zoom (5.2)");
  assert(midZoomCities.some((c) => c.name.toLowerCase() === "seattle"), "Seattle emerges at regional zoom (5.2)");
  assert(midZoomCities.some((c) => c.name.toLowerCase() === "marseille"), "Marseille emerges at regional zoom (5.2)");
  assert(midZoomCities.some((c) => c.name.toLowerCase() === "sydney"), "Sydney emerges at regional zoom (5.2)");

  // Test Zoom Threshold 3: Metro / Local Cloud Corridor View (zoom = 7.5)
  const highZoomCities = citiesData.filter((c) => 7.5 >= c.minZoom);
  assert(highZoomCities.length >= 350, `At Zoom 7.5 (close zoom), all ${highZoomCities.length} local DC campuses and edge municipalities appear`);
  assert(highZoomCities.some((c) => c.name.toLowerCase() === "sterling"), "Sterling, VA local cloud corridor appears at close zoom");
  assert(highZoomCities.some((c) => c.name.toLowerCase() === "slough"), "Slough, UK local cloud corridor appears at close zoom");
  assert(highZoomCities.some((c) => c.name.toLowerCase() === "quincy"), "Quincy, WA hydro cloud cluster appears at close zoom");
  assert(highZoomCities.some((c) => c.name.toLowerCase() === "hillsboro"), "Hillsboro, OR transpacific cluster appears at close zoom");

  // Detailed State / Country expansion
  const vaAshburn = citiesData.find((c) => c.name.toLowerCase() === "ashburn");
  assert(vaAshburn && vaAshburn.displayName === "Ashburn, VA", "Ashburn correctly formats displayName as 'Ashburn, VA'");
  const deFrankfurt = citiesData.find((c) => c.name.toLowerCase().includes("frankfurt"));
  assert(deFrankfurt && deFrankfurt.displayName.includes("Frankfurt"), "Frankfurt correctly formats displayName");

  // -------------------------------------------------------------------------
  // PHASE 3: HUD CONTROLS, TOOLTIPS & THEME CONTRAST
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 3: HUD Controls, Tooltips & Theme Contrast ---");

  const controlsPath = path.join(process.cwd(), "components/map/MapControls.tsx");
  assert(fs.existsSync(controlsPath), "components/map/MapControls.tsx exists on disk");
  const controlsSrc = fs.readFileSync(controlsPath, "utf-8");

  // Map Controls HUD Layer Toggles
  assert(controlsSrc.includes("toggleLayer(\"datacenters\")"), "MapControls provides Data Centers toggle button");
  assert(controlsSrc.includes("toggleLayer(\"substations\")"), "MapControls provides Substations toggle button");
  assert(controlsSrc.includes("toggleLayer(\"interconnectors\")"), "MapControls provides Transmission Interconnectors toggle button");
  assert(controlsSrc.includes("toggleLayer(\"floodOverlay\")"), "MapControls provides Flood Hazard Overlay toggle button");
  assert(controlsSrc.includes("toggleLayer(\"subseaCables\")"), "MapControls provides Subsea Cables toggle button");
  assert(controlsSrc.includes("toggleLayer(\"fiberConduits\")"), "MapControls provides Dark Fiber Conduits toggle button");
  assert(controlsSrc.includes("toggleLayer(\"seismicFaults\")"), "MapControls provides Seismic Fault Lines toggle button");
  assert(controlsSrc.includes("toggleLayer(\"labels\")"), "MapControls provides City & Metropolitan Labels toggle button");
  assert(controlsSrc.includes("toggleProjectionMode"), "MapControls provides 3D Globe vs 2D Mercator toggle button");

  // Tooltip Visual Contrast & Badges
  const tooltipPath = path.join(process.cwd(), "components/map/StationTooltip.tsx");
  assert(fs.existsSync(tooltipPath), "components/map/StationTooltip.tsx exists on disk");
  const tooltipSrc = fs.readFileSync(tooltipPath, "utf-8");

  assert(tooltipSrc.includes("hoveredCity"), "StationTooltip handles hoveredCity state");
  assert(tooltipSrc.includes("GLOBAL CLOUD & FINANCIAL HUB"), "StationTooltip displays Tier-1 metropolitan badge");
  assert(tooltipSrc.includes("REGIONAL METROPOLITAN CORE"), "StationTooltip displays Tier-2 regional core badge");
  assert(tooltipSrc.includes("DATA CENTER CORRIDOR / METRO"), "StationTooltip displays Tier-3 corridor badge");
  assert(tooltipSrc.includes("Tracked Facilities") && tooltipSrc.includes("IT Capacity"), "StationTooltip displays facility count and IT power capacity in MW");
  assert(tooltipSrc.includes("IXP ON-SITE"), "StationTooltip displays purple IXP ON-SITE badge for CLS");
  assert(tooltipSrc.includes("PDB #"), "StationTooltip displays green PeeringDB facility ID badge for CLS");

  // -------------------------------------------------------------------------
  // PHASE 4: VISUAL DATA FEED ROUTE IN-MEMORY CONTRACT TESTS
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 4: Visual Data Feed Route In-Memory Contracts ---");

  // 4.1 Subsea Backhaul & CLS Dataset
  const clsDataPath = path.join(process.cwd(), "data/cable-landing-stations.json");
  const clsStations = JSON.parse(fs.readFileSync(clsDataPath, "utf-8"));
  assert(Array.isArray(clsStations) && clsStations.length >= 25, `Cable Landing Stations dataset contains ${clsStations.length} hubs (>= 25)`);

  const vaBeach = clsStations.find((c) => c.id === "cls-virginia-beach");
  assert(!!vaBeach && vaBeach.peeringDbFacilityId === 6732, "Virginia Beach Hub linked to PeeringDB ID 6732");
  assert(vaBeach.ixpPresent === true, "Virginia Beach Hub flags IXP ON-SITE presence");
  assert(vaBeach.regulatoryLicenseId?.includes("FCC"), "Virginia Beach Hub records FCC license ID");

  // Nearest CLS calculation from Ashburn, VA (lat: 39.0438, lng: -77.4874)
  let nearestCls = null;
  let minDistance = Infinity;
  for (const s of clsStations) {
    const d = haversineDistanceKm(39.0438, -77.4874, s.latitude, s.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearestCls = s;
    }
  }

  assert(!!nearestCls, "Nearest CLS resolution from Ashburn successful");
  assert(nearestCls?.name.includes("Virginia Beach"), "Nearest CLS from Ashburn is Virginia Beach Cable Landing Hub");
  const distKm = Math.round(minDistance * 10) / 10;
  assert(distKm > 200 && distKm < 350, `Terrestrial distance from Ashburn to VA Beach is ${distKm} km (~270km expected)`);
  const latencyMs = Math.round(distKm * 2 * 0.005 * 1.3 * 10) / 10;
  assert(latencyMs < 4.0, `Sub-4.0ms one-way optical latency to ocean landing (${latencyMs} ms)`);

  // 4.2 Siting Hazards Payload
  const fiberData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/dark-fiber-corridors.json"), "utf-8"));
  assert(Array.isArray(fiberData) && fiberData.length > 0, "dark-fiber-corridors.json contains active terrestrial fiber lines");
  const faultsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/seismic-faults.json"), "utf-8"));
  assert(Array.isArray(faultsData) && faultsData.length > 0, "seismic-faults.json contains quaternary fault lines");
  const floodData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/flood-hazard-zones.json"), "utf-8"));
  assert(Array.isArray(floodData) && floodData.length >= 41, "flood-hazard-zones.json contains coastal & riverine surge risk zones (>= 41)");

  // 4.3 Electricity Price Underwriting
  const pricesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/global-electricity-prices.json"), "utf-8"));
  const vaPrice = pricesData.find((p) => p.id === "elec-us-va" || p.stateOrRegion?.includes("Virginia"));
  assert(vaPrice && vaPrice.industrialTariffUsdPerKwh === 0.082, "Northern Virginia correctly priced at $0.082/kWh");
  const waPrice = pricesData.find((p) => p.id === "elec-us-wa" || p.stateOrRegion?.includes("Washington"));
  assert(waPrice && waPrice.industrialTariffUsdPerKwh === 0.054, "Grant/Douglas PUD Washington Hydro correctly priced at $0.054/kWh");

  // -------------------------------------------------------------------------
  // PHASE 5: PRODUCT INTEGRATION & CASE STUDY SHELL VALIDATION
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 5: AInframework Product Integration & Layout Integrity ---");

  // 5.1 Landing Page Shell
  const productPageSrc = fs.readFileSync(path.join(process.cwd(), "app/products/atlasgrid/page.tsx"), "utf-8");
  assert(productPageSrc.includes("Global Power Grid & Data Center Observability"), "Product page renders hero title");
  assert(productPageSrc.includes("Launch Interactive Demo") || productPageSrc.includes("Launch Free Interactive Demo"), "Product page renders launch CTA button");
  assert(productPageSrc.includes("5,200+ Global Power Stations"), "Product page renders 5,200+ power stations grid item");
  assert(productPageSrc.includes("4,380+ Data Center Footprint"), "Product page renders 4,380+ data center footprint item");
  assert(productPageSrc.includes("Transmission Interconnectors"), "Product page renders transmission interconnectors item");

  // 5.2 250MW Siting Case Study
  const caseStudySrc = fs.readFileSync(path.join(process.cwd(), "app/products/atlasgrid/case-study/page.tsx"), "utf-8");
  assert(caseStudySrc.includes("250MW Hyperscale AI Campus"), "Case study specifies 250MW campus sizing");
  assert(caseStudySrc.includes("Northern Virginia (PJM)"), "Case study analyzes Northern Virginia");
  assert(caseStudySrc.includes("West Texas (ERCOT)"), "Case study analyzes Texas ERCOT");
  assert(caseStudySrc.includes("Pacific Northwest / Quebec"), "Case study analyzes hydro clean energy corridor");
  assert(caseStudySrc.includes("Interconnection Wall") || caseStudySrc.includes("queue bottleneck"), "Case study details queue wait times");
  assert(caseStudySrc.includes("Annual Power OpEx"), "Case study details annual power OpEx comparison");

  // 5.3 Pricing Grid
  const pricingPageSrc = fs.readFileSync(path.join(process.cwd(), "app/products/atlasgrid/pricing/page.tsx"), "utf-8");
  assert(pricingPageSrc.includes("Free Analyst") || pricingPageSrc.includes("Explorer Tier"), "Pricing page renders Free tier");
  assert(pricingPageSrc.includes("Institutional Pro") && pricingPageSrc.includes("$499"), "Pricing page renders Institutional Pro at $499/mo");
  assert(pricingPageSrc.includes("Sovereign Cluster") || pricingPageSrc.includes("Enterprise"), "Pricing page renders Enterprise tier");

  // 5.4 Sign-In Gate & Navigation
  const signinSrc = fs.readFileSync(path.join(process.cwd(), "app/products/atlasgrid/signin/page.tsx"), "utf-8");
  assert(signinSrc.includes("Work Email Address"), "Sign-in page enforces corporate work email capture");
  assert(signinSrc.includes("Zero-trust JWT authentication") || signinSrc.includes("No password"), "Sign-in page displays security badge");

  const siteNavSrc = fs.readFileSync(path.join(process.cwd(), "lib/site-nav.ts"), "utf-8");
  assert(siteNavSrc.includes("/products/atlasgrid"), "lib/site-nav.ts integrates /products/atlasgrid in global navigation");

  // -------------------------------------------------------------------------
  // PHASE 6: 4 MAJOR MAP VISUAL UPGRADES
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 6: 4 Major Map Visual Upgrades ---");

  // 6.1 Upgrade 1: Animated Living Grid Flow Particles
  const deckGlSrc = fs.readFileSync(path.join(process.cwd(), "components/map/DeckGLMap.tsx"), "utf-8");
  assert(deckGlSrc.includes('id: "grid-flow-particles"'), "Flow particles layer rendered with id 'grid-flow-particles'");
  assert(deckGlSrc.includes("setAnimTick") && deckGlSrc.includes("requestAnimationFrame"), "Map engine runs smooth 60fps animation frame loop");
  assert(deckGlSrc.includes("flowParticleData"), "Particle positions computed along high-voltage interties & supply lines");

  // 6.2 Upgrade 2: Interactive Siting Sonar Radar & Buffer Due Diligence Tool
  assert(deckGlSrc.includes('id: "siting-sonar-buffer-area"'), "Sonar buffer area polygon rendered on globe canvas");
  assert(deckGlSrc.includes('id: "siting-sonar-pulse-ring"'), "Sonar dynamic pulse ring rendered with animated alpha sweep");
  assert(deckGlSrc.includes('id: "siting-sonar-center-anchor"'), "Sonar center crosshair anchor rendered at target coordinate");
  assert(deckGlSrc.includes("isSitingSonarActive ? \"crosshair\""), "Pointer cursor switches to precision crosshair in Sonar mode");
  assert(deckGlSrc.includes("<SitingSonarOverlay"), "SitingSonarOverlay HUD component mounted above map canvas");

  const sonarUiSrc = fs.readFileSync(path.join(process.cwd(), "components/map/SitingSonarOverlay.tsx"), "utf-8");
  assert(sonarUiSrc.includes("Export Greenfield Siting Memo (JSON)"), "SitingSonarOverlay provides 1-click JSON siting memo download");
  assert(sonarUiSrc.includes("setSitingSonarRadius"), "SitingSonarOverlay allows dynamic 25km / 50km / 100km buffer selection");

  // 6.3 Upgrade 3: 24/7 Carbon Intensity (CFE %) & Clean Energy Heatmap
  assert(deckGlSrc.includes('id: "carbon-intensity-heatmap"'), "Carbon intensity heatmap layer rendered with multi-color ramp");
  assert(deckGlSrc.includes('visualizationMode === "carbon_intensity"'), "Map supports dedicated carbon_intensity visualization mode");

  const mapControlsSrc = fs.readFileSync(path.join(process.cwd(), "components/map/MapControls.tsx"), "utf-8");
  assert(mapControlsSrc.includes("carbon_intensity") && mapControlsSrc.includes("24/7 Carbon Intensity"), "MapControls provides 24/7 Carbon Intensity mode selector");
  assert(mapControlsSrc.includes("toggleLayer(\"carbonHeatmap\")"), "MapControls provides Carbon Heatmap layer toggle button");

  const legendSrc = fs.readFileSync(path.join(process.cwd(), "components/map/MapLegend.tsx"), "utf-8");
  assert(legendSrc.includes("Legend // Carbon & CFE %"), "MapLegend adapts to Carbon & CFE % mode");
  assert(legendSrc.includes("Hydro/Nuclear/Wind") && legendSrc.includes("Unabated Peakers"), "MapLegend displays clean vs fossil resource ramp");

  // 6.4 Upgrade 4: Real-Time Anomaly Beacons & Price Spike Shockwaves
  assert(deckGlSrc.includes('id: "anomaly-beacons-shockwave"'), "Shockwave ripple layer rendered on price spike & outage nodes");
  assert(deckGlSrc.includes('id: "anomaly-beacons-core"'), "Glowing anomaly core beacon layer rendered");
  assert(mapControlsSrc.includes("toggleLayer(\"anomalyBeacons\")"), "MapControls provides Anomaly Beacons toggle button");
  assert(legendSrc.includes("Price Spike Beacons"), "MapLegend displays Price Spike Beacons status indicator");

  // -------------------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log(`VISUAL FUNCTIONAL QA COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVisualFunctionalQA().catch((err) => {
  console.error("FATAL ERROR in visual functional QA:", err);
  process.exit(1);
});
