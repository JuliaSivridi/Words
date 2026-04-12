const PDFDocument = require('pdfkit')
const fs = require('fs')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false })
doc.pipe(fs.createWriteStream('docs/Words_TechSpec.pdf'))

const ORANGE = '#e07e38'
const DARK   = '#1c1c1c'
const GRAY   = '#555555'
const LGRAY  = '#888888'
const LINE   = '#e0e0e0'
const WHITE  = '#ffffff'

const W = 595.28
const H = 841.89
const M = 56

// ─── helpers ─────────────────────────────────────────────────────────────────

function h1(text) {
  doc.moveDown(0.8)
  doc.fontSize(18).fillColor(ORANGE).font('Helvetica-Bold').text(text, M, doc.y)
  doc.moveDown(0.25)
  const y = doc.y
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor(ORANGE).lineWidth(1).stroke()
  doc.moveDown(0.4)
}

function h2(text) {
  doc.moveDown(0.4)
  doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text(text, M, doc.y)
  doc.moveDown(0.2)
}

function body(text) {
  doc.fontSize(10).fillColor(DARK).font('Helvetica').text(text, M, doc.y, { align: 'justify', width: W - M * 2 })
  doc.moveDown(0.25)
}

function bullet(items) {
  for (const item of items) {
    doc.fontSize(10).fillColor(DARK).font('Helvetica')
      .text('\u2022  ' + item, M + 12, doc.y, { width: W - M * 2 - 12 })
  }
  doc.moveDown(0.25)
}

function kv(key, value) {
  const y = doc.y
  doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
    .text(key + ':', M + 12, y, { width: 140, lineBreak: false })
  doc.fontSize(10).font('Helvetica').fillColor(GRAY)
    .text(value, M + 160, y, { width: W - M - 160 - M })
  doc.moveDown(0.05)
}

function mono(lines) {
  const blockH = lines.length * 13 + 14
  doc.rect(M, doc.y, W - M * 2, blockH).fillColor('#f4f4f4').fill()
  const startY = doc.y + 7
  for (let i = 0; i < lines.length; i++) {
    doc.fontSize(8).fillColor('#222').font('Courier')
      .text(lines[i], M + 10, startY + i * 13, { width: W - M * 2 - 20, lineBreak: false })
  }
  doc.y = startY + lines.length * 13 + 9
  doc.moveDown(0.2)
}

function divider() {
  doc.moveDown(0.3)
  doc.moveTo(M, doc.y).lineTo(W - M, doc.y).strokeColor(LINE).lineWidth(0.5).stroke()
  doc.moveDown(0.3)
}

function ensureSpace(needed) {
  if (doc.y + needed > H - 50) {
    doc.addPage({ margin: 0, size: 'A4' })
    doc.y = 56
  }
}

// ─── COVER PAGE ──────────────────────────────────────────────────────────────

doc.addPage({ margin: 0, size: 'A4' })
doc.rect(0, 0, W, H).fillColor(DARK).fill()
doc.rect(0, H / 2 - 2, W, 3).fillColor(ORANGE).fill()

doc.fontSize(56).fillColor(ORANGE).font('Helvetica-Bold').text('Words', M, 210, { width: W - M * 2 })
doc.fontSize(22).fillColor(WHITE).font('Helvetica').text('Technical Specification', M, 290, { width: W - M * 2 })

doc.fontSize(11).fillColor(LGRAY).font('Helvetica')
  .text('Personal PWA  \u00b7  React + Vite  \u00b7  Google Sheets API', M, H / 2 + 18, { width: W - M * 2 })
doc.fontSize(10).fillColor(LGRAY)
  .text('No backend  \u00b7  Any language pair  \u00b7  Mobile-first', M, H / 2 + 38, { width: W - M * 2 })

doc.fontSize(9).fillColor(LGRAY)
  .text('Version 1.0  \u00b7  April 2026', M, H - 72, { width: W - M * 2 })

// ─── TABLE OF CONTENTS ───────────────────────────────────────────────────────

doc.addPage({ margin: 0, size: 'A4' })
doc.y = 56

doc.fontSize(26).fillColor(ORANGE).font('Helvetica-Bold').text('Contents', M, doc.y)
doc.moveDown(0.3)
doc.rect(M, doc.y, W - M * 2, 2).fillColor(ORANGE).fill()
doc.moveDown(0.9)

const toc = [
  ['1.', 'Project Overview'],
  ['2.', 'Tech Stack'],
  ['3.', 'Project Architecture'],
  ['4.', 'Data Model'],
  ['5.', 'Session Algorithm'],
  ['6.', 'Screens & Navigation'],
  ['7.', 'Authentication'],
  ['8.', 'Google Sheets API Integration'],
  ['9.', 'UI & Theme'],
  ['10.', 'PWA & Mobile'],
  ['11.', 'Setup & Deployment'],
]

for (const [num, title] of toc) {
  const y = doc.y
  doc.fontSize(12).fillColor(ORANGE).font('Helvetica-Bold').text(num, M, y, { width: 36, lineBreak: false })
  doc.fontSize(12).fillColor(DARK).font('Helvetica').text(title, M + 40, y, { width: W - M * 2 - 40 })
  doc.moveDown(0.55)
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

doc.addPage({ margin: 0, size: 'A4' })
doc.y = 56

// 1
h1('1. Project Overview')
body(
  'Words is a personal vocabulary learning app built as a Progressive Web App (PWA). ' +
  'It runs in any modern browser and installs on Android or iOS home screens as a standalone app. ' +
  'There is no backend \u2014 Google Sheets is used directly as the database via the Sheets API v4, ' +
  'and authentication is handled client-side through Google Identity Services (OAuth 2.0). ' +
  'The app supports any language pair and organises words into three progressively harder learning modes ' +
  'based on a simple spaced-repetition model.'
)
divider()

// 2
h1('2. Tech Stack')
h2('Frontend')
kv('Framework', 'React 18 (JavaScript, no TypeScript)')
kv('Build Tool', 'Vite 6')
kv('Styling', 'CSS Modules + CSS custom properties (light / dark theme)')
kv('Routing', 'React Router DOM v6')
kv('Icons', 'Inline SVG (Lucide-style, hand-written)')
doc.moveDown(0.3)
h2('Data & Auth')
kv('Database', 'Google Sheets API v4 (spreadsheet as DB, direct browser fetch)')
kv('File Discovery', 'Google Drive API v3 (find or create db_words spreadsheet)')
kv('Authentication', 'Google Identity Services \u2014 OAuth 2.0 Token Client')
kv('Token Storage', 'In-memory access token; user profile in localStorage')
doc.moveDown(0.3)
h2('PWA & Deployment')
kv('PWA', 'manifest.json + custom service worker (sw.js)')
kv('Hosting', 'Any static host (Vercel, Netlify, GitHub Pages)')
kv('Env var', 'VITE_GOOGLE_CLIENT_ID (only required variable)')
divider()

// 3
ensureSpace(180)
h1('3. Project Architecture')
mono([
  'src/',
  '  main.jsx               Entry point',
  '  App.jsx                Router + top-level state (auth, sheet, language)',
  '  theme.css              CSS variables, light/dark theme, min 16px font',
  '  auth.js                GIS token client, silent sign-in, token refresh',
  '  sheetsApi.js           Drive + Sheets API wrappers',
  '  constants.js           M1_MAX=4  M2_MAX=8  M3_MAX=12  TOTAL_REPS=24',
  '  screens/',
  '    LoginScreen.jsx      Sign-in page',
  '    HomeScreen.jsx       Start / Word List / Language / Category',
  '    LanguageScreen.jsx   Tab picker from db_words spreadsheet',
  '    CategoryScreen.jsx   Category filter picker',
  '    SessionScreen.jsx    12-step session orchestrator',
  '    WordListScreen.jsx   Browseable word list with learned toggle',
  '  components/',
  '    FlipCard.jsx         Mode 1 \u2014 flip card',
  '    MultipleChoice.jsx   Mode 2 \u2014 4-option quiz',
  '    MatchingGrid.jsx     Mode 3 \u2014 6-pair matching grid',
  '    NextButton.jsx       Shared pinned Next button',
  '    CheckIcon.jsx        Shared SVG checkmark',
  '    WordListItem.jsx     Single row in word list',
  '  hooks/',
  '    useWords.js          Word loading + saving hook',
  '    useSession.js        buildSession() \u2014 12-step plan',
  'public/',
  '  manifest.json  sw.js  icons/icon-192.png  icons/icon-512.png',
])
divider()

// 4
ensureSpace(220)
h1('4. Data Model')
body(
  'All data lives in the user\u2019s Google Spreadsheet named \u201cdb_words\u201d (found or auto-created on first login). ' +
  'Language tabs are named in TRANSLATION-STUDY format, e.g. RU-EN = study English, translate Russian. ' +
  'A special \u201c_settings\u201d tab stores the last selected language and category for cross-device sync.'
)
h2('Word Tab Columns (A\u2013G)')
mono([
  'A  category     Optional grouping label (e.g. Verbs, Food)',
  'B  word         Target-language word (the language being studied)',
  'C  translation  Native-language meaning',
  'D  m1           FlipCard rep count       0 \u2013 4',
  'E  m2           MultipleChoice rep count 0 \u2013 8',
  'F  m3           MatchingGrid rep count   0 \u2013 12',
  'G  learned      TRUE / FALSE',
])
h2('_settings Tab')
kv('A1', 'Language code, e.g. RU-EN')
kv('A2', 'Category filter, e.g. Animals (empty = all categories)')
doc.moveDown(0.2)
body(
  'Row 1 is treated as a header if column B = \u201cword\u201d (case-insensitive); otherwise all non-empty rows are data.'
)
divider()

// 5
ensureSpace(220)
h1('5. Session Algorithm')
body('Each session consists of 12 steps. Pools are built from the word list, a balanced plan is assembled, then shuffled.')
h2('Mode Pools')
bullet([
  'Mode 1 (FlipCard): !learned && m1 < 4',
  'Mode 2 (MultipleChoice): !learned && m1 \u2265 4 && m2 < 8',
  'Mode 3 (MatchingGrid): !learned && m2 \u2265 8 && m3 < 12, sorted asc by m3',
  'Mode 3 excluded if fewer than 6 words qualify',
  'No available modes \u2192 session returns { allLearned: true }',
])
h2('Step Planning')
bullet([
  'Steps distributed equally: 12 / N modes (e.g. 4+4+4, 6+6, or 12)',
  'Step list shuffled \u2014 modes interleaved, not grouped',
  'Modes 1 & 2: shuffled word queue, cycling when exhausted',
  'Mode 3: pool split into non-overlapping groups of 6; each step uses next group (cycling)',
])
h2('Counter Updates')
bullet([
  'Counters accumulate in memory during session \u2014 no mid-session API calls',
  'On session complete: one batchUpdateWords() call for all changed rows',
  '\u201cLearn and hide\u201d button: markLearned() PUT request fires immediately',
])
divider()

// 6
ensureSpace(280)
h1('6. Screens & Navigation')
h2('LoginScreen')
bullet([
  'App icon + name centred on screen',
  'trySilentSignIn() on load \u2014 navigates to Home automatically if token obtained',
  '\u201cSign in with Google\u201d button for first-time / failed silent sign-in',
])
h2('HomeScreen')
bullet([
  'Three full-width buttons: Start session / Word List / Language',
  'Subtitle shows current language and active category filter',
])
h2('LanguageScreen + CategoryScreen')
bullet([
  'Language: lists all tabs from db_words; checkmark on current; tap to select',
  'Category: lists unique column A values + \u201cAll categories\u201d; checkmark on current',
  'Both write selection to _settings tab immediately',
])
h2('SessionScreen')
bullet([
  'Progress bar + \u201c3 / 12\u201d counter; back exits without saving',
  'Renders FlipCard, MultipleChoice, or MatchingGrid per step',
  '\u201cNext \u2192\u201d always at bottom via margin-top: auto, disabled until step complete',
  'After step 12: batchUpdateWords(), then shows Session complete screen',
])
h2('WordListScreen')
bullet([
  '\u201cN learned / M total\u201d counter in header',
  'Eye icon = active word; crossed-eye = learned. Tap to toggle.',
  'Un-learning resets m1/m2/m3 to 0 via immediate resetWordCounters() call',
])
divider()

// 7
ensureSpace(220)
h1('7. Authentication')
body(
  'Uses Google Identity Services (GIS) Token Client \u2014 OAuth 2.0 implicit flow. ' +
  'Only Authorized JavaScript Origins must be configured; no redirect URIs needed.'
)
h2('Silent Sign-In Flow')
bullet([
  'On app load: trySilentSignIn() calls requestAccessToken({ prompt: \u201d\u201d })',
  'If previously authorised: token returned without UI, navigate to Home',
  'Otherwise: GIS popup shown; failure leaves user on LoginScreen',
  'User profile (email, name, picture) fetched and stored in localStorage',
])
h2('Token Lifecycle')
bullet([
  'Access token kept in memory \u2014 never written to localStorage',
  'Lifetime: 1 hour (standard GIS implicit grant)',
  'On any 401: refreshTokenIfNeeded() silently re-requests token',
])
h2('Required OAuth Scopes')
bullet([
  'email, profile \u2014 user identity',
  'https://www.googleapis.com/auth/spreadsheets \u2014 read/write db_words',
  'https://www.googleapis.com/auth/drive.metadata.readonly \u2014 find file in Drive',
])
divider()

// 8
ensureSpace(260)
h1('8. Google Sheets API Integration')
body('All calls go through request() in sheetsApi.js, which injects the Bearer token and throws on non-2xx responses.')
h2('Key API Calls')
mono([
  'Find db_words:',
  "  GET /drive/v3/files?q=name='db_words'...",
  '',
  'Create if not found:',
  "  POST /v4/spreadsheets  { properties: { title: 'db_words' } }",
  '',
  'List language tabs:',
  '  GET /v4/spreadsheets/{id}?fields=sheets.properties.title',
  '',
  'Read words:',
  '  GET /v4/spreadsheets/{id}/values/{tab}!A1:G',
  '',
  'Batch-update after session:',
  '  POST /v4/spreadsheets/{id}/values:batchUpdate',
  "  { valueInputOption: 'RAW', data: [{ range: 'D{r}:G{r}', values: [[m1,m2,m3,learned]] }] }",
  '',
  'Mark learned:    PUT /values/{tab}!G{row}',
  'Reset counters:  PUT /values/{tab}!D{row}:G{row}  ->  [0,0,0,FALSE]',
  '_settings:       GET or PUT /values/_settings!A1:A2',
])
divider()

// 9
ensureSpace(200)
h1('9. UI & Theme')
h2('Color Palette (CSS Variables)')
mono([
  'Token            Light      Dark',
  '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
  '--bg             #FFFFFF    #1C1C1C',
  '--surface        #F3F1EF    #2B2B2B',
  '--surface-2      #E8E8E8    #363636',
  '--text           #1C1C1C    #EFEFEF',
  '--text-muted     #6B6B6B    #949494',
  '--accent         #E07E38    #E8935A',
  '--success        #6BBF7A    #5AA569',
  '--error          #E07070    #C96060',
  '--border         #E0E0E0    #4A4A4A',
])
h2('Layout Rules')
bullet([
  'All screens: height: 100dvh; overflow: hidden \u2014 no page scroll',
  '\u201cNext \u2192\u201d wrapper: margin-top: auto in flex column \u2014 pins to bottom',
  'Mode 2 word card: max-height: 45vh \u2014 keeps quiz grid on screen',
  'FlipCard: CSS 3D rotateX; swipe trigger \u0394Y > 50px',
])
divider()

// 10
ensureSpace(160)
h1('10. PWA & Mobile')
bullet([
  'manifest.json: name=\u201cWords\u201d, short_name=\u201cWords\u201d, display=standalone, theme_color=#E07E38',
  'sw.js: App Shell cached on install; Sheets/Drive API \u2014 network-first with cache fallback',
  'Icons: icon-192.png and icon-512.png (orange gradient, W design)',
  'Android: Chrome shows automatic install banner',
  'iOS: Safari Share \u2192 Add to Home Screen',
])
divider()

// 11
ensureSpace(240)
h1('11. Setup & Deployment')
h2('Local Development')
mono([
  '1.  git clone https://github.com/JuliaSivridi/Words.git',
  '2.  npm install',
  '3.  Create .env:',
  '      VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com',
  '4.  npm run dev   ->  http://localhost:5173',
  '5.  npm run build ->  dist/',
])
h2('Google Cloud Console')
bullet([
  'Enable Google Sheets API v4 and Google Drive API',
  'Create OAuth 2.0 Client ID \u2014 type: Web application',
  'Authorized JavaScript Origins: http://localhost:5173 + production URL',
  'OAuth consent screen: Testing mode; add your Google account as test user',
])
h2('Vercel Deployment')
bullet([
  'Import repo at vercel.com; add VITE_GOOGLE_CLIENT_ID env var',
  'Every push to main auto-deploys; add Vercel URL to Google Cloud Origins',
  'No backend to provision \u2014 spreadsheet auto-created on first login',
])

doc.end()
console.log('Done: docs/Words_TechSpec.pdf')
