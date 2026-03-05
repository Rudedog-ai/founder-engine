import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getCompanyProfile } from '../api'
import type { KnowledgeEntry } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function KnowledgeScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [knowledge, setKnowledge] = useState<Record<string, KnowledgeEntry[]>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(profile => setKnowledge(profile?.knowledge || {}))
      .catch(() => showToast('Failed to load knowledge', 'error'))
      .finally(() => setLoading(false))
  }, [companyId])

  function toggleTopic(topic: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  if (loading) {
    return <div className="screen-content"><div className="loading"><div className="spinner" /></div></div>
  }

  const totalEntries = Object.values(knowledge).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="screen-content">
      <div className="header-bar">
        <h1>Knowledge Base</h1>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{totalEntries} entries</span>
      </div>

      {Object.entries(knowledge).map(([topic, entries]) => {
        if (entries.length === 0) return null
        const isExpanded = expanded.has(topic)
        return (
          <div key={topic} className={`knowledge-topic ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleTopic(topic)}>
            <div className="knowledge-topic-header">
              <span>{topicLabels[topic] || topic}</span>
              <span className="knowledge-topic-count">{entries.length}</span>
              <span className="knowledge-chevron">{'\u25B8'}</span>
            </div>
            <div className="knowledge-topic-body">
              {entries.map(e => (
                <div key={e.id} className="knowledge-entry" onClick={ev => ev.stopPropagation()}>
                  <div className="knowledge-key">{formatKey(e.key)}</div>
                  <div className="knowledge-value">{e.value}</div>
                  <span className={`confidence-badge confidence-${e.confidence || 'medium'}`}>
                    {e.confidence || 'medium'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {totalEntries === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No knowledge captured yet. Start a voice session to begin building intelligence.</p>
        </div>
      )}
    </div>
  )
}
