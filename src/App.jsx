import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  getUser,
  initAuth,
  trySilentSignIn,
  onAuthChange,
} from './auth.js'
import { findOrCreateWordsFile, readSettings, writeSettings } from './sheetsApi.js'
import { useWords } from './hooks/useWords.js'

import LoginScreen from './screens/LoginScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import SessionScreen from './screens/SessionScreen.jsx'
import WordListScreen from './screens/WordListScreen.jsx'
import LanguageScreen from './screens/LanguageScreen.jsx'
import CategoryScreen from './screens/CategoryScreen.jsx'

// ── helpers: persist category as JSON in localStorage ─────────────────────
function loadCategoryFromStorage() {
  try {
    const raw = localStorage.getItem('words_category')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

function saveCategoryToStorage(cat) {
  if (cat && cat.length > 0) {
    localStorage.setItem('words_category', JSON.stringify(cat))
  } else {
    localStorage.removeItem('words_category')
  }
}

// Category stored in sheet as comma-separated string; "" = all
function categoryToSheetValue(cat) {
  if (!cat || cat.length === 0) return ''
  return cat.join(',')
}

function categoryFromSheetValue(val) {
  if (!val) return null
  const arr = val.split(',').map(s => s.trim()).filter(Boolean)
  return arr.length > 0 ? arr : null
}

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)
  const [sheetId, setSheetId] = useState(null)
  const [currentLang, setCurrentLang] = useState(
    () => localStorage.getItem('words_lang') ?? null
  )
  // null = "All categories"; string[] = specific categories
  const [sessionCategory, setSessionCategory] = useState(loadCategoryFromStorage)

  // ── Auth init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    initAuth(async () => {
      const ok = await trySilentSignIn()
      setUser(ok ? getUser() : null)
      setAuthReady(true)
    })

    const unsub = onAuthChange(u => setUser(u))
    return unsub
  }, [])

  // ── Find sheet + sync settings after login ─────────────────────────────────
  useEffect(() => {
    if (!user) { setSheetId(null); return }
    findOrCreateWordsFile()
      .then(async id => {
        setSheetId(id)
        try {
          const settings = await readSettings(id)
          if (settings.language) {
            setCurrentLang(settings.language)
            localStorage.setItem('words_lang', settings.language)
          }
          const cat = categoryFromSheetValue(settings.category)
          setSessionCategory(cat)
          saveCategoryToStorage(cat)
        } catch {
          // Settings read failed — keep localStorage values
        }
      })
      .catch(() => setSheetId(null))
  }, [user])

  // ── Words ──────────────────────────────────────────────────────────────────
  const { words, loading, saveSessionUpdates, setLearned, resetWord, reload } =
    useWords(sheetId, currentLang)

  function handleLangSelect(tab) {
    setCurrentLang(tab)
    localStorage.setItem('words_lang', tab)
    reload()
    if (sheetId) {
      writeSettings(sheetId, {
        language: tab,
        category: categoryToSheetValue(sessionCategory),
      }).catch(() => {})
    }
  }

  function handleCategorySelect(cat) {
    // cat is null (all) or string[]
    setSessionCategory(cat)
    saveCategoryToStorage(cat)
    if (sheetId) {
      writeSettings(sheetId, {
        language: currentLang ?? '',
        category: categoryToSheetValue(cat),
      }).catch(() => {})
    }
  }

  async function handleSessionComplete(updates, immediate = false) {
    if (!updates.length) return
    if (immediate) {
      const u = updates[0]
      await setLearned(u.row, u.learned)
    } else {
      await saveSessionUpdates(updates)
    }
  }

  function handleToggleLearned(word) {
    if (word.learned) {
      resetWord(word.row)
    } else {
      setLearned(word.row, true)
    }
  }

  function handleSignOut() {
    setUser(null)
    setSheetId(null)
  }

  if (!authReady) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Loading…</span>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={() => setUser(getUser())} />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomeScreen
            sheetId={sheetId}
            currentLang={currentLang}
            currentCategory={sessionCategory}
            onSignOut={handleSignOut}
          />
        }
      />
      <Route
        path="/session"
        element={
          sheetId && currentLang ? (
            <SessionScreen
              sheetId={sheetId}
              tab={currentLang}
              words={words}
              categoryFilter={sessionCategory}
              onSessionComplete={handleSessionComplete}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/words"
        element={
          sheetId && currentLang ? (
            <WordListScreen
              words={words}
              loading={loading}
              categoryFilter={sessionCategory}
              onToggleLearned={handleToggleLearned}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/language"
        element={
          <LanguageScreen
            sheetId={sheetId}
            currentLang={currentLang}
            onSelect={handleLangSelect}
          />
        }
      />
      <Route
        path="/category"
        element={
          sheetId && currentLang ? (
            <CategoryScreen
              words={words}
              currentCategory={sessionCategory}
              onSelect={handleCategorySelect}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
