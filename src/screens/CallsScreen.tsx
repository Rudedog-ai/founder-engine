import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getCompanyProfile } from '../api'
import type { Session } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}m`
}

type Filter = 'all' | 'founder' | 'team'

export default function CallsScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(profile => setSessions(profile?.sessions || []))
      .catch(() => showToast('Failed to load calls', 'error'))
      .finally(() => setLoading(false))
  }, [companyId])

  const filtered = sessions.filter(s => {
    if (filter === 'founder') return s.participant_role === 'founder' || !s.participant_role
    if (filter === 'team') return s.participant_role && s.participant_role !== 'founder'
    return true
  })

  if (loading) {
    return <div className="screen-content"><div className="loading"><div className="spinner" /></div></div>
  }

  return (
    <div className="screen-content">
      <div className="header-bar">
        <h1>Call History</h1>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{sessions.length} sessions</span>
      </div>

      <div className="filter-tabs">
        {(['all', 'founder', 'team'] as Filter[]).map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No sessions match this filter.</p>
        </div>
      ) : (
        filtered.map(s => {
          const isExpanded = expandedId === s.id
          const date = new Date(s.created_at)
          const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

          return (
            <div
              key={s.id}
              className={`session-card card interactive ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
            >
              <div className="session-card-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {s.channel === 'whatsapp' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--biolum)" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                        <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    )}
                    <strong>{s.participant_name || 'Unknown'}</strong>
                    {s.participant_role && <span className="badge badge-accent">{s.participant_role}</span>}
                    {s.session_type && <span className="badge badge-green">{s.session_type}</span>}
                    {s.status === 'in_progress' && <span className="badge badge-orange">In Progress</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    <span>{dateStr} {timeStr}</span>
                    <span>{s.duration_seconds ? formatDuration(s.duration_seconds) : 'N/A'}</span>
                    <span>{s.data_points_captured || 0} data points</span>
                  </div>
                </div>
                <span className="session-chevron">{'\u25B8'}</span>
              </div>
              <div className="session-card-body">
                {s.summary ? <p style={{ color: 'var(--text)' }}>{s.summary}</p> : <p>No summary available.</p>}
                {(s.topics_covered || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {s.topics_covered.map(t => (
                      <span key={t} className="topic-tag">{topicLabels[t] || t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
