// GoogleDriveStage v3 — BroadcastChannel + polling for connection status
import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [connected, setConnected] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const markConnected = useCallback(() => {
    setConnected(true)
    setConnecting(false)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    // Update DB status
    if (companyId) {
      supabase.from('integrations').upsert({
        company_id: companyId,
        toolkit: 'google_drive',
        status: 'connected',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,toolkit' })
    }
    showToast('Google Drive connected!')
  }, [companyId, showToast])

  // Check if already connected on mount
  useEffect(() => {
    if (!companyId) return
    supabase
      .from('integrations')
      .select('status')
      .eq('company_id', companyId)
      .eq('toolkit', 'google_drive')
      .single()
      .then(({ data }) => {
        if (data?.status === 'connected' || data?.status === 'active') {
          setConnected(true)
        }
      })
  }, [companyId])

  // Listen for cross-tab broadcast from /integrations/callback
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('fe-integration-connected')
      bc.onmessage = () => markConnected()
      return () => bc.close()
    } catch { /* BroadcastChannel not supported — rely on polling */ }
  }, [markConnected])

  // Also detect via window focus (fallback for blocked popups)
  useEffect(() => {
    if (!connecting || !companyId) return
    const onFocus = () => {
      supabase
        .from('integrations')
        .select('status')
        .eq('company_id', companyId)
        .eq('toolkit', 'google_drive')
        .single()
        .then(({ data }) => {
          if (data?.status === 'connected' || data?.status === 'active') {
            markConnected()
          }
        })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [connecting, companyId, markConnected])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

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
    } catch {
      showToast('Connection failed', 'error')
      setConnecting(false)
    }
  }

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={2} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        {connected ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '2px solid var(--biolum)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem', fontSize: '1.5rem',
              }}>
                ✓
              </div>
              <h3 style={{ color: 'var(--biolum)', margin: '0 0 0.5rem' }}>
                Google Drive Connected
              </h3>
              <p className="onboarding-subtitle">
                Angus will start reading your recent documents in the background.
              </p>
            </div>
            <button className="btn btn-primary btn-block" onClick={onAdvance}>
              Continue
            </button>
          </>
        ) : (
          <>
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
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                What Angus looks for:
              </h4>
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

            {connecting ? (
              <div style={{ textAlign: 'center' }}>
                <button className="btn btn-primary btn-block" disabled>
                  <span className="spinner" /> Waiting for authorisation...
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Complete the sign-in in the popup, then come back here.
                </p>
                <button
                  className="btn btn-link"
                  style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}
                  onClick={markConnected}
                >
                  I've completed authorisation
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-block" onClick={handleConnect}>
                Connect Google Drive
              </button>
            )}

            <div className="onboarding-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-link" onClick={onAdvance}>
                Skip for now — I'll connect later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
