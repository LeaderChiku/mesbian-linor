import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import { uploadAudioFile } from '@/lib/audio-server';

function isAuthorized(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  return verifyAdminToken(cookieToken || headerToken);
}

/**
 * POST: Upload MP3 or audio file from laptop.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const result = await uploadAudioFile(file, title, description);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 422 });
    }

    return NextResponse.json({ success: true, track: result.track });
  } catch (err) {
    console.warn('Audio upload handler error:', err);
    return NextResponse.json({ error: 'Failed to process audio upload' }, { status: 500 });
  }
}
