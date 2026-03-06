// CampaignApprovalCard v1 — Inline campaign approval inside Angus chat
import { useState } from 'react'
import { approveCampaign } from '../api'
import type { CampaignProposed } from '../api'

interface Props {
  companyId: string
  campaign: CampaignProposed
}

export default function CampaignApprovalCard({ companyId, campaign }: Props) {
  const [status, setStatus] = useState<'pending' | 'launching' | 'launched' | 'dismissed'>('pending')

  async function handleLaunch() {
    if (status !== 'pending') return
    setStatus('launching')
    try {
      await approveCampaign(companyId, campaign.campaign_id)
      setStatus('launched')
    } catch {
      setStatus('pending')
    }
  }

  if (status === 'dismissed') return null

  return (
    <div className="campaign-card">
      <div className="campaign-card-title">{campaign.title}</div>
      <div className="campaign-card-stats">
        <span>{campaign.leads_count} lead{campaign.leads_count !== 1 ? 's' : ''} found</span>
      </div>
      <div className="campaign-card-preview">{campaign.message_preview}</div>

      {status === 'launched' ? (
        <div className="campaign-card-launched">Campaign launched</div>
      ) : (
        <div className="campaign-card-actions">
          <button className="campaign-btn campaign-btn-launch" onClick={handleLaunch} disabled={status === 'launching'}>
            {status === 'launching' ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Launching...</> : 'Launch Campaign'}
          </button>
          <button className="campaign-btn campaign-btn-dismiss" onClick={() => setStatus('dismissed')}>
            Not this time
          </button>
        </div>
      )}
    </div>
  )
}
