// DataPrivacySection v1 — Export All + Erase All (two-step confirm)
import { useState } from 'react'
import { useToast } from '../Toast'
import { resetCompany, exportCompany } from '../../api'

interface Props {
  companyId: string
  companyName: string
}

export default function DataPrivacySection({ companyId, companyName }: Props) {
  const { showToast } = useToast()
  const [showEraseConfirm, setShowEraseConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [exporting, setExporting] = useState(false)

  return (
    <>
      <div className="section-title">Data & Privacy</div>
      <div className="card" style={{ background: 'var(--surface)' }}>
        <button
          className="btn btn-secondary btn-block"
          disabled={exporting}
          onClick={async () => {
            if (exporting) return
            setExporting(true)
            try {
              await exportCompany(companyId, companyName)
              showToast('Export downloaded')
            } catch { showToast('Export failed', 'error') }
            finally { setExporting(false) }
          }}
          style={{ marginBottom: '8px' }}
        >
          {exporting ? <><span className="spinner" /> Exporting...</> : 'Export All Data'}
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0 0 16px' }}>
          Download everything Angus knows as a .txt file. Your data, yours to keep.
        </p>

        {!showEraseConfirm ? (
          <button
            className="btn btn-block"
            onClick={() => setShowEraseConfirm(true)}
            style={{ border: '1px solid #f87171', color: '#f87171', background: 'transparent' }}
          >
            Erase All Data
          </button>
        ) : (
          <div style={{ border: '1px solid #f87171', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <p style={{ fontSize: '0.85rem', color: '#fbbf24', margin: '0 0 12px' }}>
              This resets Angus's memory of your company. All documents, knowledge, corrections, and questions will be deleted. Your login and account stay. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowEraseConfirm(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                className="btn btn-small"
                disabled={resetting}
                onClick={async () => {
                  if (resetting) return
                  setResetting(true)
                  try {
                    await resetCompany(companyId)
                    window.location.href = '/'
                  } catch {
                    setResetting(false)
                    showToast('Reset failed. Please try again.', 'error')
                  }
                }}
                style={{ background: '#f87171', color: '#1a1a2e', fontWeight: 600 }}
              >
                {resetting ? <><span className="spinner" /> Erasing...</> : 'Yes, erase everything'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
