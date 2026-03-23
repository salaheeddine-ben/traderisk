import React, { useState, useEffect } from 'react'
import { getStressColor } from '../utils/stressCalc'
import { getPhase } from '../utils/marketData'

export default function ResearcherPanel({ participantID, age, sex, group, profile, stress, tick }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!visible) return null

  const phase = getPhase(tick)
  const mm = String(Math.floor(tick / 60)).padStart(2, '0')
  const ss = String(tick % 60).padStart(2, '0')
  const stressColor = getStressColor(stress)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 300,
        background: '#1A2332',
        border: '2px solid #FFD700',
        borderRadius: 8,
        padding: '12px 14px',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#E8EAED',
        zIndex: 9999,
        boxShadow: '0 0 20px rgba(255,215,0,0.25)',
        userSelect: 'none',
      }}
    >
      <div style={{ color: '#FFD700', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
        ⚙ PANNEAU CHERCHEUR
      </div>
      <div style={{ borderBottom: '1px solid #3D4F65', marginBottom: 8 }} />
      <Row label="ID" value={participantID} />
      <Row label="Âge" value={age} />
      <Row label="Sexe" value={sex} />
      <Row label="Groupe" value={group} color={group === 'B' ? '#00C9A7' : '#5B8DEF'} />
      <Row label="Profil" value={profile} />
      <Row
        label="Stress"
        value={`${stress}%`}
        color={stressColor}
      />
      <Row label="Temps" value={`${mm}:${ss} (T=${tick}s)`} />
      <Row
        label="Phase"
        value={phase}
        color={phase === 'crash' ? '#FF6B6B' : phase === 'recovery' ? '#FFA500' : '#00C9A7'}
      />
      <div style={{ borderBottom: '1px solid #3D4F65', margin: '8px 0' }} />
      <div style={{ color: '#888', fontSize: 10 }}>Raccourci: Ctrl+Shift+D</div>
    </div>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ color: '#B0B8C1' }}>{label}:</span>
      <span style={{ color: color || '#E8EAED', fontWeight: 600 }}>{value ?? '—'}</span>
    </div>
  )
}
