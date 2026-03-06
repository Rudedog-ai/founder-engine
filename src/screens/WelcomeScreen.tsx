import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { supabase } from '../supabase'
import { onboardCompany, scrapeBusiness } from '../api'

type EmailMode = 'signin' | 'signup'

export default function WelcomeScreen() {
  const { signUp, signIn, signInWithGoogle, setCompanyId, user } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Email auth
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailMode, setEmailMode] = useState<EmailMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Onboarding fields — restored from sessionStorage so they survive app-switching
  const [companyName, setCompanyNameRaw] = useState(() => sessionStorage.getItem('fe_draft_company') || '')
  const [founderName, setFounderNameRaw] = useState(() => sessionStorage.getItem('fe_draft_founder') || '')
  const [website, setWebsiteRaw] = useState(() => sessionStorage.getItem('fe_draft_website') || '')
  const [scraping, setScraping] = useState(false)

  function setCompanyName(v: string) { setCompanyNameRaw(v); sessionStorage.setItem('fe_draft_company', v) }
  function setFounderName(v: string) { setFounderNameRaw(v); sessionStorage.setItem('fe_draft_founder', v) }
  function setWebsite(v: string) { setWebsiteRaw(v); sessionStorage.setItem('fe_draft_website', v) }

  async function handleGoogle() {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
    // OAuth redirects — no further handling needed here
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (emailMode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        showToast('Check your email for a confirmation link, then sign in.')
        setEmailMode('signin')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        // App.tsx auto-lookup will find company by user_id
        // If no company, WelcomeScreen re-renders with user set → shows onboarding
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!companyName.trim() || !founderName.trim()) {
      setError('Company name and your name are required')
      return
    }

    setLoading(true)
    setScraping(true)

    try {
      const founderEmail = user?.email || email

      // Check if a company already exists for this user or email before creating
      const { data: existing } = await supabase
        .from('companies')
        .select('id, name, user_id')
        .or(`user_id.eq.${user?.id},founder_email.eq.${founderEmail}`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (existing && existing.length > 0) {
        // Link to this auth user if not already linked
        if (!existing[0].user_id && user?.id) {
          await supabase
            .from('companies')
            .update({ user_id: user.id })
            .eq('id', existing[0].id)
        }
        setCompanyId(existing[0].id)
        localStorage.setItem('fe_email', founderEmail)
        localStorage.setItem('fe_company_name', existing[0].name || companyName.trim())
        showToast('Welcome back! Found your existing company.')
        setScraping(false)
        setLoading(false)
        return
      }

      const result = await onboardCompany(
        companyName.trim(),
        founderName.trim(),
        founderEmail,
        website.trim() || undefined
      )

      const companyId = result.company?.id || result.company_id
      setCompanyId(companyId)
      localStorage.setItem('fe_email', founderEmail)
      localStorage.setItem('fe_company_name', companyName.trim())

      // Kick off background research (don't await — it's slow)
      scrapeBusiness(companyId, website.trim() || '', companyName.trim(), founderName.trim()).catch(
        err => console.warn('Background scrape failed:', err)
      )

      // Clear drafts now that onboarding succeeded
      sessionStorage.removeItem('fe_draft_company')
      sessionStorage.removeItem('fe_draft_founder')
      sessionStorage.removeItem('fe_draft_website')

      showToast('Account created! Welcome to Founder Engine.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
      setScraping(false)
    } finally {
      setLoading(false)
    }
  }

  // Authenticated user with no company → onboarding form
  const needsOnboarding = !!user

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

        {!needsOnboarding && !scraping && (
          <div className="ocean-form-card">
            {!showEmailForm ? (
              <>
                {/* Landing: two buttons only */}
                <button className="btn btn-primary btn-block" onClick={handleGoogle} type="button" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 20px', fontSize: '1rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>

                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => setShowEmailForm(true)}
                  type="button"
                  style={{ fontSize: '0.9rem' }}
                >
                  Sign in with Email
                </button>

                {error && (
                  <div style={{
                    background: 'rgba(255,107,107,0.1)',
                    border: '1px solid var(--red)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    marginTop: '12px',
                    color: 'var(--red)',
                    fontSize: '0.9rem',
                  }}>
                    {error}
                  </div>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px', marginBottom: 0 }}>
                  Note: Google sign-in requires OAuth to be enabled in Supabase dashboard.
                </p>
              </>
            ) : (
              <>
                {/* Email sign-in expanded inline */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    className={`btn ${emailMode === 'signin' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                    onClick={() => { setEmailMode('signin'); setError('') }}
                    style={{ flex: 1 }}
                  >
                    Sign In
                  </button>
                  <button
                    className={`btn ${emailMode === 'signup' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                    onClick={() => { setEmailMode('signup'); setError('') }}
                    style={{ flex: 1 }}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleEmailAuth}>
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
                      placeholder={emailMode === 'signup' ? 'Create a password' : 'Your password'}
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
                    {loading ? <><span className="spinner" /> Working...</> : emailMode === 'signup' ? 'Create Account' : 'Sign In'}
                  </button>
                </form>

                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => { setShowEmailForm(false); setError('') }}
                  type="button"
                  style={{ marginTop: '8px', fontSize: '0.85rem' }}
                >
                  Back
                </button>
              </>
            )}
          </div>
        )}

        {needsOnboarding && !scraping && (
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
                  type="text"
                  placeholder="e.g. acme.com"
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

        {scraping && (
          <div className="ocean-form-card" style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: 'var(--gap)' }} />
            <h3 style={{ color: 'var(--text)' }}>Researching your business...</h3>
            <p>Angus is reviewing your company and public information.</p>
          </div>
        )}
      </div>
    </div>
  )
}
