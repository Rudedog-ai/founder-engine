import { useState } from 'react'
import { useToast } from '../Toast'
import { generateRecommendations, updateRecommendationStatus } from '../../api'
import type { Recommendation } from '../../types'

interface Props {
  companyId: string
  recommendations: Recommendation[]
  onGenerated: () => void
}

export default function RecommendationsSection({ companyId, recommendations, onGenerated }: Props) {
  const { showToast } = useToast()
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateRecommendations(companyId)
      showToast('Recommendations generated!')
      onGenerated()
    } catch {
      showToast('Failed to generate recommendations', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <div className="section-title">Recommendations</div>
      <button className="btn btn-secondary btn-small" onClick={handleGenerate} disabled={generating} style={{ marginBottom: 'var(--gap)' }}>
        {generating ? <><span className="spinner" /> Generating...</> : 'Generate Recommendations'}
      </button>
      {recommendations.length === 0 ? (
        <p>No recommendations yet. Generate recommendations to get started.</p>
      ) : (
        recommendations.map(rec => (
          <div key={rec.id} className="recommendation-card">
            <div className="recommendation-header">
              <div style={{ flex: 1 }}>
                <div className="recommendation-badges">
                  {rec.priority && <span className={`badge ${rec.priority <= 3 ? 'badge-orange' : 'badge-accent'}`}>#{rec.priority}</span>}
                  {rec.constraint_type && <span className="badge badge-green">{rec.constraint_type}</span>}
                </div>
                <div className="recommendation-title">{rec.title}</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>{rec.description}</p>
              </div>
            </div>
            <div className="recommendation-status">
              <select
                style={{ flex: 1 }}
                value={rec.status}
                onChange={e => {
                  updateRecommendationStatus(companyId, rec.id, e.target.value)
                    .then(() => showToast('Status updated'))
                    .catch(() => showToast('Failed to update', 'error'))
                }}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        ))
      )}
    </>
  )
}
