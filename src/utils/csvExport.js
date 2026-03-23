/**
 * CSV export — 32 variables, one data row per participant.
 */

function q(value) {
  // Quote and escape CSV values
  if (value === null || value === undefined) return '"-"'
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return `"${s}"`
}

export function generateCSV(participantData, tradingData) {
  const {
    participantID,
    age,
    sex,
    group,
    profile,
    lambdaEstime,
    answers,
    sessionStartDate,
    sessionStartHour,
  } = participantData

  const {
    sold,
    saleTime,
    salePrice,
    performance,
    panicSale,
    perteEvitee,
    stressMax,
    stressHistory,
    sellClicks,
    firstCrashClick,
    jitaiTriggered,
    jitaiCompleted,
    jitaiChoice,
    sessionDuration,
  } = tradingData

  // Lambda from profile
  const lambdaMap = { Prudent: 2.5, Équilibré: 1.3, Dynamique: 1.0 }
  const lambda = lambdaEstime || lambdaMap[profile] || '-'

  // Answer labels
  const answerLabels = ['A', 'B', 'C']
  const getAnswer = (i) =>
    answers && answers[i] !== undefined ? answerLabels[answers[i]] : '-'

  // Stress snapshots
  const sh = stressHistory || []
  const stressT0 = sh[0] ?? 30
  const stressT1 = sh[60] ?? '-'
  const stressT2 = sh[120] ?? '-'
  const stressT3 = sh[180] ?? '-'
  const stressT4 = sh[240] ?? '-'
  const stressT5 = sold && saleTime < 300 ? '-' : (sh[300] ?? '-')

  // JITAI columns (NA for group A)
  const jitaiDec = group === 'B' ? (jitaiTriggered ? 'OUI' : 'NON') : 'NA'
  const jitaiAtt =
    group === 'B' && jitaiTriggered
      ? jitaiCompleted
        ? 'OUI'
        : 'NON'
      : 'NA'
  const jitaiChoiceFinal =
    group === 'B' && jitaiTriggered ? (jitaiChoice ?? 'NA') : 'NA'

  const headers = [
    'ID_Participant',
    'Age',
    'Sexe',
    'Groupe',
    'Profil_Risque',
    'Lambda_Estime',
    'Temps_Avant_Vente',
    'A_Vendu_Panic',
    'Nb_Clics_Vente',
    'Nb_Clics_Achat',
    'Temps_Reaction_Premier_Clic',
    'Prix_Vente',
    'Performance_Finale',
    'Perte_Evitee',
    'Stress_Max',
    'Stress_T0',
    'Stress_T1',
    'Stress_T2',
    'Stress_T3_Krach',
    'Stress_T4',
    'Stress_T5',
    'JITAI_Declenche',
    'JITAI_Attente_Complete',
    'JITAI_Choix_Final',
    'Date_Experimentation',
    'Heure_Debut',
    'Duree_Totale_Secondes',
    'Reponse_Q1',
    'Reponse_Q2',
    'Reponse_Q3',
    'Reponse_Q4',
    'Reponse_Q5',
  ]

  const values = [
    participantID,
    age,
    sex,
    group,
    profile,
    lambda,
    sold && saleTime != null ? saleTime : '-',
    sold && panicSale ? 'OUI' : 'NON',
    sellClicks ?? 0,
    0,
    firstCrashClick != null ? firstCrashClick : '-',
    sold && salePrice != null ? salePrice.toFixed(2) : '-',
    performance != null ? Math.round(performance) : '-',
    perteEvitee != null ? Math.round(perteEvitee) : '-',
    stressMax ?? '-',
    stressT0,
    stressT1,
    stressT2,
    stressT3,
    stressT4,
    stressT5,
    jitaiDec,
    jitaiAtt,
    jitaiChoiceFinal,
    sessionStartDate ?? '-',
    sessionStartHour ?? '-',
    sessionDuration ?? '-',
    getAnswer(0),
    getAnswer(1),
    getAnswer(2),
    getAnswer(3),
    getAnswer(4),
  ]

  const headerRow = headers.join(',')
  const dataRow = values.map(q).join(',')

  return `${headerRow}\n${dataRow}`
}

export function downloadCSV(csv, participantID) {
  const timestamp = Date.now()
  const filename = `neuroadvisor_${participantID}_${timestamp}.csv`
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
