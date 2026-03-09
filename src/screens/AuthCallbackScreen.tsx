// AuthCallbackScreen v3 — handles OAuth PKCE code exchange
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error_code = params.get('error')
    const error_description = params.get('error_description')

    console.log('[AuthCallback] Full URL:', window.location.href)
    console.log('[AuthCallback] Code present:', !!code)
    console.log('[AuthCallback] Error code:', error_code)
    console.log('[AuthCallback] User agent:', navigator.userAgent)

    if (error_code) {
      setErrorMsg(`OAuth error: ${error_description || error_code}`)
      setStatus('error')
      return
    }

    if (!code) {
      setErrorMsg('No auth code found in URL. Please try signing in again.')
      setStatus('error')
      return
    }

    console.log('[AuthCallback] Starting code exchange...')
    
    supabase.auth.exchangeCodeForSession(code)
      .then(({ data, error }) => {
        console.log('[AuthCallback] Exchange complete. Error:', error?.message, 'Session:', !!data?.session)
        
        if (error) {
          console.error('exchangeCodeForSession error:', error)
          setErrorMsg(`Auth exchange failed: ${error.message}. Try clearing cookies and signing in again.`)
          setStatus('error')
          return
        }
        
        if (data.session) {
          console.log('[AuthCallback] Session established, redirecting to /')
          // Give mobile browsers time to persist session
          setTimeout(() => {
            window.location.replace('/')
          }, 100)
        } else {
          console.error('Exchange returned no error but no session either')
          setErrorMsg('Sign-in succeeded but no session was returned. Please clear cookies and try again.')
          setStatus('error')
        }
      })
      .catch(err => {
        console.error('Auth callback exception:', err)
        setErrorMsg(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}. Clear cookies and try again.`)
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
