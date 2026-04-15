// Builds a session from the available words.
// Returns { steps, allLearned }
import { DEFAULT_SETTINGS, isWordLearned, isWordEligibleForMode } from '../settingsUtils.js'

function pickRandomN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ─── Mode 3 pool with cross-category supplements ─────────────────────────────
// Normally mode 3 requires m2 >= M2_MAX, but if some selected categories have
// no qualifying words yet, we supplement from those categories' most-advanced
// unlearned words so that every selected category is represented in the grid.
function buildMode3Pool(active, categoryFilter, settings) {
  const qualified = active
    .filter(w => isWordEligibleForMode(w, 3, settings))
    .sort((a, b) => a.m3 - b.m3)

  if (!categoryFilter || categoryFilter.length <= 1) return qualified

  const presentCats = new Set(qualified.map(w => w.category))
  const missingCats = categoryFilter.filter(c => !presentCats.has(c))

  if (missingCats.length === 0) return qualified

  const slotsPerCat = Math.ceil(6 / categoryFilter.length)
  const supplements = missingCats.flatMap(cat =>
    active
      .filter(w => w.category === cat && w.m3 < M3_MAX)
      .sort((a, b) => (b.m2 + b.m1) - (a.m2 + a.m1))
      .slice(0, slotsPerCat)
  )

  return [...qualified, ...supplements]
}

// ─── Slice the mode 3 pool into non-overlapping groups of 6 ──────────────────
// Each group will be shown in a separate mode 3 step, so different words
// appear each time mode 3 comes up within the same session.
function buildMode3Groups(pool) {
  const groups = []
  for (let i = 0; i + 6 <= pool.length; i += 6) {
    groups.push(pool.slice(i, i + 6))
  }
  return groups
}

// ─── Main session builder ─────────────────────────────────────────────────────
// categoryFilter: null = all words; string[] = only words whose category is in the array
// settings: { mode1, mode2, mode3 } — which modes are enabled
export function buildSession(words, categoryFilter = null, settings = DEFAULT_SETTINGS) {
  const filtered = categoryFilter && categoryFilter.length > 0
    ? words.filter(w => categoryFilter.includes(w.category))
    : words

  const active = filtered.filter(w => !isWordLearned(w, settings))

  const mode1Pool   = active.filter(w => isWordEligibleForMode(w, 1, settings))
  const mode2Pool   = active.filter(w => isWordEligibleForMode(w, 2, settings))
  const mode3Pool   = buildMode3Pool(active, categoryFilter, settings)
  const mode3Groups = buildMode3Groups(mode3Pool)

  const availableModes = []
  if (mode1Pool.length > 0)   availableModes.push(1)
  if (mode2Pool.length > 0)   availableModes.push(2)
  if (mode3Groups.length > 0) availableModes.push(3)  // at least one full group of 6

  if (!availableModes.length) {
    return { steps: [], allLearned: true }
  }

  // ── Plan: equal slots per mode, total = stepsPerSession ────────────────────
  // 3 modes available → N/3 each
  // 2 modes available → N/2 each
  // 1 mode available  → N all
  const TOTAL    = settings.stepsPerSession ?? 12
  const perMode  = Math.floor(TOTAL / availableModes.length)
  const remainder = TOTAL % availableModes.length

  const plan = []
  for (let mi = 0; mi < availableModes.length; mi++) {
    const count = perMode + (mi < remainder ? 1 : 0)
    for (let j = 0; j < count; j++) {
      plan.push(availableModes[mi])
    }
  }

  // Shuffle so modes are interleaved rather than bunched
  const shuffledPlan = shuffle(plan)

  // ── Queues for modes 1 & 2: cycle through all words before repeating ────────
  const mode1Queue = shuffle([...mode1Pool])
  const mode2Queue = shuffle([...mode2Pool])
  let m1i = 0
  let m2i = 0
  let m3i = 0  // which mode 3 group to show next

  const steps = []
  for (const mode of shuffledPlan) {
    if (mode === 1) {
      const word = mode1Queue[m1i % mode1Queue.length]
      m1i++
      steps.push({ mode: 1, word })

    } else if (mode === 2) {
      const word = mode2Queue[m2i % mode2Queue.length]
      m2i++
      // Wrong answers from the same category-filtered set; fall back to full list if too few
      const filteredWrongPool = filtered.filter(w => w.row !== word.row)
      const wrongPool = filteredWrongPool.length >= 3
        ? filteredWrongPool
        : words.filter(w => w.row !== word.row)
      const wrong = pickRandomN(wrongPool, 3)
      steps.push({ mode: 2, word, choices: shuffle([word, ...wrong]) })

    } else {
      // Rotate through groups — each mode 3 step shows a different set of 6 words
      const group = mode3Groups[m3i % mode3Groups.length]
      m3i++
      const leftCards  = shuffle(group.map(w => ({ row: w.row, text: w.word })))
      const rightCards = shuffle(group.map(w => ({ row: w.row, text: w.translation })))
      steps.push({ mode: 3, words: group, leftCards, rightCards })
    }
  }

  return { steps, allLearned: false }
}
