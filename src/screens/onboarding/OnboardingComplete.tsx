import { useState } from 'react'
import ProgressIndicator from './ProgressIndicator'

export default function OnboardingComplete({ onAdvance }: { onAdvance: () => Promise<void> }) {
  const [clicked, setClicked] = useState(false)

  async function handleFinish() {
    setClicked(true)
    await onAdvance()
  }

  return (
    <div className="onboarding-stage">
      <ProgressIndicator currentStage={4} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div className="welcome-avatar" style={{ background: 'var(--green)' }}>✓</div>
        <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>You're all set</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Angus is now building your company intelligence profile. The more you interact, the smarter it gets.
        </p>
        <button
          className="btn btn-primary btn-block"
          onClick={handleFinish}
          disabled={clicked}
        >
          {clicked ? <><span className="spinner" /> Loading dashboard...</> : 'Go to Dashboard'}
        </button>
      </div>
    </div>
  )
}
