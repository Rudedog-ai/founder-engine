import { useState } from 'react'
import { supabase } from '../../supabase'
import CorrectionHistory from './CorrectionHistory'

interface CorrectionPanelProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  elementKey: string
  elementLabel: string
  domain: string
  currentValue: string
  onCorrected: () => void
}

export default function CorrectionPanel({
  isOpen, onClose, companyId, elementKey, elementLabel, domain, currentValue, onCorrected,
}: CorrectionPanelProps) {
  const [correctedValue, setCorrectedValue] = useState('')
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  async function handleSave() {
    if (!correctedValue.trim() || saving) return
    setSaving(true)
    try {
      const { data, error } = await supabase.functions.invoke('apply-correction', {
        body: {
          company_id: companyId,
          element_key: elementKey,
          element_label: elementLabel,
          domain,
          original_value: currentValue,
          corrected_value: correctedValue.trim(),
          correction_context: context.trim() || undefined,
          source: 'dashboard_edit',
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      onCorrected()
      onClose()
    } catch (err) {
      console.error('Apply correction failed:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="correction-overlay" onClick={onClose} />
      <div className="correction-panel">
        <div className="correction-panel-header">
          <h3>Edit Fact</h3>
          <button className="correction-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="correction-panel-body">
          <span className="correction-domain-badge">{domain}</span>

          <div className="correction-field">
            <label>{elementLabel}</label>
            <div className="current-value">{currentValue || 'Unknown'}</div>
          </div>

          <div className="correction-field">
            <label>Corrected Value</label>
            <input
              type="text"
              value={correctedValue}
              onChange={e => setCorrectedValue(e.target.value)}
              placeholder="Enter the correct value..."
              autoFocus
            />
          </div>

          <div className="correction-field">
            <label>Why? (optional)</label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g., Based on 2024 filed accounts"
              rows={2}
            />
          </div>

          <button className="correction-save-btn" onClick={handleSave} disabled={!correctedValue.trim() || saving}>
            {saving ? 'Saving...' : 'Save Correction'}
          </button>

          <CorrectionHistory companyId={companyId} elementKey={elementKey} />
        </div>
      </div>
    </>
  )
}
