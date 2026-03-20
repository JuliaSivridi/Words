const PDFDocument = require('pdfkit')
const fs = require('fs')

const doc = new PDFDocument({ margin: 60, size: 'A4' })
doc.pipe(fs.createWriteStream('D:/Projects/Words/docs/Words_TechSpec.pdf'))

const ORANGE = '#e07e38'
const DARK   = '#1c1c1c'
const GRAY   = '#555555'
const LGRAY  = '#888888'
const LINE   = '#dddddd'

function h1(text) {
  doc.moveDown(0.5)
  doc.fontSize(20).fillColor(ORANGE).font('Helvetica-Bold').text(text)
  doc.moveDown(0.25)
}
function h2(text) {
  doc.moveDown(0.5)
  doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold').text(text)
  doc.moveDown(0.15)
}
function h3(text) {
  doc.moveDown(0.3)
  doc.fontSize(10).fillColor(ORANGE).font('Helvetica-Bold').text(text)
  doc.moveDown(0.1)
}
function body(text) {
  doc.fontSize(10).fillColor(DARK).font('Helvetica').text(text, { align: 'justify' })
  doc.moveDown(0.2)
}
function bullet(items) {
  for (let i = 0; i < items.length; i++) {
    doc.fontSize(10).fillColor(DARK).font('Helvetica').text('\u2022  ' + items[i], { indent: 14 })
  }
  doc.moveDown(0.2)
}
function kv(key, value) {
  doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK).text(key + ':  ', { continued: true })
  doc.font('Helvetica').fillColor(GRAY).text(value)
}
function code(lines) {
  for (let i = 0; i < lines.length; i++) {
    doc.fontSize(8.5).fillColor('#333').font('Courier').text(lines[i], { indent: 16 })
  }
  doc.moveDown(0.2)
}
function divider() {
  doc.moveDown(0.4)
  doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor(LINE).lineWidth(0.5).stroke()
  doc.moveDown(0.4)
}

// ── Cover ──────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 190).fillColor(DARK).fill()
doc.fontSize(30).fillColor(ORANGE).font('Helvetica-Bold').text('Words', 60, 55)
doc.fontSize(15).fillColor('#ffffff').font('Helvetica').text('Technical Specification', 60, 98)
doc.fontSize(9.5).fillColor(LGRAY).text('Personal PWA  \u00b7  Web + Mobile  \u00b7  Version 1.0', 60, 126)
doc.fontSize(9).fillColor(LGRAY).text('March 2026', 60, 144)
doc.y = 215

// ── 1 ─────────────────────────────────────────────────────────────────────────
h1('1. Project Overview')
body(
  'Words is a personal vocabulary learning application built as a Progressive Web App (PWA). ' +
  'It runs in any modern browser and can be installed on Android or iOS home screens for a native-like ' +
  'experience without an app store. The application uses Google Sheets as a persistent database and ' +
  'Google Identity Services for authentication. Words are learned through three progressively harder ' +
  'exercise modes: flip cards, multiple-choice questions, and a matching grid. ' +
  'There is no backend — all data access is performed directly from the browser via the Google Sheets API v4.'
)
divider()

// ── 2 ─────────────────────────────────────────────────────────────────────────
h1('2. Goals & Non-Goals')
h2('Goals')
bullet([
  'Vocabulary learning tool accessible from any device via browser or installed PWA',
  'No backend server required — Google Sheets acts as the data store',
  'Three-mode spaced-repetition system: FlipCard → MultipleChoice → MatchingGrid',
  'Single user (personal use); authentication via Google OAuth 2.0',
  'Settings (language, category filter) synced across devices via the sheet',
  'Mobile-first design with full touch support and swipe gestures',
])
h2('Non-Goals')
bullet([
  'Multi-user collaboration or shared word lists',
  'Native app distribution via App Store / Google Play',
  'Server-side rendering or a backend API',
  'Built-in offline mode / IndexedDB caching (network required)',
  'Audio pronunciation or TTS',
])
divider()

// ── 3 ─────────────────────────────────────────────────────────────────────────
h1('3. Technology Stack')
h2('Frontend')
kv('Framework', 'React 18 (JavaScript, no TypeScript)')
kv('Build Tool', 'Vite 6')
kv('Styling', 'CSS Modules + global CSS variables (light / dark theme)')
kv('Routing', 'React Router DOM v6')
kv('PWA', 'Manual manifest.json + service worker (sw.js)')
doc.moveDown(0.3)
h2('Data & Auth')
kv('Database', 'Google Sheets API v4 (spreadsheet as DB, direct browser fetch)')
kv('Drive API', 'Google Drive API v3 (find or create the "Words" spreadsheet)')
kv('Authentication', 'Google Identity Services (GIS) \u2014 OAuth 2.0 Token Client')
kv('Offline Storage', 'None (localStorage for lang + category preferences only)')
doc.moveDown(0.3)
h2('PWA & Deployment')
kv('Hosting', 'Any static host (Vercel, Netlify, GitHub Pages)')
kv('CI/CD', 'GitHub \u2192 Vercel (push-triggered builds)')
kv('Env variable', 'VITE_GOOGLE_CLIENT_ID (single variable required)')
divider()

// ── 4 ─────────────────────────────────────────────────────────────────────────
h1('4. Application Architecture')
body('The app is a single-page React application with no backend. State flows top-down from App.jsx. ' +
  'All Google API calls are made directly from the browser using a short-lived OAuth 2.0 access token.')
h3('Layer Overview')
bullet([
  'App.jsx  --  root router, auth state, sheet ID, language & category state',
  'screens/  --  LoginScreen, HomeScreen, SessionScreen, WordListScreen, LanguageScreen, CategoryScreen',
  'components/  --  FlipCard, MultipleChoice, MatchingGrid, WordListItem, NextButton',
  'hooks/useWords.js  --  load words, saveSessionUpdates, setLearned, resetWord',
  'hooks/useSession.js  --  buildSession() constructs the 12-step session array',
  'auth.js  --  GIS token client, trySilentSignIn(), onAuthChange()',
  'sheetsApi.js  --  Drive + Sheets API fetch wrappers',
  'constants.js  --  M1_MAX=4, M2_MAX=12, M3_MAX=24, TOTAL_REPS=40',
])
h3('Data Flow')
body('Login \u2192 findOrCreateWordsFile() \u2192 readSettings() \u2192 load words for selected tab \u2192 buildSession() \u2192 ' +
  'render steps \u2192 collect updates in memory \u2192 batchUpdateWords() after session complete')
h3('Settings Sync')
body('Language and category filter are stored in two places: localStorage (fast initial load) and ' +
  'the _settings tab of the Words sheet (cross-device sync). On login, sheet values win.')
divider()

// ── 5 ─────────────────────────────────────────────────────────────────────────
h1('5. Data Model')
body(
  'All data lives in the user\'s Google Spreadsheet named "Words". The app finds it in Google Drive ' +
  'by name and creates it automatically on first launch. Each language pair is a separate sheet tab.'
)
h2('Word Sheet Tab  (e.g. "RU-EN")')
body('Tab name format: TRANSLATION-STUDY. For RU-EN the user studies English; the translation column holds Russian.')
body('Row 1 is treated as a header only if A1 = "word" (case-insensitive); otherwise all rows are data.')
code([
  'A  word         -- the word being studied (target language)',
  'B  translation  -- meaning in the user\'s native language',
  'C  m1           -- mode 1 repetition count  (0 \u2013 M1_MAX)',
  'D  m2           -- mode 2 repetition count  (0 \u2013 M2_MAX)',
  'E  m3           -- mode 3 repetition count  (0 \u2013 M3_MAX)',
  'F  learned      -- TRUE | FALSE',
  'G  category     -- optional grouping label (e.g. "Verbs", "Food")',
])
h2('_settings Tab')
code([
  'A1  language code   -- e.g. "RU-EN"  (last selected tab)',
  'A2  category filter -- comma-separated category names, or "" = all',
])
h2('Progression Thresholds (constants.js)')
bullet([
  'M1_MAX = 4   -- word graduates from Mode 1 after 4 correct flip-card views',
  'M2_MAX = 12  -- word graduates from Mode 2 after 12 correct multiple-choice answers',
  'M3_MAX = 24  -- word is auto-learned after 24 matching-grid completions',
  'TOTAL_REPS = 40  -- total repetitions per word across all modes',
])
divider()

// ── 6 ─────────────────────────────────────────────────────────────────────────
h1('6. Game Mechanics')
body(
  'Each session consists of exactly 12 steps. For each step the algorithm randomly selects a mode ' +
  'from those that currently have eligible words. Counters are accumulated in memory during the session ' +
  'and batch-saved to Google Sheets after the final step. '
)
h2('Mode Eligibility')
bullet([
  'Mode 1 (FlipCard):       m1 < M1_MAX',
  'Mode 2 (MultipleChoice): m1 \u2265 M1_MAX  AND  m2 < M2_MAX',
  'Mode 3 (MatchingGrid):   m2 \u2265 M2_MAX  AND  m3 < M3_MAX  AND  \u2265 6 eligible words available',
])
h2('Mode 1 \u2014 FlipCard')
bullet([
  'Displays one word at a time on a full-screen flip card',
  'Front face shows the word; back face shows the translation',
  'CSS 3D flip on the X-axis (vertical flip); trigger: click / tap / vertical swipe (delta Y > 50px)',
  'Next \u2192 button becomes active after the card is flipped OR after "Learn and forget" is clicked',
  'On Next: m1++ for this word (saved at end of session)',
])
h2('Mode 2 \u2014 MultipleChoice')
bullet([
  'Shows the word in the top half; 2\u00d72 grid of translation cards in the bottom half',
  'Wrong tap: card flashes red, question remains active',
  'Correct tap: card turns green, Next \u2192 becomes active',
  'Next \u2192 also becomes active if "Learn and forget" is clicked',
  'Wrong answers drawn from the same category-filtered word pool when possible (falls back to full list)',
  'On Next: m2++ for this word',
])
h2('Mode 3 \u2014 MatchingGrid')
bullet([
  '6 words selected via round-robin across all selected categories (pickSpread)',
  'Two columns: left = shuffled words, right = shuffled translations (same 6 rows, independent order)',
  'Tap any card in either column to select it; tap the opposite column to attempt a match',
  'Correct pair: both cards turn green and are permanently deactivated',
  'Wrong pair: both flash red, selection resets',
  'All 6 pairs matched \u2192 Next \u2192 becomes active',
  'No "Learn and forget" button in Mode 3',
  'On Next: m3++ for all 6 words in the group',
])
h2('Category Filter & Pool Building')
bullet([
  'sessionCategory: null = all words; string[] = only words in selected categories',
  'buildMode3Pool(): uses strictly qualified words (m2 \u2265 M2_MAX) as primary pool',
  'If selected categories are missing from the qualified pool, supplements with the most-advanced',
  '  (by m1+m2 score) unlearned words from those categories to ensure cross-category representation',
  'Shuffled queues for modes 1 & 2: all words cycled before any word repeats',
])
h2('"Learn and forget" Button')
bullet([
  'Available in Mode 1 and Mode 2 on every step',
  'Clicking immediately marks the word as learned=TRUE and saves to the sheet',
  'Also unlocks the Next \u2192 button so the session can continue',
  'Once clicked, the button is disabled for the current step (shows "Learned \u2713")',
])
divider()

// ── 7 ─────────────────────────────────────────────────────────────────────────
h1('7. Screens & Navigation')
h2('LoginScreen')
bullet([
  'Centered layout: horizontal logo row (icon + app name + tagline)',
  'Two description lines: "Data stored in your Google Sheets." / "Works offline with automatic sync."',
  'Orange "Sign in with Google" button with Google logo SVG',
])
h2('HomeScreen')
bullet([
  'Four navigation buttons in order: Start \u2192 Language \u2192 Category \u2192 Word List',
  'Language and Category buttons show a sub-label (selected value or "All categories")',
  'Category sub-label: null \u2192 "All categories" | one item \u2192 name | 2+ \u2192 "Multiple\u2026"',
  'Monochrome SVG icons (currentColor) aligned left on each button',
  'Sign-out available via user avatar or menu',
])
h2('LanguageScreen')
bullet([
  'Lists all sheet tabs from the "Words" file (excludes _settings)',
  'Currently selected tab has accent-colored checkmark on the right',
  'Tapping a tab saves to localStorage + sheet settings and returns to Home',
])
h2('CategoryScreen')
bullet([
  'Multi-select: any combination of categories can be active simultaneously',
  '"All categories" row at top — toggles between full selection and empty selection',
  'Each category row shows a checkmark on the right when selected',
  'Back button saves the selection and navigates to Home (no separate Done button)',
  'Stored as null (all) or string[] in state; synced to sheet as comma-separated string',
])
h2('SessionScreen')
bullet([
  'Progress indicator at top: "3 / 12"',
  'Renders FlipCard / MultipleChoice / MatchingGrid based on current step mode',
  'Next \u2192 button always at the bottom, disabled until the step is complete',
  'After step 12: calls batchUpdateWords(), shows "\u2713 Session complete!" banner, returns to Home',
])
h2('WordListScreen')
bullet([
  'Scrollable list of all words (filtered by sessionCategory if set)',
  'Each row: word | translation | toggle icon',
  'Icon: eye-open = active; eye-crossed = learned',
  'Tapping eye-crossed \u2192 resets word (learned=FALSE, all counters \u2192 0), saved immediately',
  'Tapping eye-open \u2192 marks learned=TRUE, saved immediately',
])
divider()

// ── 8 ─────────────────────────────────────────────────────────────────────────
h1('8. Authentication')
body(
  'Authentication uses Google Identity Services (GIS) Token Client \u2014 OAuth 2.0 implicit flow. ' +
  'No redirect URIs are needed; only Authorized JavaScript Origins must be configured.'
)
bullet([
  'initAuth(): loads the GIS script, then calls trySilentSignIn()',
  'trySilentSignIn(): calls tokenClient.requestAccessToken({ prompt: "" })',
  '  -- silent: no UI shown if the user previously granted access',
  '  -- falls back to LoginScreen popup if silent fails',
  'User profile (name, email, picture) fetched from Google userinfo endpoint',
  'Email saved in localStorage as hint for subsequent silent sign-ins',
  'Access token stored in module-level memory variable (not persisted)',
  'On 401 from Sheets API: silent token refresh attempted automatically',
  'Sign-out: clears user object, calls google.accounts.oauth2.revoke()',
])
h2('Required OAuth Scopes')
bullet([
  'email, profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
])
h2('Google Cloud Console Setup')
bullet([
  'Enable Google Sheets API v4 and Google Drive API on the project',
  'OAuth 2.0 Client ID \u2014 type: Web application',
  'Authorized JavaScript Origins: http://localhost:5173 (dev) + production URL (prod)',
  'OAuth consent screen: Testing mode, personal Google account added as test user',
])
divider()

// ── 9 ─────────────────────────────────────────────────────────────────────────
h1('9. Google Sheets API Integration')
body('All Sheets and Drive calls are plain fetch() calls in sheetsApi.js, using the in-memory access token.')
h2('Key API Calls')
code([
  '// Find "Words" file in Drive',
  "GET drive/v3/files?q=name='Words'&mimeType=...spreadsheet...&trashed=false",
  '',
  '// Create file if not found',
  'POST drive/v3/files',
  '',
  '// List tabs (to populate LanguageScreen)',
  'GET sheets/v4/spreadsheets/{id}?fields=sheets.properties.title',
  '',
  '// Read words for selected tab',
  'GET sheets/v4/spreadsheets/{id}/values/{tab}!A2:G',
  '',
  '// Read _settings tab',
  'GET sheets/v4/spreadsheets/{id}/values/_settings!A1:A2',
  '',
  '// Batch update counters after session',
  'POST sheets/v4/spreadsheets/{id}/values:batchUpdate',
  '  body: { data: [ { range: "{tab}!C{row}:F{row}", values: [[m1,m2,m3,learned]] } ] }',
  '',
  '// Write settings',
  'PUT sheets/v4/spreadsheets/{id}/values/_settings!A1:A2',
  '  body: { values: [[language], [category]] }',
])
h2('Batch Save Strategy')
bullet([
  'Counter increments accumulated in memory during the session (updates array)',
  'batchUpdateWords() called once after step 12 completes (or on navigation away)',
  '"Learn and forget" button triggers an immediate single-row update (setLearned)',
  'resetWord() writes [[0, 0, 0, "FALSE"]] to reset all counters + learned flag',
])
divider()

// ── 10 ────────────────────────────────────────────────────────────────────────
h1('10. UI / UX Design')
h2('Theme')
bullet([
  'Color mode: follows system prefers-color-scheme (light / dark, automatic)',
  'Primary accent: #E8935A \u2014 soft warm orange (slightly brighter in light mode)',
  'Dark mode accent: #D4804A (slightly muted)',
  'Dark mode background: #2B2B2B',
  'Base font size: 16px minimum (enforced in html {})',
  'Success: #6BBF7A  |  Error: #E07070  |  Border: #D0D0D0 (light) / #4A4A4A (dark)',
])
h2('CSS Architecture')
bullet([
  'Global variables in theme.css (:root + dark media query)',
  'Per-component CSS Modules (.module.css) for scoped class names',
  'Global utility classes: .btn, .btn-ghost (in App.css or global.css)',
  'Card style: --card-bg, --border, --radius (12px)',
])
h2('Touch & Mobile')
bullet([
  'Minimum tap target: 44px+ on all interactive elements',
  '-webkit-tap-highlight-color: transparent on all buttons',
  'FlipCard: vertical swipe (touchstart/touchend, delta Y > 50px) triggers flip',
  'Layout: 100dvh with overflow:hidden on wrapper, internal scroll where needed',
  'No horizontal scrolling at any screen size',
])
divider()

// ── 11 ────────────────────────────────────────────────────────────────────────
h1('11. PWA & Mobile')
bullet([
  'Web App Manifest: name "Words", short_name "Words", display standalone',
  'Theme color: #E8935A (set in manifest.json and <meta name="theme-color"> in index.html)',
  'Background color: matches --bg variable (white in light mode)',
  'Icons: icon-192.png and icon-512.png',
  'Service Worker (sw.js): App Shell caching (HTML / JS / CSS / icons)',
  'Network-first strategy for Google API calls; cache-first for static assets',
  'Android: Chrome shows automatic install banner or browser menu \u2192 Install app',
  'iOS: Safari Share menu \u2192 "Add to Home Screen"',
])
divider()

// ── 12 ────────────────────────────────────────────────────────────────────────
h1('12. Deployment')
h2('Vercel (Recommended)')
bullet([
  'Connect the GitHub repository at vercel.com',
  'Add environment variable: VITE_GOOGLE_CLIENT_ID',
  'Build command: npm run build  |  Output: dist/',
  'Every push to main triggers automatic build and deployment',
  'Add the Vercel URL to Google Cloud Console Authorized JavaScript Origins',
])
h2('Local Development')
code([
  '1. git clone https://github.com/JuliaSivridi/Words.git',
  '2. cd Words && npm install',
  '3. Create .env:   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com',
  '4. npm run dev    ->   http://localhost:5173',
  '5. npm run build  ->   production output in dist/',
])
divider()

// ── 13 ────────────────────────────────────────────────────────────────────────
h1('13. Key File Structure')
code([
  'src/',
  '  App.jsx             root router, auth + sheet state, settings sync',
  '  auth.js             GIS token client, silent sign-in, token refresh',
  '  sheetsApi.js        Drive / Sheets API fetch wrappers',
  '  constants.js        M1_MAX=4  M2_MAX=12  M3_MAX=24  TOTAL_REPS=40',
  '  theme.css           CSS variables, light/dark theme, min 16px font',
  '  screens/',
  '    LoginScreen.jsx          Google sign-in page',
  '    HomeScreen.jsx           Start / Language / Category / Word List buttons',
  '    SessionScreen.jsx        12-step session orchestration + progress bar',
  '    WordListScreen.jsx       scrollable word list with learned toggle',
  '    LanguageScreen.jsx       tab selection from "Words" spreadsheet',
  '    CategoryScreen.jsx       multi-select category filter',
  '  components/',
  '    FlipCard.jsx             Mode 1: flip card with swipe support',
  '    MultipleChoice.jsx       Mode 2: 2x2 choice grid',
  '    MatchingGrid.jsx         Mode 3: 6-pair matching columns',
  '    NextButton.jsx           shared "Next \u2192" button',
  '    WordListItem.jsx         single row in word list',
  '  hooks/',
  '    useWords.js              word load / save / reset hook',
  '    useSession.js            buildSession() \u2014 12-step session builder',
  'public/',
  '  manifest.json       PWA manifest',
  '  sw.js               service worker (App Shell cache)',
  '  icons/              icon-192.png  icon-512.png',
  'index.html            GIS script tag, theme-color meta',
  'vite.config.js        @vitejs/plugin-react',
  '.env                  VITE_GOOGLE_CLIENT_ID  (not committed)',
])

// ── Footer ────────────────────────────────────────────────────────────────────
doc.moveDown(1.5)
divider()
doc.fontSize(8.5).fillColor(LGRAY).font('Helvetica')
  .text('Words  \u00b7  Technical Specification  \u00b7  March 2026', { align: 'center' })

doc.end()
console.log('Done: docs/Words_TechSpec.pdf')
