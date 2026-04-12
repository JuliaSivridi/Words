const PDFDocument = require('pdfkit')
const fs = require('fs')

const doc = new PDFDocument({ margin: 60, size: 'A4' })
doc.pipe(fs.createWriteStream('docs/Words_TechSpec.pdf'))

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

// Cover
doc.rect(0, 0, 595, 190).fillColor(DARK).fill()
doc.fontSize(30).fillColor(ORANGE).font('Helvetica-Bold').text('Words', 60, 55)
doc.fontSize(15).fillColor('#ffffff').font('Helvetica').text('Technical Specification', 60, 98)
doc.fontSize(9.5).fillColor(LGRAY).text('Personal PWA  \u00b7  Web + Mobile  \u00b7  Version 1.0', 60, 126)
doc.fontSize(9).fillColor(LGRAY).text('April 2026', 60, 144)
doc.y = 215

h1('1. Project Overview')
body(
  'Words is a personal vocabulary learning app built as a Progressive Web App (PWA). ' +
  'It runs in any modern browser and installs on Android or iOS home screens as a standalone app. ' +
  'There is no backend \u2014 Google Sheets is used directly as the database via the Sheets API v4. ' +
  'Authentication is handled client-side through Google Identity Services (OAuth 2.0). ' +
  'The app supports any language pair and organises words into three progressively harder learning modes ' +
  'based on a simple spaced-repetition model.'
)
divider()

h1('2. Technology Stack')
h2('Frontend')
kv('Framework', 'React 18 (JavaScript, no TypeScript)')
kv('Build Tool', 'Vite 6')
kv('Styling', 'CSS Modules + CSS custom properties (light / dark theme)')
kv('Routing', 'React Router DOM v6')
kv('Icons', 'Inline SVG (Lucide-style, hand-written)')
doc.moveDown(0.3)
h2('Data & Auth')
kv('Database', 'Google Sheets API v4 (spreadsheet as DB, direct browser fetch)')
kv('File Discovery', 'Google Drive API v3 (find or create "db_words" spreadsheet)')
kv('Authentication', 'Google Identity Services (GIS) \u2014 OAuth 2.0 Token Client')
kv('Token Storage', 'In-memory access token; user profile in localStorage')
doc.moveDown(0.3)
h2('PWA & Deployment')
kv('PWA', 'manifest.json + custom service worker (sw.js)')
kv('Hosting', 'Any static host (Vercel, Netlify, GitHub Pages)')
kv('Single env var', 'VITE_GOOGLE_CLIENT_ID')
divider()

h1('3. Project Structure')
code([
  'src/',
  '  main.jsx               Entry point',
  '  App.jsx                Router + top-level state (auth, sheet, language)',
  '  theme.css              CSS variables, light/dark theme, min 16px font',
  '  auth.js                GIS token client, silent sign-in, token refresh',
  '  sheetsApi.js           Drive + Sheets API wrappers',
  '  constants.js           M1_MAX, M2_MAX, M3_MAX, TOTAL_REPS',
  '  screens/',
  '    LoginScreen.jsx      Sign-in page',
  '    HomeScreen.jsx       Start / Word List / Language buttons',
  '    LanguageScreen.jsx   Tab picker from db_words spreadsheet',
  '    CategoryScreen.jsx   Category filter picker',
  '    SessionScreen.jsx    12-step session orchestrator',
  '    WordListScreen.jsx   Browseable word list with learned toggle',
  '  components/',
  '    FlipCard.jsx         Mode 1 -- flip card',
  '    MultipleChoice.jsx   Mode 2 -- 4-option quiz',
  '    MatchingGrid.jsx     Mode 3 -- 6-pair matching grid',
  '    NextButton.jsx       Shared sticky Next button',
  '    CheckIcon.jsx        Shared SVG checkmark (Lucide-style)',
  '    WordListItem.jsx     Single row in word list',
  '  hooks/',
  '    useWords.js          Word loading + saving hook',
  '    useSession.js        buildSession() -- 12-step plan',
  'public/',
  '  manifest.json          PWA manifest',
  '  sw.js                  Service worker (cache + network-first)',
  '  icons/                 icon-192.png, icon-512.png, favicon.svg',
])
divider()

h1('4. Data Model')
body(
  'All data lives in the user\'s Google Spreadsheet named "db_words" (found or auto-created on first login). ' +
  'Language tabs are named in TRANSLATION-STUDY format (e.g. "RU-EN" = study English, translate Russian). ' +
  'A special "_settings" tab stores the last selected language and category for cross-device sync.'
)
h2('Word Tab Columns')
code([
  'A  category     Optional grouping label (e.g. "Verbs", "Food")',
  'B  word         Target-language word (the language being studied)',
  'C  translation  Native-language meaning',
  'D  m1           FlipCard repetition count     (0 \u2013 M1_MAX)',
  'E  m2           MultipleChoice rep count      (0 \u2013 M2_MAX)',
  'F  m3           MatchingGrid rep count        (0 \u2013 M3_MAX)',
  'G  learned      TRUE / FALSE',
])
h2('Repetition Constants (src/constants.js)')
kv('M1_MAX', '4   -- reps in FlipCard before advancing to MultipleChoice')
kv('M2_MAX', '8   -- reps in MultipleChoice before advancing to MatchingGrid')
kv('M3_MAX', '12  -- reps in MatchingGrid before auto-marked learned')
kv('TOTAL_REPS', '24  -- total reps across all modes (4 + 8 + 12)')
doc.moveDown(0.3)
h2('_settings Tab')
kv('A1', 'Language code, e.g. "RU-EN"')
kv('A2', 'Category filter, e.g. "Animals" (empty = all categories)')
body('Created automatically by ensureSettingsTab() on first write. Read on login to restore selection.')
h2('Header Detection')
body(
  'Row 1 is treated as a header and skipped if column B contains exactly "word" (case-insensitive). ' +
  'Otherwise all non-empty rows are treated as data, allowing sheets with or without a header row.'
)
divider()

h1('5. Session Algorithm')
body(
  'Each session consists of 12 steps. The algorithm selects words from mode-specific pools and builds a ' +
  'balanced step plan before the session starts.'
)
h2('Pool Building')
bullet([
  'Mode 1 pool: words where !learned && m1 < M1_MAX',
  'Mode 2 pool: words where !learned && m1 >= M1_MAX && m2 < M2_MAX',
  'Mode 3 pool: words where !learned && m2 >= M2_MAX && m3 < M3_MAX, sorted ascending by m3',
  'Mode 3 requires at least 6 words in pool; otherwise mode 3 is excluded',
  'If no modes available, session returns { steps: [], allLearned: true }',
])
h2('Step Planning')
bullet([
  'Steps distributed equally: 12 / N modes (e.g. 4+4+4, 6+6, or 12)',
  'Step list is shuffled so modes are interleaved rather than grouped',
  'Modes 1 & 2: shuffled word queue, cycling through all pool words',
  'Mode 3: pool split into non-overlapping groups of 6; each step uses next group (cycling)',
])
h2('Counter Updates')
bullet([
  'Counters accumulate locally during session -- no API calls mid-session',
  'On session complete: batchUpdateWords() sends all changed rows in one Sheets API call',
  '"Learn and hide" button: markLearned() fires immediately as a separate PUT request',
])
divider()

h1('6. Screens & Navigation')
h2('LoginScreen')
bullet([
  'App icon (icon-192.png) + app name centred on screen',
  '"Sign in with Google" button triggers GIS token request',
  'trySilentSignIn() called on load -- auto-navigates to Home if token obtained',
])
h2('HomeScreen')
bullet([
  'Three full-width buttons: Start session / Word List / Language',
  'Subtitle shows current language code and category filter',
])
h2('LanguageScreen')
bullet([
  'Lists all sheet tabs from db_words (filters out Sheet1 and system tabs)',
  'Checkmark on currently selected language; tap to select and return to Home',
])
h2('CategoryScreen')
bullet([
  'Lists all unique values from column A of the current language tab',
  '"All categories" option at top; checkmark on active selection',
])
h2('SessionScreen')
bullet([
  'Progress bar + step counter ("3 / 12") in top bar; back button exits without saving',
  'Renders FlipCard, MultipleChoice, or MatchingGrid based on step type',
  '"Next \u2192" button always visible at bottom (disabled until step completed)',
  'After step 12: saves counters, shows "Session complete!" screen',
])
h2('WordListScreen')
bullet([
  'Counter: "N learned / M total" in header',
  'Each row: word, translation, eye/crossed-eye icon',
  'Tap icon: toggles learned; un-learning resets all counters to 0 (immediate API write)',
])
divider()

h1('7. Learning Modes')
h2('Mode 1 -- FlipCard')
bullet([
  'Full-screen card: front = word, back = translation',
  'CSS 3D flip on X-axis (vertical rotation)',
  'Triggers: tap / click / vertical swipe (\u0394Y > 50px)',
  '"Learn and hide" button fires markLearned() immediately',
  'After flip: Next becomes active; on advance: m1++ locally',
])
h2('Mode 2 -- MultipleChoice')
bullet([
  'Top half: word card + "Learn and hide" button (capped at max-height: 45vh)',
  'Bottom half: 2\u00d72 grid of four translation options',
  'Wrong tap: red flash, resets; correct tap: green, Next active; m2++ on advance',
])
h2('Mode 3 -- MatchingGrid')
bullet([
  '2 columns: 6 words (left) and 6 translations (right), each independently shuffled',
  'Tap word -> orange highlight; tap matching translation -> green + deactivated',
  'Wrong translation: red flash, word stays selected',
  'All 6 matched -> Next active; m3++ for all 6 words on advance',
  'No "Learn and hide" button in Mode 3',
])
divider()

h1('8. Authentication')
h2('Silent Sign-In Flow')
bullet([
  'On app load: trySilentSignIn() calls requestAccessToken({ prompt: \'\' })',
  'If previously authorised: token returned without UI -> navigate to Home',
  'If not: GIS popup shown; on failure stays on LoginScreen',
  'User profile (email, name, picture) fetched and saved to localStorage',
])
h2('Token Lifecycle')
bullet([
  'Access token stored in memory -- never in localStorage',
  'Token lifetime: 1 hour (GIS implicit flow)',
  'On 401 from any API call: refreshTokenIfNeeded() re-requests silently',
])
h2('Required OAuth Scopes')
bullet([
  'email, profile -- user identity',
  'https://www.googleapis.com/auth/spreadsheets -- read/write db_words spreadsheet',
  'https://www.googleapis.com/auth/drive.metadata.readonly -- find spreadsheet in Drive',
])
divider()

h1('9. Sheets API Integration')
h2('Key API Calls')
code([
  'Drive: find db_words',
  "  GET /drive/v3/files?q=name='db_words'...",
  '',
  'Sheets: create if not found',
  "  POST /v4/spreadsheets  { properties: { title: 'db_words' } }",
  '',
  'Sheets: list language tabs',
  '  GET /v4/spreadsheets/{id}?fields=sheets.properties.title',
  '',
  'Sheets: read words',
  '  GET /v4/spreadsheets/{id}/values/{tab}!A1:G',
  '',
  'Sheets: batch-update counters after session',
  '  POST /v4/spreadsheets/{id}/values:batchUpdate',
  "  { valueInputOption: 'RAW', data: [{ range: '{tab}!D{row}:G{row}', values: [[m1,m2,m3,learned]] }] }",
  '',
  'Mark learned:    PUT /v4/spreadsheets/{id}/values/{tab}!G{row}?valueInputOption=RAW',
  'Reset counters:  PUT /v4/spreadsheets/{id}/values/{tab}!D{row}:G{row}?valueInputOption=RAW',
  '_settings read:  GET /v4/spreadsheets/{id}/values/_settings!A1:A2',
  '_settings write: PUT /v4/spreadsheets/{id}/values/_settings!A1:A2?valueInputOption=RAW',
])
divider()

h1('10. UI & Theme')
h2('Color System (CSS Variables)')
code([
  '                    Light           Dark',
  '--bg                #FFFFFF          #1C1C1C',
  '--surface           #F3F1EF          #2B2B2B',
  '--surface-2         #E8E8E8          #363636',
  '--text              #1C1C1C          #EFEFEF',
  '--text-muted        #6B6B6B          #949494',
  '--accent            #E07E38          #E8935A',
  '--success           #6BBF7A          #5AA569',
  '--error             #E07070          #C96060',
  '--border            #E0E0E0          #4A4A4A',
  '--card-bg           #FFFFFF          #363636',
])
h2('Layout Rules')
bullet([
  'All screens: height: 100dvh; overflow: hidden',
  'Next button wrapper: margin-top: auto in flex column -- pins to bottom',
  'Mode 2 top half: max-height: 45vh',
])
divider()

h1('11. PWA')
bullet([
  'manifest.json: name="Words", short_name="Words", display=standalone, theme_color="#E07E38"',
  'Service worker: App Shell cached on install; Sheets/Drive API uses network-first with cache fallback',
  'Icons: icon-192.png and icon-512.png',
  'Android: Chrome install prompt; iOS: Safari Share -> Add to Home Screen',
])
divider()

h1('12. Setup & Deployment')
h2('Local Development')
code([
  '1.  git clone https://github.com/JuliaSivridi/Words.git',
  '2.  npm install',
  '3.  Create .env:  VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com',
  '4.  npm run dev   ->  http://localhost:5173',
  '5.  npm run build ->  production output in dist/',
])
h2('Google Cloud Console')
bullet([
  'Enable Google Sheets API v4 and Google Drive API',
  'OAuth 2.0 Client ID -- type: Web application',
  'Authorized JavaScript Origins: http://localhost:5173 + your production URL',
  'OAuth consent screen: Testing mode, add your Google account as a test user',
])
h2('First-Time Data Setup')
body(
  'No manual spreadsheet setup required. On first login the app searches Google Drive for "db_words" and ' +
  'creates it if absent. Add a sheet tab named like "RU-EN", put words in columns B and C ' +
  '(category optionally in column A), and start a session.'
)

// Footer
doc.moveDown(1.5)
divider()
doc.fontSize(8.5).fillColor(LGRAY).font('Helvetica')
  .text('Words  \u00b7  Technical Specification  \u00b7  April 2026', { align: 'center' })

doc.end()
console.log('Done: docs/Words_TechSpec.pdf')
