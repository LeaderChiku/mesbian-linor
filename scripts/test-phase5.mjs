/**
 * Phase 5 Comprehensive Integration Tests
 *
 * Verifies:
 * 1. CMS content save and reload persistence.
 * 2. CMS isolation: updating CMS never alters or resets countdown schedule.
 * 3. Schedule isolation: updating schedule never alters CMS content.
 * 4. Audio upload validation, retrieval, and deletion.
 * 5. Dev Tools visibility toggle state persistence.
 * 6. Photo album empty-state and graceful fallback (no 404 dummy paths).
 */

import assert from 'node:assert';
import {
  applyAdminCommand,
  getAuthoritativeSessionState,
} from '../lib/server-state.ts';
import {
  uploadAudioFile,
  getAudioTracks,
  deleteAudioTrack,
} from '../lib/audio-server.ts';
import { getPhotosByCategory } from '../lib/photos-server.ts';

async function run() {
  console.log('\n--- 1. Testing CMS & Schedule Isolation ---');

  const testSchedule = '2026-11-20T12:00:00.000Z';
  applyAdminCommand({
    type: 'SET_SCHEDULE',
    scheduledAt: testSchedule,
  });

  const stateBeforeCms = await getAuthoritativeSessionState();
  assert.strictEqual(stateBeforeCms.scheduledAt, testSchedule);

  // Update CMS
  const updatedCmsData = {
    heroTitle: 'A Beautiful Keepsake for You',
    letterTitle: 'The Story We Keep',
    endingAWish: 'I wish you endless joy and laughter.',
  };

  const cmsResult = applyAdminCommand({
    type: 'UPDATE_CMS',
    data: updatedCmsData,
  });

  assert.strictEqual(cmsResult.success, true);
  assert.strictEqual(cmsResult.state.cmsData.heroTitle, 'A Beautiful Keepsake for You');

  // Verify schedule was NOT altered by CMS update
  const stateAfterCms = await getAuthoritativeSessionState();
  assert.strictEqual(
    stateAfterCms.scheduledAt,
    testSchedule,
    'Saving CMS content must NEVER overwrite or reset countdown schedule'
  );
  console.log('  ✓ CMS updated without altering countdown schedule');

  // Now update Schedule and verify CMS data was NOT altered
  const newSchedule = '2026-12-01T15:00:00.000Z';
  const scheduleResult = applyAdminCommand({
    type: 'SET_SCHEDULE',
    scheduledAt: newSchedule,
  });
  assert.strictEqual(scheduleResult.success, true);
  assert.strictEqual(scheduleResult.state.scheduledAt, newSchedule);
  assert.strictEqual(
    scheduleResult.state.cmsData.heroTitle,
    'A Beautiful Keepsake for You',
    'Updating schedule must NEVER overwrite or reset CMS content'
  );
  console.log('  ✓ Countdown schedule updated without altering CMS content');

  console.log('\n--- 2. Testing Dev Tools Visibility Toggle ---');

  const turnDevToolsOn = applyAdminCommand({
    type: 'SET_DEV_TOOLS',
    enabled: true,
  });
  assert.strictEqual(turnDevToolsOn.success, true);
  assert.strictEqual(turnDevToolsOn.state.showDevTools, true);

  const turnDevToolsOff = applyAdminCommand({
    type: 'SET_DEV_TOOLS',
    enabled: false,
  });
  assert.strictEqual(turnDevToolsOff.success, true);
  assert.strictEqual(turnDevToolsOff.state.showDevTools, false);
  console.log('  ✓ Dev Tools toggle persists state cleanly');

  console.log('\n--- 3. Testing Audio Upload Manager ---');

  // Test 3a: Non-audio file rejection
  const textBlob = new Blob(['this is not audio'], { type: 'text/plain' });
  const textFile = new File([textBlob], 'notes.txt', { type: 'text/plain' });
  const invalidResult = await uploadAudioFile(textFile, 'Test Text');
  assert.strictEqual(invalidResult.success, false, 'Non-audio file must be rejected');
  console.log('  ✓ Non-audio files correctly rejected');

  // Test 3b: Valid audio file (MP3 ID3 header mockup)
  // ID3 header: 0x49 0x44 0x33 0x03 0x00 0x00 0x00 0x00 0x00 0x00 + dummy payload
  const mp3Bytes = new Uint8Array([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const audioBlob = new Blob([mp3Bytes], { type: 'audio/mpeg' });
  const audioFile = new File([audioBlob], 'ambient_melody.mp3', { type: 'audio/mpeg' });

  const audioUploadResult = await uploadAudioFile(audioFile, 'Ambient Melody', 'Peaceful background track');
  assert.strictEqual(audioUploadResult.success, true, 'Valid MP3 upload must succeed');
  assert.ok(audioUploadResult.track?.id, 'Track ID must be present');
  assert.strictEqual(audioUploadResult.track.title, 'Ambient Melody');
  console.log('  ✓ Audio upload succeeded:', audioUploadResult.track.title);

  // Test 3c: Audio tracks list
  const tracks = await getAudioTracks();
  assert.ok(tracks.some((t) => t.id === audioUploadResult.track?.id), 'Uploaded track must be in list');
  console.log(`  ✓ Retrieved ${tracks.length} audio track(s) from storage`);

  // Test 3d: Delete audio track
  const deleted = await deleteAudioTrack(audioUploadResult.track.id);
  assert.strictEqual(deleted, true, 'Track deletion must succeed');
  const tracksAfterDelete = await getAudioTracks();
  assert.strictEqual(tracksAfterDelete.some((t) => t.id === audioUploadResult.track?.id), false);
  console.log('  ✓ Audio track deletion confirmed');

  console.log('\n--- 4. Testing Photo Album Fallback (No 404 Broken Paths) ---');

  const photos = await getPhotosByCategory('the-golden-hour');
  // Photos must not contain broken default placeholder paths like /photos/golden-hour-1.jpg
  for (const photo of photos) {
    assert.strictEqual(
      photo.imageUrl.startsWith('/photos/'),
      false,
      'Must not return broken default placeholder paths (e.g. /photos/golden-hour-1.jpg)'
    );
  }
  console.log('  ✓ Photo album verified without broken default 404 paths');

  console.log('\n============================================');
  console.log('All Phase 5 integration tests PASSED successfully!');
  console.log('============================================\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
