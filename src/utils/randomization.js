/**
 * Participant group randomization.
 * - Uses a deterministic hash of the participant ID.
 * - Persisted in localStorage so the SAME id ALWAYS gets the SAME group.
 * - The user NEVER sees which group they are in.
 */

function djb2Hash(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function assignGroup(participantID) {
  if (!participantID) participantID = 'P001'

  const storageKey = `na_group_${participantID}`
  const stored = localStorage.getItem(storageKey)
  if (stored === 'A' || stored === 'B') return stored

  const hash = djb2Hash(participantID)
  const group = hash % 2 === 0 ? 'A' : 'B'
  localStorage.setItem(storageKey, group)
  return group
}

export function getParticipantID() {
  const params = new URLSearchParams(window.location.search)
  return params.get('id') || 'P001'
}
