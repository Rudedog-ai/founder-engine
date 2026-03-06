import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import WelcomeStage from './WelcomeStage'
import ConnectToolsStage from './ConnectToolsStage'

export default function OnboardingFlow() {
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
      case 1: return <WelcomeStage />
      case 2: return <ConnectToolsStage />
      default: return null // Stages 3-5 built in later sprints
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
