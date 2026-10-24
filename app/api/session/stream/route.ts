import { NextRequest } from 'next/server';
import { getVisitorState, subscribeToSession, type StorySessionState } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial session state immediately
      const initial = getVisitorState();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));

      // 2. Subscribe to real-time session state changes
      const unsubscribe = subscribeToSession((newState: StorySessionState) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(newState)}\n\n`));
        } catch {
          // Stream might be closed
        }
      });

      // 3. Keep-alive heartbeat every 15s
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      // 4. Cleanup when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
