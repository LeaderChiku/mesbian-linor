You are working on my existing project, **Mesbian Linor**, located at:

`C:\Users\ADITYA CHAUHAN\Documents\GitHub\mesbian-linor`

The project uses Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Supabase, and Vercel.

I need you to fix the existing bugs and implement the features below in the current project. This is an existing production-oriented website, so do not rebuild it from scratch, remove existing functionality, or break the current storytelling experience.

**PRIORITY: Fix countdown persistence first. Then fix the CMS and photo albums. After that, implement the remaining features.**

Do not just explain the fixes or produce a report. Inspect the existing source code, implement the changes, run the tests, and report the actual results.

# 1. CRITICAL: Permanently Fix Countdown Schedule Reset

## Current bug

The admin panel allows me to set a custom countdown date and time.

The custom date sometimes works while the admin panel is open, but when I close the admin panel, reload the website, or perform certain actions, the countdown unexpectedly resets to the default date and time, such as October 25, 2026, at approximately 12:43 AM.

I have already attempted a persistence fix involving:
- `lib/server-state.ts`
- `lib/supabase.ts`
- `app/api/session/state/route.ts`
- `app/api/session/stream/route.ts`
- `app/api/admin/command/route.ts`
- `components/admin/AdminDashboard.tsx`
- Supabase schema and migrations
- `scripts/test-schedule-persistence.mjs`

Despite these changes, the reset problem may still occur.

Do not assume that the previous fix was successful. Investigate the actual current implementation.

## Required investigation

Trace the complete schedule lifecycle:

1. Admin enters a date and time.
2. Admin clicks Save Schedule.
3. The API validates and saves the date.
4. The persistent database confirms the write.
5. Admin receives the saved schedule.
6. Visitor opens or reloads the website.
7. Visitor receives the same saved schedule.
8. Admin closes the panel.
9. A new API request, new browser session, server restart, or Vercel cold start occurs.
10. The same schedule remains available.

Inspect all relevant state initialization, API handlers, SSE synchronization, Supabase operations, client-side defaults, caching, and CMS save logic.

Search the entire repository for:
- `defaultFutureSchedule`
- `defaultFutureDate`
- `scheduledAt`
- `scheduled_at`
- `NEXT_PUBLIC_SCHEDULED_AT`
- `Date.now() + 24`
- Hardcoded dates
- Schedule reset operations
- Any fallback that replaces a missing schedule with a default date
- Any operation that overwrites the schedule during CMS saves or unrelated admin commands.

Remove unintended date-reset behavior.

## Permanent persistence architecture

Use Supabase as the authoritative shared persistent store for the production website.

Requirements:

- Save the schedule as a properly validated timestamp, preferably UTC in ISO 8601 format.
- Read the saved value from Supabase before serving authoritative state when necessary.
- Do not overwrite a valid database schedule with an outdated in-memory value, local cache, or hardcoded default.
- Do not rely on Node.js global variables, open SSE connections, browser storage, or local JSON files as the authoritative production database.
- A local JSON cache may be used for local development or explicitly designed fallback behavior, but it must not override newer database data.
- Vercel serverless instances must all observe the same saved schedule.
- The admin API must await and verify the database write before returning a successful save response.
- Handle Supabase failures explicitly. Never report a successful persistent save if the database write failed.
- Avoid races between admin commands, CMS updates, and concurrent requests.
- Preserve unrelated session settings when updating the schedule.
- Clearing the schedule must persist an explicit `null` state instead of silently restoring a default date.
- A missing schedule must have a deliberate, documented behavior; it must not unexpectedly become October 25 or another date.
- Do not expose Supabase service-role credentials in browser code.
- Review Next.js caching behavior so that public state requests do not return stale schedule data.
- Ensure countdown display and admin controls agree on the same saved timestamp.

If the existing Supabase schema does not support reliable persistence, create a safe migration. Inspect the current schema and existing data before proposing or executing any migration.

Do not reset the database or delete production records.

## Countdown acceptance tests

Add or update automated tests covering:

- Saving a custom date.
- Reading the same date from the visitor website.
- Closing the admin panel and reopening it.
- Reloading the visitor page.
- Simulating a server restart or fresh server-state initialization.
- Reading the schedule from a separate application instance.
- Saving a CMS update without changing the countdown.
- Running unrelated admin commands without changing the countdown.
- Handling database errors without falsely reporting success.
- Clearing the schedule and preserving the explicit cleared state.
- Concurrent requests without stale writes overriding the latest saved schedule.

The tests must exercise the real persistence boundary wherever practical. Do not claim that a mocked in-memory test proves cross-instance database persistence.

# 2. FIX CMS: Edit Content Must Actually Save and Load

## Current problem

The admin panel has an Edit Content section with fields for:
- Hero and welcome text
- Story title and description
- Parchment story letter
- Paragraphs and signature
- Ending messages and wishes
- Other visitor-facing text

When I edit these values and click Save All Content, the interface may show a success message, but the content does not reliably update or persist. In some cases, saving content may also coincide with the countdown resetting.

## Required implementation

Investigate the complete CMS flow:

Admin form → save API → server-side validation → persistent storage → visitor-facing components.

Inspect:
- `lib/cms.ts`
- `app/api/admin/cms/route.ts`
- `components/admin/AdminCmsPanel.tsx`
- `components/story/WelcomeSection.tsx`
- All ending components
- Every component that consumes CMS content
- Any session state or database update logic shared with CMS.

Implement a reliable persistent CMS system.

Requirements:

1. All supported CMS fields must save to persistent storage.
2. Reloading the admin panel must load the last saved values.
3. Reloading the visitor website must display those saved values.
4. The CMS must not reset to defaults on a server restart or deployment.
5. Saving CMS content must never overwrite the countdown schedule.
6. Saving the countdown must never overwrite CMS content.
7. Partial updates must preserve unrelated fields.
8. Validate input types and impose reasonable text-length limits.
9. Show a clear saving state, success state, and actionable error message.
10. Do not show a success message before the persistent write is confirmed.
11. Provide a deliberate Reset Defaults action, with confirmation if it can overwrite saved content.
12. Preserve existing field names and current content where possible.

Use a consistent, versioned CMS configuration model. If appropriate, store the CMS document in a dedicated Supabase table with a stable identifier and updated timestamp.

Avoid destructive schema changes.

Add automated tests for CMS save, reload, persistence, partial updates, and isolation from countdown state.

# 3. FIX PHOTO ALBUMS: Real Upload, Persistent Storage and Correct Image URLs

## Current problem

The admin panel contains a Photo Albums tab with an upload button.

The interface sometimes indicates that photos have uploaded, but the images do not appear correctly in the albums.

The browser console shows errors similar to:

`Failed to load resource: the server responded with a status of 404`

Examples include:
- `photos/golden-hour-1.jpg`
- `photos/golden-hour-2.jpg`
- `photos/valorant-1.jpg`
- `photos/valorant-2.jpg`
- `photos/minecraft-1.jpg`
- `photos/whispers-1.jpg`

Investigate the actual image URLs, API routes, metadata, and storage configuration before deciding the root cause.

## Required photo upload functionality

I need to upload photos directly from my laptop without providing an external image URL.

Implement a proper file picker in the admin panel.

The admin must be able to:

- Select one or multiple image files from the local computer.
- See upload progress.
- Receive accurate success or failure messages.
- Preview uploaded images.
- Assign photos to the correct album.
- Add or edit captions.
- Reorder photos.
- Select a cover image.
- Delete photos with confirmation.
- Reload the page and see all previously uploaded photos.
- Open the visitor website and see those same photos.

Support the existing album categories:

1. The Golden Hour — `the-golden-hour`
2. Late Night Queues — `late-night-queues`
3. Folded Whispers — `folded-whispers`
4. Our Little World — `our-little-world`

Preserve existing album functionality and design.

## Storage implementation

Investigate whether the existing Supabase Storage bucket exists and whether its permissions and configuration are correct.

If Supabase Storage is already configured, fix the existing implementation rather than creating unnecessary duplicate buckets.

If the bucket does not exist, provide a safe migration or explicit setup instructions for creating it.

Requirements:

- Store image binaries in persistent object storage, preferably the existing Supabase Storage setup.
- Store image metadata in the database.
- Store stable storage paths or valid URLs, not temporary browser blob URLs.
- If using private storage, generate appropriate signed URLs.
- If using public storage, configure the bucket and access policies deliberately.
- Keep service-role keys server-side only.
- Do not use a Vercel local filesystem directory as permanent production image storage.
- Validate file types and file sizes on the server.
- Reject unsupported or unsafe files.
- Avoid path traversal and filename collisions.
- Support reasonable upload limits and handle failures cleanly.
- Ensure the database metadata is saved only after a successful upload.
- If metadata saving fails after the file upload, handle cleanup or retry safely.
- Ensure deleted database records and storage objects do not become inconsistent.
- Do not silently mark failed uploads as successful.

## Fix all broken image references

Audit all existing hardcoded image paths and album records.

Determine whether each broken URL refers to:
- A missing local file.
- An incorrect relative URL.
- An incorrect Supabase Storage URL.
- A missing bucket or object.
- A failed upload.
- Missing metadata.
- Incorrect access permissions.

Correct the actual root cause.

Do not invent replacement photos or create fake successful upload records.

Where old images are genuinely missing, show a graceful placeholder and explain which assets need to be re-uploaded.

Add automated tests for file validation, upload handling, metadata persistence, image retrieval, and error states.

# 4. ADD AN AUDIO UPLOAD MANAGER TO LIVE CONTROL

## Goal

In the Live Control section of the admin panel, add an audio manager so I can upload MP3 files from my laptop and play them on the website.

I do not want to depend on external audio URLs.

## Admin features

Add an Audio Library section with:

- Upload MP3 button.
- File picker.
- Upload progress.
- Audio title and optional description.
- List of saved tracks.
- Play and pause preview.
- Delete track with confirmation.
- Optional track ordering.
- Clear upload errors and success messages.

Use persistent storage for audio files and database metadata.

Validate audio formats and file sizes on the server. Do not trust only the file extension or browser MIME type.

Use the existing Supabase Storage infrastructure if possible. Reuse existing infrastructure where appropriate, but keep photo and audio metadata logically separated.

## Visitor playback

Add a persistent website audio player that can play the selected uploaded track across the different story pages and chapters.

Requirements:

- One shared audio player should persist across client-side route or chapter transitions.
- Navigating between chapters must not create duplicate audio players or reset playback unexpectedly.
- Provide play/pause controls and a volume control.
- Handle unavailable or deleted tracks gracefully.
- Avoid loading the same audio multiple times.
- Use appropriate audio metadata and cleanup behavior.
- Do not autoplay audio with sound on a fresh visitor session. Browser autoplay restrictions must be respected.
- Let the visitor start playback through an explicit user action.
- Ensure the player works on mobile and desktop.
- Keep admin upload and deletion operations protected by admin authentication.

If background playback cannot be maintained across a full document navigation or browser refresh, explain the limitation accurately rather than claiming guaranteed uninterrupted playback.

# 5. IMPROVE THE GLASS-SHATTER ROMANTIC TWIST

## Current problem

The existing glass-shatter effect appears to trigger around five or six times and looks artificial.

The transition also takes too long.

## Required behavior

Inspect the existing implementation, especially:

- `components/twist/GlassShatterTransition.tsx`
- `components/twist/RomanticExperience.tsx`
- The admin trigger logic.
- Any SSE event or session-state synchronization involved.

Requirements:

1. The glass-shatter transition must only begin after an explicit admin-triggered twist command.
2. A single command must produce one transition, not repeated transitions.
3. Prevent duplicate triggers caused by rerenders, reconnecting SSE streams, React Strict Mode, duplicate event listeners, or repeated state hydration.
4. Use a unique event or transition ID and deduplicate processed events.
5. A single event must never trigger multiple simultaneous animations.
6. Make the shatter animation visually more realistic, with convincing glass-like fragments, motion, depth, highlights, and fading.
7. Respect reduced-motion preferences.
8. Do not make the animation excessively CPU-intensive.
9. The transition from the existing website to the romantic experience must complete within approximately one second.
10. Once the transition completes, reveal the baby-pink romantic experience cleanly.
11. Ensure the transition behaves consistently on mobile and desktop.
12. Provide an admin action to reset the transition state intentionally if needed.

Aim for one clean shatter sequence per trigger. Do not run the animation continuously or automatically based on guesses about the visitor's behavior.

Test duplicate events and reconnects.

# 6. ADD A DEV TOOLS VISIBILITY CONTROL IN THE ADMIN PANEL

## Current problem

The main website contains a Dev Tools feature with Show Tools and Hide Tools controls.

I want an equivalent on/off control in the admin panel so I can decide whether Dev Tools are visible on the visitor-facing website.

## Requirements

- Add a Dev Tools visibility toggle to Live Control.
- Show its current saved state.
- Save the setting persistently.
- Synchronize the setting with the visitor website.
- Preserve the existing Show Tools and Hide Tools behavior.
- Reloading the website must preserve the admin's selection.
- Use the existing session-control architecture where practical.
- Do not expose private admin controls to visitors.
- Make the control work after a fresh server instance or deployment.

Keep Dev Tools hidden by default for ordinary visitors unless the current product configuration explicitly specifies otherwise.

# 7. PERMANENT, SHARED PERSISTENCE FOR ALL ADMIN SETTINGS

## Goal

Anything I intentionally save in the admin panel must remain saved until I explicitly change or delete it.

This includes:
- Countdown date and time.
- CMS text and letters.
- Album metadata.
- Uploaded photos and cover selections.
- Uploaded audio files and selected tracks.
- Dev Tools visibility.
- Chapter unlock state.
- Twist configuration and trigger state where applicable.
- Other persistent admin settings already supported by the website.

Do not add a machine-learning model merely to remember website settings. This is a data-persistence problem, not an ML problem.

Use a reliable persistent architecture, with Supabase as the shared source of truth for production data and object storage for binary assets.

## Required architectural principles

- Use one clear, documented source of truth for each type of data.
- Keep unrelated settings logically isolated so saving one cannot accidentally reset another.
- Use explicit schemas, validation, and safe migrations.
- Prevent stale cache values from overwriting newer database data.
- Do not silently substitute defaults when a database read or write fails.
- Ensure all production instances read the same saved values.
- Add timestamps or version numbers where useful.
- Handle concurrent writes safely.
- Use authenticated server-side admin APIs.
- Never expose service-role keys or other secrets to client code.
- Keep existing production records and user content intact.
- Do not perform destructive migrations or database resets.
- Do not use local browser storage or local JSON files as the sole production persistence layer.
- Do not create a second conflicting source of truth for settings that already have a reliable database record.

A Save All Content operation must update only CMS data, not the countdown or other unrelated session state.

Likewise, photo uploads, audio uploads, and chapter unlock commands must not overwrite the CMS or countdown data.

# 8. REGRESSION TESTING AND QUALITY CHECKS

Run the existing test suites before and after the changes.

Inspect and run the existing scripts, including:

- `npm run test:all`
- The schedule persistence tests.
- The Phase 3 and Phase 4 tests.
- The production build.

Add appropriate tests for every new behavior.

Do not remove existing tests merely to make the suite pass.

Do not modify tests to simply mirror the implementation without validating the intended behavior.

Verify:
- Countdown persistence across a fresh application instance.
- CMS persistence after reload.
- Photo upload and retrieval using actual storage integration where practical.
- Audio upload and playback selection.
- Dev Tools visibility synchronization.
- Duplicate glass-shatter event handling.
- Admin authentication and authorization.
- Existing chapter navigation and ending flows.

Use mocks for isolated unit tests where appropriate, but do not present mock-only results as proof that Supabase or production object storage works.

If real Supabase credentials are unavailable, clearly distinguish locally verified tests from integration tests that still need to run against the configured project.

Run `npm run build` and fix any new build errors.

Review `git diff --check`.

# 9. MIGRATIONS, ENVIRONMENT VARIABLES, AND DEPLOYMENT

Inspect the existing environment variable names and Supabase configuration before making changes.

If additional setup is required:

1. Add safe, non-destructive migrations.
2. Document the expected bucket names and access policies.
3. Document any required environment variables using placeholder names only.
4. Never print actual credentials or secrets.
5. Do not overwrite `.env.local`.
6. Do not commit `.env` files, cache files, private uploads, or secret data.
7. Explain what must be configured in Supabase before deployment.
8. Ensure Vercel deployment does not depend on local JSON cache files or local filesystem persistence.

Do not execute destructive SQL automatically.

# 10. FINAL REPORT

After implementing the changes, provide a concise but detailed report with:

1. Root cause of the countdown reset.
2. Root cause of the CMS saving problem.
3. Root cause of the broken photo URLs and upload problem.
4. Persistent storage architecture used.
5. New audio upload and playback functionality.
6. Glass-shatter improvements.
7. Dev Tools visibility control.
8. Files created or modified.
9. Database migrations and manual configuration required.
10. Test results with actual pass/fail counts.
11. Build and lint results where available.
12. Remaining limitations or failures.

Do not call the project production-ready unless the relevant production integration has actually been verified.

## Execution order

Work in this order:

**P0 — Countdown persistence and isolation from CMS updates.**

**P1 — CMS save/load reliability and photo upload/storage/retrieval.**

**P2 — Audio upload library and persistent visitor playback.**

**P3 — Glass-shatter duplicate-trigger fix and animation improvement.**

**P4 — Persistent Dev Tools visibility toggle.**

**P5 — Full regression testing, safe migrations, and documentation.**

Start by inspecting the current repository and the existing changes. Preserve useful work already implemented. Do not blindly revert files or overwrite previous fixes.

Implement the changes in the existing project and report verified results honestly.
