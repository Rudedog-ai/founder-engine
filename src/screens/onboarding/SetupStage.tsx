// SetupStage v1 — Connect tools + drop documents in one screen
import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadDocument } from '../../api'
import { supabase } from '../../supabase'
import ProgressIndicator from './ProgressIndicator'
import ConnectTools from '../../components/integrations/ConnectTools'

const ACCEPTED = '.pdf,.docx,.xlsx,.pptx,.csv,.txt,.png,.jpg,.jpeg,.webp'

export default function SetupStage({ onAdvance }: { onAdvance: () => Promise<void> }) {
  const { companyId } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || !companyId) return
    setUploading(true)
    let count = 0
    for (const file of Array.from(files)) {
      try {
        await uploadDocument(companyId, file)
        count++
      } catch { /* skip failed */ }
    }
    setUploadCount(prev => prev + count)
    setUploading(false)
  }

  async function handleComplete() {
    if (advancing) return
    setAdvancing(true)
    // Insert a knowledge chunk noting setup was completed
    if (companyId) {
      await supabase.from('knowledge_chunks').insert({
        company_id: companyId,
        domain: 'onboarding',
        chunk_text: `Onboarding completed. ${uploadCount} document(s) uploaded.`,
        source: 'onboarding',
        source_name: 'setup',
        is_stale: false,
      }).then(() => {})
    }
    await onAdvance()
  }

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={2} />
      <div className="ocean-form-card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Set up Angus</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          The more systems you connect, the smarter Angus becomes. Connect what you have — you can add more later.
        </p>

        <ConnectTools companyId={companyId!} compact />

        <div style={{ margin: '20px 0 12px', borderTop: '1px solid var(--sea)', paddingTop: '20px' }}>
          <h4 style={{ color: 'var(--text)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>Drop your documents</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '12px' }}>
            Upload anything — pitch decks, strategy docs, financials, team org charts. Angus reads everything.
          </p>
          <div
            className={`feed-dropzone ${dragActive ? 'dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            style={{ padding: '24px 16px', textAlign: 'center', cursor: 'pointer' }}
          >
            <input ref={fileRef} type="file" multiple accept={ACCEPTED} style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 6 }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.85rem' }}>
              {uploading ? 'Uploading...' : uploadCount > 0 ? `${uploadCount} file${uploadCount > 1 ? 's' : ''} uploaded — drop more or continue` : 'Drop files here or click to browse'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '4px 0 0' }}>PDF, Word, Excel, CSV, TXT, images</p>
          </div>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleComplete}
          disabled={advancing}
          style={{ marginTop: '1.2rem' }}
        >
          {advancing ? <><span className="spinner" /> Setting up...</> : "I'm ready — let's talk to Angus"}
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
          You can always connect more tools and upload more docs from the dashboard.
        </p>
      </div>
    </div>
  )
}
