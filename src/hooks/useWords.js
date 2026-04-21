import { useState, useEffect, useCallback } from 'react'
import {
  getWords,
  batchUpdateWords,
  markLearned,
  resetWordCounters,
} from '../sheetsApi.js'

export function useWords(sheetId, tab) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!sheetId || !tab) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWords(sheetId, tab)
      setWords(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sheetId, tab])

  useEffect(() => {
    load()
  }, [load])

  // After session: save updated counters for changed words
  const saveSessionUpdates = useCallback(async (updatedWords) => {
    if (!sheetId || !tab) return

    // 1. Write counters only (D:F) — never write the learned column from here.
    //    This prevents session results from ever overwriting a manually-set learned=TRUE.
    await batchUpdateWords(sheetId, tab, updatedWords)

    // 2. For words that just became learned (reached all mode maxes), mark them
    //    explicitly. Idempotent if handleLearn already called markLearned earlier.
    const learnedWords = updatedWords.filter(w => w.learned)
    await Promise.all(learnedWords.map(w => markLearned(sheetId, tab, w.row, true)))

    // 3. Merge into local state
    setWords(prev =>
      prev.map(w => {
        const updated = updatedWords.find(u => u.row === w.row)
        return updated ? { ...w, ...updated } : w
      })
    )
  }, [sheetId, tab])

  // Mark a word as learned (immediate save)
  const setLearned = useCallback(async (row, learned) => {
    setWords(prev =>
      prev.map(w => w.row === row ? { ...w, learned } : w)
    )
    await markLearned(sheetId, tab, row, learned)
  }, [sheetId, tab])

  // Reset counters (un-learn)
  const resetWord = useCallback(async (row) => {
    setWords(prev =>
      prev.map(w => w.row === row ? { ...w, m1: 0, m2: 0, m3: 0, learned: false } : w)
    )
    await resetWordCounters(sheetId, tab, row)
  }, [sheetId, tab])

  return { words, loading, error, reload: load, saveSessionUpdates, setLearned, resetWord }
}
