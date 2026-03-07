// ConnectToolsStage v1 — Step 1: Connect your business tools
import { useAuth } from '../../contexts/AuthContext'
import ProgressIndicator from './ProgressIndicator'
import ConnectTools from '../../components/integrations/ConnectTools'

interface Props {
  onAdvance: () => Promise<void>
}

export default function ConnectToolsStage({ onAdvance }: Props) {
  const { companyId } = useAuth()

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={1} />
      <div className="ocean-form-card" style={{ maxWidth: 580, margin: '0 auto' }}>
        <h3>Connect your tools</h3>
        <p className="onboarding-subtitle">
          Right then. The more Angus can see, the sharper his advice. Connect what you use — you can add more later.
        </p>
        <ConnectTools companyId={companyId!} compact />
        <div className="onboarding-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary btn-block" onClick={onAdvance}>
            Continue
          </button>
          <button className="btn btn-link" onClick={onAdvance}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
