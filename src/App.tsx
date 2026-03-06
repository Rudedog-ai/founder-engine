import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './supabase'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import WelcomeScreen from './screens/WelcomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import VoiceScreen from './screens/VoiceScreen'
import KnowledgeScreen from './screens/KnowledgeScreen'
import CallsScreen from './screens/CallsScreen'
import MoreScreen from './screens/MoreScreen'

export default function App() {
  const { user, loading, companyId, setCompanyId } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [lookingUp, setLookingUp] = useState(false)

  // Auto-find company by user_id when logged in but no companyId
  useEffect(() => {
    if (user && !companyId && !lookingUp) {
      setLookingUp(true)
      supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCompanyId(data[0].id)
            localStorage.setItem('fe_company_name', data[0].name || '')
          }
          setLookingUp(false)
        }, () => setLookingUp(false))
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
