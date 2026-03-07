// App v3 — main routing with onboarding status check
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

type OnboardingState = 'loading' | 'onboarding' | 'complete'

export default function App() {
  const { user, loading, companyId, setCompanyId } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [companyLoading, setCompanyLoading] = useState(false)
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('loading')

  // Auth callback — render before anything else
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallbackScreen />
  }

  // Handle Composio integration callback
  useEffect(() => {
    if (window.location.pathname === '/integrations/callback') {
      const params = window.location.search
      window.history.replaceState({}, '', '/' + params)
    }
  }, [])

  // Fetch company and onboarding status after auth resolves
  useEffect(() => {
    if (!user) {
      setOnboardingState('loading')
      return
    }

    // If companyId is cached, check its onboarding status
    if (companyId) {
      setCompanyLoading(true)
      supabase
        .from('companies')
        .select('onboarding_status')
        .eq('id', companyId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            setOnboardingState('onboarding')
          } else if (data.onboarding_status === 'complete' || data.onboarding_status === 'active') {
            setOnboardingState('complete')
          } else {
            setOnboardingState('onboarding')
          }
          setCompanyLoading(false)
        })
      return
    }

    // No companyId — look up by user_id, then email
    setCompanyLoading(true)
    findCompany()

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
        const status = byUserId[0].onboarding_status
        setOnboardingState(status === 'complete' || status === 'active' ? 'complete' : 'onboarding')
        setCompanyLoading(false)
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
          const status = byEmail[0].onboarding_status
          setOnboardingState(status === 'complete' || status === 'active' ? 'complete' : 'onboarding')
          setCompanyLoading(false)
          return
        }
      }

      // No company found — will show WelcomeScreen
      setCompanyLoading(false)
    }
  }, [user, companyId])

  // Loading states
  if (loading || companyLoading) {
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

  if (!user || !companyId) {
    return <WelcomeScreen />
  }

  if (onboardingState === 'onboarding') {
    return <OnboardingFlow onComplete={() => setOnboardingState('complete')} />
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
