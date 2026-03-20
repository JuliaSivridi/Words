import { useState } from 'react'
import NextButton from './NextButton.jsx'
import styles from './MatchingGrid.module.css'

// selected: { side: 'left'|'right', row: number } | null
// wrongFlash: { left: number|null, right: number|null }

export default function MatchingGrid({ step, onNext }) {
  const total = step.words.length // 6

  const [matched, setMatched]   = useState(new Set())
  const [selected, setSelected] = useState(null)
  const [wrongLeft, setWrongLeft]   = useState(null)
  const [wrongRight, setWrongRight] = useState(null)

  const allMatched = matched.size === total

  function handleTap(side, row) {
    // Ignore already-matched cards
    if (matched.has(row)) return

    if (selected === null) {
      // Nothing selected yet — select this card
      setSelected({ side, row })
      return
    }

    if (selected.side === side) {
      // Same column: switch selection (or deselect if same card)
      setSelected(selected.row === row ? null : { side, row })
      return
    }

    // Opposite column — try to match
    const leftRow  = side === 'left'  ? row : selected.row
    const rightRow = side === 'right' ? row : selected.row

    if (leftRow === rightRow) {
      // ✓ Correct pair
      const next = new Set(matched)
      next.add(leftRow)
      setMatched(next)
      setSelected(null)
    } else {
      // ✗ Wrong pair — flash both cards red then clear
      setWrongLeft(leftRow)
      setWrongRight(rightRow)
      setSelected(null)
      setTimeout(() => {
        setWrongLeft(null)
        setWrongRight(null)
      }, 500)
    }
  }

  function cardState(side, row) {
    if (matched.has(row)) return 'matched'
    if (side === 'left'  && wrongLeft  === row) return 'wrong'
    if (side === 'right' && wrongRight === row) return 'wrong'
    if (selected && selected.side === side && selected.row === row) return 'selected'
    return 'idle'
  }

  function handleNext() {
    setMatched(new Set())
    setSelected(null)
    setWrongLeft(null)
    setWrongRight(null)
    onNext()
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {/* Left column: words */}
        <div className={styles.column}>
          {step.leftCards.map(card => (
            <button
              key={`w-${card.row}`}
              className={`${styles.card} ${styles[cardState('left', card.row)]}`}
              onClick={() => handleTap('left', card.row)}
              disabled={matched.has(card.row)}
            >
              <span className={styles.cardText}>{card.text}</span>
            </button>
          ))}
        </div>

        {/* Right column: translations — always enabled until matched */}
        <div className={styles.column}>
          {step.rightCards.map(card => (
            <button
              key={`t-${card.row}`}
              className={`${styles.card} ${styles[cardState('right', card.row)]}`}
              onClick={() => handleTap('right', card.row)}
              disabled={matched.has(card.row)}
            >
              <span className={styles.cardText}>{card.text}</span>
            </button>
          ))}
        </div>
      </div>

      <NextButton onClick={handleNext} disabled={!allMatched} />
    </div>
  )
}
