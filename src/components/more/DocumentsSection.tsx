import { useState } from 'react'
import type { Document } from '../../types'

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
  'business_fundamentals', 'revenue_financials', 'customers',
  'team_operations', 'marketing_sales', 'technology_systems', 'founder_headspace',
]

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(ts: string) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fileTypeIcon(type: string) {
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('word') || type.includes('docx')) return 'DOC'
  if (type.includes('sheet') || type.includes('xlsx')) return 'XLS'
  if (type.includes('presentation') || type.includes('pptx')) return 'PPT'
  if (type.includes('csv')) return 'CSV'
  if (type.includes('plain') || type.includes('text')) return 'TXT'
  if (type.includes('image')) return 'IMG'
  return 'FILE'
}

interface Props {
  documents: Document[]
}

export default function DocumentsSection({ documents }: Props) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const docsByTopic: Record<string, Document[]> = {}
  for (const doc of documents) {
    const topic = doc.extracted_data?.primary_topic || doc.extracted_data?.data_points?.[0]?.topic || 'uncategorized'
    if (!docsByTopic[topic]) docsByTopic[topic] = []
    docsByTopic[topic].push(doc)
  }

  function renderDoc(doc: Document) {
    const isExpanded = expandedDoc === doc.id
    return (
      <div key={doc.id} className="knowledge-entry" style={{ cursor: 'pointer' }} onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-accent" style={{ fontSize: '0.65rem', flexShrink: 0 }}>{fileTypeIcon(doc.file_type)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
              <span>{formatDate(doc.uploaded_at)}</span>
              <span>{formatFileSize(doc.file_size_bytes)}</span>
              <span>{doc.processed ? 'Processed' : 'Pending'}</span>
            </div>
          </div>
        </div>
        {isExpanded && doc.extracted_data && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--sea)' }}>
            {doc.extracted_data.document_summary && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>{doc.extracted_data.document_summary}</p>
            )}
            {doc.extracted_data.data_points && doc.extracted_data.data_points.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Extracted {doc.extracted_data.data_points.length} data points:</div>
                {doc.extracted_data.data_points.slice(0, 5).map((dp, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(13,48,85,0.3)' }}>
                    <span style={{ color: 'var(--glow)', fontWeight: 500 }}>{dp.key}</span>
                    <span style={{ color: 'var(--text-dim)' }}> — {dp.value}</span>
                  </div>
                ))}
                {doc.extracted_data.data_points.length > 5 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>+ {doc.extracted_data.data_points.length - 5} more</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (documents.length === 0) return null

  return (
    <>
      <div className="section-title">Documents ({documents.length})</div>
      {topicOrder.map(topic => {
        const topicDocs = docsByTopic[topic] || []
        if (topicDocs.length === 0) return null
        const dataPoints = topicDocs.reduce((sum, d) => sum + (d.extracted_data?.data_points?.length || 0), 0)
        const isExpanded = expandedTopic === topic
        return (
          <div key={topic} className={`knowledge-topic ${isExpanded ? 'expanded' : ''}`}>
            <div className="knowledge-topic-header" onClick={() => setExpandedTopic(isExpanded ? null : topic)}>
              <span>{topicLabels[topic] || topic}</span>
              <span className="knowledge-topic-count">{topicDocs.length} docs, {dataPoints} points</span>
              <span className="knowledge-chevron">{isExpanded ? '\u25BC' : '\u25B6'}</span>
            </div>
            <div className="knowledge-topic-body">{topicDocs.map(renderDoc)}</div>
          </div>
        )
      })}
      {docsByTopic['uncategorized']?.length > 0 && (
        <div className={`knowledge-topic ${expandedTopic === 'uncategorized' ? 'expanded' : ''}`}>
          <div className="knowledge-topic-header" onClick={() => setExpandedTopic(expandedTopic === 'uncategorized' ? null : 'uncategorized')}>
            <span>Uncategorized</span>
            <span className="knowledge-topic-count">{docsByTopic['uncategorized'].length} docs</span>
            <span className="knowledge-chevron">{expandedTopic === 'uncategorized' ? '\u25BC' : '\u25B6'}</span>
          </div>
          <div className="knowledge-topic-body">{docsByTopic['uncategorized'].map(renderDoc)}</div>
        </div>
      )}
    </>
  )
}
