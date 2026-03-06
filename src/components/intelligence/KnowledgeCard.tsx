import type { KnowledgeEntry } from '../../types'

interface Props {
  entry: KnowledgeEntry
}

export default function KnowledgeCard({ entry }: Props) {
  const confidence = (entry.confidence || 'medium').toLowerCase()

  return (
    <div className="knowledge-fact-card">
      <div className="knowledge-fact-header">
        <span className="knowledge-fact-key">
          <span className={`confidence-dot ${confidence}`} />
          {entry.key}
        </span>
        <span className="knowledge-fact-topic">{entry.topic}</span>
      </div>
      <div className="knowledge-fact-value">{entry.value}</div>
    </div>
  )
}
