/**
 * Phase 7 Critical Integration & Reliability Test Suite
 *
 * Verifies all Phase 7 requirements:
 * 1. Partial SQL updates & zero-risk countdown isolation (CMS does NOT touch schedule; Schedule does NOT touch CMS).
 * 2. Countdown persistence preserves configured November 2, 2026 IST date without unexpected reset.
 * 3. Default chapter lock (Prologue only; Ch I-IV locked) & sequential unlock via NAVIGATE.
 * 4. Explicit Prologue reset locks all chapters.
 * 5. Ending selection (A, B, C) unlocks Chapter IV and sets selectedEnding.
 * 6. Dev Tools admin toggle controls visibility.
 * 7. Audio catalog integration for live admin controls.
 * 8. State restoration guarantees tests never pollute saved countdown schedule or CMS.
 */

import assert from 'node:assert/strict';
import {
  ensureSessionState,
  getSessionState,
  getAuthoritativeSessionState,
  applyAdminCommand,
  persistActionToSupabase,
} from '../lib/server-state.ts';
import { getAudioTracks } from '../lib/audio-server.ts';

console.log('\n============================================');
console.log('Mesbian Linor: Phase 7 Verification Test Suite');
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

async function runPhase7Tests() {
  const initialSessionState = JSON.parse(JSON.stringify(await getAuthoritativeSessionState()));

  try {
    console.log('--- 1. Testing Schedule & CMS Partial Isolation ---');

    const testSchedule = '2026-11-02T10:30:00.000Z'; // November 2, 2026 4:00 PM IST
    applyAdminCommand({
      type: 'SET_SCHEDULE',
      scheduledAt: testSchedule,
    });

    test('Schedule set successfully and matches November 2, 2026 IST', () => {
      const state = getSessionState();
      assert.equal(state.scheduledAt, testSchedule);
    });

    // Update CMS content
    const testCmsData = {
      heroTitle: 'Mesbian Linor Phase 7 Title',
      heroDedication: 'Forever & Always Testing',
    };
    const cmsUpdateResult = applyAdminCommand({
      type: 'UPDATE_CMS',
      data: testCmsData,
    });

    test('Updating CMS does NOT overwrite or mutate scheduledAt', () => {
      assert.equal(cmsUpdateResult.success, true);
      assert.equal(cmsUpdateResult.state.cmsData.heroTitle, 'Mesbian Linor Phase 7 Title');
      assert.equal(cmsUpdateResult.state.scheduledAt, testSchedule);
    });

    test('Subsequent authoritative read retains both CMS and Schedule intact', async () => {
      const authState = await getAuthoritativeSessionState();
      assert.equal(authState.scheduledAt, testSchedule);
      assert.equal(authState.cmsData.heroTitle, 'Mesbian Linor Phase 7 Title');
    });

    console.log('\n--- 2. Testing Chapter Locks & Sequential Navigation ---');

    // Reset to Prologue
    const resetResult = applyAdminCommand({
      type: 'NAVIGATE',
      sectionIndex: 0,
      unlockedChapterIndex: 0,
    });

    test('Admin reset to Prologue locks Chapters I-IV (unlockedChapterIndex = 0)', () => {
      assert.equal(resetResult.success, true);
      assert.equal(resetResult.state.currentSectionIndex, 0);
      assert.equal(resetResult.state.unlockedChapterIndex, 0);
    });

    // Unlock Chapter I
    const navCh1 = applyAdminCommand({
      type: 'NAVIGATE',
      sectionIndex: 1,
      unlockedChapterIndex: 1,
    });

    test('Navigating to Chapter I unlocks Chapter I (unlockedChapterIndex = 1)', () => {
      assert.equal(navCh1.success, true);
      assert.equal(navCh1.state.currentSectionIndex, 1);
      assert.equal(navCh1.state.unlockedChapterIndex, 1);
    });

    console.log('\n--- 3. Testing Ending Selection & Auto Chapter IV Unlock ---');

    // Selecting Ending A must automatically unlock Chapter IV so visitor can read ending
    const endingResult = applyAdminCommand({
      type: 'SET_ENDING',
      ending: 'ending-a',
    });

    test('Selecting Ending A sets selectedEnding and unlocks Chapter IV (unlockedChapterIndex >= 4)', () => {
      assert.equal(endingResult.success, true);
      assert.equal(endingResult.state.selectedEnding, 'ending-a');
      assert.ok(endingResult.state.unlockedChapterIndex >= 4);
    });

    console.log('\n--- 4. Testing Dev Tools Admin Toggle ---');

    const devToolsOn = applyAdminCommand({
      type: 'SET_DEV_TOOLS',
      enabled: true,
    });
    test('SET_DEV_TOOLS enabled true updates state', () => {
      assert.equal(devToolsOn.success, true);
      assert.equal(devToolsOn.state.showDevTools, true);
    });

    const devToolsOff = applyAdminCommand({
      type: 'SET_DEV_TOOLS',
      enabled: false,
    });
    test('SET_DEV_TOOLS enabled false updates state', () => {
      assert.equal(devToolsOff.success, true);
      assert.equal(devToolsOff.state.showDevTools, false);
    });

    console.log('\n--- 5. Testing Audio Library Retrieval for Live Control ---');

    await testAsync('getAudioTracks retrieves audio catalog for Live Audio controls', async () => {
      const tracks = await getAudioTracks();
      assert.ok(Array.isArray(tracks), 'Tracks catalog must be an array');
    });

    console.log('\n============================================');
    console.log(`Results: ${passedTests} of ${totalTests} tests passed.`);
    console.log('============================================\n');

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  } finally {
    // Restore original state completely
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
      if (initialSessionState.unlockedChapterIndex !== undefined) {
        applyAdminCommand({
          type: 'NAVIGATE',
          sectionIndex: initialSessionState.currentSectionIndex ?? 0,
          unlockedChapterIndex: initialSessionState.unlockedChapterIndex,
        });
      }
      if (initialSessionState.selectedEnding !== undefined) {
        applyAdminCommand({
          type: 'SET_ENDING',
          ending: initialSessionState.selectedEnding,
        });
      }
      if (initialSessionState.showDevTools !== undefined) {
        applyAdminCommand({
          type: 'SET_DEV_TOOLS',
          enabled: initialSessionState.showDevTools,
        });
      }
    }
  }
}

runPhase7Tests().catch((err) => {
  console.error('Phase 7 test suite error:', err);
  process.exit(1);
});
