import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useToast } from '../Toast'
import CorrectionPanel from '../corrections/CorrectionPanel'

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
  const { showToast } = useToast()
  const [sot, setSot] = useState<SotData | null>(null)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingFact, setEditingFact] = useState<{ key: string; label: string; domain: string; value: string } | null>(null)

  async function load() {
    const { data, error } = await supabase
      .from('companies')
      .select('intelligence_score, source_of_truth_doc_id')
      .eq('id', companyId)
      .single()

    if (error) {
      showToast('Failed to load Source of Truth', 'error')
      setLoading(false)
      return
    }

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

  useEffect(() => { load() }, [companyId])

  function toggle(domain: string) {
    setExpanded(prev => ({ ...prev, [domain]: !prev[domain] }))
  }

  function factToKey(fact: string) {
    return fact.slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, '_')
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
                  {data.key_facts.map((fact, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <span style={{ flex: 1 }}>{fact}</span>
                      <button
                        className="edit-fact-btn"
                        onClick={e => {
                          e.stopPropagation()
                          setEditingFact({ key: factToKey(fact), label: fact.slice(0, 60), domain, value: fact })
                        }}
                        title="Edit this fact"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </li>
                  ))}
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

      {editingFact && (
        <CorrectionPanel
          isOpen={true}
          onClose={() => setEditingFact(null)}
          companyId={companyId}
          elementKey={editingFact.key}
          elementLabel={editingFact.label}
          domain={editingFact.domain}
          currentValue={editingFact.value}
          onCorrected={() => { setEditingFact(null); load() }}
        />
      )}
    </div>
  )
}
