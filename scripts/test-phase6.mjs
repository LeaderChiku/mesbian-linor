import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ensureSessionState,
  getSessionState,
  applyAdminCommand,
  getAuthoritativeSessionState,
  syncSessionWithSupabase,
} from '../lib/server-state.ts';
import { getCmsValue, DEFAULT_CMS_CONTENT } from '../lib/cms.ts';
import {
  getLocalPhotos,
  setLocalPhotos,
  addPhoto,
  updatePhoto,
  deletePhoto,
  getPhotosByCategory,
} from '../lib/photos-server.ts';
import {
  getLocalAudioTracks,
  setLocalAudioTracks,
  uploadAudioFile,
  deleteAudioTrack,
} from '../lib/audio-server.ts';

console.log('\n============================================');
console.log('Mesbian Linor: Phase 6 Verification Test Suite');
console.log('============================================\n');

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

async function testAsync(description, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

async function runAllTests() {
  console.log('--- 1. Testing CMS Content Persistence & Cold-Start Hydration ---');

  // Test 1: CMS update
  const sampleCustomCms = {
    heroTitle: 'Mesbian Linor Story for You',
    letterTitle: 'A Chapter We Write Together',
    letterSignature: 'With All My Heart',
  };
  const cmsResult = applyAdminCommand({
    type: 'UPDATE_CMS',
    data: sampleCustomCms,
  });
  test('UPDATE_CMS properly updates session cmsData', () => {
    assert.equal(cmsResult.success, true);
    assert.equal(cmsResult.state.cmsData.heroTitle, sampleCustomCms.heroTitle);
    assert.equal(cmsResult.state.cmsData.letterSignature, sampleCustomCms.letterSignature);
  });

  // Test 2: getCmsValue reflects custom values
  test('getCmsValue returns custom value over default', () => {
    const val = getCmsValue(getSessionState().cmsData, 'heroTitle');
    assert.equal(val, sampleCustomCms.heroTitle);
  });

  // Test 3: Audio report heartbeat does not wipe cmsData or trigger unnecessary sequence bump
  const preAudioSeq = getSessionState().commandSeq;
  const audioReportResult = applyAdminCommand({
    type: 'REPORT_AUDIO_STATE',
    state: 'playing',
  });
  test('REPORT_AUDIO_STATE preserves cmsData and does not cause commandSeq flood', () => {
    assert.equal(audioReportResult.success, true);
    assert.equal(audioReportResult.state.audioState, 'playing');
    assert.equal(audioReportResult.state.cmsData.heroTitle, sampleCustomCms.heroTitle);
    assert.equal(audioReportResult.state.commandSeq, preAudioSeq);
  });

  // Test 4: Cold-start simulation preserving CMS content
  await testAsync('Simulated process cold-start preserves saved CMS data', async () => {
    // Save to cache file as done in production
    const currentState = getSessionState();
    const cachePath = path.join(process.cwd(), '.session_cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(currentState, null, 2), 'utf-8');

    // Reset memory global to simulate cold start
    global.__mbl_session_state = undefined;
    global.__mbl_has_hydrated = false;

    const hydrated = await getAuthoritativeSessionState();
    assert.equal(hydrated.cmsData.heroTitle, sampleCustomCms.heroTitle);
    assert.equal(hydrated.cmsData.letterSignature, sampleCustomCms.letterSignature);
  });

  console.log('\n--- 2. Testing CMS & Schedule Isolation ---');

  // Test 5: Updating schedule does not affect CMS
  const futureSchedule = new Date(Date.now() + 86400000).toISOString();
  applyAdminCommand({
    type: 'SET_SCHEDULE',
    scheduledAt: futureSchedule,
  });
  test('Setting schedule leaves CMS content completely intact', () => {
    const state = getSessionState();
    assert.equal(state.scheduledAt, futureSchedule);
    assert.equal(state.cmsData.heroTitle, sampleCustomCms.heroTitle);
  });

  // Test 6: Updating CMS does not affect schedule
  applyAdminCommand({
    type: 'UPDATE_CMS',
    data: { heroDedication: 'Forever & Always' },
  });
  test('Updating CMS leaves countdown schedule completely intact', () => {
    const state = getSessionState();
    assert.equal(state.scheduledAt, futureSchedule);
    assert.equal(state.cmsData.heroDedication, 'Forever & Always');
  });

  console.log('\n--- 3. Testing Photo Album Set-As-Cover & Delete Persistence ---');

  // Seed two test photos in a category
  setLocalPhotos([]);
  const photoA = await addPhoto({
    categorySlug: 'the-golden-hour',
    imageUrl: '/uploads/photos/the-golden-hour/photoA.jpg',
    caption: 'Sunset Memory A',
    orderIndex: 0,
    isCover: true,
    dateLabel: 'Oct 2026',
  });
  const photoB = await addPhoto({
    categorySlug: 'the-golden-hour',
    imageUrl: '/uploads/photos/the-golden-hour/photoB.jpg',
    caption: 'Sunset Memory B',
    orderIndex: 1,
    isCover: false,
    dateLabel: 'Oct 2026',
  });

  test('Initial cover assignment sets photoA as cover', () => {
    const photos = getLocalPhotos();
    const pA = photos.find((p) => p.id === photoA.id);
    const pB = photos.find((p) => p.id === photoB.id);
    assert.equal(pA?.isCover, true);
    assert.equal(pB?.isCover, false);
  });

  // Toggle photoB to cover
  await updatePhoto(photoB.id, { isCover: true });
  test('Setting photoB as cover automatically unsets photoA as cover', () => {
    const photos = getLocalPhotos();
    const pA = photos.find((p) => p.id === photoA.id);
    const pB = photos.find((p) => p.id === photoB.id);
    assert.equal(pB?.isCover, true);
    assert.equal(pA?.isCover, false);
  });

  // Delete photoA
  const deleteResult = await deletePhoto(photoA.id);
  test('Deleting photoA removes it completely from album', () => {
    assert.equal(deleteResult, true);
    const photos = getLocalPhotos();
    assert.equal(photos.some((p) => p.id === photoA.id), false);
    assert.equal(photos.length, 1);
  });

  // Query by category
  await testAsync('getPhotosByCategory retrieves the remaining photoB', async () => {
    const categoryPhotos = await getPhotosByCategory('the-golden-hour');
    assert.equal(categoryPhotos.length, 1);
    assert.equal(categoryPhotos[0].id, photoB.id);
  });

  console.log('\n--- 4. Testing Audio Upload & Bucket Error Resiliency ---');

  await testAsync('Audio validation rejects non-audio files', async () => {
    const fakeTextFile = new File([Buffer.from('not an audio file')], 'sample.txt', {
      type: 'text/plain',
    });
    const result = await uploadAudioFile(fakeTextFile, 'Invalid Track');
    assert.equal(result.success, false);
    assert.match(result.error || '', /Unsupported/i);
  });

  await testAsync('Audio upload succeeds with proper audio header and fallback', async () => {
    // Valid ID3 buffer header
    const mp3Header = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const audioFile = new File([mp3Header], 'test_track.mp3', { type: 'audio/mpeg' });
    const result = await uploadAudioFile(audioFile, 'Test Ambient Sound');
    assert.equal(result.success, true);
    assert.ok(result.track?.storageUrl);

    // Clean up
    if (result.track?.id) {
      await deleteAudioTrack(result.track.id);
    }
  });

  console.log('\n--- 5. Testing Glass Shatter Performance Optimizations ---');

  test('GlassShatterTransition component file uses optimized hardware-accelerated configuration', () => {
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components/twist/GlassShatterTransition.tsx'),
      'utf-8'
    );
    // Verified 14 shards (not 20)
    assert.ok(code.includes('generateShards(14)'), 'Should use 14 shards for performance');
    // Verified hardware acceleration classes
    assert.ok(code.includes('transform-gpu'), 'Should include transform-gpu');
    assert.ok(code.includes('will-change-transform'), 'Should include will-change-transform');
    // Verified backdrop-blur-sm removed from shards
    assert.ok(!code.includes('backdrop-blur-sm'), 'Should not contain laggy backdrop-blur-sm on shards');
    // Verified shadow-2xl removed from moving shards
    assert.ok(!code.includes('shadow-2xl'), 'Should not contain shadow-2xl on shards');
  });

  console.log('\n============================================');
  console.log(`Results: ${passedTests} of ${totalTests} tests passed.`);
  console.log('============================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite runner error:', err);
  process.exit(1);
});
