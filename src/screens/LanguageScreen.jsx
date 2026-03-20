import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLanguageTabs } from '../sheetsApi.js'
import { parseLangLabel } from '../langMap.js'
import CheckIcon from '../components/CheckIcon.jsx'
import styles from './LanguageScreen.module.css'

export default function LanguageScreen({ sheetId, currentLang, onSelect }) {
  const navigate = useNavigate()
  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sheetId) return
    getLanguageTabs(sheetId)
      .then(setTabs)
      .catch(() => setError('Could not load language tabs.'))
      .finally(() => setLoading(false))
  }, [sheetId])

  function handleSelect(tab) {
    onSelect(tab)
    navigate('/')
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '8px 16px' }}>
          ← Back
        </button>
        <span className="top-bar-title">Language</span>
        <span style={{ width: 80 }} />
      </div>

      <div className="screen-content">
        {loading && <p className="text-muted" style={{ textAlign: 'center', marginTop: 32 }}>Loading…</p>}
        {error && <p style={{ color: 'var(--error)', textAlign: 'center', marginTop: 32 }}>{error}</p>}

        {!loading && !error && tabs.length === 0 && (
          <div className={styles.empty}>
            <p>No language sheets found.</p>
            <p className="text-muted" style={{ marginTop: 8, fontSize: '0.9rem' }}>
              Open your <strong>Words</strong> Google Sheet and add a tab named like <strong>RU-EN</strong> (translation–study language).
            </p>
          </div>
        )}

        <div className={styles.list}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={`${styles.tabItem} ${tab === currentLang ? styles.selected : ''}`}
              onClick={() => handleSelect(tab)}
            >
              <span className={styles.tabName}>{formatTabName(tab)}</span>
              <span className={styles.tabCode}>{tab}</span>
              {tab === currentLang && <span className={styles.check}><CheckIcon /></span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatTabName(tab) {
  const [study, native] = parseLangLabel(tab)
  if (!native) return study || tab
  return `${study} (${native})`
}
