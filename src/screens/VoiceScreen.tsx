import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getCompanyProfile, processTranscript } from '../api'

export default function VoiceScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [step, setStep] = useState<'precall' | 'active' | 'processing'>('precall')
  const [companyName, setCompanyName] = useState('Your Company')
  const [transcript, setTranscript] = useState('')
  const [sessionType, setSessionType] = useState('voice_founder')
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null)
  const [processing, setProcessing] = useState(false)
  const widgetLoaded = useRef(false)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId).then(profile => {
      setCompanyName(profile?.company?.name || 'Your Company')
    }).catch(() => {})
  }, [companyId])

  const loadElevenLabs = useCallback(() => {
    if (widgetLoaded.current) return
    widgetLoaded.current = true
    const s = document.createElement('script')
    s.src = 'https://elevenlabs.io/convai-widget/index.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  function startCall() {
    loadElevenLabs()
    setStep('active')
  }

  async function handleProcessTranscript() {
    if (!transcript.trim() || !companyId) {
      showToast('Please enter a transcript', 'error')
      return
    }

    setProcessing(true)
    try {
      const result = await processTranscript(companyId, transcript.trim(), sessionType) as { extracted_data?: Record<string, unknown> }
      setExtractedData(result.extracted_data || null)
      showToast('Transcript processed successfully!')
    } catch {
      showToast('Failed to process transcript', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="screen-content">
      <div className="header-bar">
        <h1>Voice Session</h1>
      </div>

      {step === 'precall' && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--glow)" strokeWidth="1.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <h2>{companyName}</h2>
          <p style={{ marginBottom: '2rem' }}>
            Angus has reviewed your website and is ready to chat
          </p>
          <button className="btn btn-primary" onClick={startCall}>
            Start Call with Angus
          </button>
        </div>
      )}

      {step === 'active' && (
        <div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <elevenlabs-convai agent-id="agent_1901kjxbr6xte40bw8dyeyhjwgze" />
            <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>
              Call in progress... Speak naturally with Angus.
            </p>
          </div>
        </div>
      )}

      {/* Manual transcript processing */}
      <div className="water-divider" />
      <h3 style={{ marginBottom: 'var(--gap)' }}>Process a Transcript</h3>
      <div className="form-group">
        <label>Session Type</label>
        <select value={sessionType} onChange={e => setSessionType(e.target.value)}>
          <option value="voice_founder">Founder Call</option>
          <option value="voice_team">Team Call</option>
        </select>
      </div>
      <div className="form-group">
        <label>Transcript</label>
        <textarea
          rows={6}
          placeholder="Paste a call transcript here..."
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleProcessTranscript}
        disabled={processing}
      >
        {processing ? <><span className="spinner" /> Processing...</> : 'Process Transcript'}
      </button>

      {extractedData && (
        <div style={{ marginTop: 'var(--gap)' }}>
          <h3>Extracted Data</h3>
          {Object.entries(extractedData).map(([key, value]) => (
            <div key={key} style={{
              padding: '8px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '8px',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{key}</div>
              <div style={{ fontWeight: 500 }}>{String(value)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
