/**
 * In-memory sliding window rate limiter
 * Enforces:
 * - 100 requests / minute per IP
 * - 1000 requests / hour per authenticated user
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateBucket>();
const userBuckets = new Map<string, RateBucket>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of ipBuckets.entries()) {
      if (bucket.resetAt <= now) ipBuckets.delete(key);
    }
    for (const [key, bucket] of userBuckets.entries()) {
      if (bucket.resetAt <= now) userBuckets.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkIpRateLimit(ip: string, limit = 100, windowMs = 60 * 1000): RateLimitResult {
  const now = Date.now();
  const cleanIp = ip.replace(/^.*:/, "") || "127.0.0.1";
  let bucket = ipBuckets.get(cleanIp);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 1, resetAt: now + windowMs };
    ipBuckets.set(cleanIp, bucket);
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining,
    resetSeconds,
  };
}

export function checkUserRateLimit(userId: string, limit = 1000, windowMs = 60 * 60 * 1000): RateLimitResult {
  const now = Date.now();
  let bucket = userBuckets.get(userId);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 1, resetAt: now + windowMs };
    userBuckets.set(userId, bucket);
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining,
    resetSeconds,
  };
}
