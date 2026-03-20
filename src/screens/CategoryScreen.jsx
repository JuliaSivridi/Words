import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './CategoryScreen.module.css'

function getCategories(words) {
  const set = new Set()
  for (const w of words) {
    if (w.category) set.add(w.category)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

// currentCategory: null (= all) or string[] (= selected subset)
export default function CategoryScreen({ words, currentCategory, onSelect }) {
  const navigate = useNavigate()
  const categories = getCategories(words)

  const [selected, setSelected] = useState(() => {
    if (!currentCategory) return new Set(categories)
    return new Set(currentCategory)
  })

  const allSelected = categories.length === 0 || selected.size === categories.length

  // Toggle: all selected → clear all; otherwise → select all
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(categories))
  }

  function toggleOne(cat) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Save and go back — Back button saves the selection
  function handleBack() {
    if (allSelected || selected.size === 0) {
      onSelect(null) // null = "all categories", no filter
    } else {
      onSelect([...selected])
    }
    navigate('/')
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className="btn btn-ghost" onClick={handleBack} style={{ padding: '8px 16px' }}>
          ← Back
        </button>
        <span className={styles.title}>Category</span>
        <span style={{ width: 72 }} />
      </div>

      <div className={styles.list}>
        {/* "All categories" — toggles full selection */}
        <button
          className={`${styles.item} ${allSelected ? styles.selected : ''}`}
          onClick={toggleAll}
        >
          <span className={styles.itemLabel}>All categories</span>
          {allSelected && <CheckIcon />}
        </button>

        {categories.length === 0 && (
          <p className={styles.empty}>
            No categories found. Add a category in column G of your Google Sheet.
          </p>
        )}

        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.item} ${selected.has(cat) ? styles.selected : ''}`}
            onClick={() => toggleOne(cat)}
          >
            <span className={styles.itemLabel}>{cat}</span>
            {selected.has(cat) && <CheckIcon />}
          </button>
        ))}
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
