// AuthCallbackScreen v1 — handles OAuth redirect from Supabase/Google
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check if session already established (hash-based implicit flow)
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setErrorMsg(error.message)
          setStatus('error')
          return
        }
        if (data.session) {
          window.location.replace('/')
          return
        }

        // PKCE flow: exchange ?code= for a session
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setErrorMsg(exchangeError.message)
            setStatus('error')
            return
          }
          window.location.replace('/')
          return
        }

        // Hash-based tokens: give onAuthStateChange a moment to pick them up
        if (window.location.hash) {
          await new Promise(r => setTimeout(r, 500))
          const { data: retryData } = await supabase.auth.getSession()
          if (retryData.session) {
            window.location.replace('/')
            return
          }
        }

        setErrorMsg('No session could be established. Please try signing in again.')
        setStatus('error')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')
      }
    }

    handleCallback()
  }, [])

  if (status === 'error') {
    return (
      <div className="ocean-welcome">
        <div className="ocean-bg" />
        <div className="ocean-welcome-content" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>&#9888;&#65039;</div>
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
