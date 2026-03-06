import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

interface CorrectionHistoryProps {
  companyId: string
  elementKey: string
}

interface CorrectionRecord {
  id: string
  original_value: string | null
  corrected_value: string
  correction_context: string | null
  source: string
  active: boolean
  applied_at: string
}

export default function CorrectionHistory({ companyId, elementKey }: CorrectionHistoryProps) {
  const [history, setHistory] = useState<CorrectionRecord[]>([])

  useEffect(() => {
    supabase
      .from('knowledge_corrections')
      .select('id, original_value, corrected_value, correction_context, source, active, applied_at')
      .eq('company_id', companyId)
      .eq('element_key', elementKey)
      .order('applied_at', { ascending: false })
      .then(({ data }) => setHistory(data || []))
  }, [companyId, elementKey])

  if (history.length === 0) return null

  return (
    <div className="correction-history">
      <h4>History</h4>
      {history.map(c => (
        <div key={c.id} className={`correction-history-item${c.active ? '' : ' superseded'}`}>
          <div className="correction-date">
            {new Date(c.applied_at).toLocaleDateString()} {new Date(c.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="correction-change">
            {c.original_value && <span className="old">{c.original_value}</span>}
            {c.original_value && <span className="arrow">&rarr;</span>}
            <span className="new">{c.corrected_value}</span>
          </div>
          <div className="correction-source">{c.source}{c.correction_context ? ` — ${c.correction_context}` : ''}</div>
        </div>
      ))}
    </div>
  )
}
