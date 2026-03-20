import { useState, useRef } from 'react'
import NextButton from './NextButton.jsx'
import styles from './FlipCard.module.css'

export default function FlipCard({ step, onNext, onLearn }) {
  const [flipped, setFlipped] = useState(false)
  // hasFlipped: Next becomes available once the user has seen the back side
  const [hasFlipped, setHasFlipped] = useState(false)
  // markedLearned: tracks if the user clicked "Learn and hide" this step
  const [markedLearned, setMarkedLearned] = useState(false)
  const touchStartY = useRef(null)

  function handleFlip() {
    setFlipped(f => !f)
    setHasFlipped(true)
  }

  function handleTouchStart(e) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e) {
    if (touchStartY.current === null) return
    const delta = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    touchStartY.current = null
    if (delta > 50) handleFlip()
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.learnRow}>
        <button
          className={`btn ${styles.learnBtn} ${markedLearned ? styles.learnBtnDone : ''}`}
          onClick={() => { setMarkedLearned(true); onLearn() }}
          disabled={markedLearned}
        >
          {markedLearned ? 'Learned ✓' : 'Learn and hide'}
        </button>
      </div>

      <div className={styles.cardArea}>
        <div
          className={`${styles.flipContainer} ${flipped ? styles.flipped : ''}`}
          onClick={handleFlip}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Tap to flip back' : 'Tap to flip'}
          onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? handleFlip() : null}
        >
          <div className={styles.flipInner}>
            <div className={`${styles.face} ${styles.front}`}>
              <span className={styles.word}>{step.word.word}</span>
              <span className={styles.hint}>tap to flip</span>
            </div>
            <div className={`${styles.face} ${styles.back}`}>
              <span className={styles.word}>{step.word.translation}</span>
              <span className={styles.hint}>tap to flip back</span>
            </div>
          </div>
        </div>
      </div>

      <NextButton onClick={onNext} disabled={!hasFlipped && !markedLearned} />
    </div>
  )
}
