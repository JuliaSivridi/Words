// Helpers for settings-aware word progression logic.
// settings shape: { mode1, mode2, mode3, m1Max, m2Max, m3Max, stepsPerSession }
import { M1_MAX, M2_MAX, M3_MAX } from './constants.js'

export const DEFAULT_SETTINGS = {
  mode1: true,
  mode2: true,
  mode3: true,
  stepsPerSession: 12,
  m1Max: M1_MAX,   // 4
  m2Max: M2_MAX,   // 8
  m3Max: M3_MAX,   // 12
}

// Resolve max values from settings, falling back to constants if missing.
function maxes(settings) {
  return {
    m1Max: settings.m1Max ?? M1_MAX,
    m2Max: settings.m2Max ?? M2_MAX,
    m3Max: settings.m3Max ?? M3_MAX,
  }
}

// A word is "learned" when:
//   • the learned flag is explicitly set (manually marked in Word List), OR
//   • every ACTIVE mode counter has reached its maximum.
// If a mode is disabled its counter is ignored entirely.
export function isWordLearned(word, settings = DEFAULT_SETTINGS) {
  if (word.learned) return true
  const { m1Max, m2Max, m3Max } = maxes(settings)
  if (settings.mode1 && word.m1 < m1Max) return false
  if (settings.mode2 && word.m2 < m2Max) return false
  if (settings.mode3 && word.m3 < m3Max) return false
  return true
}

// A word is eligible for mode N when:
//   • that mode is enabled
//   • its own counter hasn't reached the max
//   • every enabled mode with a lower index has already reached its max
//     (disabled modes are skipped — their counters don't gate the next mode)
export function isWordEligibleForMode(word, modeNum, settings = DEFAULT_SETTINGS) {
  const { m1Max, m2Max, m3Max } = maxes(settings)
  if (modeNum === 1) {
    return settings.mode1 && word.m1 < m1Max
  }
  if (modeNum === 2) {
    return (
      settings.mode2 &&
      word.m2 < m2Max &&
      (!settings.mode1 || word.m1 >= m1Max)
    )
  }
  if (modeNum === 3) {
    return (
      settings.mode3 &&
      word.m3 < m3Max &&
      (!settings.mode2 || word.m2 >= m2Max) &&
      (!settings.mode1 || word.m1 >= m1Max)
    )
  }
  return false
}
