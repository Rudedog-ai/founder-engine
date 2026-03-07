// QuestionsStage v1 — Step 3: Answer questions to fill gaps
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import ProgressIndicator from './ProgressIndicator'
import QuestionBatch from '../../components/questions/QuestionBatch'

interface Props {
  onAdvance: () => Promise<void>
}

export default function QuestionsStage({ onAdvance }: Props) {
  const { companyId } = useAuth()
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    if (!companyId || generated) return
    supabase.functions.invoke('generate-onboarding-questions', {
      body: { company_id: companyId },
    }).then(() => setGenerated(true)).catch(() => setGenerated(true))
  }, [companyId, generated])

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={3} />
      <div className="ocean-form-card" style={{ maxWidth: 580, margin: '0 auto' }}>
        <h3>Quick questions</h3>
        <p className="onboarding-subtitle">
          Answer what you can — voice, text, or skip. Every answer sharpens Angus's understanding.
        </p>
        <QuestionBatch companyId={companyId!} />
        <div className="onboarding-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary btn-block" onClick={onAdvance}>
            Finish setup
          </button>
          <button className="btn btn-link" onClick={onAdvance}>
            I'll answer later
          </button>
        </div>
      </div>
    </div>
  )
}
