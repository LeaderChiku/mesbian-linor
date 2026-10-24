import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import { getSessionState, applyAdminCommand } from '@/lib/server-state';
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
  const state = getSessionState();
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

    // Sanitize string entries (strip potential script tags)
    const sanitizedData: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string') {
        sanitizedData[k] = v.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
      }
    }

    const result = applyAdminCommand({
      type: 'UPDATE_CMS',
      data: sanitizedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Content updated successfully',
      cms: { ...DEFAULT_CMS_CONTENT, ...result.state.cmsData },
    });
  } catch (err) {
    console.warn('Error updating CMS:', err);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
