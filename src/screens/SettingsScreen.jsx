import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/Toast.jsx'
import { DEFAULT_SETTINGS } from '../settingsUtils.js'
import styles from './SettingsScreen.module.css'

const MODES = [
  { key: 'mode1', maxKey: 'm1Max', label: 'Flash-cards', description: 'Flip card — see the translation' },
  { key: 'mode2', maxKey: 'm2Max', label: 'Choice',      description: 'Pick the correct translation from 4 options' },
  { key: 'mode3', maxKey: 'm3Max', label: 'Match',       description: 'Match 6 word–translation pairs' },
]

export default function SettingsScreen({ settings, onChange }) {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  // ── Checkbox toggle ────────────────────────────────────────────────────────
  function handleToggle(key) {
    const next = { ...settings, [key]: !settings[key] }
    const anyActive = next.mode1 || next.mode2 || next.mode3
    if (!anyActive) {
      setToast('At least one mode must be active')
      return
    }
    onChange(next)
  }

  // ── Number field: commit on blur, reset to default if invalid ──────────────
  function handleNumberBlur(field, value) {
    const num = parseInt(value)
    if (!num || num <= 0) {
      onChange({ ...settings, [field]: DEFAULT_SETTINGS[field] })
    } else {
      onChange({ ...settings, [field]: num })
    }
  }

  // ── Reset all settings to defaults ────────────────────────────────────────
  function handleReset() {
    onChange({ ...DEFAULT_SETTINGS })
  }

  return (
    <div className={styles.screen}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>Settings</span>
      </div>

      <div className={styles.content}>

        {/* ── Session ─────────────────────────────────────────────────────── */}
        <p className={styles.sectionLabel}>Session</p>
        <div className={styles.list}>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.rowLabel}>Steps per session</span>
              <span className={styles.rowDesc}>Number of exercises in one session</span>
            </div>
            <input
              type="number"
              className={styles.numInput}
              defaultValue={settings.stepsPerSession ?? DEFAULT_SETTINGS.stepsPerSession}
              key={settings.stepsPerSession}
              min="1"
              onBlur={e => handleNumberBlur('stepsPerSession', e.target.value)}
            />
          </div>
        </div>

        {/* ── Learning modes ──────────────────────────────────────────────── */}
        <p className={styles.sectionLabel}>Learning modes</p>
        <div className={styles.list}>
          {MODES.map(({ key, maxKey, label, description }) => (
            <div key={key} className={styles.row}>
              {/* Checkbox on the left */}
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={!!settings[key]}
                onChange={() => handleToggle(key)}
              />
              {/* Label in the middle */}
              <div className={styles.rowText}>
                <span className={styles.rowLabel}>{label}</span>
                <span className={styles.rowDesc}>{description}</span>
              </div>
              {/* Max reps on the right */}
              <div className={styles.maxWrapper}>
                <span className={styles.maxLabel}>Max</span>
                <input
                  type="number"
                  className={styles.numInput}
                  defaultValue={settings[maxKey] ?? DEFAULT_SETTINGS[maxKey]}
                  key={settings[maxKey]}
                  min="1"
                  onBlur={e => handleNumberBlur(maxKey, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── Reset ───────────────────────────────────────────────────────── */}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset to defaults
        </button>

      </div>

      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
