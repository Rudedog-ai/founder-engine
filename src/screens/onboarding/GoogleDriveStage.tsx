// GoogleDriveStage v1 — Step 2: Connect Google Drive
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import { useToast } from '../../components/Toast'
import ProgressIndicator from './ProgressIndicator'

interface Props {
  onAdvance: () => Promise<void>
}

export default function GoogleDriveStage({ onAdvance }: Props) {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [connecting, setConnecting] = useState(false)

  async function handleConnect() {
    if (!companyId || connecting) return
    setConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          company_id: companyId,
          toolkit: 'google_drive',
          redirect_uri: window.location.origin + '/integrations/callback?integration_connected=true',
        },
      })
      if (error || !data?.redirect_url) {
        showToast(data?.error || 'Could not connect Google Drive', 'error')
        setConnecting(false)
        return
      }
      window.open(data.redirect_url, '_blank')
      setConnecting(false)
    } catch {
      showToast('Connection failed', 'error')
      setConnecting(false)
    }
  }

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={2} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h3>Connect Google Drive</h3>
        <p className="onboarding-subtitle">
          This is the most powerful thing you can do for Angus. He'll find your
          recent, relevant documents automatically — pitch decks, financials,
          strategy docs, team plans.
        </p>

        <div style={{
          background: 'rgba(0, 240, 255, 0.05)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1rem',
        }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>What Angus looks for:</h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <li>Recent documents (last 12 months)</li>
            <li>Spreadsheets with financial data</li>
            <li>Strategy and planning documents</li>
            <li>Team and org information</li>
          </ul>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Angus reads but never writes. Your data stays yours.
          </p>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting
            ? <><span className="spinner" /> Connecting...</>
            : 'Connect Google Drive'}
        </button>

        <div className="onboarding-actions" style={{ marginTop: '0.5rem' }}>
          <button className="btn btn-link" onClick={onAdvance}>
            Skip for now — I'll connect later
          </button>
        </div>
      </div>
    </div>
  )
}
