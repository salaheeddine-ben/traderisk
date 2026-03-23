import React, { useState } from 'react'

const QUESTIONS = [
  {
    id: 1,
    text: 'Si votre portefeuille perd 10% en une journée, que faites-vous instinctivement ?',
    options: [
      { label: 'A', text: 'Je vends immédiatement pour limiter les dégâts', profile: 'Prudent' },
      { label: 'B', text: "J'attends quelques jours pour voir l'évolution", profile: 'Équilibré' },
      { label: 'C', text: 'Je profite de la baisse pour renforcer ma position', profile: 'Dynamique' },
    ],
  },
  {
    id: 2,
    text: 'Quel rendement annuel visez-vous ?',
    options: [
      { label: 'A', text: '2-4% (sécurité avant tout)', profile: 'Prudent' },
      { label: 'B', text: '5-8% (équilibre rendement/risque)', profile: 'Équilibré' },
      { label: 'C', text: '>10% (j\u2019accepte la volatilit\u00e9)', profile: 'Dynamique' },
    ],
  },
  {
    id: 3,
    text: 'Horizon de placement prévu ?',
    options: [
      { label: 'A', text: 'Moins de 2 ans', profile: 'Prudent' },
      { label: 'B', text: '2-5 ans', profile: 'Équilibré' },
      { label: 'C', text: 'Plus de 5 ans', profile: 'Dynamique' },
    ],
  },
  {
    id: 4,
    text: 'Un pari : 50% de gagner 200€, 50% de perdre X€. Quel montant X maximum acceptez-vous ?',
    options: [
      { label: 'A', text: "Jusqu'à 80€", profile: 'Prudent' },
      { label: 'B', text: "Jusqu'à 150€", profile: 'Équilibré' },
      { label: 'C', text: '200€ ou plus', profile: 'Dynamique' },
    ],
  },
  {
    id: 5,
    text: 'Complétez : "Pour moi, investir c\'est avant tout..."',
    options: [
      { label: 'A', text: 'Protéger mon capital', profile: 'Prudent' },
      { label: 'B', text: 'Faire fructifier mon épargne progressivement', profile: 'Équilibré' },
      { label: 'C', text: 'Saisir des opportunités de croissance', profile: 'Dynamique' },
    ],
  },
]

const LAMBDA = { Prudent: 2.5, Équilibré: 1.3, Dynamique: 1.0 }

const PROFILE_ICONS = { Prudent: '🛡️', Équilibré: '⚖️', Dynamique: '🚀' }
const PROFILE_COLORS = {
  Prudent: '#5B8DEF',
  Équilibré: '#00C9A7',
  Dynamique: '#FFA500',
}

function computeProfile(answers) {
  const counts = { Prudent: 0, Équilibré: 0, Dynamique: 0 }
  answers.forEach((idx) => {
    if (idx !== null) {
      const profile = ['Prudent', 'Équilibré', 'Dynamique'][idx]
      counts[profile]++
    }
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

export default function Onboarding({ participantID, onComplete }) {
  const [step, setStep] = useState(1)
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [answers, setAnswers] = useState([null, null, null, null, null])

  const canProceedStep1 = age !== '' && parseInt(age) >= 18 && sex !== ''
  const allAnswered = answers.every((a) => a !== null)
  const profile = allAnswered ? computeProfile(answers) : null

  function handleAnswer(questionIdx, answerIdx) {
    const next = [...answers]
    next[questionIdx] = answerIdx
    setAnswers(next)
  }

  function handleStart() {
    const p = computeProfile(answers)
    onComplete({
      age: parseInt(age),
      sex,
      profile: p,
      lambdaEstime: LAMBDA[p],
      answers,
    })
  }

  return (
    <div className="onboarding-container">
      {/* Neural background decoration */}
      <div className="neural-bg" aria-hidden="true">
        <div className="neural-orb orb-1" />
        <div className="neural-orb orb-2" />
        <div className="neural-orb orb-3" />
        <div className="neural-orb orb-4" />
        <div className="neural-orb orb-5" />
      </div>

      {/* Logo */}
      <div className="onboarding-logo">
        <div className="logo-icon">🧠</div>
        <div>
          <div className="logo-title">NEURO-ADVISOR SIMULATOR</div>
          <div className="logo-subtitle">v3.0 — Finance Comportementale · Université de Lille</div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="step-indicator">
        <StepDot n={1} active={step === 1} done={step > 1} label="Profil" />
        <div className={`step-line ${step > 1 ? 'done' : ''}`} />
        <StepDot n={2} active={step === 2} done={false} label="Questionnaire" />
      </div>

      {step === 1 ? (
        <div className="onboarding-card">
          <h2 className="card-title">
            <span className="card-title-accent">01</span>
            Informations démographiques
          </h2>
          <p className="card-subtitle">
            Ces informations sont strictement anonymes et utilisées à des fins de recherche scientifique.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Âge</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ex. 28"
                min="18"
                max="99"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sexe</label>
              <select
                className="form-input"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              >
                <option value="">Sélectionner...</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
          </div>

          <div className="participant-badge">
            <span style={{ color: '#888', fontSize: 12 }}>ID Participant</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                color: '#00C9A7',
                fontWeight: 700,
              }}
            >
              {participantID}
            </span>
          </div>

          <button
            className="btn-primary"
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
          >
            Continuer →
          </button>
        </div>
      ) : (
        <div className="onboarding-card questionnaire-card">
          <h2 className="card-title">
            <span className="card-title-accent">02</span>
            Questionnaire de profilage
          </h2>
          <p className="card-subtitle">
            Répondez instinctivement — il n'y a pas de bonne ou mauvaise réponse.
          </p>

          <div className="questions-list">
            {QUESTIONS.map((q, qi) => (
              <div key={q.id} className="question-block">
                <div className="question-header">
                  <span className="question-number">Q{q.id}</span>
                  <span className="question-text">{q.text}</span>
                </div>
                <div className="options-grid">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      className={`option-btn ${answers[qi] === oi ? 'selected' : ''}`}
                      onClick={() => handleAnswer(qi, oi)}
                      style={
                        answers[qi] === oi
                          ? {
                              borderColor: PROFILE_COLORS[opt.profile],
                              background: `${PROFILE_COLORS[opt.profile]}18`,
                              color: PROFILE_COLORS[opt.profile],
                            }
                          : {}
                      }
                    >
                      <span className="option-label">{opt.label}</span>
                      <span className="option-text">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Profile preview */}
          {allAnswered && profile && (
            <div
              className="profile-preview"
              style={{ borderColor: PROFILE_COLORS[profile] }}
            >
              <span style={{ fontSize: 24 }}>{PROFILE_ICONS[profile]}</span>
              <div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                  Profil détecté
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: PROFILE_COLORS[profile],
                  }}
                >
                  {profile}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>λ (aversion perte)</div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#E8EAED',
                  }}
                >
                  {LAMBDA[profile]}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn-secondary"
              onClick={() => setStep(1)}
              style={{ flex: '0 0 auto' }}
            >
              ← Retour
            </button>
            <button
              className="btn-primary"
              disabled={!allAnswered}
              onClick={handleStart}
              style={{ flex: 1 }}
            >
              🚀 Commencer la simulation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepDot({ n, active, done, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          background: done
            ? '#00C9A7'
            : active
            ? 'linear-gradient(135deg, #5B8DEF, #3d6fd4)'
            : '#2A3647',
          color: done || active ? '#fff' : '#556',
          border: active ? '2px solid rgba(91,141,239,0.5)' : '2px solid transparent',
          boxShadow: active ? '0 0 15px rgba(91,141,239,0.4)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        {done ? '✓' : n}
      </div>
      <span
        style={{
          fontSize: 11,
          color: active ? '#E8EAED' : done ? '#00C9A7' : '#556',
          fontWeight: active ? 600 : 400,
        }}
      >
        {label}
      </span>
    </div>
  )
}
