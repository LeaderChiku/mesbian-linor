/**
 * Phase 3 Comprehensive Verification Suite
 * Tests admin auth, visitor verification, schedule math, state management,
 * ending selection, audio controls, and security constraints.
 */

import assert from 'assert';
import {
  verifyAdminPin,
  signAdminToken,
  verifyAdminToken,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../lib/admin-auth.ts';

import {
  getTimeRemaining,
  pad,
  formatScheduledDate,
} from '../lib/schedule.ts';

import {
  getSessionState,
  getVisitorState,
  getStoredVisitorCode,
  applyAdminCommand,
  subscribeToSession,
} from '../lib/server-state.ts';

import {
  getSectionByIndex,
  getSectionById,
  getAudioById,
  STORY_SECTIONS,
  STORY_AUDIOS,
} from '../lib/sections.ts';

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runTests() {
  console.log('\n--- 1. Admin Authentication & Security Tests ---');

  test('Admin PIN 7714 is verified successfully', () => {
    assert.strictEqual(verifyAdminPin('7714'), true);
  });

  test('Incorrect Admin PINs are rejected', () => {
    assert.strictEqual(verifyAdminPin('1234'), false);
    assert.strictEqual(verifyAdminPin('771'), false);
    assert.strictEqual(verifyAdminPin('77145'), false);
    assert.strictEqual(verifyAdminPin(''), false);
    assert.strictEqual(verifyAdminPin('abcd'), false);
  });

  test('Admin HMAC token signing & verification works', () => {
    const token = signAdminToken('admin-test');
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.includes('.'), true);
    assert.strictEqual(verifyAdminToken(token), true);
  });

  test('Tampered or invalid tokens are rejected', () => {
    assert.strictEqual(verifyAdminToken('fake.token'), false);
    assert.strictEqual(verifyAdminToken(''), false);
    assert.strictEqual(verifyAdminToken(null), false);
    const valid = signAdminToken();
    const tampered = valid.slice(0, -4) + 'zzzz';
    assert.strictEqual(verifyAdminToken(tampered), false);
  });

  test('Rate limiting triggers lockout after 5 consecutive failures', () => {
    const testIp = '192.168.1.99';
    resetRateLimit(testIp);

    assert.strictEqual(checkRateLimit(testIp).allowed, true);
    recordFailedAttempt(testIp);
    recordFailedAttempt(testIp);
    recordFailedAttempt(testIp);
    recordFailedAttempt(testIp);
    const fifth = recordFailedAttempt(testIp);

    assert.strictEqual(fifth.locked, true);
    assert.strictEqual(checkRateLimit(testIp).allowed, false);

    resetRateLimit(testIp);
    assert.strictEqual(checkRateLimit(testIp).allowed, true);
  });

  console.log('\n--- 2. Schedule & Countdown Logic Tests ---');

  test('pad formats single and double digits properly', () => {
    assert.strictEqual(pad(0), '00');
    assert.strictEqual(pad(7), '07');
    assert.strictEqual(pad(42), '42');
  });

  test('getTimeRemaining handles future timestamps without drift', () => {
    const future = new Date(Date.now() + 1000 * 60 * 65).toISOString(); // 1 hr 5 min
    const rem = getTimeRemaining(future);
    assert.strictEqual(rem.hours, 1);
    assert.strictEqual(rem.minutes, 5);
    assert.strictEqual(rem.total > 0, true);
  });

  test('getTimeRemaining returns total <= 0 for past timestamps', () => {
    const past = new Date(Date.now() - 5000).toISOString();
    const rem = getTimeRemaining(past);
    assert.strictEqual(rem.total <= 0, true);
  });

  test('formatScheduledDate returns readable local date', () => {
    const dateStr = '2026-10-24T18:00:00.000Z';
    const formatted = formatScheduledDate(dateStr);
    assert.strictEqual(typeof formatted, 'string');
    assert.strictEqual(formatted.length > 5, true);
  });

  console.log('\n--- 3. Server State & Admin Command Tests ---');

  test('Visitor code is stored securely and defaults to 739', () => {
    const code = getStoredVisitorCode();
    assert.strictEqual(code, '739');
  });

  test('SET_VISITOR_CODE validates 3 numeric digits', () => {
    const invalid = applyAdminCommand({ type: 'SET_VISITOR_CODE', code: '12' });
    assert.strictEqual(invalid.success, false);

    const valid = applyAdminCommand({ type: 'SET_VISITOR_CODE', code: '739' });
    assert.strictEqual(valid.success, true);
    assert.strictEqual(getStoredVisitorCode(), '739');
  });

  test('NAVIGATE command shifts currentSectionIndex within bounds', () => {
    const nav1 = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 2 });
    assert.strictEqual(nav1.success, true);
    assert.strictEqual(nav1.state.currentSectionIndex, 2);
    assert.strictEqual(nav1.state.currentSectionId, 'letter');

    // Out of bounds bounded
    const outHigh = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 99 });
    assert.strictEqual(outHigh.state.currentSectionIndex, STORY_SECTIONS.length - 1);

    const outLow = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: -5 });
    assert.strictEqual(outLow.state.currentSectionIndex, 0);
  });

  test('AUDIO_CONTROL updates command, volume and audio track', () => {
    const res = applyAdminCommand({
      type: 'AUDIO_CONTROL',
      command: 'play',
      audioId: 'music-reverie',
      volume: 65,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.state.audioCommand, 'play');
    assert.strictEqual(res.state.selectedAudioId, 'music-reverie');
    assert.strictEqual(res.state.audioVolume, 65);
  });

  test('SET_BLACK_SCREEN toggles isBlackScreen flag', () => {
    const on = applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: true });
    assert.strictEqual(on.state.isBlackScreen, true);
    const off = applyAdminCommand({ type: 'SET_BLACK_SCREEN', enabled: false });
    assert.strictEqual(off.state.isBlackScreen, false);
  });

  test('SET_SESSION_STATUS updates lifecycle states', () => {
    const paused = applyAdminCommand({ type: 'SET_SESSION_STATUS', status: 'paused' });
    assert.strictEqual(paused.state.sessionStatus, 'paused');
    const active = applyAdminCommand({ type: 'SET_SESSION_STATUS', status: 'active' });
    assert.strictEqual(active.state.sessionStatus, 'active');
  });

  console.log('\n--- 4. Phase 3 Three Endings Tests ---');

  test('SET_ENDING supports Ending A (Normal Goodbye)', () => {
    const res = applyAdminCommand({ type: 'SET_ENDING', ending: 'ending-a' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.state.selectedEnding, 'ending-a');
    assert.strictEqual(getSessionState().selectedEnding, 'ending-a');
  });

  test('SET_ENDING supports Ending B (Emotional Goodbye)', () => {
    const res = applyAdminCommand({ type: 'SET_ENDING', ending: 'ending-b' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.state.selectedEnding, 'ending-b');
    assert.strictEqual(getSessionState().selectedEnding, 'ending-b');
  });

  test('SET_ENDING supports Ending C (Romantic Conversation)', () => {
    const res = applyAdminCommand({ type: 'SET_ENDING', ending: 'ending-c' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.state.selectedEnding, 'ending-c');
    assert.strictEqual(getSessionState().selectedEnding, 'ending-c');
  });

  test('SET_ENDING can be cleared back to null (Default Closing)', () => {
    const res = applyAdminCommand({ type: 'SET_ENDING', ending: null });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.state.selectedEnding, null);
    assert.strictEqual(getSessionState().selectedEnding, null);
  });

  test('Real-time subscribers receive state notifications on mutation', () => {
    let notifiedState = null;
    const unsubscribe = subscribeToSession((s) => {
      notifiedState = s;
    });

    applyAdminCommand({ type: 'SET_ENDING', ending: 'ending-a' });
    assert.strictEqual(notifiedState?.selectedEnding, 'ending-a');

    unsubscribe();
    applyAdminCommand({ type: 'SET_ENDING', ending: null });
  });

  console.log('\n--- 5. Sections and Audio Registry Integrity Tests ---');

  test('All sections have valid titles, IDs, and associated audio', () => {
    assert.strictEqual(STORY_SECTIONS.length, 5);
    STORY_SECTIONS.forEach((sec, idx) => {
      assert.strictEqual(sec.index, idx);
      assert.strictEqual(typeof sec.id, 'string');
      assert.strictEqual(typeof sec.title, 'string');
      assert.strictEqual(sec.associatedAudios.length > 0, true);
    });
  });

  test('Audio catalog includes synthesized frequencies for zero-asset fallback', () => {
    assert.strictEqual(STORY_AUDIOS.length >= 6, true);
    STORY_AUDIOS.forEach((audio) => {
      assert.strictEqual(Array.isArray(audio.synthesizedFrequency), true);
      assert.strictEqual(audio.synthesizedFrequency.length > 0, true);
    });
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} of ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
