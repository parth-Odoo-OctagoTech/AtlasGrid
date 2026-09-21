import crypto from "crypto";

// Security Credentials per specification
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "Qwerty123";

// Cryptographic salt and secret
const SERVER_SECRET = process.env.SESSION_SECRET || process.env.CRON_SECRET || "atlasgrid-secret-defense-key-2026";

// In-memory rate limiting store for brute-force defense
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
  lastAttempt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// Security Audit Log (circular buffer of recent authentication events)
export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  event: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "RATE_LIMITED" | "SESSION_VERIFIED";
  ip: string;
  details?: string;
}
const auditLog: SecurityAuditEntry[] = [];

export function addSecurityAudit(
  event: SecurityAuditEntry["event"],
  ip: string,
  details?: string
) {
  const entry: SecurityAuditEntry = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    event,
    ip: ip.replace(/^.*:/, ""), // clean IPv6/IPv4
    details,
  };
  auditLog.unshift(entry);
  if (auditLog.length > 50) auditLog.pop();
}

export function getSecurityAuditLog(): SecurityAuditEntry[] {
  return [...auditLog];
}

/**
 * Constant-time string equality check to protect against timing attacks.
 */
function timingSafeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Rate limiter check. Allows up to 5 failed attempts per IP before enforcing a 60-second cooldown.
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.lockedUntil > now) {
    const remaining = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds: remaining };
  }

  // If previous attempt was over 5 minutes ago, reset
  if (now - record.lastAttempt > 5 * 60 * 1000) {
    rateLimitMap.delete(ip);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { attempts: 0, lockedUntil: 0, lastAttempt: now };
  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= 5) {
    record.lockedUntil = now + 60 * 1000; // 60-second lockout
    addSecurityAudit("RATE_LIMITED", ip, `IP locked out for 60s after ${record.attempts} failed attempts`);
  } else {
    addSecurityAudit("LOGIN_FAILED", ip, `Failed attempt ${record.attempts}/5`);
  }

  rateLimitMap.set(ip, record);
}

export function resetRateLimit(ip: string) {
  rateLimitMap.delete(ip);
}

/**
 * Verify credentials securely
 */
export function verifyAdminCredentials(username: string, pass: string, ip: string = "127.0.0.1") {
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return {
      success: false,
      error: `Too many failed login attempts. Terminal locked for ${rate.retryAfterSeconds}s.`,
      locked: true,
      retryAfterSeconds: rate.retryAfterSeconds,
    };
  }

  const isUserValid = timingSafeCompare(username.trim(), ADMIN_USERNAME);
  const isPassValid = timingSafeCompare(pass, ADMIN_PASSWORD);

  if (isUserValid && isPassValid) {
    resetRateLimit(ip);
    addSecurityAudit("LOGIN_SUCCESS", ip, "Admin authenticated with Level-5 clearance");
    const token = createSessionToken(username);
    return {
      success: true,
      token,
      user: {
        username: ADMIN_USERNAME,
        role: "admin",
        clearanceLevel: "LEVEL_5_TOP_SECRET",
      },
    };
  }

  recordFailedAttempt(ip);
  return {
    success: false,
    error: "Invalid Security Clearance Operator ID or Passkey.",
    locked: false,
  };
}

/**
 * Creates an HMAC-SHA256 signed session token.
 */
export function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    u: username,
    r: "admin",
    c: "LEVEL_5_TOP_SECRET",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
  });

  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SERVER_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Validates a signed session token.
 */
export function verifySessionToken(token: string | null | undefined): {
  valid: boolean;
  username?: string;
  role?: string;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return { valid: false };
  }

  const expectedSig = crypto
    .createHmac("sha256", SERVER_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  if (!timingSafeCompare(signature, expectedSig)) {
    return { valid: false };
  }

  try {
    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false }; // expired
    }

    return {
      valid: true,
      username: payload.u,
      role: payload.r,
    };
  } catch {
    return { valid: false };
  }
}
