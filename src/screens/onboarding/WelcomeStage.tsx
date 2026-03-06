import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import ProgressIndicator from './ProgressIndicator'

const WELCOME_LINES = [
  "G'day. I'm Angus — your AI business analyst.",
  "I've already done some homework on your company from what's publicly available.",
  "Over the next few steps, we'll connect your tools and fill in the gaps I can't find online.",
  "The more I know, the better I can help. Think of me as your always-on analyst who actually reads the documents.",
  "Let's get started.",
]

export default function WelcomeStage() {
  const { companyId } = useAuth()
  const [visibleLines, setVisibleLines] = useState(0)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    if (visibleLines < WELCOME_LINES.length) {
      const timer = setTimeout(() => setVisibleLines(v => v + 1), 1800)
      return () => clearTimeout(timer)
    }
  }, [visibleLines])

  const allVisible = visibleLines >= WELCOME_LINES.length

  async function handleContinue() {
    if (!companyId || advancing) return
    setAdvancing(true)
    await supabase
      .from('companies')
      .update({ welcome_complete: true, onboarding_stage: 2 })
      .eq('id', companyId)
    // App.tsx re-fetches company data and re-renders with stage 2
    window.location.reload()
  }

  return (
    <div className="onboarding-stage">
      <ProgressIndicator currentStage={1} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="welcome-avatar">A</div>
        <div className="welcome-lines">
          {WELCOME_LINES.slice(0, visibleLines).map((line, i) => (
            <p key={i} className="welcome-line fade-in">{line}</p>
          ))}
        </div>
        {allVisible && (
          <button
            className="btn btn-primary btn-block fade-in"
            onClick={handleContinue}
            disabled={advancing}
            style={{ marginTop: '1.5rem' }}
          >
            {advancing ? <><span className="spinner" /> Continuing...</> : "Let's go →"}
          </button>
        )}
      </div>
    </div>
  )
}
