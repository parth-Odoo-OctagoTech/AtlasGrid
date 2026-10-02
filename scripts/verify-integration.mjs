import { signJWT, verifyJWT } from "./lib/auth/jwt.js";
import { db } from "./lib/db/pool.js";
import { getStationsByBounds, getTelemetrySince, getLMPGrid } from "./lib/db/queries.js";
import { entsoEClient } from "./lib/api/entso-e-client.js";
import { eiaClient } from "./lib/api/eia-client.js";
import { checkIpRateLimit, checkUserRateLimit } from "./lib/middleware/rateLimiter.js";
import { redactSensitiveData } from "./lib/logging.js";

async function runTests() {
  console.log("=== RUNNING ATLASGRID × AINFRAMEWORK VERIFICATION SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. JWT Testing
  console.log("--- 1. Web Crypto JWT Module ---");
  const testPayload = { userId: "usr-test-1", email: "analyst@ainframework.com", role: "analyst" };
  const token = await signJWT(testPayload, { expiresIn: "15m" });
  assert(typeof token === "string" && token.split(".").length === 3, "JWT token generated with 3 segments");

  const verified = await verifyJWT(token);
  assert(verified.userId === testPayload.userId && verified.email === testPayload.email, "JWT payload verified correctly");

  let caughtExpired = false;
  const expiredToken = await signJWT(testPayload, { expiresIn: 0 });
  try {
    await new Promise((r) => setTimeout(r, 1100));
    await verifyJWT(expiredToken);
  } catch {
    caughtExpired = true;
  }
  assert(caughtExpired, "Expired token correctly rejected");

  // 2. Database & Pool Engine
  console.log("\n--- 2. PostgreSQL / PostGIS Pool & Fallback Engine ---");
  const userInsert = await db.query("INSERT INTO users (email, company, use_case, created_at, role) VALUES ($1, $2, $3, NOW(), $4)", [
    "director@hyperscale.com",
    "Hyperscale Cloud",
    "DC Planning",
    "analyst"
  ]);
  assert(userInsert.rows.length === 1 && userInsert.rows[0].email === "director@hyperscale.com", "User upsert in pool succeeds");

  const userSelect = await db.query("SELECT * FROM users WHERE email = $1", ["director@hyperscale.com"]);
  assert(userSelect.rows.length === 1 && userSelect.rows[0].role === "analyst", "User lookup by email returns correct role");

  const auditInsert = await db.query("INSERT INTO audit_log (endpoint, status, latency_ms, user_id, ip, error_message) VALUES ($1, $2, $3, $4, $5, $6)", [
    "/api/stations",
    200,
    42.5,
    userSelect.rows[0].id,
    "192.168.1.1",
    null
  ]);
  assert(auditInsert.rows.length === 1 && auditInsert.rows[0].endpoint === "/api/stations", "Audit log insert succeeded");

  // 3. Prepared Geospatial & Telemetry Queries
  console.log("\n--- 3. Geospatial & Telemetry Queries ---");
  const bounds = { minLng: -125, minLat: 30, maxLng: -110, maxLat: 45 };
  const stations = await getStationsByBounds(bounds, { limit: 100 });
  assert(stations.stations.length > 0, `getStationsByBounds returned ${stations.stations.length} stations in US West`);

  const telemetry = await getTelemetrySince("plant-1", new Date(Date.now() - 3600000));
  assert(Array.isArray(telemetry) && telemetry.length > 0, `getTelemetrySince returned ${telemetry.length} time points`);

  const lmpGrid = await getLMPGrid();
  assert(Array.isArray(lmpGrid) && lmpGrid.length >= 5000, `getLMPGrid returned ${lmpGrid.length} pricing grid nodes`);

  // 4. Upstream API Clients
  console.log("\n--- 4. ENTSO-E & US EIA API Clients ---");
  const entsoeGen = await entsoEClient.getActualGeneration({ areaCode: "10Y1001A1001A83F" });
  assert(entsoeGen.success && entsoeGen.data.length > 0, `ENTSO-E actual generation returned ${entsoeGen.data.length} units (source: ${entsoeGen.source})`);

  const entsoePrice = await entsoEClient.getDayAheadPrices("10Y1001A1001A83F");
  assert(entsoePrice.success && entsoePrice.data[0].priceEurPerMwh > 0, `ENTSO-E day-ahead price quoted at €${entsoePrice.data[0].priceEurPerMwh}/MWh`);

  const eiaCaiso = await eiaClient.getIsoFuelMix("CAISO");
  assert(eiaCaiso.success && eiaCaiso.data.fuelMix.solarMw > 0, `EIA CAISO fuel mix solar: ${eiaCaiso.data.fuelMix.solarMw} MW`);

  const eiaPrices = await eiaClient.getIsoLmp("PJM");
  assert(eiaPrices.success && eiaPrices.data.length > 0, `EIA PJM LMP hub pricing: ${eiaPrices.data.length} hubs active`);

  // 5. Rate Limiter
  console.log("\n--- 5. Rate Limiter ---");
  const ipCheck1 = checkIpRateLimit("203.0.113.195", 2);
  const ipCheck2 = checkIpRateLimit("203.0.113.195", 2);
  const ipCheck3 = checkIpRateLimit("203.0.113.195", 2);
  assert(ipCheck1.allowed && ipCheck2.allowed && !ipCheck3.allowed, "IP rate limiter correctly throttled on 3rd request");

  // 6. Logging Redaction
  console.log("\n--- 6. Secret Redaction Defense ---");
  const secretSample = "Request with api_key=entsoe_secret_key_12345 and Bearer eyJhbGciOiJIUzI1NiJ9.test and token: abcdef123456";
  const redacted = redactSensitiveData(secretSample);
  assert(!redacted.includes("entsoe_secret_key_12345") && !redacted.includes("abcdef123456"), "Sensitive tokens and API keys redacted");

  console.log(`\n===============================================================`);
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
