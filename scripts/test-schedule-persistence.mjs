/**
 * Test Schedule Persistence and Closure Bug Fix
 *
 * Verifies that:
 * 1. Admin can set and save an arbitrary schedule.
 * 2. Visitor receives and displays the updated schedule.
 * 3. Closing admin panel (unsubscribing SSE, terminating stream) does NOT reset the schedule.
 * 4. Server restart / process reload preserves the saved schedule from persistent cache / Supabase.
 * 5. October 25, 2026 NEVER reappears unless explicitly saved.
 * 6. Explicit Clear Schedule clears to null (unscheduled), which also persists across restart.
 * 7. Asia/Kolkata timezone conversion is mathematically exact and roundtrips correctly.
 * 8. Unauthorized users cannot modify the schedule.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  applyAdminCommand,
  getSessionState,
  getAuthoritativeSessionState,
  subscribeToSession,
} from '../lib/server-state.ts';
import { kolkataToUTC, utcToKolkataParts, formatKolkataDate } from '../lib/schedule.ts';
import { verifyAdminToken } from '../lib/admin-auth.ts';

async function run() {
  const initialSessionState = JSON.parse(JSON.stringify(await getAuthoritativeSessionState()));

  try {
    console.log('\n--- 1. Testing Schedule Setting & Admin Closure ---');

  const customSchedule = '2026-11-14T18:30:00.000Z';

  // Step 1: Simulate Admin Panel opening with an active SSE subscription
  let adminReceivedState = null;
  const adminUnsubscribe = subscribeToSession((state) => {
    adminReceivedState = state;
  });

  // Step 2: Admin changes date & time and clicks Save Schedule
  const saveResult = applyAdminCommand({
    type: 'SET_SCHEDULE',
    scheduledAt: customSchedule,
  });

  assert.strictEqual(saveResult.success, true, 'SET_SCHEDULE command must succeed');
  assert.strictEqual(saveResult.state.scheduledAt, customSchedule, 'Authoritative state must have custom schedule');
  assert.strictEqual(adminReceivedState?.scheduledAt, customSchedule, 'Admin SSE listener must receive custom schedule');
  console.log('  ✓ Admin saved custom schedule:', customSchedule);

  // Step 3: Visitor fetches state
  const visitorState = await getAuthoritativeSessionState();
  assert.strictEqual(visitorState.scheduledAt, customSchedule, 'Visitor must receive authoritative custom schedule');
  console.log('  ✓ Visitor sees custom schedule');

  // Step 4: Admin closes panel completely (SSE unsubscribes and aborts)
  adminUnsubscribe();
  console.log('  ✓ Admin panel closed completely (SSE stream disconnected)');

  // Step 5: Visitor refreshes or polls state after admin panel is closed
  const postCloseVisitorState = await getAuthoritativeSessionState();
  assert.strictEqual(
    postCloseVisitorState.scheduledAt,
    customSchedule,
    'Saved date must NOT revert after admin panel closes'
  );
  assert.notStrictEqual(
    new Date(postCloseVisitorState.scheduledAt).toISOString().split('T')[0],
    '2026-10-25',
    'Must not revert to October 25, 2026 default'
  );
  console.log('  ✓ Date remains authoritative after admin panel closed');

  console.log('\n--- 2. Testing Server Restart / Process Re-initialization ---');

  // Step 6: Verify cache file exists on disk
  const cacheFile = path.join(process.cwd(), '.session_cache.json');
  assert.strictEqual(fs.existsSync(cacheFile), true, '.session_cache.json must exist');
  const cachedOnDisk = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  assert.strictEqual(cachedOnDisk.scheduledAt, customSchedule, 'Disk cache must hold custom schedule');
  console.log('  ✓ Persistent disk cache contains saved schedule');

  // Step 7: Simulate server restart / cold start by clearing globals
  global.__mbl_session_state = undefined;
  global.__mbl_has_hydrated = undefined;

  // Step 8: Re-import / re-fetch state in fresh worker
  const freshRestartState = await getAuthoritativeSessionState();
  assert.strictEqual(
    freshRestartState.scheduledAt,
    customSchedule,
    'Schedule must survive complete server restart'
  );
  assert.notStrictEqual(
    new Date(freshRestartState.scheduledAt).toISOString().split('T')[0],
    '2026-10-25',
    'October 25, 2026 must NEVER reappear on restart'
  );
  console.log('  ✓ Server restart preserved the saved date (no October 25 reset)');

  console.log('\n--- 3. Testing Explicit Clear Schedule ---');

  // Step 9: Click Clear Schedule
  const clearResult = applyAdminCommand({
    type: 'SET_SCHEDULE',
    scheduledAt: null,
  });
  assert.strictEqual(clearResult.success, true);
  assert.strictEqual(clearResult.state.scheduledAt, null, 'Schedule must be explicitly null');
  console.log('  ✓ Explicit Clear Schedule set scheduledAt to null (immediate access)');

  // Step 10: Simulate server restart after clear
  global.__mbl_session_state = undefined;
  global.__mbl_has_hydrated = undefined;
  const restartedClearedState = await getAuthoritativeSessionState();
  assert.strictEqual(
    restartedClearedState.scheduledAt,
    null,
    'Null (unscheduled) state must survive restart, not restore Oct 25 default'
  );
  console.log('  ✓ Cleared state persists across restart as explicit null');

  console.log('\n--- 4. Testing Asia/Kolkata Timezone Conversion ---');

  // Step 11: Timezone conversions
  const istDate = '2026-12-25';
  const istTime = '19:30';
  const utcISO = kolkataToUTC(istDate, istTime);
  assert.strictEqual(
    utcISO,
    '2026-12-25T14:00:00.000Z',
    '7:30 PM IST (UTC+5:30) must translate exactly to 2:00 PM UTC'
  );

  const parts = utcToKolkataParts(utcISO);
  assert.deepStrictEqual(parts, { date: '2026-12-25', time: '19:30' }, 'UTC must roundtrip back to 19:30 in Kolkata');

  const formattedIST = formatKolkataDate(utcISO);
  assert.strictEqual(formattedIST.includes('December'), true, 'Formatted IST date must include month');
  console.log('  ✓ Asia/Kolkata conversion matches exact UTC offset (+05:30)');

  console.log('\n--- 5. Testing Admin Authorization Security ---');
  assert.strictEqual(verifyAdminToken(undefined), false, 'Empty token must be rejected');
  assert.strictEqual(verifyAdminToken('invalid-fake-token'), false, 'Forged token must be rejected');
  console.log('  ✓ Unauthorized modification of schedule is strictly rejected');

  console.log('\n============================================');
  console.log('All schedule persistence tests PASSED successfully!');
  console.log('============================================\n');
  } finally {
    if (initialSessionState) {
      if (initialSessionState.scheduledAt !== undefined) {
        applyAdminCommand({
          type: 'SET_SCHEDULE',
          scheduledAt: initialSessionState.scheduledAt,
        });
      }
      if (initialSessionState.cmsData) {
        applyAdminCommand({
          type: 'UPDATE_CMS',
          data: initialSessionState.cmsData,
        });
      }
    }
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
