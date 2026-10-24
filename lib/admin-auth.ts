import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Server-side Admin Authentication and Rate Limiting
 *
 * - Verifies 4-digit PIN against server environment configuration.
 * - Protects endpoints with HMAC-signed session tokens in HTTP-only cookies.
 * - Enforces in-memory rate limiting to prevent brute-force attacks.
 * - Never logs or exposes PINs in client bundles.
 */

const ADMIN_COOKIE_NAME = 'mbl_admin_session';
const TOKEN_MAX_AGE_SEC = 60 * 60 * 8; // 8 hours

// Server secret for signing session tokens
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'mbl-secret-session-salt-987456123-antigravity';

// Expected 4-digit PIN (defaults to 7714 in development, or process.env.ADMIN_PIN)
const EXPECTED_PIN = process.env.ADMIN_PIN || '7714';

// In-memory rate limiting tracker: ip -> { count: number, lockedUntil: number }
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check and record an attempt from an IP address.
 * Returns true if allowed, or false if locked out.
 */
export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (record && record.lockedUntil > now) {
    const retryAfterSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  const isLockExpired = record && record.lockedUntil > 0 && record.lockedUntil <= now;
  const attempts = isLockExpired ? 0 : record?.attempts || 0;
  return { allowed: attempts < MAX_ATTEMPTS, remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts) };
}

export function recordFailedAttempt(ip: string): { locked: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  const isLockExpired = record && record.lockedUntil > 0 && record.lockedUntil <= now;
  const currentAttempts = (isLockExpired ? 0 : record?.attempts || 0) + 1;

  if (currentAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    rateLimitMap.set(ip, { attempts: currentAttempts, lockedUntil });
    return { locked: true, retryAfterSec: Math.ceil(LOCKOUT_MS / 1000) };
  }

  rateLimitMap.set(ip, { attempts: currentAttempts, lockedUntil: 0 });
  return { locked: false };
}

export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

/**
 * Sign an admin session payload into a tamper-proof token: payload.signature
 */
export function signAdminToken(adminId = 'admin'): string {
  const expiresAt = Date.now() + TOKEN_MAX_AGE_SEC * 1000;
  const payload = Buffer.from(JSON.stringify({ adminId, expiresAt })).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verify a signed admin session token.
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, providedSig] = parts;

  try {
    const expectedSig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const bufA = Buffer.from(providedSig);
    const bufB = Buffer.from(expectedSig);
    if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return false; // Expired
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Verify a 4-digit PIN safely using timing-safe comparison.
 */
export function verifyAdminPin(inputPin: string): boolean {
  if (!inputPin || typeof inputPin !== 'string') return false;

  const sanitized = inputPin.trim();
  if (!/^\d{4}$/.test(sanitized)) return false;

  const bufInput = Buffer.from(sanitized);
  const bufExpected = Buffer.from(EXPECTED_PIN);

  if (bufInput.length !== bufExpected.length) return false;

  return timingSafeEqual(bufInput, bufExpected);
}

export { ADMIN_COOKIE_NAME, TOKEN_MAX_AGE_SEC };
