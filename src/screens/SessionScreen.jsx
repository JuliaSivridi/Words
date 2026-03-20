import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildSession } from '../hooks/useSession.js'
import { M1_MAX, M2_MAX, M3_MAX } from '../constants.js'
import FlipCard from '../components/FlipCard.jsx'
import MultipleChoice from '../components/MultipleChoice.jsx'
import MatchingGrid from '../components/MatchingGrid.jsx'
import styles from './SessionScreen.module.css'

const TOTAL_STEPS = 12

export default function SessionScreen({ sheetId, tab, words, categoryFilter, onSessionComplete }) {
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [allLearned, setAllLearned] = useState(false)

  // Accumulate counter changes during session
  // Map: row → { m1, m2, m3, learned }
  const pendingUpdates = useRef(new Map())

  // Guard: build session only once per mount, not every time words updates.
  // words changes when session results are saved — without this guard the
  // session would reset itself right after completing.
  const sessionBuilt = useRef(false)

  useEffect(() => {
    if (sessionBuilt.current || !words.length) return
    sessionBuilt.current = true
    const { steps, allLearned: learned } = buildSession(words, categoryFilter)
    if (learned || !steps.length) {
      setAllLearned(true)
      return
    }
    setSession(steps)
    pendingUpdates.current = new Map()
  }, [words])

  function getWordState(row) {
    if (pendingUpdates.current.has(row)) return pendingUpdates.current.get(row)
    const w = words.find(w => w.row === row)
    return w ? { m1: w.m1, m2: w.m2, m3: w.m3, learned: w.learned } : null
  }

  function incrementCounter(step) {
    if (step.mode === 1) {
      const state = getWordState(step.word.row)
      if (state) {
        pendingUpdates.current.set(step.word.row, {
          ...state,
          m1: Math.min(state.m1 + 1, M1_MAX),
        })
      }
    } else if (step.mode === 2) {
      const state = getWordState(step.word.row)
      if (state) {
        pendingUpdates.current.set(step.word.row, {
          ...state,
          m2: Math.min(state.m2 + 1, M2_MAX),
        })
      }
    } else if (step.mode === 3) {
      step.words.forEach(w => {
        const state = getWordState(w.row)
        if (state) {
          const newM3 = Math.min(state.m3 + 1, M3_MAX)
          pendingUpdates.current.set(w.row, {
            ...state,
            m3: newM3,
            learned: newM3 >= M3_MAX ? true : state.learned,
          })
        }
      })
    }
  }

  async function handleNext() {
    const step = session[stepIndex]
    incrementCounter(step)

    if (stepIndex + 1 >= TOTAL_STEPS) {
      // Session done — collect and save
      const updates = []
      pendingUpdates.current.forEach((state, row) => {
        updates.push({ row, ...state })
      })
      await onSessionComplete(updates)
      setDone(true)
    } else {
      setStepIndex(i => i + 1)
    }
  }

  async function handleLearn(row) {
    // Mark learned immediately (saves to sheet via onSessionComplete pathway)
    // We set learned in pending and also call immediate save via parent
    const state = getWordState(row)
    if (state) {
      pendingUpdates.current.set(row, { ...state, learned: true })
    }
    await onSessionComplete([{ row, ...getWordState(row) }], true)
  }

  if (allLearned) {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>
          <div className={styles.completeIcon}>🎉</div>
          <h2 className={styles.completeTitle}>All words learned!</h2>
          <p className={styles.completeSub}>You've mastered all the words in this language.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>
          <div className={styles.completeIcon}>✓</div>
          <h2 className={styles.completeTitle}>Session complete!</h2>
          <p className={styles.completeSub}>Great job! Keep practising.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>
          <p className="text-muted">Loading session…</p>
        </div>
      </div>
    )
  }

  const step = session[stepIndex]

  return (
    <div className={styles.screen}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((stepIndex) / TOTAL_STEPS) * 100}%` }} />
      </div>

      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>✕</button>
        <span className={styles.stepCount}>{stepIndex + 1} / {TOTAL_STEPS}</span>
        <span style={{ width: 40 }} />
      </div>

      <div className={`${styles.stepArea} animate-in`} key={stepIndex}>
        {step.mode === 1 && (
          <FlipCard
            step={step}
            onNext={handleNext}
            onLearn={() => handleLearn(step.word.row)}
          />
        )}
        {step.mode === 2 && (
          <MultipleChoice
            step={step}
            onNext={handleNext}
            onLearn={() => handleLearn(step.word.row)}
          />
        )}
        {step.mode === 3 && (
          <MatchingGrid
            step={step}
            onNext={handleNext}
          />
        )}
      </div>
    </div>
  )
}
