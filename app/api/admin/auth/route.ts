import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  verifyAdminPin,
  signAdminToken,
  verifyAdminToken,
  ADMIN_COOKIE_NAME,
  TOKEN_MAX_AGE_SEC,
} from '@/lib/admin-auth';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * GET: Check if current request has a valid admin session.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  const authenticated = verifyAdminToken(token);

  return NextResponse.json({ authenticated });
}

/**
 * POST: Authenticate using 4-digit PIN.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Enforce rate limiting
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many failed attempts. Access locked for ${Math.ceil((rateLimit.retryAfterSec || 900) / 60)} minutes.`,
        remainingAttempts: 0,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 numeric digits' },
        { status: 400 }
      );
    }

    // 2. Timing-safe verification
    const isValid = verifyAdminPin(pin);

    if (!isValid) {
      const record = recordFailedAttempt(ip);
      const remaining = Math.max(0, rateLimit.remainingAttempts - 1);

      if (record.locked) {
        return NextResponse.json(
          {
            error: 'Incorrect PIN. Too many failed attempts. Locked for 15 minutes.',
            remainingAttempts: 0,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // 3. Success — clear rate limit and issue secure session cookie
    resetRateLimit(ip);
    const token = signAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      token,
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_MAX_AGE_SEC,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}

/**
 * DELETE: Admin Logout.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
