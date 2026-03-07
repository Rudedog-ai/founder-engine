// OnboardingFlow v4 — Connect Tools → Google Drive → Questions
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import ConnectToolsStage from './ConnectToolsStage'
import GoogleDriveStage from './GoogleDriveStage'
import QuestionsStage from './QuestionsStage'

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { companyId } = useAuth()
  const [stage, setStage] = useState<number | null>(null)

  useEffect(() => {
    if (!companyId) return
    supabase
      .from('companies')
      .select('onboarding_stage, onboarding_status')
      .eq('id', companyId)
      .single()
      .then(({ data }) => {
        if (data?.onboarding_status === 'complete') {
          onComplete()
        } else {
          setStage(data?.onboarding_stage ?? 1)
        }
      })
  }, [companyId])

  async function advanceTo(nextStage: number) {
    if (!companyId) return
    const updates: Record<string, unknown> = { onboarding_stage: nextStage }
    if (nextStage > 3) {
      updates.onboarding_status = 'complete'
    }
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
    if (error) {
      console.error('Failed to update onboarding stage:', error)
    }
    if (nextStage > 3) {
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
      case 1: return <ConnectToolsStage onAdvance={() => advanceTo(2)} />
      case 2: return <GoogleDriveStage onAdvance={() => advanceTo(3)} />
      case 3: return <QuestionsStage onAdvance={() => advanceTo(4)} />
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
