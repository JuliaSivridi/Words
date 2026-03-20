import { useState } from 'react'
import NextButton from './NextButton.jsx'
import styles from './MultipleChoice.module.css'

export default function MultipleChoice({ step, onNext, onLearn }) {
  const [selected, setSelected] = useState(null) // row of selected card
  const [correct, setCorrect] = useState(false)
  const [markedLearned, setMarkedLearned] = useState(false)

  function handleChoice(word) {
    if (correct) return
    setSelected(word.row)
    if (word.row === step.word.row) {
      setCorrect(true)
    }
  }

  function handleNext() {
    setSelected(null)
    setCorrect(false)
    onNext()
  }

  function cardState(word) {
    if (correct && word.row === step.word.row) return 'correct'
    if (!correct && selected === word.row) return 'wrong'
    return 'idle'
  }

  return (
    <div className={styles.wrapper}>
      {/* Top half: word */}
      <div className={styles.topHalf}>
        <div className={styles.learnRow}>
          <button
            className={`btn ${styles.learnBtn} ${markedLearned ? styles.learnBtnDone : ''}`}
            onClick={() => { setMarkedLearned(true); onLearn() }}
            disabled={markedLearned}
          >
            {markedLearned ? 'Learned ✓' : 'Learn and forget'}
          </button>
        </div>
        <div className={styles.wordCard}>
          <span className={styles.word}>{step.word.word}</span>
        </div>
      </div>

      {/* Bottom half: 4 choices */}
      <div className={styles.bottomHalf}>
        <div className={styles.grid}>
          {step.choices.map(choice => (
            <button
              key={choice.row}
              className={`${styles.choiceCard} ${styles[cardState(choice)]}`}
              onClick={() => handleChoice(choice)}
              disabled={correct}
            >
              <span className={styles.choiceText}>{choice.translation}</span>
            </button>
          ))}
        </div>
      </div>

      <NextButton onClick={handleNext} disabled={!correct && !markedLearned} />
    </div>
  )
}
