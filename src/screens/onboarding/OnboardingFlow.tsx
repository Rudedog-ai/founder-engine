import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import WelcomeStage from './WelcomeStage'
import ConnectToolsStage from './ConnectToolsStage'
import FeedAngusStage from './FeedAngusStage'
import QuestionsStage from './QuestionsStage'
import OnboardingComplete from './OnboardingComplete'

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { companyId } = useAuth()
  const [stage, setStage] = useState<number | null>(null)

  useEffect(() => {
    if (!companyId) return
    supabase
      .from('companies')
      .select('onboarding_stage')
      .eq('id', companyId)
      .single()
      .then(({ data }) => {
        setStage(data?.onboarding_stage ?? 1)
      })
  }, [companyId])

  async function advanceTo(nextStage: number, extraFields?: Record<string, unknown>) {
    if (!companyId) return
    await supabase
      .from('companies')
      .update({ onboarding_stage: nextStage, ...extraFields })
      .eq('id', companyId)
    if (nextStage > 5) {
      onComplete()
    } else {
      setStage(nextStage)
    }
  }

  if (stage === null) {
    return (
      <div className="ocean-welcome">
        <div className="ocean-bg" />
        <div className="ocean-welcome-content">
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        </div>
      </div>
    )
  }

  const stageComponent = (() => {
    switch (stage) {
      case 1: return <WelcomeStage onAdvance={() => advanceTo(2, { welcome_complete: true })} />
      case 2: return <ConnectToolsStage onAdvance={() => advanceTo(3)} />
      case 3: return <FeedAngusStage onAdvance={() => advanceTo(4)} />
      case 4: return <QuestionsStage onAdvance={() => advanceTo(5)} />
      case 5: return <OnboardingComplete onAdvance={() => advanceTo(6)} />
      default: return null
    }
  })()

  return (
    <div className="ocean-welcome">
      <div className="ocean-bg" />
      <div className="light-rays">
        <div className="ray" /><div className="ray" /><div className="ray" /><div className="ray" />
      </div>
      <div className="wave wave-1" />
      <div className="wave wave-2" />
      <div className="wave wave-3" />
      <div className="ocean-welcome-content">
        {stageComponent}
      </div>
    </div>
  )
}
