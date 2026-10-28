import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import {
  getAuthoritativeSessionState,
  applyAdminCommand,
  syncSessionWithSupabase,
} from '@/lib/server-state';
import { DEFAULT_CMS_CONTENT } from '@/lib/cms';

function isAuthorized(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  return verifyAdminToken(cookieToken || headerToken);
}

/**
 * GET: Fetch current CMS content (merged with defaults).
 */
export async function GET() {
  const state = await getAuthoritativeSessionState();
  const merged = { ...DEFAULT_CMS_CONTENT, ...(state.cmsData || {}) };
  return NextResponse.json({ success: true, cms: merged });
}

/**
 * POST: Update CMS content fields.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid CMS payload' }, { status: 400 });
    }

    // Sanitize string entries (strip potential script tags) & enforce length limits
    const sanitizedData: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string') {
        const cleaned = v.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
        if (cleaned.length > 2000) {
          return NextResponse.json({ error: `Field "${k}" exceeds 2000 character limit.` }, { status: 400 });
        }
        sanitizedData[k] = cleaned;
      }
    }

    const result = applyAdminCommand({
      type: 'UPDATE_CMS',
      data: sanitizedData,
    });

    const isCloudConfigured = Boolean(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    if (isCloudConfigured) {
      const syncOk = await syncSessionWithSupabase(result.state);
      if (!syncOk) {
        return NextResponse.json({
          error: 'CMS content updated in memory but failed to write to database. Please check Supabase connection.',
          partialSuccess: true,
          cms: { ...DEFAULT_CMS_CONTENT, ...result.state.cmsData },
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Content updated and persisted successfully',
      cms: { ...DEFAULT_CMS_CONTENT, ...result.state.cmsData },
    });
  } catch (err) {
    console.warn('Error updating CMS:', err);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
