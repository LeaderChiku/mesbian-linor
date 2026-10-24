# Phase 4 Manual Verification Checklist

Follow this checklist to manually test and verify all Phase 4 features across visitor and administrator interfaces.

---

## 1. Visitor PIN Gate & Reload Behavior
- [ ] Open the site at `http://localhost:3000/`.
- [ ] Verify the cinematic opening screen appears and transitions to countdown or access screen.
- [ ] If schedule is in the future, observe the countdown ticking downward every second.
- [ ] When on the access code screen, enter `123` (incorrect) and verify error message "Incorrect code. Please try again."
- [ ] Enter `739` (correct visitor PIN) and verify the scrapbook story unlocks.
- [ ] Refresh the page in the browser (`F5` or `Ctrl + R`).
- [ ] **Verify**: Reloading does **not** bypass security; you are prompted again for the PIN or countdown.

---

## 2. Admin Authentication & Re-Authentication on Reload
- [ ] Open `http://localhost:3000/admin`.
- [ ] Verify you are prompted to enter the Admin PIN.
- [ ] Enter `1111` (incorrect) and verify error message.
- [ ] Enter `7714` (correct admin PIN) and verify you enter the Admin Control Panel.
- [ ] Refresh the page (`F5`).
- [ ] **Verify**: The admin PIN gate appears again; the session does not silently bypass the PIN on reload.

---

## 3. "Ready to Begin" Trigger & Admin Notification
- [ ] In the visitor window, scroll down to Chapter Roadmap (Timeline section).
- [ ] Click the **"Ready to Begin"** button.
- [ ] Verify the button transitions to "Sending..." and then "Sent! Aditya has been notified 💌".
- [ ] Switch to the Admin window at `/admin`.
- [ ] **Verify**: A prominent notification banner appears at the top:
  `"💌 Your girl is ready to see the story! 💌"`
- [ ] Click **"Dismiss"** on the notification banner.
- [ ] Verify the notification dismisses and moves to the Notification History drawer.

---

## 4. Full-Screen Black Screen Overlay
- [ ] In the Admin Panel under **Live Session Overrides**, click **"Black Screen"**.
- [ ] Switch to the Visitor window.
- [ ] **Verify**: The entire screen turns pitch black.
- [ ] Try scrolling with the mouse wheel or swiping on mobile.
- [ ] **Verify**: Scrollbar is completely gone; no scrolling or content bleed occurs.
- [ ] In Admin Panel, toggle **"Disable Black Screen"**.
- [ ] **Verify**: Visitor screen immediately restores to its previous view and scrolling is unlocked.

---

## 5. Four Category Photo Collages
- [ ] In the Visitor scrapbook, find Section 2 ("Treasured Moments").
- [ ] Click the first polaroid: **"The Golden Hour"**.
- [ ] **Verify**: The scrapbook modal opens with title, subtitle, washi tape ribbons, tilted polaroids, and sticky notes.
- [ ] Scroll vertically through the photos.
- [ ] Press `Esc` or click the `✕` button to close the modal.
- [ ] Test the remaining three polaroids:
  - [ ] **"Late Night Queues"** (Valorant memories)
  - [ ] **"Our Little World"** (Minecraft & inside jokes)
  - [ ] **"Folded Whispers"** (Handwritten notes & cards)

---

## 6. Admin Photo Manager
- [ ] In the Admin Panel, click the **"📷 Photo Albums"** tab.
- [ ] Select **"Late Night Queues"**.
- [ ] Fill in the "Add Photo to Category" form:
  - Image URL: `/photos/valorant-test.jpg`
  - Caption: `Late night ace clutch`
  - Comment: `Unbelievable 1v4 comeback!`
  - Check "Set as album cover photo"
- [ ] Click **"Add to Album"**.
- [ ] Verify the new photo appears in the album list with the `COVER` badge.
- [ ] Click **"Delete"** on the newly created photo and confirm deletion.

---

## 7. Admin CMS (Content Management System)
- [ ] In the Admin Panel, click the **"✏️ Edit Content"** tab.
- [ ] In the **Hero & Welcome Header** section, change the Story Title to `A Story for Aditya & Linor`.
- [ ] Click **"Save All Content"**.
- [ ] Switch to the Visitor window and reload (enter PIN `739`).
- [ ] **Verify**: The hero header displays `A Story for Aditya & Linor`.
- [ ] In the CMS tab, click **"Reset Defaults"** and save to return to default text.

---

## 8. Romantic Twist Experience & Glass-Shatter Transition
- [ ] In the Visitor window, remain on the scrapbook story.
- [ ] In the Admin window under **Phase 4 — Romantic Twist Experience**, click **"Trigger Twist"**.
- [ ] In the confirmation modal, click **"Trigger 💌"**.
- [ ] Immediately watch the Visitor window:
  - [ ] **Verify**: The screen cracks with sharp fracture lines and plays a glass-cracking sound.
  - [ ] **Verify**: The screen shatters into geometric shards flying outwards.
  - [ ] **Verify**: The baby-pink Romantic Experience screen appears.
- [ ] On the Romantic Experience screen:
  - [ ] Tap/click anywhere on the screen. Verify blossoms (`🌸`, `💖`, `✨`) float upward from where you clicked.
  - [ ] Click "A small note for you..." to expand the secret thought card.
  - [ ] Verify the romantic declaration and 11:11 wish are rendered beautifully.
- [ ] In the Admin Panel, click **"Reset Twist"**.
- [ ] Switch to Visitor window.
- [ ] **Verify**: The visitor screen cleanly reverts back to the scrapbook story.
