// App v7 — add Scrapling test + INGEST dashboard routes
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './supabase'
import ErrorBoundary from './components/ErrorBoundary'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import WelcomeScreen from './screens/WelcomeScreen'
import OnboardingFlow from './screens/onboarding/OnboardingFlow'
import DashboardScreen from './screens/DashboardScreen'
import VoiceScreen from './screens/VoiceScreen'
import KnowledgeScreen from './screens/KnowledgeScreen'
import CallsScreen from './screens/CallsScreen'
import MoreScreen from './screens/MoreScreen'
import AngusChat from './components/AngusChat'
import AuthCallbackScreen from './screens/AuthCallbackScreen'
import ScraplingTest from './pages/ScraplingTest'
import IngestDashboard from './components/dashboard/IngestDashboard'

type Route = 'loading' | 'welcome' | 'onboarding' | 'dashboard'

const isAuthCallback = window.location.pathname === '/auth/callback'
const isScraplingTest = window.location.pathname === '/scrapling-test'
const isIngestDashboard = window.location.pathname === '/ingest-dashboard'

export default function App() {
  const { user, loading: authLoading, companyId, setCompanyId } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [route, setRoute] = useState<Route>('loading')

  // Handle Composio integration callback — notify original tab via BroadcastChannel
  useEffect(() => {
    if (isAuthCallback || isScraplingTest || isIngestDashboard) return
    if (window.location.pathname === '/integrations/callback') {
      try {
        const bc = new BroadcastChannel('fe-integration-connected')
        bc.postMessage({ connected: true })
        bc.close()
      } catch { /* BroadcastChannel not supported */ }
      const params = window.location.search
      window.history.replaceState({}, '', '/' + params)
    }
  }, [])

  // Resolve route after auth loads
  useEffect(() => {
    if (isAuthCallback || isScraplingTest || isIngestDashboard) return

    // Still waiting for auth
    if (authLoading) { setRoute('loading'); return }

    // No user — welcome screen
    if (!user) { setRoute('welcome'); return }

    // User exists but no companyId — find company
    if (!companyId) {
      setRoute('loading')
      findCompany()
      return
    }

    // User + companyId — check onboarding status
    setRoute('loading')
    supabase
      .from('companies')
      .select('onboarding_status')
      .eq('id', companyId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Stale companyId in localStorage — clear it and re-find
          console.warn('[App] companyId lookup failed, clearing stale ID and re-finding')
          setCompanyId(null)
          return
        }
        const s = data.onboarding_status
        setRoute(s === 'complete' || s === 'active' ? 'dashboard' : 'onboarding')
      })

    async function findCompany() {
      const { data: byUserId } = await supabase
        .from('companies')
        .select('id, name, onboarding_status')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (byUserId && byUserId.length > 0) {
        setCompanyId(byUserId[0].id)
        localStorage.setItem('fe_company_name', byUserId[0].name || '')
        const s = byUserId[0].onboarding_status
        setRoute(s === 'complete' || s === 'active' ? 'dashboard' : 'onboarding')
        return
      }

      if (user!.email) {
        const { data: byEmail } = await supabase
          .from('companies')
          .select('id, name, user_id, onboarding_status')
          .eq('founder_email', user!.email)
          .order('created_at', { ascending: false })
          .limit(1)

        if (byEmail && byEmail.length > 0) {
          if (!byEmail[0].user_id) {
            await supabase.from('companies').update({ user_id: user!.id }).eq('id', byEmail[0].id)
          }
          setCompanyId(byEmail[0].id)
          localStorage.setItem('fe_company_name', byEmail[0].name || '')
          const s = byEmail[0].onboarding_status
          setRoute(s === 'complete' || s === 'active' ? 'dashboard' : 'onboarding')
          return
        }
      }

      // No company found
      setRoute('welcome')
    }
  }, [authLoading, user, companyId])

  // Special routes — render AFTER all hooks (React hooks ordering rule)
  if (isAuthCallback) {
    return <AuthCallbackScreen />
  }

  if (isScraplingTest) {
    return <ScraplingTest />
  }

  if (isIngestDashboard) {
    return <IngestDashboard />
  }

  if (route === 'loading') {
    return (
      <div className="container">
        <div className="content">
          <div className="loading" style={{ minHeight: '100vh' }}>
            <div className="spinner" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (route === 'welcome' || !user || !companyId) {
    return <WelcomeScreen />
  }

  if (route === 'onboarding') {
    return <OnboardingFlow onComplete={() => setRoute('dashboard')} />
  }

  const screens: Record<string, JSX.Element> = {
    dashboard: <ErrorBoundary fallback="Dashboard failed to load"><DashboardScreen /></ErrorBoundary>,
    voice: <ErrorBoundary fallback="Voice session failed to load"><VoiceScreen /></ErrorBoundary>,
    knowledge: <ErrorBoundary fallback="Knowledge screen failed to load"><KnowledgeScreen /></ErrorBoundary>,
    calls: <ErrorBoundary fallback="Calls screen failed to load"><CallsScreen /></ErrorBoundary>,
    more: <ErrorBoundary fallback="Settings failed to load"><MoreScreen /></ErrorBoundary>,
  }

  return (
    <div className="container">
      <SideNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className="content">
        {screens[activeScreen] || <DashboardScreen />}
      </div>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <AngusChat companyId={companyId} />
    </div>
  )
}
