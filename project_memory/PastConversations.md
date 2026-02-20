# Autofocus App — Project Memory

> A running log of all development conversations, summarized for quick reference.
> Last updated: 2026-02-19

---

## 1. Theme System Implementation
**Date:** Jan 29, 2026

Implemented a dynamic theme system that ties specific visual themes to graveyards. Updated `db.json` with theme metadata, modified `MainContainer` to load/apply themes by graveyard ID, and wired up `themes.json` + `ThemeContext`. Goal: background and text colors change dynamically per graveyard (e.g., 'sea-1' → 'fishinsea' background).

---

## 2. Organizing CSS Variables
**Date:** Feb 1, 2026

Discussed best practices for separating CSS variables into dedicated files. Concluded it's a common and recommended practice for maintainability.

---

## 3. Theme System Implementation (cont.)
**Date:** Jan 29, 2026

_(Covered above — same session.)_

---

## 4. Frontend-Backend Integration Inquiry
**Date:** Feb 9, 2026

Explored how to integrate the app's frontend and backend before writing code. Covered process overview and best practices for connecting the two layers.

---

## 5. Timestamp Formatting and Alignment
**Date:** Feb 9, 2026

Modified `InteractionPaginateContainer.tsx` to format timestamps into human-readable `YYYY-MM-DD` format and right-aligned the time within its container.

---

## 6. Footer Component Explanation
**Date:** Feb 12, 2026

Walked through the React `Footer` component — its structure, functionality, and the purpose of each section.

---

## 7. Restoring File Explorer View
**Date:** Feb 16, 2026

VS Code's file explorer was missing (only Outline/Timeline visible). Troubleshot and restored the file tree view.

---

## 8. Retro UI & Layout Refinement
**Date:** Feb 19, 2026 (morning)

Major UI overhaul inspired by Daygram:
- Applied retro theme: background `#f1f0ec`, grey/black buttons, distinct font style.
- Centered the "+" button in the nav bar, adjusted button positions.
- Fixed iOS keyboard bug (input field covered by keyboard).
- Redesigned Log Page to match Daygram's timeline/footer aesthetic, updated fonts and date filtering.

---

## 9. Debugging `npm start` Failure
**Date:** Feb 19, 2026

Identified and resolved the root cause of `npm start` failing in the Autofocus app.

---

## 10. Layout & Interaction Refinements
**Date:** Feb 19, 2026

- Prevented "New Task…" input from appearing on full pages.
- Fixed swipe gesture.
- Stabilized header height (consistent with/without "Fire" icon).
- Reduced circle button size.

---

## 11. Hiding "New Tasks" Input
**Date:** Feb 19, 2026

Hid the "New tasks…" input field on all pages by adding conditional rendering logic.

---

## 12. Investigating iOS Swipe Issue
**Date:** Feb 19, 2026

Investigated why swiping wasn't working on iOS. Analyzed `HomeScreen.tsx` and `Pager.tsx` to find the root cause and plan a fix.

---

## 13. Refining Settings UI
**Date:** Feb 19, 2026

- Implemented auto-save for settings changes.
- Removed unnecessary buttons.
- Added bottom bar with distinct button shapes (wide rectangle = settings, circle = log).
- Preserved "Fire" button logic and retro aesthetic.

---

## 14. Refining Task Modal Workflow
**Date:** Feb 19, 2026

Significant modal UX improvements:
- Edit/Preview mode toggle with custom `| DONE |` button.
- Tap in Preview → re-enter Edit; swipe down → save & close.
- Tasks only saved if they have content; empty tasks are discarded.
- Fixed swipe-down gesture issues.
- Ensured input visibility when keyboard is active.
- Displayed task name in the header during editing.
- Auto-sorted active and completed tasks.

---

## 15. Page Transition Animations
**Date:** Feb 19, 2026

Changed page transitions from a page-flip effect to a fade-in/fade-out animation.

---

## 16. Pager Swipe Refinement
**Date:** Feb 19, 2026

Polished swipe gestures in the Pager component:
- Real-time visual feedback showing adjacent pages during drag.
- Smooth snap-to-page / spring-back on release (distance + velocity based).
- Rubber-band effect at boundaries (first/last page).

---

## 17. Expo Go Upgrade Path
**Date:** Feb 19, 2026

Explored the Expo Go upgrade warning. Discussed how to generate a standalone development build that launches directly from the home screen without opening Expo Go first.

---

## 18. Product Overview / README Writing
**Date:** Feb 19, 2026 (afternoon)

Created a GitHub `README.md` targeting recruiters/hiring managers. Sections: Title, Screenshots (placeholders), About (Autofocus method explanation), Key Features, Tech Stack, Project Structure, Getting Started. Professional and concise tone.

---

## 19. README Refinement
**Date:** Feb 19, 2026

Iterated on the README for both HR and technical audiences. Balanced frontend/backend coverage, adjusted tone, and shortened overall length. Also wrote a concise repository description.

---

## 20. Cross-Platform Development Inquiry
**Date:** Feb 19, 2026

High-level overview of building the Autofocus app for macOS or web with iOS sync. Discussed general steps and potential challenges.

---

## 22. Implementing Export Feature & EAS Sync
**Date:** Feb 19, 2026 (evening)

Added a JSON data export feature to the iOS app:
- Installed `expo-file-system` and `expo-sharing`.
- Added `exportData()` to `TaskContext` to bundle tasks and settings.
- Added an "EXPORT DATA" button to `SettingsScreen` that uses the iOS share sheet to export a JSON file.
- Synced the changes to EAS (Expo Application Services) on the `development` channel.

---

## 23. Prioritizing Responsive Web App & Memory Update
**Date:** Feb 19, 2026

Decided to prioritize developing a responsive web app over the iOS app for primary use. While the iOS app will be kept, the web version is preferred because iOS gestures (PanResponder/Animated) are not smooth enough for the user's preference. Updated project memory to reflect this shift in priority.
