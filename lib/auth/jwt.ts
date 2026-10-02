/**
 * Isomorphic Web Crypto JWT Implementation
 * Fully compliant with Edge Runtime (Next.js middleware) and Node.js.
 */

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "atlasgrid-secure-jwt-key-2026-production-salt";

export interface JWTPayload {
  userId: string;
  email: string;
  role?: "viewer" | "analyst" | "admin";
  company?: string;
  useCase?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function base64UrlDecodeToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign standard JWT token (HS256) using Web Crypto API
 */
export async function signJWT(payload: JWTPayload, options?: { expiresIn?: string | number }): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  let expiresInSeconds = 15 * 60; // default 15 minutes

  if (typeof options?.expiresIn === "number") {
    expiresInSeconds = options.expiresIn;
  } else if (typeof options?.expiresIn === "string") {
    const unit = options.expiresIn.slice(-1);
    const value = parseInt(options.expiresIn.slice(0, -1), 10);
    if (unit === "m") expiresInSeconds = value * 60;
    else if (unit === "h") expiresInSeconds = value * 3600;
    else if (unit === "d") expiresInSeconds = value * 86400;
    else if (unit === "s") expiresInSeconds = value;
  }

  const completePayload: JWTPayload = {
    ...payload,
    role: payload.role || "viewer",
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(completePayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(JWT_SECRET);
  const sigBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signatureInput)
  );

  const signature = base64UrlEncodeBytes(new Uint8Array(sigBuffer));
  return `${signatureInput}.${signature}`;
}

/**
 * Verify JWT token and return payload, or throw Error
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid token format");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("JWT token must have 3 segments");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const signatureInput = `${headerB64}.${payloadB64}`;

  const key = await getCryptoKey(JWT_SECRET);
  const sigBytes = base64UrlDecodeToBytes(signatureB64);

  const isValid = await globalThis.crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes as unknown as BufferSource,
    new TextEncoder().encode(signatureInput)
  );

  if (!isValid) {
    throw new Error("Invalid JWT signature");
  }

  const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT token expired");
  }

  return payload;
}
