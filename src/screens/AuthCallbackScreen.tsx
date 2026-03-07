// AuthCallbackScreen v3 — handles OAuth PKCE code exchange
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      setErrorMsg('No auth code found in URL')
      setStatus('error')
      return
    }

    supabase.auth.exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          console.error('exchangeCodeForSession error:', error.message)
          setErrorMsg(error.message)
          setStatus('error')
          return
        }
        // Use session from exchange response directly — no separate getSession() call
        if (data.session) {
          window.location.replace('/')
        } else {
          console.error('Exchange returned no error but no session either')
          setErrorMsg('Sign-in succeeded but no session was returned. Please try again.')
          setStatus('error')
        }
      })
      .catch(err => {
        console.error('Auth callback exception:', err)
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error during sign-in')
        setStatus('error')
      })
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
