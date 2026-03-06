import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './supabase'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import WelcomeScreen from './screens/WelcomeScreen'
import OnboardingFlow from './screens/onboarding/OnboardingFlow'
import DashboardScreen from './screens/DashboardScreen'
import VoiceScreen from './screens/VoiceScreen'
import KnowledgeScreen from './screens/KnowledgeScreen'
import CallsScreen from './screens/CallsScreen'
import MoreScreen from './screens/MoreScreen'

export default function App() {
  const { user, loading, companyId, setCompanyId } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [lookingUp, setLookingUp] = useState(false)
  const [onboardingStage, setOnboardingStage] = useState<number | null>(null)

  // Auto-find company by user_id, then fallback to email lookup
  useEffect(() => {
    if (user && !companyId && !lookingUp) {
      setLookingUp(true)

      async function findCompany() {
        // First: try by user_id
        const { data: byUserId } = await supabase
          .from('companies')
          .select('id, name, onboarding_stage')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (byUserId && byUserId.length > 0) {
          setCompanyId(byUserId[0].id)
          setOnboardingStage(byUserId[0].onboarding_stage ?? 1)
          localStorage.setItem('fe_company_name', byUserId[0].name || '')
          setLookingUp(false)
          return
        }

        // Fallback: try by founder_email (handles Google OAuth with different user_id)
        if (user!.email) {
          const { data: byEmail } = await supabase
            .from('companies')
            .select('id, name, user_id, onboarding_stage')
            .eq('founder_email', user!.email)
            .order('created_at', { ascending: false })
            .limit(1)

          if (byEmail && byEmail.length > 0) {
            // Link this auth user to the existing company
            if (!byEmail[0].user_id) {
              await supabase
                .from('companies')
                .update({ user_id: user!.id })
                .eq('id', byEmail[0].id)
            }
            setCompanyId(byEmail[0].id)
            setOnboardingStage(byEmail[0].onboarding_stage ?? 1)
            localStorage.setItem('fe_company_name', byEmail[0].name || '')
            setLookingUp(false)
            return
          }
        }

        setLookingUp(false)
      }

      findCompany().catch(() => setLookingUp(false))
    }
  }, [user, companyId])

  if (loading || lookingUp) {
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

  // Show onboarding flow for stages 1-5 (stage 6+ = complete, show dashboard)
  if (onboardingStage !== null && onboardingStage <= 5) {
    return <OnboardingFlow />
  }

  const screens: Record<string, JSX.Element> = {
    dashboard: <DashboardScreen />,
    voice: <VoiceScreen />,
    knowledge: <KnowledgeScreen />,
    calls: <CallsScreen />,
    more: <MoreScreen />,
  }

  return (
    <div className="container">
      <SideNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className="content">
        {screens[activeScreen] || <DashboardScreen />}
      </div>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  )
}
