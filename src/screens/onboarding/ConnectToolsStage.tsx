import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import ProgressIndicator from './ProgressIndicator'
import ConnectCard from './ConnectCard'

const GoogleDriveIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M8.01 18.26l-1.42-2.46L12.58 6h2.84l-7.41 12.26z" fill="#4285F4"/>
    <path d="M15.84 18.26H8.01l1.42-2.46h6.41l1.42 2.46z" fill="#0066DA"/>
    <path d="M18.69 13.34l-3.27-5.34L12.58 6h2.84l4.69 7.34z" fill="#00AC47"/>
    <path d="M8.01 18.26l3.27-5.34h7.41l-1.42 2.46-2.85 4.88H8.01z" fill="#EA4335"/>
  </svg>
)

const XeroIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#13B5EA"/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">X</text>
  </svg>
)

export default function ConnectToolsStage() {
  const { companyId } = useAuth()
  const [skipping, setSkipping] = useState(false)

  async function handleSkip() {
    if (!companyId || skipping) return
    setSkipping(true)
    await supabase
      .from('companies')
      .update({ onboarding_stage: 3 })
      .eq('id', companyId)
    window.location.reload()
  }

  return (
    <div className="onboarding-stage">
      <ProgressIndicator currentStage={2} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Connect Your Tools</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Give Angus access to your existing documents and data. The more context, the smarter the analysis.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
          <ConnectCard
            title="Google Drive"
            description="Share business docs, pitch decks, financials"
            icon={<GoogleDriveIcon />}
            connected={false}
            onConnect={() => {}}
            disabled
          />
          <ConnectCard
            title="Xero"
            description="Import financial data automatically"
            icon={<XeroIcon />}
            connected={false}
            onConnect={() => {}}
            disabled
          />
        </div>

        <button
          className="btn btn-secondary btn-block"
          onClick={handleSkip}
          disabled={skipping}
          style={{ fontSize: '0.85rem' }}
        >
          {skipping ? <><span className="spinner" /> Skipping...</> : 'Skip for now — I\'ll add these later'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
          You can always connect tools later from Settings.
        </p>
      </div>
    </div>
  )
}
