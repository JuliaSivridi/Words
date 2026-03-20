import { useState } from 'react'
import styles from './FilterDialog.module.css'

// categories: string[] — all unique categories from current words
// activeCategories: string[] | null — null means "all" (no filter)
// onApply: (selected: string[] | null) => void  — null means "all"
// onClose: () => void
export default function FilterDialog({ categories, activeCategories, onApply, onClose }) {
  // Internal state: null = "all selected", array = specific selection
  const [selected, setSelected] = useState(
    activeCategories === null ? new Set(categories) : new Set(activeCategories)
  )

  const allChecked = selected.size === categories.length
  const noneChecked = selected.size === 0

  function toggle(cat) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(categories))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  function handleApply() {
    if (allChecked) {
      onApply(null) // null = no filter = show all
    } else {
      onApply([...selected])
    }
    onClose()
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <span className={styles.dialogTitle}>Filter by category</span>
        </div>

        {/* Select all / deselect all */}
        <div className={styles.toggleRow}>
          <button
            className={styles.toggleBtn}
            onClick={selectAll}
            disabled={allChecked}
          >
            Select all
          </button>
          <button
            className={styles.toggleBtn}
            onClick={deselectAll}
            disabled={noneChecked}
          >
            Deselect all
          </button>
        </div>

        {/* Category checkboxes */}
        <div className={styles.checkList}>
          {categories.map(cat => (
            <label key={cat} className={styles.checkItem}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selected.has(cat)}
                onChange={() => toggle(cat)}
              />
              <span className={styles.checkLabel}>{cat}</span>
            </label>
          ))}
          {categories.length === 0 && (
            <p className={styles.empty}>No categories in current word list.</p>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={`btn btn-secondary`} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn btn-primary`}
            onClick={handleApply}
            disabled={noneChecked}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
