import { NextRequest, NextResponse } from 'next/server';
import { applyAdminCommand, getSessionState } from '@/lib/server-state';

// In-memory cooldown map to prevent spamming
const readyCooldownMap = new Map<string, number>();
const COOLDOWN_MS = 20 * 1000; // 20 seconds

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * POST /api/session/ready-to-begin
 * Triggered by the visitor when they are ready to begin the story.
 * Broadcasts in real-time to the administrator's dashboard via SSE.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const lastClick = readyCooldownMap.get(ip) || 0;

  if (now - lastClick < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (now - lastClick)) / 1000);
    return NextResponse.json(
      { success: false, error: `Already notified! Please wait ${waitSec}s before sending again.` },
      { status: 429 }
    );
  }

  readyCooldownMap.set(ip, now);

  try {
    let customMessage = 'Your girl is ready to see the story! 💌';
    try {
      const body = await req.json();
      if (body?.message && typeof body.message === 'string') {
        customMessage = body.message.trim().slice(0, 140);
      }
    } catch {
      // Use default message
    }

    const result = applyAdminCommand({
      type: 'TRIGGER_READY_TO_BEGIN',
      message: customMessage,
    });

    return NextResponse.json({
      success: true,
      timestamp: result.state.readyToBeginAt,
      message: 'Notification sent to administrator',
    });
  } catch (err) {
    console.warn('Error recording Ready to Begin:', err);
    return NextResponse.json({ error: 'Failed to notify administrator' }, { status: 500 });
  }
}
