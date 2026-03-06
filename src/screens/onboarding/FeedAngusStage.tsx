import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadDocument, processTranscript } from '../../api'
import ProgressIndicator from './ProgressIndicator'
import FeedMethodCard from './FeedMethodCard'

const DocIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
const MicIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z" /></svg>

export default function FeedAngusStage({ onAdvance }: { onAdvance: () => Promise<void> }) {
  const { companyId } = useAuth()
  const [showUpload, setShowUpload] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
    setUploadCount((prev) => prev + count)
    setUploading(false)
  }

  async function handleTranscript() {
    if (!transcript.trim() || !companyId) return
    setSubmitting(true)
    try {
      await processTranscript(companyId, transcript, 'onboarding')
      setSubmitted(true)
      setTranscript('')
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={2} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h3>Feed Angus</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
          The more context you give, the smarter the analysis.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.2rem' }}>
          <FeedMethodCard
            title="Upload Documents"
            description="Pitch decks, financials, business plans, contracts"
            icon={<DocIcon />}
            actionLabel="Upload"
            onClick={() => setShowUpload(!showUpload)}
            badge={uploadCount > 0 ? `${uploadCount} uploaded` : undefined}
          />
          <FeedMethodCard
            title="Talk to Angus"
            description="Share context via a transcript paste"
            icon={<MicIcon />}
            actionLabel={submitted ? 'Sent' : 'Paste'}
            onClick={() => setShowVoice(!showVoice)}
          />
        </div>

        {showUpload && (
          <div className="feed-section fade-in">
            <div
              className="feed-dropzone"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover') }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleFiles(e.dataTransfer.files) }}
              onClick={() => document.getElementById('feed-file-input')?.click()}
            >
              <input id="feed-file-input" type="file" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
              <p>{uploading ? 'Uploading...' : 'Drop files here or click to browse'}</p>
            </div>
          </div>
        )}

        {showVoice && (
          <div className="feed-section fade-in">
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Voice calls coming soon. For now, paste a transcript or notes below.
            </p>
            <textarea
              className="feed-textarea"
              rows={4}
              placeholder="Paste transcript or notes about your business..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <button className="btn btn-primary btn-small" disabled={!transcript.trim() || submitting} onClick={handleTranscript} style={{ marginTop: 8 }}>
              {submitting ? 'Sending...' : submitted ? 'Sent!' : 'Submit'}
            </button>
          </div>
        )}

        <button className="btn btn-secondary btn-block" onClick={onAdvance} style={{ marginTop: '1.2rem' }}>
          Continue to Questions &rarr;
        </button>
        <p className="hint" style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
          You can always add more later from the dashboard.
        </p>
      </div>
    </div>
  )
}
