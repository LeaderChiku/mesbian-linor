import { NextResponse } from 'next/server';
import { getAuthoritativeSessionState } from '@/lib/server-state';

// Dynamic route so state is always fresh
export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await getAuthoritativeSessionState();
  return NextResponse.json(state, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
