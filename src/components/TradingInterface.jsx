import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getMarketTimeline, getPhase } from '../utils/marketData'
import { calculateStress, getStressColor } from '../utils/stressCalc'
import JITAIOverlay from './JITAIOverlay'
import ResearcherPanel from './ResearcherPanel'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

// ─── ETF Composition ────────────────────────────────────────────────────────

const ETF_COMPONENTS = [
  // Actions — 60%
  { symbol: 'NOVA', name: 'Novaris – Cloud', cat: 'actions', pct: 8, desc: 'Leader cloud B2B européen. 850+ contrats long-terme. Croissance annuelle de 28%.' },
  { symbol: 'VELM', name: 'Velmont – Énergies Renouvelables', cat: 'actions', pct: 7, desc: 'Producteur solaire & éolien. 120 installations. Label "Green Bond AAA".' },
  { symbol: 'KRYS', name: 'Kryssen – Fintech', cat: 'actions', pct: 6, desc: 'Néobanque européenne. 4M clients actifs. Plateforme de paiement multi-devises.' },
  { symbol: 'LUMI', name: 'Lumida – Biotech', cat: 'actions', pct: 7, desc: 'Biotechnologies oncologie. 3 molécules en phase III. Pipeline R&D en accélération.' },
  { symbol: 'ASTE', name: 'Asteron – IoT', cat: 'actions', pct: 6, desc: 'Capteurs industriels IoT. Présent dans 45 pays. Marges opérationnelles 34%.' },
  { symbol: 'PHYX', name: 'Phyxalis – Santé', cat: 'actions', pct: 6, desc: 'Dispositifs médicaux connectés. Contrats publics UE 2024-2029.' },
  { symbol: 'TERR', name: 'Terragen – AgriTech', cat: 'actions', pct: 5, desc: 'Agriculture de précision. Drones et IA appliqués. Expansion Asie en cours.' },
  { symbol: 'MAVI', name: 'Mavista – Mobilité', cat: 'actions', pct: 5, desc: 'Mobilité électrique urbaine. Flotte de 200k véhicules en Europe.' },
  { symbol: 'AQUA', name: 'Aquadyne – Tech Maritime', cat: 'actions', pct: 5, desc: 'Propulsion navale hydrogène. Partenariat avec 3 armateurs majeurs.' },
  { symbol: 'NEON', name: 'Neosynth – IA', cat: 'actions', pct: 5, desc: 'Infrastructure IA & LLM. Centre de données neutres en carbone. Forte demande B2B.' },
  // Obligations — 25%
  { symbol: 'OBL-EUR', name: "Obligations d'État Européennes", cat: 'obligations', pct: 15, desc: 'Souverains zone euro. Notation AAA. Coupon fixe 3,2% annuel.' },
  { symbol: 'OBL-CORP', name: 'Obligations Corporates AAA', cat: 'obligations', pct: 10, desc: 'Grandes entreprises notées AAA. Duration 5 ans. Rendement 4,1%.' },
  // Crypto — 10%
  { symbol: '₿ BTC', name: 'Bitcoin via ETF', cat: 'crypto', pct: 6, desc: 'Exposition BTC via ETF régulé (UCITS). Couverture EUR/USD intégrée.' },
  { symbol: 'Ξ ETH', name: 'Ethereum via ETF', cat: 'crypto', pct: 4, desc: 'Exposition ETH via ETF régulé. Smart contracts et DeFi exposure.' },
  // Immobilier — 5%
  { symbol: 'SCPI-EUR', name: 'SCPI Européennes', cat: 'immobilier', pct: 5, desc: 'SCPI diversifiées : bureaux, logistique, commerces. Rendement cible 4,8%.' },
]

const CAT_COLORS = {
  actions: '#5B8DEF',
  obligations: '#00C9A7',
  crypto: '#FFD700',
  immobilier: '#FFA500',
}
const CAT_LABELS = {
  actions: 'Actions',
  obligations: 'Obligations',
  crypto: 'Crypto',
  immobilier: 'Immobilier',
}

// Component-specific volatility multipliers for sparklines
const VOL_MULT = {
  'NOVA': 1.15, 'VELM': 0.9, 'KRYS': 1.2, 'LUMI': 1.3, 'ASTE': 1.1,
  'PHYX': 1.05, 'TERR': 0.95, 'MAVI': 1.0, 'AQUA': 0.85, 'NEON': 1.4,
  'OBL-EUR': 0.2, 'OBL-CORP': 0.3,
  '₿ BTC': 2.5, 'Ξ ETH': 3.0,
  'SCPI-EUR': 0.4,
}

// ─── Sparkline ──────────────────────────────────────────────────────────────

function Sparkline({ prices, color }) {
  if (!prices || prices.length < 2) return null
  const W = 64, H = 26
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 0.01
  const pts = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * W
      const y = H - ((p - min) / range) * (H - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={W} height={H} style={{ flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}

// ─── Stress Gauge ───────────────────────────────────────────────────────────

function StressGauge({ value }) {
  const R = 46
  const C = 2 * Math.PI * R
  const offset = C * (1 - value / 100)
  const color = getStressColor(value)
  const pulse = value >= 70

  return (
    <div
      className={`stress-gauge-wrapper ${pulse ? 'stress-pulse' : ''}`}
      style={{ '--stress-color': color }}
    >
      <svg width="110" height="110" viewBox="0 0 110 110">
        {/* Track */}
        <circle cx="55" cy="55" r={R} fill="none" stroke="#2A3647" strokeWidth="9" />
        {/* Fill */}
        <circle
          cx="55"
          cy="55"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90, 55, 55)"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.5s ease' }}
        />
        {/* Glow ring when critical */}
        {pulse && (
          <circle
            cx="55"
            cy="55"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90, 55, 55)"
            opacity="0.3"
          />
        )}
        <text x="55" y="49" textAnchor="middle" fill={color} fontSize="20" fontWeight="800" fontFamily="monospace">
          {value}
        </text>
        <text x="55" y="63" textAnchor="middle" fill={color} fontSize="9.5" fontWeight="600">
          %
        </text>
        <text x="55" y="73" textAnchor="middle" fill="#666" fontSize="8.5">
          STRESS
        </text>
      </svg>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TradingInterface({ participantData, onEnd }) {
  const timeline = useMemo(() => getMarketTimeline(), [])
  const { group, profile, participantID, age, sex, sessionStartTime } = participantData

  // ── Render state
  const [tick, setTick] = useState(0)
  const [stress, setStress] = useState(30)
  const [phase, setPhase] = useState('normal')
  const [portfolio, setPortfolio] = useState({ shares: 100, cash: 0 })
  const [sellClicks, setSellClicks] = useState(0)
  const [jitaiOpen, setJitaiOpen] = useState(false)
  const [priceFlash, setPriceFlash] = useState(null) // 'up'|'down'
  const [notification, setNotification] = useState(null)
  const [tooltip, setTooltip] = useState(null) // { symbol, x, y }
  const [sold, setSold] = useState(false)

  // ── Refs (avoid stale closures in interval)
  const r = useRef({
    tick: 0,
    sold: false,
    sellClicks: 0,
    lastSellClick: null,
    firstCrashClick: null,
    stressHistory: new Array(301).fill(null),
    stressMax: 30,
    maxPrice: 100,
    jitaiOpen: false,
    jitaiTriggered: false,
    jitaiCompleted: false,
    jitaiChoice: null,
    logs: [],
    portfolio: { shares: 100, cash: 0 },
    saleTime: null,
    salePrice: null,
    panicSale: false,
    perteEvitee: 0,
  })

  const onEndRef = useRef(onEnd)
  useEffect(() => { onEndRef.current = onEnd }, [onEnd])

  // ── Initialization
  useEffect(() => {
    r.current.stressHistory[0] = 30
  }, [])

  // ── Session finalization
  const finalize = useCallback(
    (isEndOfTime) => {
      const rc = r.current
      if (rc.sold) return
      rc.sold = true

      const finalPrice = timeline[300]
      let perf, saleVal

      if (isEndOfTime || !rc.salePrice) {
        // Not sold — evaluate at T=300
        const shares = rc.portfolio.shares
        saleVal = shares * finalPrice + rc.portfolio.cash
        perf = saleVal - 10000
      } else {
        saleVal = rc.portfolio.cash
        perf = saleVal - 10000
      }

      onEndRef.current({
        sold: rc.salePrice !== null,
        saleTime: rc.saleTime,
        salePrice: rc.salePrice,
        saleValue: saleVal,
        performance: perf,
        panicSale: rc.panicSale,
        perteEvitee: rc.perteEvitee,
        stressMax: rc.stressMax,
        stressHistory: [...rc.stressHistory],
        sellClicks: rc.sellClicks,
        firstCrashClick: rc.firstCrashClick,
        jitaiTriggered: rc.jitaiTriggered,
        jitaiCompleted: rc.jitaiCompleted,
        jitaiChoice: rc.jitaiChoice,
        logs: [...rc.logs],
        sessionDuration: Math.round((Date.now() - sessionStartTime) / 1000),
      })
    },
    [timeline, sessionStartTime]
  )

  // ── Execute sell
  const executeSell = useCallback(() => {
    const rc = r.current
    if (rc.sold) return
    rc.sold = true

    const t = rc.tick
    const price = timeline[t]
    const shares = rc.portfolio.shares
    const saleValue = shares * price
    const performance = saleValue - 10000
    const currentPhase = getPhase(t)
    const panicSale = currentPhase === 'crash'
    const valueAtT300 = shares * timeline[300]
    const perteEvitee = valueAtT300 - saleValue

    rc.saleTime = t
    rc.salePrice = price
    rc.panicSale = panicSale
    rc.perteEvitee = perteEvitee
    rc.portfolio = { shares: 0, cash: saleValue }

    rc.logs.push({
      event: 'sell_executed',
      t,
      price,
      saleValue,
      performance,
      panicSale,
      perteEvitee,
    })

    // Update render state
    setPortfolio({ shares: 0, cash: saleValue })
    setSold(true)

    const isPanic = currentPhase === 'crash'
    setNotification({
      type: isPanic ? 'warning' : 'success',
      message: isPanic
        ? `⚠️ Vente durant le krach — ${saleValue.toFixed(2)}€ récupérés`
        : `✅ Vente exécutée — ${saleValue.toFixed(2)}€`,
    })

    setTimeout(() => {
      onEndRef.current({
        sold: true,
        saleTime: t,
        salePrice: price,
        saleValue,
        performance,
        panicSale,
        perteEvitee,
        stressMax: rc.stressMax,
        stressHistory: [...rc.stressHistory],
        sellClicks: rc.sellClicks,
        firstCrashClick: rc.firstCrashClick,
        jitaiTriggered: rc.jitaiTriggered,
        jitaiCompleted: rc.jitaiCompleted,
        jitaiChoice: rc.jitaiChoice,
        logs: [...rc.logs],
        sessionDuration: Math.round((Date.now() - sessionStartTime) / 1000),
      })
    }, 3000)
  }, [timeline, sessionStartTime])

  // ── Main timer
  useEffect(() => {
    const interval = setInterval(() => {
      const rc = r.current
      if (rc.sold) return

      const t = rc.tick + 1
      if (t > 300) {
        clearInterval(interval)
        finalize(true)
        return
      }

      rc.tick = t
      const price = timeline[t]
      const prevPrice = timeline[t - 1]
      const currentPhase = getPhase(t)

      if (price > rc.maxPrice) rc.maxPrice = price

      const stressVal = calculateStress({
        t,
        recentPrices: timeline.slice(Math.max(0, t - 10), t + 1),
        maxPrice: rc.maxPrice,
        currentPrice: price,
        sellClickCount: rc.sellClicks,
        lastSellClickTime: rc.lastSellClick,
        currentTime: Date.now(),
      })

      rc.stressHistory[t] = stressVal
      if (stressVal > rc.stressMax) rc.stressMax = stressVal

      // Render updates
      setTick(t)
      setStress(stressVal)
      setPhase(currentPhase)
      setPriceFlash(price >= prevPrice ? 'up' : 'down')
      setTimeout(() => setPriceFlash(null), 350)
    }, 1000)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  // ── Sell click handler
  const handleSellClick = useCallback(() => {
    const rc = r.current
    if (rc.sold) return

    const t = rc.tick
    const price = timeline[t]
    const currentPhase = getPhase(t)
    const currentStress = rc.stressHistory[t] ?? 30
    const now = Date.now()

    if (currentPhase === 'crash' && rc.firstCrashClick === null) {
      rc.firstCrashClick = t
    }

    rc.sellClicks += 1
    rc.lastSellClick = now
    setSellClicks(rc.sellClicks)

    rc.logs.push({
      event: 'sell_attempt',
      t,
      price,
      stress: currentStress,
      phase: currentPhase,
      timestamp: now,
    })

    // GROUP DIVERGENCE
    if (group === 'B' && currentPhase === 'crash' && currentStress > 70) {
      rc.jitaiOpen = true
      rc.jitaiTriggered = true
      setJitaiOpen(true)
      rc.logs.push({ event: 'jitai_triggered', t, timestamp: now })
    } else {
      executeSell()
    }
  }, [group, timeline, executeSell])

  // ── JITAI handlers
  const handleJITAIKeep = useCallback((completed) => {
    const rc = r.current
    rc.jitaiOpen = false
    rc.jitaiChoice = 'waited'
    rc.jitaiCompleted = completed
    setJitaiOpen(false)
    rc.logs.push({ event: 'jitai_cancelled', t: rc.tick, completed })
  }, [])

  const handleJITAISell = useCallback(
    (completed) => {
      const rc = r.current
      rc.jitaiOpen = false
      rc.jitaiChoice = 'sold_anyway'
      rc.jitaiCompleted = completed
      setJitaiOpen(false)
      rc.logs.push({ event: 'jitai_sell_anyway', t: rc.tick, completed })
      executeSell()
    },
    [executeSell]
  )

  // ── Derived values
  const currentPrice = timeline[tick]
  const initialValue = 10000
  const portfolioValue =
    portfolio.shares * currentPrice + portfolio.cash
  const perfValue = portfolioValue - initialValue
  const perfPct = (perfValue / initialValue) * 100
  const isPositive = perfValue >= 0

  const mm = String(Math.floor(tick / 60)).padStart(2, '0')
  const ss = String(tick % 60).padStart(2, '0')

  // Sparkline data: last 30 ticks for each component
  const sparkStart = Math.max(0, tick - 29)
  const baseSlice = timeline.slice(sparkStart, tick + 1)
  const baseRef = timeline[sparkStart] || 100

  function getComponentSparkline(symbol) {
    const mult = VOL_MULT[symbol] ?? 1.0
    return baseSlice.map((p) => {
      const move = (p - baseRef) * mult
      return baseRef + move
    })
  }

  const stressColor = getStressColor(stress)
  const phaseColor =
    phase === 'crash' ? '#FF6B6B' : phase === 'recovery' ? '#FFA500' : '#00C9A7'
  const phaseLabel =
    phase === 'crash' ? '⚡ KRACH' : phase === 'recovery' ? '↗ Rebond' : '◉ Stable'

  // ── Dynamic Y-axis bounds (zooms in on Phase 1, expands on crash)
  const visiblePrices = timeline.slice(0, tick + 1)
  const minVisible = Math.min(...visiblePrices)
  const maxVisible = Math.max(...visiblePrices)
  const priceRange = maxVisible - minVisible
  const yPad = Math.max(priceRange * 0.28, 1.5)
  const chartYMin = parseFloat((minVisible - yPad).toFixed(1))
  const chartYMax = parseFloat((maxVisible + yPad).toFixed(1))

  // ── Chart data
  const chartLabels = Array.from({ length: tick + 1 }, (_, i) =>
    i % 60 === 0 ? `${Math.floor(i / 60)}m` : ''
  )
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: timeline.slice(0, tick + 1),
        borderColor: '#00C9A7',
        backgroundColor: 'rgba(0,201,167,0.08)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        segment: {
          borderColor: (ctx) => {
            const idx = ctx.p1DataIndex
            if (idx >= 180 && idx <= 210) return '#FF6B6B'
            if (idx > 210 && idx <= 240) return '#FFA500'
            return '#00C9A7'
          },
          backgroundColor: (ctx) => {
            const idx = ctx.p1DataIndex
            if (idx >= 180 && idx <= 210) return 'rgba(255,107,107,0.07)'
            if (idx > 210 && idx <= 240) return 'rgba(255,165,0,0.07)'
            return 'rgba(0,201,167,0.07)'
          },
        },
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A2332',
        borderColor: '#3D4F65',
        borderWidth: 1,
        titleColor: '#888',
        bodyColor: '#E8EAED',
        callbacks: {
          title: ([item]) => `T = ${item.dataIndex}s`,
          label: (item) => ` ${Number(item.raw).toFixed(2)}€`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#555', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#555',
          font: { size: 10 },
          callback: (v) => `${v.toFixed(0)}€`,
        },
        min: chartYMin,
        max: chartYMax,
      },
    },
  }

  return (
    <div className="trading-root" data-phase={phase}>
      {/* Phase ambient overlays */}
      <div className={`phase-ambient crash-ambient ${phase === 'crash' ? 'on' : ''}`} />
      <div className={`phase-ambient recovery-ambient ${phase === 'recovery' ? 'on' : ''}`} />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="trading-header">
        <div className="header-left">
          <div className="header-logo">
            <span className="header-logo-icon">📈</span>
            <div>
              <div className="header-etf-name">ETF Équilibré Aurelia</div>
              <div className="header-meta">
                Profil : <span className="meta-accent">{profile}</span>
                &nbsp;&nbsp;|&nbsp;&nbsp;ID :&nbsp;
                <span className="meta-mono">{participantID}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="live-indicator">
            <span className="live-dot" />
            LIVE
          </div>
          <div
            className="phase-badge"
            style={{ '--phase-color': phaseColor, color: phaseColor, borderColor: phaseColor }}
          >
            {phaseLabel}
          </div>
        </div>

        <div className="header-right">
          <div className="timer-block">
            <div className="timer-label">TEMPS</div>
            <div className="timer-value">{mm}:{ss}</div>
            <div className="timer-bar">
              <div
                className="timer-bar-fill"
                style={{ width: `${(tick / 300) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── News ticker (crash only) ─────────────────────────── */}
      <div className={`news-ticker ${phase === 'crash' ? 'ticker-on' : ''}`}>
        <span className="ticker-label">🔴 FLASH</span>
        <div className="ticker-track">
          <span className="ticker-text">
            ⚡ MARCHÉS — Vente massive sur les indices européens, recul brutal en séance&nbsp;&nbsp;•&nbsp;&nbsp;
            📉 ETF TECH — Rachats record, 4,2 milliards sortis en moins d'une heure&nbsp;&nbsp;•&nbsp;&nbsp;
            🏦 BCE — Réunion d'urgence convoquée, décision attendue&nbsp;&nbsp;•&nbsp;&nbsp;
            ⚠️ VOLATILITÉ — VIX bondit à 42, signal de panique extrême&nbsp;&nbsp;•&nbsp;&nbsp;
            🌍 ASIE — Nikkei plonge de 11%, marchés de Shanghai suspendus&nbsp;&nbsp;•&nbsp;&nbsp;
            📊 ANALYSE — Les gérants conseillent de ne pas paniquer et de rester positionnés&nbsp;&nbsp;•&nbsp;&nbsp;
            ⚡ MARCHÉS — Vente massive sur les indices européens, recul brutal en séance&nbsp;&nbsp;•&nbsp;&nbsp;
            📉 ETF TECH — Rachats record, 4,2 milliards sortis en moins d'une heure&nbsp;&nbsp;•&nbsp;&nbsp;
            🏦 BCE — Réunion d'urgence convoquée, décision attendue&nbsp;&nbsp;•&nbsp;&nbsp;
            ⚠️ VOLATILITÉ — VIX bondit à 42, signal de panique extrême
          </span>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────── */}
      <main className="trading-main">
        {/* Chart zone — 65% */}
        <div className="chart-zone">
          {/* Price display */}
          <div className="price-display">
            <span
              className={`price-value ${priceFlash === 'up' ? 'flash-up' : priceFlash === 'down' ? 'flash-down' : ''}`}
            >
              {currentPrice.toFixed(2)}€
            </span>
            <span
              className="perf-badge"
              style={{ color: isPositive ? '#00C9A7' : '#FF6B6B' }}
            >
              {isPositive ? '+' : ''}
              {perfValue.toFixed(2)}€ ({isPositive ? '+' : ''}
              {perfPct.toFixed(2)}%)
            </span>
            {phase === 'crash' && (
              <span className="krach-badge">⚡ KRACH EN COURS</span>
            )}
          </div>

          {/* Chart */}
          <div className={`chart-container chart-${phase}`}>
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Phase timeline */}
          <div className="phase-timeline">
            <PhaseBar tick={tick} />
          </div>
        </div>

        {/* Sidebar — 35% */}
        <aside className="trading-sidebar">
          {/* Portfolio */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">💼 Portfolio</div>
            <div className="portfolio-grid">
              <PortfolioRow
                label="Parts détenues"
                value={portfolio.shares}
                mono
              />
              <PortfolioRow
                label="Valeur totale"
                value={`${portfolioValue.toFixed(2)}€`}
                color={isPositive ? '#00C9A7' : '#FF6B6B'}
                mono
              />
              <PortfolioRow
                label="Liquidités"
                value={`${portfolio.cash.toFixed(2)}€`}
                mono
              />
              <PortfolioRow
                label="Performance"
                value={`${isPositive ? '+' : ''}${perfValue.toFixed(2)}€`}
                color={isPositive ? '#00C9A7' : '#FF6B6B'}
                mono
              />
            </div>
          </div>

          {/* Stress monitor */}
          <div className="sidebar-card stress-card">
            <div className="sidebar-card-title">🧠 Stress Monitor</div>
            <div className="stress-layout">
              <StressGauge value={stress} />
              <div className="stress-info">
                <div className="stress-label" style={{ color: stressColor }}>
                  {stress < 40 ? 'Faible' : stress < 70 ? 'Modéré' : 'Élevé'}
                </div>
                <div className="stress-sub">Score : {stress}/100</div>
                <div className="stress-bar-wrap">
                  <div
                    className="stress-bar-fill"
                    style={{
                      width: `${stress}%`,
                      background: `linear-gradient(90deg, #00C9A7, ${stressColor})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ETF Composition */}
          <div className="sidebar-card etf-card">
            <div className="sidebar-card-title">🧩 Composition ETF</div>
            <div className="etf-list">
              {Object.keys(CAT_COLORS).map((cat) => {
                const items = ETF_COMPONENTS.filter((c) => c.cat === cat)
                return (
                  <div key={cat} className="etf-category" data-cat={cat}>
                    <div
                      className="etf-cat-header"
                      style={{ color: CAT_COLORS[cat] }}
                    >
                      <span>{CAT_LABELS[cat]}</span>
                      <span>{items.reduce((a, c) => a + c.pct, 0)}%</span>
                    </div>
                    {items.map((comp) => {
                      const sparkData = getComponentSparkline(comp.symbol)
                      const sparkLast = sparkData[sparkData.length - 1] ?? baseRef
                      const sparkFirst = sparkData[0] ?? baseRef
                      const sparkUp = sparkLast >= sparkFirst
                      return (
                        <div
                          key={comp.symbol}
                          className="etf-row"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltip({ symbol: comp.symbol, comp, x: rect.left, y: rect.top })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div className="etf-row-left">
                            <span
                              className="etf-symbol"
                              style={{ color: CAT_COLORS[comp.cat] }}
                            >
                              {comp.symbol}
                            </span>
                            <span className="etf-pct">{comp.pct}%</span>
                          </div>
                          <Sparkline
                            prices={sparkData}
                            color={sparkUp ? '#00C9A7' : '#FF6B6B'}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sell button */}
          {!sold && portfolio.shares > 0 && (
            <button
              className={`btn-sell ${phase === 'crash' ? 'btn-sell-crisis' : ''}`}
              onClick={handleSellClick}
            >
              📉 VENDRE TOUT
              <span className="btn-sell-sub">
                {portfolio.shares} parts · {portfolioValue.toFixed(2)}€
              </span>
            </button>
          )}

          {sold && (
            <div className="sold-notice">
              ✅ Position liquidée
              <br />
              <span style={{ color: '#888', fontSize: 12 }}>
                Redirection dans 3s...
              </span>
            </div>
          )}
        </aside>
      </main>

      {/* ── Tooltip ─────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="etf-tooltip"
          style={{
            top: tooltip.y - 10,
            left: tooltip.x - 320,
          }}
        >
          <strong style={{ color: CAT_COLORS[tooltip.comp.cat] }}>
            {tooltip.comp.symbol}
          </strong>{' '}
          — {tooltip.comp.name}
          <br />
          <span style={{ color: '#B0B8C1', fontSize: 11 }}>
            {tooltip.comp.desc}
          </span>
        </div>
      )}

      {/* ── Notification ────────────────────────────────────── */}
      {notification && (
        <div
          className={`notification ${notification.type}`}
          style={{
            background:
              notification.type === 'warning'
                ? 'rgba(255,165,0,0.15)'
                : 'rgba(0,201,167,0.15)',
            borderColor:
              notification.type === 'warning' ? '#FFA500' : '#00C9A7',
          }}
        >
          {notification.message}
        </div>
      )}

      {/* ── JITAI Overlay ───────────────────────────────────── */}
      <JITAIOverlay
        isOpen={jitaiOpen}
        profile={profile}
        onKeep={handleJITAIKeep}
        onSell={handleJITAISell}
      />

      {/* ── Researcher Panel ────────────────────────────────── */}
      <ResearcherPanel
        participantID={participantID}
        age={age}
        sex={sex}
        group={group}
        profile={profile}
        stress={stress}
        tick={tick}
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PortfolioRow({ label, value, color, mono }) {
  return (
    <div className="portfolio-row">
      <span className="portfolio-row-label">{label}</span>
      <span
        className="portfolio-row-value"
        style={{
          color: color || '#E8EAED',
          fontFamily: mono ? 'monospace' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function PhaseBar({ tick }) {
  return (
    <div className="phase-bar-container">
      {[
        { label: 'Confiance', from: 0, to: 180, color: '#00C9A7' },
        { label: 'Krach', from: 180, to: 210, color: '#FF6B6B' },
        { label: 'Rebond', from: 210, to: 240, color: '#FFA500' },
        { label: 'Stabilisation', from: 240, to: 300, color: '#5B8DEF' },
      ].map((seg) => {
        const isActive = tick >= seg.from && tick < seg.to
        const isDone = tick >= seg.to
        const widthPct = ((seg.to - seg.from) / 300) * 100
        return (
          <div
            key={seg.label}
            className="phase-segment"
            style={{
              width: `${widthPct}%`,
              background: isDone
                ? `${seg.color}44`
                : isActive
                ? `${seg.color}22`
                : '#1A2332',
              borderBottom: `2px solid ${isActive || isDone ? seg.color : '#2A3647'}`,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: isActive ? seg.color : isDone ? `${seg.color}88` : '#444',
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {seg.label}
            </span>
          </div>
        )
      })}
      {/* Cursor */}
      <div
        className="phase-cursor"
        style={{ left: `${(tick / 300) * 100}%` }}
      />
    </div>
  )
}
