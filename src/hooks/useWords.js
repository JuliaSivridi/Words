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
    const updates = updatedWords.map(w => ({
      row: w.row,
      m1: w.m1,
      m2: w.m2,
      m3: w.m3,
      learned: w.learned,
    }))
    await batchUpdateWords(sheetId, tab, updates)
    // Merge updates: keep word/translation, override counters/learned
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
