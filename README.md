# Autofocus

A gesture-driven task manager for iOS built on Mark Forster's Autofocus productivity method.

## Screenshots

| | | |
|:---:|:---:|:---:|
| ![Paginated task list](screenshots/task-list.png) | ![Swipe navigation](screenshots/swipe-navigation.png) | ![Task editor modal](screenshots/task-editor.png) |
| ![Dismiss confirmation](screenshots/dismiss-dialog.png) | ![Completion log](screenshots/completion-log.png) | ![Settings](screenshots/settings.png) |

## About

The [Autofocus method](http://markforster.squarespace.com/autofocus-system/) is a time management system created by Mark Forster. It replaces rigid prioritization with intuitive selection: you write tasks into a ruled notebook, scan through one page at a time, and act on whichever task "stands out" to you. If you pass through an entire page without anything catching your attention, every remaining item on that page is dismissed. The system balances rational planning with gut instinct — and in practice, it eliminates most of the friction that causes procrastination.

I've been using this method with pen and paper for a while, but no existing app captured its core mechanics correctly. Most task managers treat dismiss/delete as failure states, whereas in Autofocus, dismissal is a feature — it's how the system filters out what doesn't matter. So I built this app to bring the full method to my phone, including the page-based structure, the dismiss mechanic, and the cyclical review loop.

## Key Features

- **Paginated task system** — Tasks are organized into fixed-capacity pages, mirroring the ruled notebook from the original method. Pages fill up, close, and cycle automatically.
- **Dismiss mechanic** — Batch-dismiss all active tasks on a full page, preserving them in the log for review rather than deleting them permanently.
- **Gesture-driven navigation** — Swipe between pages with spring physics and rubber-band edge effects. Swipe down in the task editor to save and close.
- **Smart suggestions** — As you type a new task, the app fuzzy-matches against completed and dismissed history, surfacing recurring tasks and warning you if you're re-adding something you previously dismissed.
- **Completion log** — A timeline view of finished tasks grouped by day and filterable by month/year, styled after Daygram.
- **Customizable settings** — Adjust items per page and font size with auto-save. Reset all data when needed.

## Tech Stack

| Technology | Purpose |
|:---|:---|
| React Native + Expo 54 | Cross-platform mobile framework |
| TypeScript | Type safety |
| AsyncStorage | Local data persistence |
| React Navigation (Stack) | Screen routing with fade transitions |
| Animated + PanResponder | Gesture-driven page swiping |

## Project Structure

```
autofocus-app/
├── App.tsx                        # Root component
├── src/
│   ├── types.ts                   # Task type definitions
│   ├── theme.ts                   # Theme configuration
│   ├── context/TaskContext.tsx     # Core state management
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Main view: paginated tasks + navigation
│   │   ├── LogPage.tsx            # Completion log
│   │   └── SettingsScreen.tsx     # Settings
│   └── components/
│       ├── Pager.tsx              # Gesture-based page swiper
│       ├── TaskItem.tsx           # Task row component
│       ├── TaskModal.tsx          # Task create/edit modal
│       └── SuggestionInput.tsx    # Autocomplete input
```

## Getting Started

```bash
git clone https://github.com/[username]/autofocus-app.git
cd autofocus-app
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your device to run it.
