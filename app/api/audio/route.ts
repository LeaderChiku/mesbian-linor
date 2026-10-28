import { NextResponse } from 'next/server';
import { getAudioTracks } from '@/lib/audio-server';

/**
 * GET: Public list of audio tracks for the visitor music player.
 */
export async function GET() {
  try {
    const tracks = await getAudioTracks();
    return NextResponse.json({
      success: true,
      tracks,
    });
  } catch (err) {
    console.warn('Error fetching audio tracks for visitor:', err);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}
