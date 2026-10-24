/**
 * Phase 4 Test Suite — mesbian-linor
 * Tests for: Twist, Notifications, CMS, Photo Library, Black Screen,
 * Ready-to-Begin, Persistent State, and Security.
 *
 * Run with:  npm run test:p4
 */

import assert from 'assert';

import {
  applyAdminCommand,
  getSessionState,
  subscribeToSession,
} from '../lib/server-state.ts';

import { getCmsValue, DEFAULT_CMS_CONTENT } from '../lib/cms.ts';

import {
  DEFAULT_PHOTOS,
  PHOTO_CATEGORIES,
  getLocalPhotos,
  setLocalPhotos,
} from '../lib/photos-server.ts';

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`      ${e.message}`);
    failures.push({ name, error: e.message });
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────
console.log('\n--- 1. Phase 4 Romantic Twist Tests ---');
// ─────────────────────────────────────────────────────────────

test('SET_TWIST enables isTwistActive flag', () => {
  const r = applyAdminCommand({ type: 'SET_TWIST', enabled: true });
  assert.ok(r.success, 'Command should succeed');
  assert.strictEqual(r.state.isTwistActive, true, 'isTwistActive should be true');
  assert.strictEqual(r.state.lastCommand, 'TWIST_TRIGGERED');
});

test('SET_TWIST can be reset back to false', () => {
  const r = applyAdminCommand({ type: 'SET_TWIST', enabled: false });
  assert.ok(r.success);
  assert.strictEqual(r.state.isTwistActive, false, 'isTwistActive should be false after reset');
  assert.strictEqual(r.state.lastCommand, 'TWIST_RESET');
});

test('commandSeq increments on each twist command', () => {
  const before = getSessionState().commandSeq;
  applyAdminCommand({ type: 'SET_TWIST', enabled: true });
  applyAdminCommand({ type: 'SET_TWIST', enabled: false });
  const after = getSessionState().commandSeq;
  assert.ok(after > before + 1, `commandSeq should have incremented twice (was ${before}, now ${after})`);
});

// ─────────────────────────────────────────────────────────────
console.log('\n--- 2. Notifications & Ready-to-Begin Tests ---');
// ─────────────────────────────────────────────────────────────

test('TRIGGER_READY_TO_BEGIN creates a notification', () => {
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
  const r = applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN', message: 'Test: visitor is ready!' });
  assert.ok(r.success);
  assert.ok(r.state.readyToBeginAt, 'readyToBeginAt should be set');
  assert.strictEqual(r.state.notifications.length, 1, 'Should have 1 notification');
  assert.strictEqual(r.state.notifications[0].type, 'READY_TO_BEGIN');
  assert.strictEqual(r.state.notifications[0].read, false, 'New notification should be unread');
  assert.strictEqual(r.state.notifications[0].message, 'Test: visitor is ready!');
});

test('TRIGGER_READY_TO_BEGIN uses default message when none provided', () => {
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
  const r = applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN' });
  assert.ok(r.state.notifications[0].message.length > 0, 'Should have default message');
});

test('DISMISS_NOTIFICATION marks a notification as read', () => {
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
  const r1 = applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN', message: 'She is ready' });
  const notifId = r1.state.notifications[0].id;
  const r2 = applyAdminCommand({ type: 'DISMISS_NOTIFICATION', id: notifId });
  assert.ok(r2.success);
  const dismissed = r2.state.notifications.find((n) => n.id === notifId);
  assert.ok(dismissed, 'Notification should still exist');
  assert.strictEqual(dismissed.read, true, 'Notification should be marked as read');
});

test('CLEAR_NOTIFICATIONS removes all notifications', () => {
  applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN', message: 'Ping 1' });
  applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN', message: 'Ping 2' });
  const r = applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
  assert.ok(r.success);
  assert.strictEqual(r.state.notifications.length, 0, 'All notifications should be cleared');
});

test('Notification list is capped at 20 entries', () => {
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
  for (let i = 0; i < 25; i++) {
    applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN', message: `Ping ${i}` });
  }
  const s = getSessionState();
  assert.ok(s.notifications.length <= 20, `Notifications should not exceed 20, got ${s.notifications.length}`);
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
});

// ─────────────────────────────────────────────────────────────
console.log('\n--- 3. CMS Content Management Tests ---');
// ─────────────────────────────────────────────────────────────

test('UPDATE_CMS merges provided fields into cmsData', () => {
  const r = applyAdminCommand({
    type: 'UPDATE_CMS',
    data: { heroTitle: 'Custom Title', twistWish: 'My wish has always been you.' },
  });
  assert.ok(r.success);
  assert.strictEqual(r.state.cmsData.heroTitle, 'Custom Title');
  assert.strictEqual(r.state.cmsData.twistWish, 'My wish has always been you.');
});

test('getCmsValue returns override value when cmsData is set', () => {
  const val = getCmsValue({ heroTitle: 'A Custom Story' }, 'heroTitle');
  assert.strictEqual(val, 'A Custom Story');
});

test('getCmsValue falls back to DEFAULT_CMS_CONTENT when key is absent', () => {
  const val = getCmsValue({}, 'letterSalutation');
  assert.strictEqual(val, DEFAULT_CMS_CONTENT.letterSalutation);
});

test('getCmsValue falls back when value is whitespace-only', () => {
  const val = getCmsValue({ letterTitle: '   ' }, 'letterTitle');
  assert.strictEqual(val, DEFAULT_CMS_CONTENT.letterTitle, 'Should fall back for whitespace-only values');
});

test('getCmsValue falls back when cmsData is null or undefined', () => {
  const v1 = getCmsValue(null, 'heroTitle');
  const v2 = getCmsValue(undefined, 'twistWish');
  assert.strictEqual(v1, DEFAULT_CMS_CONTENT.heroTitle);
  assert.strictEqual(v2, DEFAULT_CMS_CONTENT.twistWish);
});

test('UPDATE_CMS does not overwrite unrelated existing keys', () => {
  applyAdminCommand({ type: 'UPDATE_CMS', data: { heroTitle: 'Preserved Value' } });
  applyAdminCommand({ type: 'UPDATE_CMS', data: { letterTitle: 'New Letter Title' } });
  const s = getSessionState();
  assert.strictEqual(s.cmsData.heroTitle, 'Preserved Value', 'heroTitle should be preserved');
  assert.strictEqual(s.cmsData.letterTitle, 'New Letter Title', 'letterTitle should be updated');
});

test('All required CMS default keys are defined with non-empty string values', () => {
  const keys = Object.keys(DEFAULT_CMS_CONTENT);
  assert.ok(keys.length >= 20, `Should have ≥20 CMS keys, got ${keys.length}`);
  for (const key of keys) {
    assert.ok(
      typeof DEFAULT_CMS_CONTENT[key] === 'string' && DEFAULT_CMS_CONTENT[key].trim().length > 0,
      `Default CMS key "${key}" should be a non-empty string`
    );
  }
});

// ─────────────────────────────────────────────────────────────
console.log('\n--- 4. Photo Library & Category Tests ---');
// ─────────────────────────────────────────────────────────────

test('PHOTO_CATEGORIES defines exactly 4 required categories', () => {
  assert.strictEqual(PHOTO_CATEGORIES.length, 4, 'Should have exactly 4 photo categories');
  const slugs = PHOTO_CATEGORIES.map((c) => c.slug);
  assert.ok(slugs.includes('the-golden-hour'), 'Missing the-golden-hour');
  assert.ok(slugs.includes('late-night-queues'), 'Missing late-night-queues');
  assert.ok(slugs.includes('our-little-world'), 'Missing our-little-world');
  assert.ok(slugs.includes('folded-whispers'), 'Missing folded-whispers');
});

test('Each PHOTO_CATEGORY has required fields', () => {
  for (const cat of PHOTO_CATEGORIES) {
    assert.ok(cat.slug, `Category is missing slug`);
    assert.ok(cat.title, `Category "${cat.slug}" is missing title`);
    assert.ok(cat.icon, `Category "${cat.slug}" is missing icon`);
    assert.ok(cat.themeColor, `Category "${cat.slug}" is missing themeColor`);
    assert.ok(cat.description, `Category "${cat.slug}" is missing description`);
  }
});

test('DEFAULT_PHOTOS contains at least 2 photos per category', () => {
  for (const cat of PHOTO_CATEGORIES) {
    const catPhotos = DEFAULT_PHOTOS.filter((p) => p.categorySlug === cat.slug);
    assert.ok(catPhotos.length >= 2, `Category "${cat.slug}" should have ≥2 default photos, got ${catPhotos.length}`);
  }
});

test('Each default photo has required fields', () => {
  for (const p of DEFAULT_PHOTOS) {
    assert.ok(p.id, `Photo missing id`);
    assert.ok(p.imageUrl, `Photo "${p.id}" missing imageUrl`);
    assert.ok(p.caption, `Photo "${p.id}" missing caption`);
    assert.ok(p.categorySlug, `Photo "${p.id}" missing categorySlug`);
    assert.ok(typeof p.orderIndex === 'number', `Photo "${p.id}" missing numeric orderIndex`);
  }
});

test('getLocalPhotos returns default photos on fresh state', () => {
  global.__mbl_photos_state = undefined;
  const photos = getLocalPhotos();
  assert.ok(Array.isArray(photos), 'Should return an array');
  assert.ok(photos.length > 0, 'Should return at least some photos');
});

test('setLocalPhotos and getLocalPhotos are consistent', () => {
  const testPhotos = [{
    id: 'test-1', imageUrl: '/test.jpg', caption: 'Test',
    categorySlug: 'the-golden-hour', orderIndex: 0, isCover: false,
    createdAt: new Date().toISOString(),
  }];
  setLocalPhotos(testPhotos);
  const retrieved = getLocalPhotos();
  assert.strictEqual(retrieved.length, 1);
  assert.strictEqual(retrieved[0].id, 'test-1');
  global.__mbl_photos_state = undefined;
});

test('Each category has at least one cover photo in DEFAULT_PHOTOS', () => {
  for (const cat of PHOTO_CATEGORIES) {
    const cover = DEFAULT_PHOTOS.find((p) => p.categorySlug === cat.slug && p.isCover === true);
    assert.ok(cover, `Category "${cat.slug}" should have at least one cover photo`);
  }
});

// ─────────────────────────────────────────────────────────────
console.log('\n--- 5. Black Screen State Tests ---');
// ─────────────────────────────────────────────────────────────

test('SET_BLACK_SCREEN enables isBlackScreen', () => {
  const r = applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: true });
  assert.ok(r.success);
  assert.strictEqual(r.state.isBlackScreen, true);
  assert.strictEqual(r.state.lastCommand, 'BLACK_SCREEN_ON');
});

test('SET_BLACK_SCREEN disables isBlackScreen', () => {
  const r = applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: false });
  assert.ok(r.success);
  assert.strictEqual(r.state.isBlackScreen, false);
  assert.strictEqual(r.state.lastCommand, 'BLACK_SCREEN_OFF');
});

test('Black screen state is independent of twist state', () => {
  applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: true });
  applyAdminCommand({ type: 'SET_TWIST', enabled: true });
  const s = getSessionState();
  assert.strictEqual(s.isBlackScreen, true);
  assert.strictEqual(s.isTwistActive, true);
  applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: false });
  applyAdminCommand({ type: 'SET_TWIST', enabled: false });
});

// ─────────────────────────────────────────────────────────────
console.log('\n--- 6. Persistent State Tests ---');
// ─────────────────────────────────────────────────────────────

test('commandSeq increments on each state mutation', () => {
  const before = getSessionState().commandSeq;
  applyAdminCommand({ type: 'SET_SESSION_STATUS', status: 'active' });
  const after = getSessionState().commandSeq;
  assert.ok(after > before, 'commandSeq should increment after command');
  applyAdminCommand({ type: 'SET_SESSION_STATUS', status: 'scheduled' });
});

test('updatedAt timestamp is refreshed on every command', () => {
  const before = getSessionState().updatedAt;
  const r = applyAdminCommand({ type: 'SET_SESSION_STATUS', status: 'scheduled' });
  assert.ok(r.state.updatedAt >= before, 'updatedAt should be recent');
});

test('Twist state persists in getSessionState', () => {
  applyAdminCommand({ type: 'SET_TWIST', enabled: true });
  const s = getSessionState();
  assert.strictEqual(s.isTwistActive, true, 'Persisted twist state should be true');
  applyAdminCommand({ type: 'SET_TWIST', enabled: false });
});

// ─────────────────────────────────────────────────────────────
console.log('\n--- 7. Real-Time SSE Subscriber Tests ---');
// ─────────────────────────────────────────────────────────────

test('Subscribers receive twist state change broadcasts', () => {
  let received = null;
  const unsub = subscribeToSession((state) => { received = state; });
  applyAdminCommand({ type: 'SET_TWIST', enabled: true });
  assert.ok(received !== null, 'Subscriber should have been called');
  assert.strictEqual(received.isTwistActive, true);
  unsub();
  applyAdminCommand({ type: 'SET_TWIST', enabled: false });
});

test('Subscribers receive notification events', () => {
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
  let received = null;
  const unsub = subscribeToSession((state) => { received = state; });
  applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN', message: 'SSE test ping' });
  assert.ok(received !== null);
  assert.ok(received.notifications.length > 0, 'Should have notification');
  assert.strictEqual(received.notifications[0].message, 'SSE test ping');
  unsub();
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
});

test('Unsubscribed listeners no longer receive updates', () => {
  let callCount = 0;
  const unsub = subscribeToSession(() => { callCount++; });
  applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: true });
  const countBefore = callCount;
  unsub();
  applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: false });
  assert.strictEqual(callCount, countBefore, 'Should not receive updates after unsubscribe');
});

// ─────────────────────────────────────────────────────────────
console.log('\n--- 8. End-to-End Integration Tests ---');
// ─────────────────────────────────────────────────────────────

test('Full P4 sequence: schedule → notify → twist → CMS → clear', () => {
  const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  let r = applyAdminCommand({ type: 'SET_SCHEDULE', scheduledAt: futureDate });
  assert.ok(r.success, 'SET_SCHEDULE should succeed');

  r = applyAdminCommand({ type: 'TRIGGER_READY_TO_BEGIN', message: 'Ready!' });
  assert.ok(r.success && r.state.notifications.length > 0);

  r = applyAdminCommand({ type: 'SET_TWIST', enabled: true });
  assert.ok(r.success && r.state.isTwistActive);

  r = applyAdminCommand({ type: 'UPDATE_CMS', data: { twistTitle: 'A Confession' } });
  assert.ok(r.success);

  applyAdminCommand({ type: 'SET_TWIST', enabled: false });
  applyAdminCommand({ type: 'CLEAR_NOTIFICATIONS' });
  applyAdminCommand({ type: 'SET_SCHEDULE', scheduledAt: null });

  const final = getSessionState();
  assert.strictEqual(final.isTwistActive, false);
  assert.strictEqual(final.notifications.length, 0);
  assert.strictEqual(final.scheduledAt, null);
});

test('CMS and ending interaction', () => {
  applyAdminCommand({ type: 'UPDATE_CMS', data: { endingAWish: 'Stay warm and be loved.' } });
  applyAdminCommand({ type: 'SET_ENDING', ending: 'ending-a' });
  const s = getSessionState();
  assert.strictEqual(s.selectedEnding, 'ending-a');
  assert.strictEqual(s.cmsData.endingAWish, 'Stay warm and be loved.');
  const wish = getCmsValue(s.cmsData, 'endingAWish');
  assert.strictEqual(wish, 'Stay warm and be loved.');
  applyAdminCommand({ type: 'SET_ENDING', ending: null });
});

// ─────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'='.repeat(44)}`);
console.log(`Results: ${passed} of ${total} tests passed.`);
if (failures.length > 0) {
  console.log(`\nFailed tests:`);
  failures.forEach((f) => console.log(`  ✗ ${f.name}: ${f.error}`));
}
console.log('='.repeat(44) + '\n');

if (failed > 0) process.exit(1);
