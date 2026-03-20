// Builds a 12-step session from the available words.
// Returns { steps, allLearned }
import { M1_MAX, M2_MAX, M3_MAX } from '../constants.js'

function pickRandomN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ─── Spread across categories ────────────────────────────────────────────────
// Round-robin pick across category groups.
// `pool` must be pre-sorted (least-seen first) within each category.
function pickSpread(pool, count) {
  const groups = new Map()
  for (const w of pool) {
    const cat = w.category ?? ''
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(w)
  }

  if (groups.size <= 1) return pool.slice(0, count)

  const groupArrays = [...groups.values()]
  const indices = new Array(groupArrays.length).fill(0)
  const result = []

  while (result.length < count) {
    let anyAdded = false
    for (let g = 0; g < groupArrays.length && result.length < count; g++) {
      if (indices[g] < groupArrays[g].length) {
        result.push(groupArrays[g][indices[g]])
        indices[g]++
        anyAdded = true
      }
    }
    if (!anyAdded) break
  }

  return result
}

// ─── Mode 3 pool with cross-category supplements ─────────────────────────────
// Normally mode 3 requires m2 >= M2_MAX, but if some selected categories have
// no qualifying words yet, we supplement from those categories' most-advanced
// unlearned words so that every selected category is represented in the grid.
function buildMode3Pool(active, categoryFilter) {
  const qualified = active
    .filter(w => w.m2 >= M2_MAX && w.m3 < M3_MAX)
    .sort((a, b) => a.m3 - b.m3)

  // No multi-category concern → use strict pool as-is
  if (!categoryFilter || categoryFilter.length <= 1) return qualified

  // Find which selected categories are missing from the qualified pool
  const presentCats = new Set(qualified.map(w => w.category))
  const missingCats = categoryFilter.filter(c => !presentCats.has(c))

  if (missingCats.length === 0) return qualified // all categories already present

  // For each missing category, add its most-advanced unlearned words as supplements
  // (sorted by m2 desc, then m1 desc — proxy for readiness)
  const slotsPerCat = Math.ceil(6 / categoryFilter.length)
  const supplements = missingCats.flatMap(cat =>
    active
      .filter(w => w.category === cat && w.m3 < M3_MAX)
      .sort((a, b) => (b.m2 + b.m1) - (a.m2 + a.m1))
      .slice(0, slotsPerCat)
  )

  return [...qualified, ...supplements]
}

// ─── Main session builder ─────────────────────────────────────────────────────
// categoryFilter: null = all words; string[] = only words whose category is in the array
export function buildSession(words, categoryFilter = null) {
  const filtered = categoryFilter && categoryFilter.length > 0
    ? words.filter(w => categoryFilter.includes(w.category))
    : words

  const active = filtered.filter(w => !w.learned)

  const mode1Pool = active.filter(w => w.m1 < M1_MAX)
  const mode2Pool = active.filter(w => w.m1 >= M1_MAX && w.m2 < M2_MAX)
  const mode3Pool = buildMode3Pool(active, categoryFilter)

  const availableModes = []
  if (mode1Pool.length > 0) availableModes.push(1)
  if (mode2Pool.length > 0) availableModes.push(2)
  if (mode3Pool.length >= 6) availableModes.push(3)

  if (!availableModes.length) {
    return { steps: [], allLearned: true }
  }

  // ── Shuffled queues: cycle through all words before repeating any ──────────
  // This prevents the same word from dominating when the pool is small.
  const mode1Queue = shuffle([...mode1Pool])
  const mode2Queue = shuffle([...mode2Pool])
  let m1i = 0
  let m2i = 0

  const steps = []
  for (let i = 0; i < 12; i++) {
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)]

    if (mode === 1) {
      // Cycle through shuffled queue — no word repeats until all have been shown
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
      // Spread 6 words evenly across all selected categories
      const group = pickSpread(mode3Pool, 6)
      const leftCards  = shuffle(group.map(w => ({ row: w.row, text: w.word })))
      const rightCards = shuffle(group.map(w => ({ row: w.row, text: w.translation })))
      steps.push({ mode: 3, words: group, leftCards, rightCards })
    }
  }

  return { steps, allLearned: false }
}
