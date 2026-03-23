import React, { useState, useRef, useMemo } from 'react'
import { assignGroup, getParticipantID } from './utils/randomization'
import { getMarketTimeline } from './utils/marketData'
import Onboarding from './components/Onboarding'
import TradingInterface from './components/TradingInterface'
import EndScreen from './components/EndScreen'

// Pre-generate timeline at app load (before any renders)
getMarketTimeline()

export default function App() {
  const participantID = useMemo(() => getParticipantID(), [])
  const group = useMemo(() => assignGroup(participantID), [participantID])

  const sessionStartRef = useRef(Date.now())
  const sessionDateRef = useRef(new Date())

  const [screen, setScreen] = useState('onboarding') // 'onboarding' | 'trading' | 'end'
  const [participantData, setParticipantData] = useState(null)
  const [tradingData, setTradingData] = useState(null)

  function handleOnboardingComplete(data) {
    const now = sessionDateRef.current
    const pad = (n) => String(n).padStart(2, '0')
    const sessionStartDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const sessionStartHour = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    setParticipantData({
      ...data,
      participantID,
      group,
      sessionStartTime: sessionStartRef.current,
      sessionStartDate,
      sessionStartHour,
    })
    setScreen('trading')
  }

  function handleTradingEnd(data) {
    setTradingData(data)
    setScreen('end')
  }

  return (
    <>
      {screen === 'onboarding' && (
        <Onboarding
          participantID={participantID}
          onComplete={handleOnboardingComplete}
        />
      )}
      {screen === 'trading' && participantData && (
        <TradingInterface
          participantData={participantData}
          onEnd={handleTradingEnd}
        />
      )}
      {screen === 'end' && participantData && tradingData && (
        <EndScreen
          participantData={participantData}
          tradingData={tradingData}
        />
      )}
    </>
  )
}
