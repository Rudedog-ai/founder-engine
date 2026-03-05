import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import BottomNav from './components/BottomNav'
import WelcomeScreen from './screens/WelcomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import VoiceScreen from './screens/VoiceScreen'
import KnowledgeScreen from './screens/KnowledgeScreen'
import CallsScreen from './screens/CallsScreen'
import MoreScreen from './screens/MoreScreen'

export default function App() {
  const { user, loading, companyId } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')

  if (loading) {
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
      <div className="content">
        {screens[activeScreen] || <DashboardScreen />}
      </div>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  )
}
