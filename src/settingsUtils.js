// Helpers for settings-aware word progression logic.
// All functions accept a `settings` object: { mode1, mode2, mode3 } (booleans).
import { M1_MAX, M2_MAX, M3_MAX } from './constants.js'

export const DEFAULT_SETTINGS = { mode1: true, mode2: true, mode3: true }

// A word is "learned" when every ACTIVE mode counter has reached its maximum.
// If a mode is disabled its counter is ignored entirely.
export function isWordLearned(word, settings = DEFAULT_SETTINGS) {
  if (settings.mode1 && word.m1 < M1_MAX) return false
  if (settings.mode2 && word.m2 < M2_MAX) return false
  if (settings.mode3 && word.m3 < M3_MAX) return false
  return true
}

// A word is eligible for mode N when:
//   • that mode is enabled
//   • its own counter hasn't reached the max
//   • every enabled mode with a lower index has already reached its max
//     (disabled modes are skipped — their counters don't gate the next mode)
export function isWordEligibleForMode(word, modeNum, settings = DEFAULT_SETTINGS) {
  if (modeNum === 1) {
    return settings.mode1 && word.m1 < M1_MAX
  }
  if (modeNum === 2) {
    return (
      settings.mode2 &&
      word.m2 < M2_MAX &&
      (!settings.mode1 || word.m1 >= M1_MAX)
    )
  }
  if (modeNum === 3) {
    return (
      settings.mode3 &&
      word.m3 < M3_MAX &&
      (!settings.mode2 || word.m2 >= M2_MAX) &&
      (!settings.mode1 || word.m1 >= M1_MAX)
    )
  }
  return false
}
