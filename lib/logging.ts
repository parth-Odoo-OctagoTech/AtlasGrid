/**
 * Centralized Logging with Automatic Redaction of Sensitive Keys
 */

const SENSITIVE_PATTERNS = [
  /api[_-]?key[=:][\s"']*([^"'\s&]+)/gi,
  /token[=:][\s"']*([^"'\s&]+)/gi,
  /secret[=:][\s"']*([^"'\s&]+)/gi,
  /password[=:][\s"']*([^"'\s&]+)/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]+)/gi,
];

export function redactSensitiveData(input: string): string {
  let redacted = input;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, (match, secret) => {
      if (!secret || secret.length < 4) return match;
      const masked = secret.substring(0, 2) + "****" + secret.substring(secret.length - 2);
      return match.replace(secret, masked);
    });
  }
  return redacted;
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    const formatted = typeof message === "string" ? redactSensitiveData(message) : message;
    console.log(`[INFO] ${formatted}`, ...args.map(a => typeof a === "string" ? redactSensitiveData(a) : a));
  },
  warn: (message: string, ...args: any[]) => {
    const formatted = typeof message === "string" ? redactSensitiveData(message) : message;
    console.warn(`[WARN] ${formatted}`, ...args.map(a => typeof a === "string" ? redactSensitiveData(a) : a));
  },
  error: (message: string, ...args: any[]) => {
    const formatted = typeof message === "string" ? redactSensitiveData(message) : message;
    console.error(`[ERROR] ${formatted}`, ...args.map(a => typeof a === "string" ? redactSensitiveData(a) : a));
  },
};
