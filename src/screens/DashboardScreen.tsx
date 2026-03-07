import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCompanyProfile } from '../api'
import { supabase } from '../supabase'
import { useToast } from '../components/Toast'
import ResearchBanner from '../components/ResearchBanner'
import IntelligenceBuilder from '../components/intelligence/IntelligenceBuilder'
import DocumentChecklist from '../components/intelligence/DocumentChecklist'
import SourceOfTruth from '../components/intelligence/SourceOfTruth'
import QuestionBatch from '../components/questions/QuestionBatch'
import ConnectTools from '../components/integrations/ConnectTools'
import type { CompanyProfile, GapAnalysis } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

const topicOrder = [
  'business_fundamentals',
  'revenue_financials',
  'customers',
  'team_operations',
  'marketing_sales',
  'technology_systems',
  'founder_headspace',
]

const topicIcons: Record<string, string> = {
  business_fundamentals: 'M2 3h20v14H2zM8 21h8M12 17v4',
  revenue_financials: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  team_operations: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z',
  marketing_sales: 'M22 12l-4 0-3 9-6-18-3 9-4 0',
  technology_systems: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
  founder_headspace: 'M9.663 17h4.673M12 3v1M18.364 5.636l-.707.707M21 12h-1M4 12H3M6.343 5.636l-.707-.707',
}

function formatTime(timestamp: string) {
  if (!timestamp) return 'just now'
  const diff = Date.now() - new Date(timestamp).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function DashboardScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(setProfile)
      .catch(() => {
        showToast('Failed to load dashboard data', 'error')
      })
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => {
    setLoading(true)
    loadProfile()
  }, [loadProfile])

  // Realtime: reload when domain_scores update so sliders animate live
  useEffect(() => {
    if (!companyId) return
    const channel = supabase
      .channel('domain-scores')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'companies',
        filter: `id=eq.${companyId}`,
      }, () => {
        loadProfile()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [companyId, loadProfile])

  function handleResearchComplete() {
    showToast('Research complete! Updating your dashboard...')
    loadProfile()
  }

  if (loading) {
    return (
      <div className="screen-content">
        <div className="loading"><div className="spinner" /><span>Loading dashboard...</span></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="screen-content">
        <p>Could not load dashboard. Please check your connection.</p>
      </div>
    )
  }

  const company = profile.company
  const gaps = profile.gaps || []
  const gapMap: Record<string, GapAnalysis> = {}
  gaps.forEach(g => { gapMap[g.topic] = g })

  const score = company.intelligence_score || (gaps.length > 0
    ? Math.round(gaps.reduce((sum, g) => sum + (g.completeness_score || 0), 0) / gaps.length)
    : 0)

  const tierMap: Record<string, string> = {
    getting_started: 'Getting Started',
    good: 'Good',
    great: 'Great',
    amazing: 'Amazing',
    expert: 'Expert',
  }
  const tier = tierMap[company.intelligence_tier] || 'Getting Started'
  const totalPoints = gaps.reduce((sum, g) => sum + (g.captured_data_points || 0), 0)
  const initials = company.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FE'
  const recentActivity = (profile.recent_activity || []).slice(0, 5)

  return (
    <div className="screen-content">
      <ResearchBanner companyId={companyId!} onComplete={handleResearchComplete} />
      {/* Score Card */}
      <div className="score-card">
        <div className="score-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--wave), var(--foam))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.85rem', color: 'var(--deep)',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{company.name || 'Your Company'}</div>
              <div className="score-label">Intelligence Score</div>
            </div>
          </div>
          <div className="score-tier">{tier}</div>
        </div>
        <div className="score-value">{score}<span>%</span></div>
        <div className="score-subtitle">{totalPoints} data points across {gaps.length} topics</div>
        <div className="score-bar-container">
          <div className="score-bar" style={{ width: `${score}%` }} />
        </div>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--wave)" />
              <stop offset="50%" stopColor="var(--foam)" />
              <stop offset="100%" stopColor="var(--glow)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Topics */}
      <div className="section-title">Knowledge Areas</div>
      <div className="topic-grid">
        {topicOrder.map(topicKey => {
          const gap = gapMap[topicKey] || {} as GapAnalysis
          const completeness = Math.round(gap.completeness_score || 0)
          return (
            <div key={topicKey} className="topic-card">
              <div className="topic-icon" style={{ background: 'rgba(0, 240, 255, 0.08)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow)" strokeWidth="2">
                  <path d={topicIcons[topicKey] || ''} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="topic-name">{topicLabels[topicKey] || topicKey}</div>
                <div className="completeness-bar">
                  <div className="completeness-fill" style={{ width: `${completeness}%` }} />
                </div>
              </div>
              <div className="completeness-percent">{completeness}%</div>
            </div>
          )
        })}
      </div>

      <div className="water-divider" />
      <ConnectTools companyId={companyId!} />

      <div className="water-divider" />
      <IntelligenceBuilder companyId={companyId!} domainScores={company.domain_scores} />
      <div className="water-divider" />
      <DocumentChecklist companyId={companyId!} documents={profile.documents} />
      <div className="water-divider" />
      <SourceOfTruth companyId={companyId!} />

      <div className="water-divider" />
      <div className="section-title">Smart Questions</div>
      <QuestionBatch companyId={companyId!} />

      {/* Activity Feed */}
      <div className="section-title">Recent Activity</div>
      <div className="activity-feed">
        {recentActivity.length > 0 ? (
          recentActivity.map((log, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" />
              <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-dim)' }}>{log.action}</div>
              <div className="activity-time">{formatTime(log.created_at)}</div>
            </div>
          ))
        ) : (
          <p>No activity yet. Get started by scheduling a voice session.</p>
        )}
      </div>

    </div>
  )
}
