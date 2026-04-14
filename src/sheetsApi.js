// Google Sheets API v4 + Drive API v3 – direct browser calls
import { getAccessToken, refreshTokenIfNeeded } from './auth.js'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

async function request(url, options = {}) {
  await refreshTokenIfNeeded()
  const token = getAccessToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

// ─── Drive: find or create "db_words" spreadsheet ───────────────────────────

const DB_FILE_NAME = 'db_words'

export async function findOrCreateWordsFile() {
  const cached = localStorage.getItem('words_sheet_id')
  if (cached) return cached

  // Search for existing file
  const query = encodeURIComponent(
    `name='${DB_FILE_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  )
  const list = await request(`${DRIVE_BASE}/files?q=${query}&fields=files(id,name)`)

  if (list.files.length > 0) {
    const id = list.files[0].id
    localStorage.setItem('words_sheet_id', id)
    return id
  }

  // Create new spreadsheet
  const created = await request(SHEETS_BASE, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: DB_FILE_NAME },
    }),
  })
  localStorage.setItem('words_sheet_id', created.spreadsheetId)
  return created.spreadsheetId
}

// ─── Sheets: list language tabs ─────────────────────────────────────────────

export async function getLanguageTabs(sheetId) {
  const data = await request(`${SHEETS_BASE}/${sheetId}?fields=sheets.properties.title`)
  return data.sheets
    .map(s => s.properties.title)
    .filter(t => t !== 'Sheet1' && t !== 'Лист1' && t !== '_settings')
}

// ─── Sheets: read words ──────────────────────────────────────────────────────

// Returns array of word objects:
// { row, word, translation, m1, m2, m3, learned, category }
// row is 1-based sheet row number.
// Column layout: A=category, B=word, C=translation, D=m1, E=m2, F=m3, G=learned
// Handles sheets with or without a header row:
//   - If row 1 column B is exactly "word" (case-insensitive), treat as header and skip.
//   - Otherwise all non-empty rows are data.
export async function getWords(sheetId, tab) {
  const range = encodeURIComponent(`${tab}!A1:G`)
  const data = await request(`${SHEETS_BASE}/${sheetId}/values/${range}`)
  const rows = data.values ?? []

  const hasHeader = rows.length > 0 &&
    rows[0][1]?.toString().trim().toLowerCase() === 'word'

  const dataRows = hasHeader ? rows.slice(1) : rows
  const rowOffset = hasHeader ? 2 : 1

  // Map with actual sheet row number BEFORE filtering.
  // Filtering after mapping ensures empty rows in the middle of the sheet
  // don't shift the row indices of subsequent words.
  return dataRows
    .map((r, i) => ({
      row: rowOffset + i,
      category: r[0]?.trim() ?? '',
      word: r[1]?.trim() ?? '',
      translation: r[2]?.trim() ?? '',
      m1: parseInt(r[3]) || 0,
      m2: parseInt(r[4]) || 0,
      m3: parseInt(r[5]) || 0,
      learned: r[6] === 'TRUE' || r[6] === true,
    }))
    .filter(w => w.word)
}

// ─── Sheets: batch-update counters after session ─────────────────────────────

// updates is array of { row, m1, m2, m3, learned }
export async function batchUpdateWords(sheetId, tab, updates) {
  if (!updates.length) return

  const data = updates.map(u => ({
    range: `${tab}!D${u.row}:G${u.row}`,
    values: [[u.m1, u.m2, u.m3, u.learned ? 'TRUE' : 'FALSE']],
  }))

  await request(`${SHEETS_BASE}/${sheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ valueInputOption: 'RAW', data }),
  })
}

// ─── Sheets: mark single word learned immediately ───────────────────────────

export async function markLearned(sheetId, tab, row, learned) {
  const range = encodeURIComponent(`${tab}!G${row}`)
  await request(`${SHEETS_BASE}/${sheetId}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [[learned ? 'TRUE' : 'FALSE']] }),
  })
}

// ─── Sheets: reset word counters (un-learn) ──────────────────────────────────

export async function resetWordCounters(sheetId, tab, row) {
  const range = encodeURIComponent(`${tab}!D${row}:G${row}`)
  await request(`${SHEETS_BASE}/${sheetId}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [[0, 0, 0, 'FALSE']] }),
  })
}

// ─── Sheets: _settings tab ───────────────────────────────────────────────────
// Stores app settings as key-value pairs for human readability:
//   A1=language   B1=RU-EN
//   A2=category   B2=Animals
//   A3=mode1      B3=TRUE
//   A4=mode2      B4=FALSE
//   A5=mode3      B5=TRUE
// Backward compat: old format had only column A (positional). Detected by
// checking whether A1 contains the literal key "language".

async function ensureSettingsTab(sheetId) {
  const data = await request(`${SHEETS_BASE}/${sheetId}?fields=sheets.properties.title`)
  const titles = data.sheets.map(s => s.properties.title)
  if (titles.includes('_settings')) return

  await request(`${SHEETS_BASE}/${sheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: '_settings' } } }],
    }),
  })
}

export async function readSettings(sheetId) {
  try {
    const range = encodeURIComponent('_settings!A1:B10')
    const data = await request(`${SHEETS_BASE}/${sheetId}/values/${range}`)
    const rows = data.values ?? []

    // New key-value format: A1 = "language"
    if (rows[0]?.[0] === 'language') {
      const map = {}
      for (const row of rows) {
        if (row[0]) map[row[0]] = row[1] ?? ''
      }
      return {
        language: map.language || null,
        category: map.category || null,
        mode1: map.mode1 !== 'FALSE',
        mode2: map.mode2 !== 'FALSE',
        mode3: map.mode3 !== 'FALSE',
      }
    }

    // Legacy format: A1=language value, A2=category value
    return {
      language: rows[0]?.[0] || null,
      category: rows[1]?.[0] || null,
      mode1: true,
      mode2: true,
      mode3: true,
    }
  } catch {
    return { language: null, category: null, mode1: true, mode2: true, mode3: true }
  }
}

export async function writeSettings(sheetId, { language, category, mode1, mode2, mode3 }) {
  await ensureSettingsTab(sheetId)
  const range = encodeURIComponent('_settings!A1:B5')
  await request(`${SHEETS_BASE}/${sheetId}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({
      values: [
        ['language', language ?? ''],
        ['category', category ?? ''],
        ['mode1',    mode1 !== false ? 'TRUE' : 'FALSE'],
        ['mode2',    mode2 !== false ? 'TRUE' : 'FALSE'],
        ['mode3',    mode3 !== false ? 'TRUE' : 'FALSE'],
      ],
    }),
  })
}
