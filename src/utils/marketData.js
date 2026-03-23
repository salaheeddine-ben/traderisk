/**
 * Market data generator — deterministic, fixed seed.
 * ALL participants see EXACTLY the same price evolution.
 * Timeline generated ONCE at module load and cached.
 */

// Mulberry32 — reliable 32-bit seeded PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let _timeline = null

/**
 * Returns the full 301-point price timeline [T=0..T=300].
 * Phase 1 : T=0→180   +2%  (100→~102)
 * Phase 2 : T=180→210 -15% (102→~86.7)  KRACH
 * Phase 3 : T=210→240 +9%  (86.7→~94.5) Rebond
 * Phase 4 : T=240→300 +5%  (94.5→~99)   Stabilisation
 */
export function getMarketTimeline() {
  if (_timeline) return _timeline

  const rand = mulberry32(20240101) // Fixed seed — never change
  const prices = new Array(301)
  prices[0] = 100.0

  // Phase 1 — Slow climb +2%
  for (let t = 1; t <= 180; t++) {
    const base = 100 * (1 + 0.02 * (t / 180))
    const noise = (rand() - 0.5) * 0.22
    prices[t] = parseFloat((base + noise).toFixed(3))
  }

  // Phase 2 — Crash -15% (accelerated, high volatility)
  const p180 = prices[180]
  for (let t = 181; t <= 210; t++) {
    const progress = (t - 180) / 30
    const base = p180 * (1 - 0.15 * progress)
    const noise = (rand() - 0.5) * 0.9
    prices[t] = parseFloat(Math.max(base + noise, 55).toFixed(3))
  }

  // Phase 3 — Rebound +9% (medium volatility)
  const p210 = prices[210]
  for (let t = 211; t <= 240; t++) {
    const progress = (t - 210) / 30
    const base = p210 * (1 + 0.09 * progress)
    const noise = (rand() - 0.5) * 0.45
    prices[t] = parseFloat((base + noise).toFixed(3))
  }

  // Phase 4 — Stabilisation +5% (low volatility)
  const p240 = prices[240]
  for (let t = 241; t <= 300; t++) {
    const progress = (t - 240) / 60
    const base = p240 * (1 + 0.05 * progress)
    const noise = (rand() - 0.5) * 0.12
    prices[t] = parseFloat((base + noise).toFixed(3))
  }

  _timeline = prices
  return prices
}

export function getPhase(t) {
  if (t >= 180 && t <= 210) return 'crash'
  if (t > 210 && t <= 240) return 'recovery'
  return 'normal'
}

export function getPhaseName(phase) {
  const names = { crash: 'Krach', recovery: 'Rebond', normal: 'Stable' }
  return names[phase] || 'Stable'
}
