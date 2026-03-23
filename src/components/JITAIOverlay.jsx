import React, { useState, useEffect, useRef } from 'react'

const MESSAGES = {
  Prudent: `Je comprends votre inquiétude face à cette baisse. Mais vendre maintenant transforme cette perte temporaire en perte définitive. Les marchés se rétablissent généralement après ces chutes brutales. Prenons 30 secondes pour observer l'évolution.`,
  Équilibré: `Cette chute est déstabilisante, c'est normal. Votre profil équilibré est justement conçu pour ces moments. Dans la majorité des cas, patienter quelques minutes permet de réduire significativement les pertes. Observons ensemble.`,
  Dynamique: `Cette baisse est impressionnante, mais vous aviez choisi une stratégie long-terme. Historiquement, ces baisses se résorbent rapidement. Vendre maintenant, c'est renoncer au rebond. Laissez-vous 30 secondes pour décider sereinement.`,
}

export default function JITAIOverlay({ isOpen, profile, onKeep, onSell }) {
  const [countdown, setCountdown] = useState(30)
  const [canSell, setCanSell] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      setCountdown(30)
      setCanSell(false)
      completedRef.current = false
      return
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanSell(true)
          completedRef.current = true
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const timerColor = countdown > 10 ? '#FFA500' : '#FF6B6B'
  const message = MESSAGES[profile] || MESSAGES['Équilibré']

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.72)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1130,
          maxWidth: '95vw',
          height: 380,
          background: '#1A2332',
          border: '3px solid #FFA500',
          borderRadius: 12,
          boxShadow:
            '0 0 60px rgba(255,165,0,0.3), 0 25px 50px rgba(0,0,0,0.6)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'jitaiSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1f2e42 0%, #2a3f5a 100%)',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid rgba(255,165,0,0.3)',
          }}
        >
          <span style={{ fontSize: 24 }}>🧠</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#E8EAED',
              letterSpacing: 0.3,
            }}
          >
            Un instant...
          </span>
          <span
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,165,0,0.15)',
              color: '#FFA500',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid rgba(255,165,0,0.4)',
            }}
          >
            Temps de réflexion
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 0,
            overflow: 'hidden',
          }}
        >
          {/* Message zone — 70% */}
          <div
            style={{
              flex: '0 0 70%',
              padding: '28px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 4,
                  minHeight: 60,
                  background: 'linear-gradient(to bottom, #FFA500, rgba(255,165,0,0.2))',
                  borderRadius: 2,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: '#D8DFE8',
                  margin: 0,
                  textAlign: 'justify',
                }}
              >
                {message}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'rgba(255,165,0,0.07)',
                borderRadius: 8,
                border: '1px solid rgba(255,165,0,0.15)',
              }}
            >
              <span style={{ fontSize: 13 }}>📊</span>
              <span style={{ fontSize: 12, color: '#B0B8C1' }}>
                Profil détecté :{' '}
                <strong style={{ color: '#FFA500' }}>{profile}</strong> — Cette
                intervention est personnalisée selon votre tolérance au risque.
              </span>
            </div>
          </div>

          {/* Timer zone — 30% */}
          <div
            style={{
              flex: '0 0 30%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              gap: 8,
            }}
          >
            {/* Circular timer */}
            <div style={{ position: 'relative', width: 110, height: 110 }}>
              <svg
                width="110"
                height="110"
                style={{ transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx="55"
                  cy="55"
                  r="48"
                  fill="none"
                  stroke="#2A3647"
                  strokeWidth="8"
                />
                <circle
                  cx="55"
                  cy="55"
                  r="48"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - countdown / 30)}`}
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 32,
                    fontWeight: 700,
                    color: timerColor,
                    lineHeight: 1,
                    transition: 'color 0.5s',
                  }}
                >
                  {countdown}s
                </span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#888', margin: 0, textAlign: 'center' }}>
              Temps de réflexion
              <br />
              {canSell ? (
                <span style={{ color: '#00C9A7', fontWeight: 600 }}>
                  ✓ Vous pouvez décider
                </span>
              ) : (
                <span style={{ color: '#FFA500' }}>En cours...</span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            display: 'flex',
            gap: 12,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {/* Keep button — 60% */}
          <button
            onClick={() => onKeep(completedRef.current)}
            style={{
              flex: '0 0 60%',
              padding: '14px',
              background: 'linear-gradient(135deg, #00C9A7, #00a88c)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 4px 15px rgba(0,201,167,0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 20px rgba(0,201,167,0.4)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(0,201,167,0.3)'
            }}
          >
            💎 Je garde mes parts
          </button>

          {/* Sell button — 40% */}
          <button
            onClick={() => canSell && onSell(completedRef.current)}
            disabled={!canSell}
            style={{
              flex: '0 0 40%',
              padding: '14px',
              background: canSell
                ? 'linear-gradient(135deg, #FF6B6B, #e85555)'
                : '#2A3647',
              color: canSell ? '#fff' : '#556',
              border: canSell ? 'none' : '1px solid #3D4F65',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: canSell ? 'pointer' : 'not-allowed',
              opacity: canSell ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.3s',
              boxShadow: canSell ? '0 4px 15px rgba(255,107,107,0.3)' : 'none',
            }}
          >
            {canSell ? '📉 Vendre quand même' : `⏳ Patientez... ${countdown}s`}
          </button>
        </div>
      </div>
    </>
  )
}
