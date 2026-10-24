import { NextRequest, NextResponse } from 'next/server';
import { applyAdminCommand } from '@/lib/server-state';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const state = body.state;

    if (['playing', 'paused', 'stopped', 'ducked', 'ready'].includes(state)) {
      applyAdminCommand({ type: 'REPORT_AUDIO_STATE', state });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid audio state' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
