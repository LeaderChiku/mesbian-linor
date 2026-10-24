import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual, createHmac } from 'crypto';
import { getStoredVisitorCode } from '@/lib/server-state';

const VISITOR_COOKIE_NAME = 'mbl_visitor_verified';
const VISITOR_SECRET = process.env.VISITOR_CODE_SECRET || 'mbl-visitor-salt-2026-linor';

// In-memory rate limiting for visitor code attempts
interface VisitorAttemptRecord {
  attempts: number;
  lockedUntil: number;
}
const visitorAttempts = new Map<string, VisitorAttemptRecord>();
const MAX_VISITOR_ATTEMPTS = 5;
const VISITOR_LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  // Rate limiting check
  const record = visitorAttempts.get(ip);
  if (record && record.lockedUntil > now) {
    const mins = Math.ceil((record.lockedUntil - now) / 60000);
    return NextResponse.json(
      { success: false, error: `Too many incorrect attempts. Please wait ${mins} minute${mins === 1 ? '' : 's'} before trying again.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code || !/^\d{3}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Code must be exactly 3 digits' },
        { status: 400 }
      );
    }

    const expectedCode = getStoredVisitorCode();
    const bufInput = Buffer.from(code);
    const bufExpected = Buffer.from(expectedCode);

    const matches = bufInput.length === bufExpected.length && timingSafeEqual(bufInput, bufExpected);

    if (!matches) {
      const currentAttempts = (record && record.lockedUntil <= now ? 0 : record?.attempts || 0) + 1;
      if (currentAttempts >= MAX_VISITOR_ATTEMPTS) {
        visitorAttempts.set(ip, { attempts: currentAttempts, lockedUntil: now + VISITOR_LOCKOUT_MS });
        return NextResponse.json(
          { success: false, error: 'Too many incorrect attempts. Locked for 10 minutes.' },
          { status: 429 }
        );
      }
      visitorAttempts.set(ip, { attempts: currentAttempts, lockedUntil: 0 });
      return NextResponse.json(
        { success: false, error: "That code doesn't match. Take another look and try again." },
        { status: 401 }
      );
    }

    // Success — reset rate limit and issue secure verification cookie
    visitorAttempts.delete(ip);

    const signature = createHmac('sha256', VISITOR_SECRET).update('verified').digest('base64url');
    const token = `verified.${signature}`;

    const response = NextResponse.json({
      success: true,
      message: 'Code verified successfully',
    });

    response.cookies.set({
      name: VISITOR_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
