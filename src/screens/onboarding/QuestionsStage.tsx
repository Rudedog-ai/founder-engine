import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import ProgressIndicator from './ProgressIndicator'

export default function QuestionsStage() {
  const { companyId } = useAuth()
  const [advancing, setAdvancing] = useState(false)

  async function handleContinue() {
    if (!companyId || advancing) return
    setAdvancing(true)
    await supabase
      .from('companies')
      .update({ onboarding_stage: 5 })
      .eq('id', companyId)
    window.location.reload()
  }

  return (
    <div className="onboarding-stage">
      <ProgressIndicator currentStage={4} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Smart Questions</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Based on what Angus knows so far, here are questions that will fill the biggest gaps in your company profile.
        </p>

        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed rgba(255,255,255,0.15)',
          marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Questions are being generated...</p>
          <p style={{ fontSize: '0.78rem' }}>
            This feature is coming soon. Angus will ask you targeted questions about gaps in your company data.
          </p>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleContinue}
          disabled={advancing}
        >
          {advancing ? <><span className="spinner" /> Finishing...</> : 'Complete Setup →'}
        </button>
      </div>
    </div>
  )
}
