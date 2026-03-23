/**
 * Stress calculation algorithm.
 * Returns value in [0, 100].
 *
 * Stress = Min(Max(30 + stressMarket + stressVolatility + stressBehavioral + stressTemporal, 0), 100)
 */
export function calculateStress({
  t,
  recentPrices,   // last 10 prices
  maxPrice,
  currentPrice,
  sellClickCount,
  lastSellClickTime,  // timestamp (ms) or null
  currentTime,        // Date.now()
}) {
  // 1. Market stress (max 50) — drawdown × 5
  const drawdown =
    maxPrice > 0 ? ((maxPrice - currentPrice) / maxPrice) * 100 : 0
  const stressMarket = Math.min(drawdown * 5, 50)

  // 2. Volatility stress (max 20) — std dev of last 10 prices × 100
  let stressVolatility = 0
  if (recentPrices && recentPrices.length >= 2) {
    const n = recentPrices.length
    const mean = recentPrices.reduce((a, b) => a + b, 0) / n
    const variance =
      recentPrices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / n
    stressVolatility = Math.min(Math.sqrt(variance) * 100, 20)
  }

  // 3. Behavioral stress (max 35)
  let stressBehavioral = 0
  if (sellClickCount > 2) stressBehavioral += 20
  if (lastSellClickTime && currentTime - lastSellClickTime < 3000) {
    stressBehavioral += 15
  }

  // 4. Temporal stress
  let stressTemporal = 0
  if (t >= 180 && t <= 210) stressTemporal = 30
  else if (t > 210 && t <= 240) stressTemporal = 20

  const total =
    30 + stressMarket + stressVolatility + stressBehavioral + stressTemporal
  return Math.min(Math.max(Math.round(total), 0), 100)
}

export function getStressColor(value) {
  if (value < 40) return '#00C9A7'
  if (value < 70) return '#FFA500'
  return '#FF6B6B'
}

export function getStressLabel(value) {
  if (value < 40) return 'Faible'
  if (value < 70) return 'Modéré'
  return 'Élevé'
}
