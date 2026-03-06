import type { Document } from '../../types'

const EXPECTED_DOCS: Record<string, string[]> = {
  financials: ['P&L Statement', 'Cash Flow Forecast', 'Management Accounts'],
  sales: ['Sales Pipeline/CRM Export', 'Sales Deck', 'Pricing Document'],
  marketing: ['Marketing Plan', 'Brand Guidelines', 'Content Strategy'],
  operations: ['Process/SOP Document', 'Org Chart', 'Key Contracts'],
  team: ['Org Chart', 'Team Directory', 'Hiring Plan'],
  strategy: ['Business Plan', 'Pitch Deck', 'Investor Update'],
}

const DOMAIN_LABELS: Record<string, string> = {
  financials: 'Financials',
  sales: 'Sales',
  marketing: 'Marketing',
  operations: 'Operations',
  team: 'Team',
  strategy: 'Strategy',
}

function hasMatchingDoc(expected: string, documents: Document[]): boolean {
  const keywords = expected.toLowerCase().split(/[\s/]+/)
  return documents.some(doc => {
    const name = doc.file_name?.toLowerCase() || ''
    const topic = doc.extracted_data?.primary_topic?.toLowerCase() || ''
    return keywords.some(kw => kw.length > 2 && (name.includes(kw) || topic.includes(kw)))
  })
}

interface Props {
  companyId: string
  documents: Document[]
}

export default function DocumentChecklist({ documents }: Props) {
  const allExpected = Object.values(EXPECTED_DOCS).flat()
  const receivedCount = allExpected.filter(exp => hasMatchingDoc(exp, documents)).length

  return (
    <div className="intelligence-section">
      <div className="doc-checklist-header">
        <div className="intelligence-section-title" style={{ margin: 0 }}>Document Checklist</div>
        <span className="doc-checklist-count">{receivedCount} of {allExpected.length} received</span>
      </div>

      {Object.entries(EXPECTED_DOCS).map(([domain, expectedDocs]) => (
        <div key={domain} className="doc-checklist-domain">
          <div className="doc-checklist-domain-label">{DOMAIN_LABELS[domain]}</div>
          {expectedDocs.map(docName => {
            const received = hasMatchingDoc(docName, documents)
            return (
              <div key={docName} className={`doc-checklist-item ${received ? 'received' : 'missing'}`}>
                <svg className="doc-check-icon" viewBox="0 0 16 16" fill="none">
                  {received ? (
                    <path d="M3 8l3 3 7-7" stroke="var(--biolum)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <circle cx="8" cy="8" r="5" stroke="var(--text-muted)" strokeWidth="1.5" />
                  )}
                </svg>
                {docName}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
