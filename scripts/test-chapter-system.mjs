/**
 * Test Chapter System and Sequential Unlocking (Priority 3 & 4)
 */

import assert from 'node:assert';
import {
  applyAdminCommand,
  getSessionState,
  getAuthoritativeSessionState,
  subscribeToSession,
} from '../lib/server-state.ts';
import { STORY_SECTIONS } from '../lib/sections.ts';

async function run() {
  console.log('\n--- 1. Testing Initial Chapter State ---');

  // Reset to initial chapter index 0
  const initResult = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 0, unlockedChapterIndex: 0 });
  assert.strictEqual(initResult.success, true);

  const state0 = getSessionState();
  assert.strictEqual(state0.currentSectionIndex, 0, 'Initial index must be 0 (Prologue)');
  assert.strictEqual(state0.unlockedChapterIndex, 0, 'Initial unlocked chapter must be 0');
  console.log('  ✓ Initial state: Prologue unlocked (index 0)');

  console.log('\n--- 2. Testing Sequential Chapter Unlocking ---');

  let sseNotifications = [];
  const unsubscribe = subscribeToSession((s) => {
    sseNotifications.push(s.currentSectionIndex);
  });

  // Step 1: Click Next Section -> Unlocks Chapter 1 (index 1)
  const step1 = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 1 });
  assert.strictEqual(step1.state.currentSectionIndex, 1);
  assert.strictEqual(step1.state.unlockedChapterIndex, 1);
  assert.strictEqual(step1.state.currentSectionId, 'polaroids');
  console.log('  ✓ 1st Next Section: Chapter 1 (Treasured Moments) unlocked');

  // Step 2: Click Next Section -> Unlocks Chapter 2 (index 2)
  const step2 = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 2 });
  assert.strictEqual(step2.state.currentSectionIndex, 2);
  assert.strictEqual(step2.state.unlockedChapterIndex, 2);
  assert.strictEqual(step2.state.currentSectionId, 'letter');
  console.log('  ✓ 2nd Next Section: Chapter 2 (The Letter) unlocked');

  // Step 3: Click Next Section -> Unlocks Chapter 3 (index 3)
  const step3 = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 3 });
  assert.strictEqual(step3.state.currentSectionIndex, 3);
  assert.strictEqual(step3.state.unlockedChapterIndex, 3);
  assert.strictEqual(step3.state.currentSectionId, 'timeline');
  console.log('  ✓ 3rd Next Section: Chapter 3 (The Journey Map) unlocked');

  // Step 4: Click Next Section -> Unlocks Chapter 4 (index 4)
  const step4 = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 4 });
  assert.strictEqual(step4.state.currentSectionIndex, 4);
  assert.strictEqual(step4.state.unlockedChapterIndex, 4);
  assert.strictEqual(step4.state.currentSectionId, 'closing');
  console.log('  ✓ 4th Next Section: Chapter 4 (A Promise for Tomorrow) unlocked');

  // Step 5: Attempting to exceed max chapters remains capped at index 4
  const stepOverflow = applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 5 });
  assert.strictEqual(stepOverflow.state.currentSectionIndex, 4, 'Cannot advance past last chapter');
  console.log('  ✓ Chapter index remains capped at Chapter 4 (All Chapters Unlocked)');

  // Verify real-time broadcast of all unlock steps
  assert.deepStrictEqual(sseNotifications, [1, 2, 3, 4, 4]);
  console.log('  ✓ Real-time SSE subscribers received sequential chapter unlock notifications');
  unsubscribe();

  console.log('\n--- 3. Testing Chapter Progress Persistence ---');

  // Simulate serverless cold start / server restart
  global.__mbl_session_state = undefined;
  global.__mbl_has_hydrated = undefined;

  const restartedState = await getAuthoritativeSessionState();
  assert.strictEqual(
    restartedState.unlockedChapterIndex,
    4,
    'Unlocked chapter progress must survive server restarts'
  );
  console.log('  ✓ Chapter progress persisted across restart');

  // Reset back to Prologue for clean baseline
  applyAdminCommand({ type: 'NAVIGATE', sectionIndex: 0, unlockedChapterIndex: 0 });

  console.log('\n============================================');
  console.log('All chapter unlocking tests PASSED successfully!');
  console.log('============================================\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
