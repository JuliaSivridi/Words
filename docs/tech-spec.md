# Words PWA — Technical Specification

**Version:** 1.0 · **Stack:** React 18 + Vite + Google Sheets API · **Repo:** JuliaSivridi/Words_PWA

---

## 1. Overview

Words is a client-side PWA for vocabulary learning. Users store words in their own Google Sheets file (`db_words`) and study them through three exercise modes with spaced-repetition-style counters.

**Key design decisions:**

- **No backend.** All data lives in the user's Google Drive. Zero infrastructure cost, zero data privacy concerns.
- **Google Sheets as database.** Each language is a separate tab; columns D–G store counters and learned status. Human-readable, user-editable without the app.
- **Settings stored per-sheet.** The `_settings` tab in `db_words` syncs language, category, and all mode settings across devices.
- **Counter-based progression, not time-based.** A word advances through three modes by successfully completing exercises, not by waiting intervals.
- **Explicit learned flag takes precedence.** `word.learned = TRUE` always wins over counter values — marking a word from the word list immediately hides it from sessions.

---

## 2. Tech Stack

| Layer | Library | Version | Note |
|---|---|---|---|
| UI framework | React | 18.3.1 | Function components + hooks only |
| Bundler | Vite | 6.0.5 | Dev server port 3000 |
| React plugin | @vitejs/plugin-react | 4.3.4 | |
| Routing | react-router-dom | 6.28.0 | BrowserRouter, v6 Routes/Route |
| Auth | Google Identity Services | CDN | `accounts.google.com/gsi/client` |
| Database | Google Sheets API v4 | REST | Direct browser fetch, no SDK |
| File discovery | Google Drive API v3 | REST | Metadata-only scope |
| Styling | CSS Modules + CSS variables | — | Light/dark auto via `prefers-color-scheme` |
| PWA | Service Worker + Web Manifest | — | Cache-first for assets, network-only for APIs |
| External scripts | GIS client | CDN | Loaded async in `index.html` |

No state management library (Redux, Zustand, etc.) — all state lives in `App.jsx` and is passed as props.

---

## 3. Architecture

### Pattern

Flat prop-drilling from a single App shell. No context, no global store. `App.jsx` owns all cross-screen state; screens are stateless display + local UI state.

### Data Flow

```
Google Drive API
  └─ findOrCreateWordsFile() ──► sheetId (cached localStorage)
       └─ getSheetFileName()  ──► sheetName (display only)

Google Sheets API
  └─ getWords(sheetId, tab)   ──► words[]  ──► useWords hook ──► App.jsx state
  └─ readSettings(sheetId)    ──► modeSettings, currentLang, sessionCategory

App.jsx state
  ├─ words[]         ──► SessionScreen, WordListScreen, CategoryScreen
  ├─ modeSettings    ──► SessionScreen, SettingsScreen
  ├─ currentLang     ──► tab name for all Sheets API calls
  └─ sessionCategory ──► filter for session + word list

SessionScreen
  ├─ buildSession(words, categoryFilter, settings) ──► steps[]
  ├─ incrementCounter() ──► pendingUpdates Map<row, {m1,m2,m3,learned}>
  └─ handleNext() at last step
       ├─ saveSessionUpdates(updates) ──► batchUpdateWords (D:F only)
       └─ learnedWords.map(w ──► markLearned(w.row, true))

WordListScreen
  └─ onToggleLearned(word)
       ├─ word.learned → resetWord(row)  ──► resetWordCounters (D:G = 0,0,0,FALSE)
       └─ !word.learned → setLearned(row, true) ──► markLearned (G = TRUE)
```

### Write Path (session end)

1. Session accumulates counter increments in `pendingUpdates` (in-memory Map).
2. At final step: `batchUpdateWords` writes **D:F** (counters only) for all changed rows in one API call.
3. For any word where `learned = true` in the update: `markLearned(row, true)` writes **G** separately.
4. `setWords` merges updates into local React state (no re-fetch needed).

### Read Path (app load)

1. `findOrCreateWordsFile()` checks `localStorage.words_sheet_id`; if missing, searches Drive for `name='db_words'` (with one 2.5s retry for indexing lag), then creates if not found.
2. `readSettings(sheetId)` → applies language, category, modeSettings to App state.
3. `useWords` hook calls `getWords(sheetId, tab)` → populates `words[]` state.
4. All subsequent renders read from in-memory React state only.

### Error Handling

- All Sheets/Drive API calls go through `request()` which throws on non-2xx. The `refreshTokenIfNeeded()` is called before every request (silent re-auth if token expires in < 30s).
- `findOrCreateWordsFile` `.catch(() => setSheetId(null))` — shows the loading screen.
- `readSettings` wrapped in try/catch — failure keeps localStorage values.
- `saveSessionUpdates` has no error UI (silent fail; data is preserved in the open sheet).

---

## 4. Package / Folder Structure

```
Words/
├── public/
│   ├── manifest.json         PWA metadata (name, icons, theme_color)
│   ├── sw.js                 Service worker (cache strategies)
│   └── icons/
│       ├── icon-192.png      PWA icon (any maskable)
│       └── icon-512.png      PWA icon (any maskable)
├── src/
│   ├── main.jsx              React root, BrowserRouter, SW registration
│   ├── App.jsx               App shell: all cross-screen state + routing
│   ├── auth.js               GIS token client, silent sign-in, token refresh
│   ├── sheetsApi.js          All Drive + Sheets API calls
│   ├── settingsUtils.js      isWordLearned(), isWordEligibleForMode(), DEFAULT_SETTINGS
│   ├── constants.js          M1_MAX=4, M2_MAX=8, M3_MAX=12, TOTAL_REPS=24
│   ├── langMap.js            ISO 639 language code → name lookup, tab label parser
│   ├── theme.css             CSS variables (light/dark), global button/layout classes
│   ├── hooks/
│   │   ├── useWords.js       Fetch + mutate words; exposes saveSessionUpdates, setLearned, resetWord
│   │   └── useSession.js     buildSession() algorithm (pure function, no React state)
│   ├── screens/
│   │   ├── LoginScreen.jsx           Sign-in with Google popup
│   │   ├── HomeScreen.jsx            Main hub with Start/Language/Category/Word List buttons
│   │   ├── LanguageScreen.jsx        Tab picker; "Reconnect" button on empty state
│   │   ├── CategoryScreen.jsx        Category filter toggles
│   │   ├── SessionScreen.jsx         Session orchestration (progress, steps, save)
│   │   ├── WordListScreen.jsx        Scrollable word list with learned toggle
│   │   └── SettingsScreen.jsx        Spreadsheet picker + mode settings + reset
│   └── components/
│       ├── FlipCard.jsx              Mode 1: flip card with swipe/tap gesture
│       ├── MultipleChoice.jsx        Mode 2: 4-choice grid
│       ├── MatchingGrid.jsx          Mode 3: 6-pair matching grid
│       ├── NextButton.jsx            Shared "Next →" primary button
│       ├── CheckIcon.jsx             SVG checkmark (Lucide style)
│       ├── Toast.jsx                 Auto-dismiss notification (2.5s + 300ms fade)
│       └── FilterDialog.jsx          Category filter modal (not currently wired to routing)
├── docs/
│   ├── tech-spec.md          This document
│   ├── tech-spec.html        HTML version of this spec
│   └── tech-spec-example.css Print-ready CSS for HTML spec
├── index.html                HTML shell, GIS CDN script, viewport meta
├── vite.config.js            Vite config (React plugin, port 3000)
└── package.json              Dependencies (React 18, Vite 6, react-router-dom 6)
```

---

## 5. Data Model

### Word

Returned by `getWords()`, maintained in `useWords` state.

| Field | Type | Source | Description |
|---|---|---|---|
| `row` | `number` | computed | 1-based sheet row number (stable identifier) |
| `category` | `string` | col A | Topic/category tag; empty string if blank |
| `word` | `string` | col B | Word in the study language |
| `translation` | `string` | col C | Word in the native language |
| `m1` | `number` | col D | Mode 1 (FlipCard) repetition count, 0–m1Max |
| `m2` | `number` | col E | Mode 2 (MultipleChoice) repetition count, 0–m2Max |
| `m3` | `number` | col F | Mode 3 (MatchingGrid) repetition count, 0–m3Max |
| `learned` | `boolean` | col G | TRUE if manually or auto-marked as learned |

> **Note:** `row` is computed from the sheet position *before* filtering, so blank rows in the middle of the sheet do not shift subsequent row numbers.

### Settings

Held in `App.jsx` state as `modeSettings`; synced to/from the `_settings` sheet tab.

| Field | Type | Default | Description |
|---|---|---|---|
| `mode1` | `boolean` | `true` | FlipCard mode enabled |
| `mode2` | `boolean` | `true` | MultipleChoice mode enabled |
| `mode3` | `boolean` | `true` | MatchingGrid mode enabled |
| `stepsPerSession` | `number` | `12` | Total exercises per session |
| `m1Max` | `number` | `4` | FlipCard repetitions to graduate a word |
| `m2Max` | `number` | `8` | MultipleChoice repetitions to graduate a word |
| `m3Max` | `number` | `12` | MatchingGrid repetitions to graduate a word |

### Session Step (Mode 1)

```typescript
{ mode: 1, word: Word }
```

### Session Step (Mode 2)

```typescript
{ mode: 2, word: Word, choices: Word[] }  // choices: 4 items (correct + 3 wrong)
```

### Session Step (Mode 3)

```typescript
{
  mode: 3,
  words: Word[],                       // 6 words
  leftCards:  Array<{ row, text }>,    // shuffled word texts
  rightCards: Array<{ row, text }>,    // shuffled translation texts
}
```

### User Profile

Stored as JSON in `localStorage.words_user`.

```typescript
{ email: string, name: string, picture: string }
```

---

## 6. Database / Storage Schema

### Google Sheets file: `db_words`

Located in the user's Google Drive. Created automatically if not found.

#### Language tabs (e.g., `RU-EN`, `RUS-FIN`)

Tab name format: `NATIVE-STUDY` (e.g., `RU-EN` means native=Russian, study=English).

| Column | Field | Type | Format |
|---|---|---|---|
| A | category | string | Free text; empty = uncategorized |
| B | word | string | Word in study language |
| C | translation | string | Word in native language |
| D | m1 | number | Integer `0`–`m1Max`; empty cell parsed as `0` |
| E | m2 | number | Integer `0`–`m2Max`; empty cell parsed as `0` |
| F | m3 | number | Integer `0`–`m3Max`; empty cell parsed as `0` |
| G | learned | string | Literal `TRUE` or `FALSE` |

**Header detection:** If cell B1 equals `"word"` (case-insensitive), row 1 is skipped as a header; row numbering starts at 2. Otherwise all rows are data starting at row 1.

**Write rules:**
- `batchUpdateWords` writes **D:F only** (counters). Column G is never set to FALSE by session logic.
- `markLearned` writes **G only** (learned flag), called explicitly when a word completes all modes or is manually toggled.
- `resetWordCounters` writes **D:G** all zeros + `FALSE` (only from the word list un-learn action).

#### `_settings` tab

Key-value format. Backward-compatible: if A1 = `"language"`, parsed as key-value; otherwise treated as legacy positional format (A1=language value, A2=category value).

| Row | Column A (key) | Column B (value) |
|---|---|---|
| 1 | `language` | Tab name, e.g. `RU-EN`; empty = not set |
| 2 | `category` | Comma-separated categories, e.g. `Animals,Food`; empty = all |
| 3 | `mode1` | `TRUE` or `FALSE` |
| 4 | `mode2` | `TRUE` or `FALSE` |
| 5 | `mode3` | `TRUE` or `FALSE` |
| 6 | `stepsPerSession` | Integer or empty (use default) |
| 7 | `m1Max` | Integer or empty (use default) |
| 8 | `m2Max` | Integer or empty (use default) |
| 9 | `m3Max` | Integer or empty (use default) |

### localStorage keys

| Key | Type | Content | Cleared when |
|---|---|---|---|
| `words_user` | JSON | `{email, name, picture}` | Sign out |
| `words_sheet_id` | string | Spreadsheet file ID | Sign out / Reconnect |
| `words_sheet_name` | string | Display name of spreadsheet | Sign out |
| `words_lang` | string | Active language tab, e.g. `RU-EN` | Sign out / Sheet change |
| `words_category` | JSON | `string[] | null` | Sign out / Sheet change |

---

## 7. Authentication & First-Launch Setup

### OAuth scopes

```
email
profile
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.metadata.readonly
```

### First-launch flow

```
App loads
  │
  ├─ initAuth()  ← polls window.google.accounts every 100ms until ready
  │    └─ trySilentSignIn() ← requestAccessToken({ prompt: '' })
  │         ├─ Success → user already authorized → setUser()
  │         └─ Fail    → LoginScreen shown
  │
  ├─ User clicks "Sign in with Google"
  │    └─ signInWithPopup() ← requestAccessToken({ prompt: 'consent' })
  │         └─ Popup: user grants scopes → callback fires with access_token
  │
  └─ onAuthChange listeners notified → App.jsx setUser()
```

### Token lifecycle

- `accessToken` stored in module-scope variable in `auth.js` (memory only, not persisted).
- `tokenExpiresAt` = `Date.now() + expires_in * 1000`.
- Before every API call: `refreshTokenIfNeeded()` checks if token expires within 30s. If so, calls `trySilentSignIn()` again (no UI shown).
- On sign-out: `accessToken` cleared; `words_user`, `words_sheet_id`, `words_sheet_name`, `words_lang` cleared from localStorage.

### Post-login sheet discovery

1. Check `localStorage.words_sheet_id` — if present, use immediately.
2. If not: Drive search for `name='db_words' AND mimeType='application/vnd.google-apps.spreadsheet' AND trashed=false`.
3. If empty results: **wait 2.5 s** and retry once (Drive search can lag for newly created files).
4. If still empty: create new spreadsheet named `db_words` via Sheets API.
5. Store resulting ID in `localStorage.words_sheet_id`.
6. Fetch display name via `GET /drive/v3/files/{id}?fields=name`, store in `localStorage.words_sheet_name`.
7. Read `_settings` tab → apply language, category, mode settings.

---

## 8. Synchronization / API Layer

All API calls are direct browser `fetch` requests — no SDK, no service worker proxy.

### Request wrapper (`sheetsApi.request()`)

```
async request(url, options):
  await refreshTokenIfNeeded()
  token = getAccessToken()
  res = fetch(url, { ...options, headers: { Authorization: Bearer token, ... } })
  if !res.ok → throw Error("API error {status}: {body}")
  return res.json()
```

### Key API calls

| Function | Method | Endpoint | Writes |
|---|---|---|---|
| `findOrCreateWordsFile` | GET → POST | `/drive/v3/files?q=...` → `/spreadsheets` | Spreadsheet if new |
| `listUserSheets` | GET | `/drive/v3/files?q=mimeType=sheets&orderBy=modifiedTime+desc` | — |
| `getSheetFileName` | GET | `/drive/v3/files/{id}?fields=name` | — |
| `getLanguageTabs` | GET | `/spreadsheets/{id}?fields=sheets.properties.title` | — |
| `getWords` | GET | `/spreadsheets/{id}/values/{tab}!A1:G` | — |
| `batchUpdateWords` | POST | `/spreadsheets/{id}/values:batchUpdate` | D:F per changed row |
| `markLearned` | PUT | `/spreadsheets/{id}/values/{tab}!G{row}` | G for one row |
| `resetWordCounters` | PUT | `/spreadsheets/{id}/values/{tab}!D{row}:G{row}` | D:G for one row |
| `readSettings` | GET | `/spreadsheets/{id}/values/_settings!A1:B10` | — |
| `writeSettings` | PUT | `/spreadsheets/{id}/values/_settings!A1:B9` | A1:B9 of _settings |
| `ensureSettingsTab` | GET → POST | `/spreadsheets/{id}:batchUpdate` | Adds _settings sheet if missing |

### Offline behaviour

The service worker caches the app shell (HTML, JS, CSS, icons) for offline access. All Google API calls are **network-only** and will fail offline. There is no offline queue or local write buffer beyond the in-session `pendingUpdates` Map.

### Retry logic

Only `findOrCreateWordsFile` has an explicit retry (2.5s delay on empty Drive search). All other calls fail immediately with a thrown error.

---

## 9. Screens / Pages

### LoginScreen

**Route:** Shown before routing (no URL)  
**Props:** `{ onLogin: () => void }`  
**State:** `loading`, `error`  
**Renders:** Centered card with app logo, tagline, Google sign-in button.  
**Flow:** `signInWithPopup()` → on success, `onLogin()` → App sets user state.

---

### HomeScreen

**Route:** `/`  
**Props:** `{ sheetId, currentLang, currentCategory, onSignOut }`  
**State:** None  
**Renders:**
- Top bar: settings gear icon (→ `/settings`), user avatar.
- Language label (tap → `/language`).
- Category label or "All categories" (tap → `/category`).
- **Start** button → `/session` (disabled if `!sheetId || !currentLang`).
- **Word List** button → `/words` (same guard).

---

### LanguageScreen

**Route:** `/language`  
**Props:** `{ sheetId, currentLang, onSelect, onReconnect }`  
**State:** `tabs[]`, `loading`, `error`  
**Effect:** `getLanguageTabs(sheetId)` on mount. Filtered: removes `Sheet1`, `Лист1`, `_settings`.  
**Renders:** List of tab names with checkmark on selected; "Reconnect to sheet" button if `tabs.length === 0`.  
**On select:** `onSelect(tab)` → writes settings to sheet → `navigate('/')`.

---

### CategoryScreen

**Route:** `/category`  
**Guard:** `sheetId && currentLang`  
**Props:** `{ words, currentCategory, onSelect }`  
**State:** `selected` (`Set<string>`)  
**Derives:** Unique categories from `words[]`, sorted alphabetically.  
**Renders:** "All categories" row (radio-style), then each category. Toggles update local set; "Apply" calls `onSelect(arr | null)`.

---

### SessionScreen

**Route:** `/session`  
**Guard:** `sheetId && currentLang`  
**Props:** `{ sheetId, tab, words, categoryFilter, settings, onSessionComplete }`  
**State:** `session` (steps array), `stepIndex`, `done`, `allLearned`  
**Local ref:** `pendingUpdates: Map<row, {m1,m2,m3,learned}>`, `sessionBuilt: boolean`

**Flow:**
1. On first `words` load: `buildSession(words, categoryFilter, settings)`.
   - If `allLearned` or no steps → show "All words learned" screen.
2. Render current step via `FlipCard` / `MultipleChoice` / `MatchingGrid`.
3. On "Next": `incrementCounter(step)` → update `pendingUpdates` → advance step index.
4. At final step: collect `pendingUpdates` → `onSessionComplete(updates)` → show "Session complete".
5. "Learned" button during session: `handleLearn(row)` → immediate `markLearned` call + set `pendingUpdates[row].learned = true`.

**Progress bar:** `stepIndex / stepsPerSession * 100%`.

---

### WordListScreen

**Route:** `/words`  
**Guard:** `sheetId && currentLang`  
**Props:** `{ words, loading, categoryFilter, onToggleLearned }`  
**State:** None  
**Renders:**
- Sticky header: learned count / total filtered count.
- Scrollable list — each row: word + translation, progress bar (total reps / max reps), toggle icon.
- Toggle icon: eye = active, crossed-eye = learned.
- Learned → `resetWord(row)` (clears all counters + flag). Active → `setLearned(row, true)`.

---

### SettingsScreen

**Route:** `/settings`  
**Props:** `{ settings, onChange, sheetId, sheetName, onChangeSheet }`  
**State:** `toast`, `pickerOpen`, `pickerFiles[]`, `pickerLoading`

**Sections:**

1. **Spreadsheet** — Current file name + "Change" button. On click: `listUserSheets()` → inline dropdown of all user's sheets with checkmark on current. On select: `onChangeSheet(id, name)` → language + category cleared.
2. **Session** — `stepsPerSession` number input (blur validation: reset to 12 if empty/≤0).
3. **Learning modes** — Three rows: `[checkbox] Flash-cards / Choice / Match | Max [input]`. At least one mode must stay checked (toast if last one deselected).
4. **Reset to defaults** — Restores `DEFAULT_SETTINGS` only; does not touch word progress.

---

## 10. Key Components

### FlipCard

**File:** `src/components/FlipCard.jsx`  
**Props:** `{ step, onNext, onLearn }`  
**State:** `flipped`, `hasFlipped`, `markedLearned`, `touchStartY`

**Layout:** Vertical flex. Top: "Learn and hide" button. Middle: 3D flip container (front = word, back = translation). Bottom: Next button.

**Flip triggers:**
- Click or tap anywhere on the card.
- Vertical swipe: `touchstart` saves Y; `touchend` flips if |ΔY| > 50px.
- Keyboard: `Enter` or `Space`.

**Next enabled when:** `hasFlipped || markedLearned`.  
**"Learn and hide":** Sets `markedLearned = true`, calls `onLearn()` (immediate save), disables flip.

---

### MultipleChoice

**File:** `src/components/MultipleChoice.jsx`  
**Props:** `{ step, onNext, onLearn }`  
**State:** `selected` (row id), `correct` (boolean), `markedLearned`

**Layout:** Top half: word card + "Learn and hide". Bottom half: 2×2 grid of 4 choice buttons.

**Choice tap logic:**
- `choice.row === step.word.row` → correct (green, all others disabled).
- Wrong choice → red flash only; remains active.

**Next enabled when:** `correct || markedLearned`.

---

### MatchingGrid

**File:** `src/components/MatchingGrid.jsx`  
**Props:** `{ step, onNext }`  
**State:** `matched: Set<row>`, `selected: {side, row} | null`, `wrongLeft: row | null`, `wrongRight: row | null`

**Layout:** Two columns side-by-side: 6 word cards (left), 6 translation cards (right). Cards are independently shuffled.

**Tap logic:**
```
tap(card, side):
  if card.row in matched → ignore
  if selected == null → select card
  if selected.side == side → replace selection with new card
  if selected.side != side:
    if selected.row == card.row:
      add to matched; clear selection
    else:
      flash wrong (500ms on both cards); clear selection
```

**Next enabled when:** `matched.size === 6`.  
**No "Learn and hide" button** in mode 3.

---

### Toast

**File:** `src/components/Toast.jsx`  
**Props:** `{ message, onDone }`  
**Behaviour:** Fixed-position at bottom center. Shows for 2.5s, then fades out over 300ms, then calls `onDone()`. Only one toast at a time (controlled by parent state).

---

### NextButton

**File:** `src/components/NextButton.jsx`  
**Props:** `{ onClick, disabled, label? }` (default label: `"Next →"`)  
**Renders:** Full-width `btn btn-primary` button, always visible, disabled until step is complete.

---

## 11. Theme & Colors

Defined in `src/theme.css` as CSS custom properties on `:root` with a `@media (prefers-color-scheme: dark)` override.

| Variable | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#1C1C1C` | Page background |
| `--surface` | `#F3F1EF` | `#363636` | Cards, list rows |
| `--surface-2` | `#E8E8E8` | `#424242` | Hover state, secondary surfaces |
| `--text` | `#1C1C1C` | `#EFEFEF` | Primary text |
| `--text-muted` | `#6B6B6B` | `#949494` | Secondary text, labels |
| `--accent` | `#E07E38` | `#E8935A` | Buttons, active states, links |
| `--accent-hover` | `#C96E2F` | `#D4804A` | Button hover |
| `--accent-text` | `#FFFFFF` | `#FFFFFF` | Text on accent buttons |
| `--success` | `#6BBF7A` | `#5AA569` | Correct answer, learned state |
| `--error` | `#E07070` | `#C96060` | Wrong answer flash |
| `--border` | `#E0E0E0` | `#4A4A4A` | Dividers, input borders |
| `--card-bg` | `#FFFFFF` | `#363636` | Card background |
| `--card-shadow` | `0 2px 12px rgba(0,0,0,0.08)` | `0 2px 12px rgba(0,0,0,0.3)` | Card elevation |
| `--radius` | `14px` | `14px` | Default border radius |
| `--radius-sm` | `8px` | `8px` | Small elements radius |

**Global utility classes:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-full`, `.screen`, `.screen-content`, `.card`, `.top-bar`, `.top-bar-title`, `.text-muted`, `.text-accent`, `.mt-auto`.

**Animations:** `@keyframes flash-red`, `flash-green`, `fade-in`.

**Minimum font size:** `16px` (`html { font-size: 16px }`).

---

## 12. Navigation

### Routes

| Path | Guard | Component |
|---|---|---|
| `/` | user logged in | HomeScreen |
| `/settings` | user logged in | SettingsScreen |
| `/language` | user logged in | LanguageScreen |
| `/session` | `sheetId && currentLang` | SessionScreen |
| `/words` | `sheetId && currentLang` | WordListScreen |
| `/category` | `sheetId && currentLang` | CategoryScreen |
| `*` | — | `<Navigate to="/" replace>` |

Guards are implemented via `<Navigate to="/" replace />` inside the route element, not via a wrapper component.

No deep-link support (all routes require an authenticated session in memory).

---

## 13. Loading & Empty States

| Screen | Loading | Empty |
|---|---|---|
| App init | Full-screen centered "Loading…" text | — |
| LanguageScreen | "Loading…" centered text | "No language sheets found" + "Reconnect to sheet" button |
| WordListScreen | Passed via `loading` prop; shows skeleton or spinner | Implicit (filtered list is empty) |
| SessionScreen | "Loading session…" centered text | "All words learned! 🎉" screen |
| SettingsScreen file picker | "Loading your sheets…" text in picker dropdown | "No Google Sheets found in your Drive." |

No shimmer / skeleton animations currently — loading states use plain text.

---

## 14. CI/CD & Build

No CI/CD pipeline is configured. Manual workflow:

```
npm run dev    # Vite dev server on port 3000 (HMR)
npm run build  # Production build → /dist
npm run preview  # Preview /dist locally
```

**Deployment:** Push `/dist` to any static host (Vercel, Netlify, GitHub Pages). No server-side rendering, no environment secrets at runtime — only `VITE_GOOGLE_CLIENT_ID` is embedded at build time.

**Required env var:**
```
VITE_GOOGLE_CLIENT_ID=<Google OAuth 2.0 Web Client ID>
```

---

## 15. First-Time Setup (New Developer)

1. **Clone the repo** and run `npm install`.
2. Create a **Google Cloud project** at [console.cloud.google.com](https://console.cloud.google.com).
3. Enable **Google Sheets API** and **Google Drive API**.
4. Create an **OAuth 2.0 client ID** (type: Web application).
5. Add to "Authorized JavaScript origins": `http://localhost:3000`.
6. Add to "Authorized redirect URIs": `http://localhost:3000`.
7. Add your Google account as a **test user** (OAuth consent screen → Test users).
8. Copy the client ID into a `.env` file at the project root:
   ```
   VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
   ```
9. Run `npm run dev`.
10. Open the app, sign in. A `db_words` spreadsheet will be created in your Google Drive automatically.
11. In the spreadsheet: rename `Sheet1` to a language tab (e.g., `RU-EN`) and add rows: `category | word | translation`.
12. Return to the app → Language → select your tab → Start.

---

## 16. Key Algorithms

### isWordLearned

```
function isWordLearned(word, settings):
  if word.learned == true:
    return true                    // Explicit flag always wins

  m1Max = settings.m1Max ?? 4
  m2Max = settings.m2Max ?? 8
  m3Max = settings.m3Max ?? 12

  if settings.mode1 AND word.m1 < m1Max: return false
  if settings.mode2 AND word.m2 < m2Max: return false
  if settings.mode3 AND word.m3 < m3Max: return false
  return true                      // All active modes are maxed
```

### isWordEligibleForMode

```
function isWordEligibleForMode(word, modeNum, settings):
  m1Max = settings.m1Max ?? 4
  m2Max = settings.m2Max ?? 8
  m3Max = settings.m3Max ?? 12

  if modeNum == 1:
    return settings.mode1 AND word.m1 < m1Max

  if modeNum == 2:
    return settings.mode2
       AND word.m2 < m2Max
       AND (NOT settings.mode1 OR word.m1 >= m1Max)   // mode1 must be done first

  if modeNum == 3:
    return settings.mode3
       AND word.m3 < m3Max
       AND (NOT settings.mode2 OR word.m2 >= m2Max)   // mode2 must be done first
       AND (NOT settings.mode1 OR word.m1 >= m1Max)   // mode1 must be done first
```

### buildSession

```
function buildSession(words, categoryFilter, settings):
  // 1. Filter by category
  filtered = categoryFilter ? words.filter(w => w.category in categoryFilter) : words

  // 2. Remove learned words
  active = filtered.filter(w => NOT isWordLearned(w, settings))

  // 3. Build mode pools
  mode1Pool = active.filter(w => isWordEligibleForMode(w, 1, settings))
  mode2Pool = active.filter(w => isWordEligibleForMode(w, 2, settings))

  // 4. Build mode3 pool with cross-category supplements
  mode3Qualified = active.filter(w => isWordEligibleForMode(w, 3, settings))
                         .sortBy(w.m3 ascending)

  if categoryFilter.length > 1:
    missingCats = categories with no words in mode3Qualified
    for each missingCat:
      slotsPerCat = ceil(6 / categoryFilter.length)
      supplements += active
        .filter(w => w.category == missingCat)
        .sortBy(w.m2 + w.m1 descending)
        .take(slotsPerCat)
  mode3Pool = mode3Qualified + supplements

  // 5. Slice mode3Pool into non-overlapping groups of 6
  mode3Groups = []
  i = 0
  while i + 6 <= mode3Pool.length:
    mode3Groups.push(mode3Pool[i .. i+6])
    i += 6

  // 6. Determine available modes
  availableModes = []
  if mode1Pool.length > 0:   availableModes.push(1)
  if mode2Pool.length > 0:   availableModes.push(2)
  if mode3Groups.length > 0: availableModes.push(3)

  if availableModes is empty:
    return { steps: [], allLearned: true }

  // 7. Plan: distribute TOTAL steps equally across modes
  TOTAL    = settings.stepsPerSession          // default 12
  perMode  = floor(TOTAL / availableModes.length)
  remainder = TOTAL mod availableModes.length
  plan = []
  for i, mode in enumerate(availableModes):
    count = perMode + (1 if i < remainder else 0)
    plan.extend([mode] * count)
  shuffle(plan)

  // 8. Generate steps
  mode1Queue = shuffle(mode1Pool); m1i = 0
  mode2Queue = shuffle(mode2Pool); m2i = 0
  m3i = 0
  steps = []

  for mode in plan:
    if mode == 1:
      word = mode1Queue[m1i % len(mode1Queue)]; m1i++
      steps.push({ mode: 1, word })

    if mode == 2:
      word = mode2Queue[m2i % len(mode2Queue)]; m2i++
      wrongPool = filtered.filter(w => w.row != word.row)
      if wrongPool.length < 3: wrongPool = words.filter(w => w.row != word.row)
      wrong = pickRandom(wrongPool, 3)
      steps.push({ mode: 2, word, choices: shuffle([word] + wrong) })

    if mode == 3:
      group = mode3Groups[m3i % len(mode3Groups)]; m3i++
      steps.push({
        mode: 3,
        words: group,
        leftCards:  shuffle(group.map(w => { row: w.row, text: w.word })),
        rightCards: shuffle(group.map(w => { row: w.row, text: w.translation })),
      })

  return { steps, allLearned: false }
```

### incrementCounter (SessionScreen)

```
function incrementCounter(step, pendingUpdates, words, settings):
  if step.mode == 1:
    state = pendingUpdates.get(step.word.row) ?? getWordState(step.word.row, words)
    next = { ...state, m1: min(state.m1 + 1, settings.m1Max) }
    next.learned = isWordLearned(next, settings)
    pendingUpdates.set(step.word.row, next)

  if step.mode == 2:
    state = pendingUpdates.get(step.word.row) ?? getWordState(step.word.row, words)
    next = { ...state, m2: min(state.m2 + 1, settings.m2Max) }
    next.learned = isWordLearned(next, settings)
    pendingUpdates.set(step.word.row, next)

  if step.mode == 3:
    for each word in step.words:
      state = pendingUpdates.get(word.row) ?? getWordState(word.row, words)
      next = { ...state, m3: min(state.m3 + 1, settings.m3Max) }
      next.learned = isWordLearned(next, settings)
      pendingUpdates.set(word.row, next)
```
