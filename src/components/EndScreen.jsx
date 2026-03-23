import React, { useState, useEffect } from 'react'
import { generateCSV, downloadCSV } from '../utils/csvExport'

const PROFILE_COLORS = {
  Prudent: '#5B8DEF',
  Équilibré: '#00C9A7',
  Dynamique: '#FFA500',
}

export default function EndScreen({ participantData, tradingData }) {
  const [downloaded, setDownloaded] = useState(false)
  const [animVal, setAnimVal] = useState(0)

  const { participantID, age, sex, profile, group } = participantData
  const {
    sold,
    saleTime,
    salePrice,
    performance,
    panicSale,
    perteEvitee,
    stressMax,
    sellClicks,
    jitaiTriggered,
    jitaiChoice,
  } = tradingData

  const isPositive = performance >= 0
  const perfColor = isPositive ? '#00C9A7' : '#FF6B6B'

  // Animate performance number on mount
  useEffect(() => {
    const target = Math.round(Math.abs(performance))
    let start = 0
    const step = target / 60
    const interval = setInterval(() => {
      start += step
      if (start >= target) {
        setAnimVal(target)
        clearInterval(interval)
      } else {
        setAnimVal(Math.round(start))
      }
    }, 16)
    return () => clearInterval(interval)
  }, [performance])

  function formatTime(t) {
    if (t == null) return 'Non vendu'
    const m = Math.floor(t / 60)
    const s = t % 60
    return `${m}m ${String(s).padStart(2, '0')}s (T=${t}s)`
  }

  function handleDownload() {
    const csv = generateCSV(participantData, tradingData)
    downloadCSV(csv, participantID)
    setDownloaded(true)
  }

  const tableRows = [
    { label: 'Profil de risque détecté', value: profile, color: PROFILE_COLORS[profile] },
    { label: 'Âge', value: age },
    { label: 'Sexe', value: sex },
    { label: 'Temps de vente', value: formatTime(saleTime) },
    { label: 'Prix de vente', value: salePrice ? `${salePrice.toFixed(2)}€` : '—' },
    { label: 'Clics sur "Vendre"', value: sellClicks ?? 0 },
    { label: 'Stress maximum atteint', value: `${stressMax}%`, color: stressMax >= 70 ? '#FF6B6B' : stressMax >= 40 ? '#FFA500' : '#00C9A7' },
  ]

  return (
    <div className="end-root">
      {/* Background particles */}
      <div className="end-bg" aria-hidden="true" />

      <div className="end-container">
        {/* Header */}
        <div className="end-header">
          <div className="end-logo">
            <span style={{ fontSize: 32 }}>🏁</span>
          </div>
          <h1 className="end-title">Simulation terminée</h1>
          <div className="end-subtitle">
            Participant <span style={{ color: '#00C9A7', fontFamily: 'monospace' }}>{participantID}</span>
            {' · '}
            <span style={{ color: PROFILE_COLORS[profile] }}>{profile}</span>
          </div>
        </div>

        {/* Big performance number */}
        <div className={`end-perf-block ${isPositive ? 'perf-positive' : 'perf-negative'}`}>
          <div
            className={`end-perf-value ${isPositive ? 'perf-glow-positive' : 'perf-glow-negative'}`}
            style={{ color: perfColor }}
          >
            {isPositive ? '+' : '-'}{animVal}€
          </div>
          <div className="end-perf-label" style={{ color: perfColor }}>
            Performance finale
          </div>
          <div className="end-perf-subtitle" style={{ color: '#666' }}>
            Base initiale : 10 000€ (100 parts × 100€)
          </div>
        </div>

        {/* Panic sale warning */}
        {sold && panicSale && (
          <div className="panic-alert">
            <div className="panic-alert-icon">⚠️</div>
            <div>
              <div className="panic-alert-title">Vous avez vendu durant le krach</div>
              {perteEvitee > 0 ? (
                <div className="panic-alert-body">
                  Si vous aviez attendu la fin de la simulation (T=300s), votre performance aurait été{' '}
                  <strong style={{ color: '#FFA500' }}>
                    meilleure de {Math.round(perteEvitee)}€
                  </strong>
                </div>
              ) : (
                <div className="panic-alert-body">
                  Votre vente s'est avérée stratégiquement correcte (marché plus bas à T=300s).
                </div>
              )}
            </div>
          </div>
        )}

        {/* JITAI info (group B) */}
        {group === 'B' && jitaiTriggered && (
          <div className="jitai-info">
            <span style={{ fontSize: 16 }}>🧠</span>
            <div>
              <div style={{ fontWeight: 600, color: '#E8EAED', fontSize: 13 }}>
                Intervention JITAI déclenchée
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>
                Choix final :{' '}
                <span style={{ color: '#00C9A7' }}>
                  {jitaiChoice === 'waited'
                    ? 'Vous avez gardé vos parts'
                    : jitaiChoice === 'sold_anyway'
                    ? 'Vous avez vendu malgré tout'
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Summary table */}
        <div className="end-table-card">
          <div className="end-table-title">📋 Récapitulatif</div>
          <table className="end-table">
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.label}>
                  <td className="end-table-label">{row.label}</td>
                  <td
                    className="end-table-value"
                    style={{ color: row.color || '#E8EAED' }}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Download CSV */}
        <button
          className={`btn-download ${downloaded ? 'btn-download-done' : ''}`}
          onClick={handleDownload}
        >
          {downloaded ? '✅ Fichier téléchargé' : '⬇ Télécharger les données (CSV)'}
        </button>

        {/* Debriefing */}
        <div className="end-debriefing">
          <p>
            Merci pour votre participation ! Cette simulation utilisait des actifs fictifs dans le
            cadre d'une recherche en finance comportementale à l'Université de Lille.
          </p>
          <p style={{ marginTop: 8, fontSize: 11 }}>
            Les données collectées sont anonymisées et traitées conformément au RGPD.
            Aucune information personnelle n'est transmise à des tiers.
          </p>
        </div>
      </div>
    </div>
  )
}
