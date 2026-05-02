import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, signOut } from '../auth.js'
import { parseLangLabel } from '../langMap.js'
import styles from './HomeScreen.module.css'

export default function HomeScreen({ sheetId, currentLang, currentCategory, onSignOut }) {
  const navigate = useNavigate()
  const user = getUser()

  const [langName, nativeName] = parseLangLabel(currentLang)
  const langSubLabel = currentLang
    ? (nativeName ? `${langName} — ${nativeName}` : langName)
    : 'Not selected'

  // currentCategory: null = all; string[] = subset
  const catSubLabel = !currentCategory
    ? 'All categories'
    : currentCategory.length === 1
      ? currentCategory[0]
      : `Multiple…`

  // ── User menu ────────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [menuOpen])

  function handleSignOut() {
    setMenuOpen(false)
    signOut()
    onSignOut()
  }

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <span className={styles.appName}>Words</span>
        <div className={styles.topBarRight}>
          <div className={styles.userMenuWrapper} ref={menuRef}>
            <button
              className={styles.userBtn}
              onClick={() => setMenuOpen(o => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className={styles.avatar} />
              ) : (
                <span className={styles.avatarFallback}>{user?.name?.[0] ?? '?'}</span>
              )}
            </button>

            {menuOpen && (
              <div className={styles.userMenu} role="menu">
                <div className={styles.userMenuHeader}>
                  <span className={styles.userMenuName}>{user?.name}</span>
                  <span className={styles.userMenuEmail}>{user?.email}</span>
                </div>
                <div className={styles.userMenuDivider} />
                <button
                  className={styles.userMenuItem}
                  onClick={() => { setMenuOpen(false); navigate('/settings') }}
                  role="menuitem"
                >
                  <GearIcon size={16} />
                  Settings
                </button>
                <button
                  className={styles.userMenuItem}
                  onClick={() => { setMenuOpen(false); navigate('/help') }}
                  role="menuitem"
                >
                  <HelpIcon />
                  Help
                </button>
                <button
                  className={styles.userMenuItem}
                  onClick={() => { setMenuOpen(false); navigate('/feedback') }}
                  role="menuitem"
                >
                  <FeedbackIcon />
                  Feedback
                </button>
                <button
                  className={styles.userMenuSignOut}
                  onClick={handleSignOut}
                  role="menuitem"
                >
                  <SignOutIcon />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`screen-content ${styles.content}`}>
        <div className={styles.buttons}>

          {/* Start — primary CTA */}
          <button
            className={`btn btn-primary btn-full ${styles.startBtn}`}
            onClick={() => navigate('/session')}
            disabled={!sheetId || !currentLang}
          >
            <PlayIcon className={styles.startIcon} />
            Start
          </button>

          {/* Language — shows selected language as sub-label */}
          <button
            className={`btn btn-secondary btn-full ${styles.navBtn}`}
            onClick={() => navigate('/language')}
          >
            <GlobeIcon />
            <span className={styles.btnTexts}>
              <span className={styles.btnMain}>Language</span>
              <span className={styles.btnSub}>{langSubLabel}</span>
            </span>
          </button>

          {/* Category — shows selected category as sub-label */}
          <button
            className={`btn btn-secondary btn-full ${styles.navBtn}`}
            onClick={() => navigate('/category')}
            disabled={!sheetId || !currentLang}
          >
            <TagIcon />
            <span className={styles.btnTexts}>
              <span className={styles.btnMain}>Category</span>
              <span className={styles.btnSub}>{catSubLabel}</span>
            </span>
          </button>

          {/* Word List */}
          <button
            className={`btn btn-secondary btn-full ${styles.navBtn}`}
            onClick={() => navigate('/words')}
            disabled={!sheetId || !currentLang}
          >
            <ListIcon />
            <span className={styles.btnTexts}>
              <span className={styles.btnMain}>Word List</span>
            </span>
          </button>

        </div>

        {!sheetId && (
          <p className={styles.hint}>Loading your Words sheet…</p>
        )}
      </div>
    </div>
  )
}

// ── Monochrome SVG icons ─────────────────────────────────────────────────────

function PlayIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
    </svg>
  )
}

function GearIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
    </svg>
  )
}

function FeedbackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
