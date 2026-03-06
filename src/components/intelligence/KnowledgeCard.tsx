import type { KnowledgeEntry } from '../../types'

interface Props {
  entry: KnowledgeEntry
  onEdit?: (key: string, label: string, value: string) => void
}

export default function KnowledgeCard({ entry, onEdit }: Props) {
  const confidence = (entry.confidence || 'medium').toLowerCase()

  return (
    <div className="knowledge-fact-card">
      <div className="knowledge-fact-header">
        <span className="knowledge-fact-key">
          <span className={`confidence-dot ${confidence}`} />
          {entry.key}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="knowledge-fact-topic">{entry.topic}</span>
          {onEdit && (
            <button
              className="edit-fact-btn"
              onClick={() => onEdit(entry.key, entry.key, entry.value)}
              title="Edit this fact"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </span>
      </div>
      <div className="knowledge-fact-value">{entry.value}</div>
    </div>
  )
}
