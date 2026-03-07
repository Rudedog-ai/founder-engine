// AuthCallbackScreen v2 — handles OAuth redirect from Supabase/Google
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      try {
        // PKCE flow: exchange ?code= for a session first
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            if (!cancelled) { setErrorMsg(exchangeError.message); setStatus('error') }
            return
          }
          // Exchange succeeded — verify session is set
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            window.location.replace('/')
            return
          }
        }

        // Hash-based tokens (implicit flow): give client a moment to process
        if (window.location.hash) {
          await new Promise(r => setTimeout(r, 1000))
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            window.location.replace('/')
            return
          }
        }

        // Final check — session may have been picked up by onAuthStateChange
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          window.location.replace('/')
          return
        }

        if (!cancelled) {
          setErrorMsg('No session could be established. Please try signing in again.')
          setStatus('error')
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
          setStatus('error')
        }
      }
    }

    handleCallback()
    return () => { cancelled = true }
  }, [])

  if (status === 'error') {
    return (
      <div className="ocean-welcome">
        <div className="ocean-bg" />
        <div className="ocean-welcome-content" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text)', marginBottom: '12px' }}>Sign-in failed</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => window.location.replace('/')}>
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ocean-welcome">
      <div className="ocean-bg" />
      <div className="ocean-welcome-content" style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-dim)' }}>Completing sign in...</p>
      </div>
    </div>
  )
}
