import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import {
  getSessionState,
  getAuthoritativeSessionState,
  getStoredVisitorCode,
  applyAdminCommand,
  syncSessionWithSupabase,
} from '@/lib/server-state';

function isAuthorized(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  return verifyAdminToken(cookieToken || headerToken);
}

/**
 * GET: Fetch complete administrative state (includes configured visitor passcode).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }

  const state = await getAuthoritativeSessionState();
  const visitorCode = getStoredVisitorCode();

  return NextResponse.json({
    state,
    visitorCode,
  });
}

/**
 * POST: Apply administrative real-time commands.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }

  try {
    const action = await req.json();

    if (!action || !action.type) {
      return NextResponse.json({ error: 'Missing action type' }, { status: 400 });
    }

    const result = applyAdminCommand(action);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to apply command' }, { status: 400 });
    }

    if (action.type === 'SET_SCHEDULE') {
      const syncOk = await syncSessionWithSupabase(result.state);
      const isCloudConfigured = Boolean(
        process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL
      );
      if (isCloudConfigured && !syncOk) {
        return NextResponse.json({
          error: 'Failed to write schedule to persistent database. Check Supabase connection and table RLS permissions.',
          state: result.state,
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      state: result.state,
      visitorCode: getStoredVisitorCode(),
    });
  } catch (err) {
    console.warn('Error processing admin command:', err);
    return NextResponse.json({ error: 'Invalid command payload' }, { status: 400 });
  }
}
