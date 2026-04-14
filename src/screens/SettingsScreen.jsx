import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/Toast.jsx'
import styles from './SettingsScreen.module.css'

const MODES = [
  { key: 'mode1', label: 'Flash-cards', description: 'Flip card — see the translation' },
  { key: 'mode2', label: 'Choice',      description: 'Pick the correct translation from 4 options' },
  { key: 'mode3', label: 'Match',       description: 'Match 6 word–translation pairs' },
]

export default function SettingsScreen({ settings, onChange }) {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  function handleToggle(key) {
    const next = { ...settings, [key]: !settings[key] }

    // Guard: at least one mode must remain active
    const anyActive = Object.values(next).some(Boolean)
    if (!anyActive) {
      setToast('At least one mode must be active')
      return
    }

    onChange(next)
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
        <p className={styles.sectionLabel}>Learning modes</p>

        <div className={styles.list}>
          {MODES.map(({ key, label, description }) => (
            <label key={key} className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowLabel}>{label}</span>
                <span className={styles.rowDesc}>{description}</span>
              </div>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={!!settings[key]}
                onChange={() => handleToggle(key)}
              />
            </label>
          ))}
        </div>
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
