# everythingList — Architecture

> The technical blueprint for evolving everythingList from a single-device iOS app into a synced, multi-platform personal tool.

---

## 1. High-Level Vision

```
                    ┌─────────────────────┐
                    │     Firestore       │
                    │  (source of truth)  │
                    └────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐  ┌───▼──────┐  ┌────▼──────┐
     │  iOS (Expo)   │  │   Web    │  │  Future   │
     │  Mobile App   │  │   App    │  │ (macOS?)  │
     └───────────────┘  └──────────┘  └───────────┘
```

- **Firestore** is the central data store and sync engine.
- **Each client** keeps a local cache (AsyncStorage on mobile, localStorage/IndexedDB on web) for offline-first behavior.
- Clients are **separate codebases** optimized for their platform, sharing types and data logic via a common package.

---

## 2. Monorepo Structure

```
everythingList/
├── packages/
│   └── shared/                  ← Shared across all apps
│       ├── types.ts             ← Task, TaskStatus, Settings types
│       ├── firestore.ts         ← Firestore read/write/listen functions
│       ├── sync.ts              ← Offline-first sync engine
│       └── logic.ts             ← Business rules (pagination, dismiss, suggestions)
│
├── apps/
│   ├── mobile/                  ← Current React Native + Expo app (renamed)
│   │   ├── App.tsx
│   │   ├── src/
│   │   │   ├── context/TaskContext.tsx   ← Uses shared/ for data, keeps UI state local
│   │   │   ├── screens/
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── web/                     ← New React web app
│       ├── src/
│       │   ├── context/TaskContext.tsx   ← Same data contract, web-native UI state
│       │   ├── pages/
│       │   └── components/
│       └── package.json
│
├── package.json                 ← Workspace root
└── firebase.json                ← Firebase project config
```

### Why separate apps instead of React Native Web?
- The mobile app is heavily gesture-driven (PanResponder, spring physics). However, you noted that these gestures are not smooth enough on iOS.
- **Pivot:** We are now prioritizing the **Web App** as the primary experience. It will focus on clicks and keyboard interactions, providing a more reliable and responsive feel than the gesture-heavy mobile app.
- The iOS app remains part of the ecosystem but will serve as a secondary/companion client.
- Shared logic (via `packages/shared/`) remains critical to ensure consistency between the new Web App and the existing Mobile App.

---

## 3. Firestore Collection Design

### Collections

```
users/{userId}/
├── tasks/{taskId}
│   ├── text: string
│   ├── status: "active" | "completed" | "dismissed"
│   ├── pageIndex: number
│   ├── details?: string
│   ├── createdAt: Timestamp
│   ├── completedAt?: Timestamp
│   ├── dismissedAt?: Timestamp
│   └── updatedAt: Timestamp          ← For sync conflict resolution
│
└── settings (single doc)
    ├── pageSize: number
    ├── fontSize: number
    └── updatedAt: Timestamp
```

### Why this structure?
- **`users/{userId}/`** — even though MVP is single-user, nesting under a user ID means multi-user support later requires zero migration. For MVP, you can use a hardcoded userId or anonymous auth.
- **Tasks as individual documents** — allows granular sync (only changed tasks are transferred, not the whole list).
- **Settings as a single document** — simple, rarely changes, no need for sub-collections.
- **`updatedAt` on every document** — the sync engine uses this for conflict resolution (last-write-wins for MVP).

---

## 4. Offline-First Sync Strategy

### How it works:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  User Action │ ──────► │  Local Cache │ ──────► │  Firestore   │
│  (tap, type) │         │  (immediate) │  async  │  (background)│
└──────────────┘         └──────────────┘         └──────────────┘
                                ▲                        │
                                │    realtime listener   │
                                └────────────────────────┘
```

1. **Write locally first** — every action (add, complete, dismiss, edit) writes to AsyncStorage / localStorage immediately. The UI updates instantly.
2. **Push to Firestore** — in the background, the sync engine writes the change to Firestore. If offline, it queues the write.
3. **Listen for remote changes** — a Firestore `onSnapshot` listener pushes changes from other devices into the local cache.
4. **Conflict resolution** — `updatedAt` timestamp wins (last-write-wins). For MVP this is fine since you're the only user.

### Firestore's built-in offline support:
- The Firestore SDK already caches data locally and replays writes when connectivity returns.
- On mobile, `firebase/firestore` with persistence enabled handles most of this automatically.
- On web, Firestore has `enableIndexedDbPersistence()` for the same effect.

### What this means in practice:
- **No internet?** App works normally. Changes sync when you're back online.
- **Open on phone and laptop?** Both see updates within seconds via Firestore listeners.

---

## 5. Shared Package (`packages/shared/`)

### `types.ts`
Exact same types used everywhere:
```ts
type TaskStatus = 'active' | 'completed' | 'dismissed';

interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  pageIndex: number;
  details?: string;
  createdAt: number;
  completedAt?: number;
  dismissedAt?: number;
  updatedAt: number;      // ← new field for sync
}

interface Settings {
  pageSize: number;
  fontSize: number;
  updatedAt: number;
}
```

### `firestore.ts`
CRUD operations against Firestore:
- `fetchTasks(userId)` — initial load
- `subscribeTasks(userId, callback)` — real-time listener
- `upsertTask(userId, task)` — create or update
- `deleteTask(userId, taskId)`
- `fetchSettings(userId)` / `upsertSettings(userId, settings)`

### `logic.ts`
Pure functions (no I/O), extracted from current `TaskContext`:
- `paginateTasks(tasks, pageSize)` — split flat task array into pages
- `getPageStatus(tasks, pageIndex)` — is page full? has active tasks?
- `getSuggestions(text, allTasks)` — fuzzy match for autocomplete
- `checkDismissedWarning(text, allTasks)` — detect re-adding dismissed tasks

### `sync.ts`
Sync engine:
- Merges remote changes into local state
- Queues local writes for upload
- Resolves conflicts via `updatedAt`

---

## 6. Changes to Current Mobile App

The current app stays mostly the same. Key changes:

| Area | Current | After |
|:--|:--|:--|
| **Data source** | AsyncStorage only | AsyncStorage as cache + Firestore sync |
| **TaskContext** | Contains business logic + persistence | Delegates to `shared/` for logic and data |
| **Task type** | No `updatedAt` | Add `updatedAt` field |
| **Firebase SDK** | Not installed | Add `@react-native-firebase/app` + `@react-native-firebase/firestore` |
| **Auth** | None | Anonymous auth (upgradeable to real auth later) |
| **Gestures, UI, screens** | No change | **No change** |

### Migration path for existing data:
- On first launch after update, read all tasks from AsyncStorage, add `updatedAt` timestamps, push to Firestore, continue as normal.

---

## 7. Web App Design

### Framework: **Vite + React** (simpler than Next.js for an SPA with no SEO needs)

### Pages (same as mobile, different UI):

| Page | Mobile Equivalent | Web Interaction |
|:--|:--|:--|
| Task List | HomeScreen | Click to navigate pages, click checkboxes, click to expand |
| Task Editor | TaskModal | Inline panel or modal, no swipe—just click "Save" / "Cancel" |
| Log | LogPage | Same timeline view, click filters |
| Settings | SettingsScreen | Same form, auto-save |

### What changes for web:
- **No PanResponder / Animated** — use CSS transitions and click handlers
- **Page navigation** — arrow buttons or keyboard shortcuts (← →) instead of swipe
- **Task editor** — modal or side panel, standard form buttons instead of swipe-to-dismiss
- **Same retro aesthetic** — Courier + Georgia fonts, `#f1f0ec` background, sharp corners. All translates directly to CSS.

---

## 8. MVP Scope (Revised)

### Phase 1: Web App Implementation (PRIORITY)
- [ ] Scaffold Vite + React app
- [ ] Import shared package (or move current logic to shared first)
- [ ] Build Task List page (click-based, no gestures)
- [ ] Build Task Editor (modal or inline)
- [ ] Build Log page
- [ ] Build Settings page
- [ ] Apply retro theme via CSS
- [ ] Test cross-device data consistency

### Phase 2: Firestore + Shared Logic
- [ ] Set up Firebase project
- [ ] Extract shared types + logic from current `TaskContext`
- [ ] Implement Firestore sync in the Web App
- [ ] Add Firestore sync to the Mobile App (legacy/companion)
- [ ] Migration path for existing AsyncStorage/Export data

### Phase 3: Polish & Deploy
- [ ] Real authentication (Google / Apple sign-in)
- [ ] Deploy web app (Vercel / Firebase Hosting)
- [ ] Standalone mobile build (optional)

---

## 9. Auth Strategy

### MVP: Anonymous Auth
- Firebase Anonymous Authentication gives you a `userId` with zero UI.
- Data is stored under `users/{anonId}/`.
- Works immediately, no sign-in screen needed.

### Later: Upgrade to Real Auth
- Firebase lets you link an anonymous account to a Google/Apple account without losing data.
- When you add multi-user support, just add a sign-in screen and the migration is seamless.

---

## 10. Open Questions

These don't need answers now, but will matter later:

1. **Shared task lists** — if other users join, do they get their own independent lists, or can users share/collaborate on a list?
2. **Data limits** — Firestore free tier allows 1GB storage and 50K reads/day. Plenty for personal use, but worth monitoring if you go public.
3. **Web deployment** — Firebase Hosting (free, same ecosystem) or Vercel (better DX for React apps)?
4. **macOS app** — Electron wrapper around the web app? Or a native SwiftUI app? (Lowest priority.)
