import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { onboardCompany, scrapeBusiness, getCompanyByEmail } from '../api'

type Mode = 'signup' | 'signin'
type Step = 'auth' | 'onboarding' | 'scraping' | 'done'

export default function WelcomeScreen() {
  const { signUp, signIn, signInWithGoogle, setCompanyId, user } = useAuth()
  const { showToast } = useToast()
  const [mode, setMode] = useState<Mode>('signup')
  const [step, setStep] = useState<Step>(user ? 'onboarding' : 'auth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Onboarding fields
  const [companyName, setCompanyName] = useState('')
  const [founderName, setFounderName] = useState('')
  const [website, setWebsite] = useState('')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        showToast('Check your email for a confirmation link, then sign in.')
        setMode('signin')
        // Don't move to onboarding yet — they need to confirm email first
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error

        // Try to find existing company for this email
        try {
          const profile = await getCompanyByEmail(email)
          if (profile?.company?.id) {
            setCompanyId(profile.company.id)
            localStorage.setItem('fe_email', email)
            localStorage.setItem('fe_company_name', profile.company.name || '')
            return // App.tsx will re-render to dashboard
          }
        } catch {
          // No company found — show onboarding
        }
        setStep('onboarding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
    // OAuth redirects — no further handling needed here
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!companyName.trim() || !founderName.trim()) {
      setError('Company name and your name are required')
      return
    }

    setLoading(true)
    setStep('scraping')

    try {
      const result = await onboardCompany(
        companyName.trim(),
        founderName.trim(),
        email,
        website.trim() || undefined
      )

      const companyId = result.company?.id || result.company_id
      setCompanyId(companyId)
      localStorage.setItem('fe_email', email)
      localStorage.setItem('fe_company_name', companyName.trim())

      // Kick off background research (don't await — it's slow)
      if (website.trim()) {
        scrapeBusiness(companyId, website.trim(), companyName.trim(), founderName.trim()).catch(
          err => console.warn('Background scrape failed:', err)
        )
      }

      showToast('Account created! Welcome to Founder Engine.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
      setStep('onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ocean-welcome">
      <div className="ocean-bg" />
      <div className="light-rays">
        <div className="ray" /><div className="ray" /><div className="ray" /><div className="ray" />
      </div>
      <div className="particles">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>
      <div className="wave wave-1" />
      <div className="wave wave-2" />
      <div className="wave wave-3" />

      <div className="ocean-welcome-content">
        <div className="ocean-logo">FOUNDER ENGINE</div>
        <h1 className="ocean-title">
          Turn chaos into <strong>clarity</strong>
        </h1>
        <p className="ocean-sub">
          AI-powered company intelligence. Voice-first onboarding that actually understands your business.
        </p>

        {step === 'auth' && (
          <div className="ocean-form-card">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                className={`btn ${mode === 'signup' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                onClick={() => { setMode('signup'); setError('') }}
                style={{ flex: 1 }}
              >
                Sign Up
              </button>
              <button
                className={`btn ${mode === 'signin' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                onClick={() => { setMode('signin'); setError('') }}
                style={{ flex: 1 }}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleAuth}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid var(--red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  marginBottom: 'var(--gap)',
                  color: 'var(--red)',
                  fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}

              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Working...</> : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>or</div>

            <button className="btn btn-secondary btn-block" onClick={handleGoogle} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        )}

        {step === 'onboarding' && (
          <div className="ocean-form-card">
            <h3 style={{ marginBottom: 'var(--gap)', color: 'var(--text)' }}>Tell us about your company</h3>
            <form onSubmit={handleOnboard}>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  placeholder="Acme Inc"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  placeholder="Jane Smith"
                  value={founderName}
                  onChange={e => setFounderName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Website (optional)</label>
                <input
                  type="url"
                  placeholder="https://acme.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid var(--red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  marginBottom: 'var(--gap)',
                  color: 'var(--red)',
                  fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}

              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Creating...</> : 'Get Started'}
              </button>
            </form>
          </div>
        )}

        {step === 'scraping' && (
          <div className="ocean-form-card" style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: 'var(--gap)' }} />
            <h3 style={{ color: 'var(--text)' }}>Researching your business...</h3>
            <p>Angus is reviewing your website and public information.</p>
          </div>
        )}
      </div>
    </div>
  )
}
