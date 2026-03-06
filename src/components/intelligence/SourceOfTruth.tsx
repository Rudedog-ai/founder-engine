import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

interface SotDomain {
  summary: string
  key_facts: string[]
  gaps: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface SotData {
  company_name: string
  generated_at: string
  domains: Record<string, SotDomain>
  overall_summary: string
  critical_gaps: string[]
}

const DOMAIN_LABELS: Record<string, string> = {
  financials: 'Revenue & Financials',
  sales: 'Sales & Pipeline',
  marketing: 'Marketing & Growth',
  operations: 'Operations & Processes',
  team: 'Team & People',
  strategy: 'Strategy & Vision',
}

interface Props {
  companyId: string
}

export default function SourceOfTruth({ companyId }: Props) {
  const [sot, setSot] = useState<SotData | null>(null)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('companies')
        .select('intelligence_score, source_of_truth_doc_id')
        .eq('id', companyId)
        .single()

      setScore(data?.intelligence_score || 0)

      if (data?.source_of_truth_doc_id) {
        try {
          const parsed = typeof data.source_of_truth_doc_id === 'string'
            ? JSON.parse(data.source_of_truth_doc_id)
            : data.source_of_truth_doc_id
          setSot(parsed)
        } catch {
          setSot(null)
        }
      }
      setLoading(false)
    }
    load()
  }, [companyId])

  function toggle(domain: string) {
    setExpanded(prev => ({ ...prev, [domain]: !prev[domain] }))
  }

  if (loading) return null

  if (!sot) {
    return (
      <div className="intelligence-section">
        <div className="intelligence-section-title">Source of Truth</div>
        <div className="sot-pending">
          <p>Source of Truth generates at 25% intelligence score</p>
          <div className="sot-pending-score">{score}%</div>
          <div className="sot-pending-threshold">
            {score < 25
              ? `${25 - score}% more needed`
              : 'Ready to generate'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="intelligence-section">
      <div className="intelligence-section-title">Source of Truth</div>

      {sot.overall_summary && (
        <div className="sot-summary">{sot.overall_summary}</div>
      )}

      {Object.entries(sot.domains || {}).map(([domain, data]) => (
        <div key={domain} className={`sot-domain-section ${expanded[domain] ? 'expanded' : ''}`}>
          <div className="sot-domain-header" onClick={() => toggle(domain)}>
            <span className="sot-domain-name">{DOMAIN_LABELS[domain] || domain}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`sot-domain-confidence ${data.confidence}`}>{data.confidence}</span>
              <svg className="sot-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
          <div className="sot-domain-body">
            <div className="sot-domain-content">
              {data.summary && <div className="sot-domain-summary">{data.summary}</div>}
              {data.key_facts?.length > 0 && (
                <ul className="sot-fact-list">
                  {data.key_facts.map((fact, i) => <li key={i}>{fact}</li>)}
                </ul>
              )}
              {data.gaps?.length > 0 && (
                <div className="sot-gaps">
                  <div className="sot-gaps-title">Gaps</div>
                  <ul className="sot-gaps">
                    {data.gaps.map((gap, i) => <li key={i}>{gap}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {sot.critical_gaps?.length > 0 && (
        <div className="sot-gaps" style={{ marginTop: 16 }}>
          <div className="sot-gaps-title">Critical Gaps</div>
          <ul className="sot-gaps">
            {sot.critical_gaps.map((gap, i) => <li key={i}>{gap}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
