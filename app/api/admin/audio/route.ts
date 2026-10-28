import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import { getAudioTracks, deleteAudioTrack } from '@/lib/audio-server';

function isAuthorized(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  return verifyAdminToken(cookieToken || headerToken);
}

/**
 * GET: Fetch all audio tracks (Admin).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const tracks = await getAudioTracks();
    return NextResponse.json({ success: true, tracks });
  } catch (err) {
    console.warn('Failed to fetch audio tracks:', err);
    return NextResponse.json({ error: 'Failed to fetch audio tracks' }, { status: 500 });
  }
}

/**
 * DELETE: Remove an audio track by ID.
 */
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing track ID parameter' }, { status: 400 });
  }

  try {
    const success = await deleteAudioTrack(id);
    if (!success) {
      return NextResponse.json({ error: 'Track not found or delete failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.warn('Failed to delete audio track:', err);
    return NextResponse.json({ error: 'Failed to delete audio track' }, { status: 500 });
  }
}
