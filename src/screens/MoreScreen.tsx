import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import {
  getCompanyProfile,
  uploadDocument,
  inviteTeamMember,
  generateRecommendations,
  updateRecommendationStatus,
} from '../api'
import type { CompanyProfile } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default function MoreScreen() {
  const { companyId, signOut } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingRecs, setGeneratingRecs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Invite form state
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(setProfile)
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }, [companyId])

  async function handleFiles(files: FileList) {
    if (!companyId) return
    for (const file of Array.from(files)) {
      try {
        await uploadDocument(companyId, file)
        showToast(`${file.name} uploaded successfully`)
      } catch {
        showToast(`Failed to upload ${file.name}`, 'error')
      }
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId || !inviteName.trim() || !inviteRole.trim()) return
    try {
      await inviteTeamMember(companyId, inviteName.trim(), inviteRole.trim(), inviteEmail.trim() || undefined)
      showToast('Team member invited!')
      setInviteName('')
      setInviteRole('')
      setInviteEmail('')
      setShowInviteForm(false)
      // Reload profile
      const updated = await getCompanyProfile(companyId)
      setProfile(updated)
    } catch {
      showToast('Failed to invite team member', 'error')
    }
  }

  async function handleGenerateRecs() {
    if (!companyId) return
    setGeneratingRecs(true)
    try {
      await generateRecommendations(companyId)
      showToast('Recommendations generated!')
      const updated = await getCompanyProfile(companyId)
      setProfile(updated)
    } catch {
      showToast('Failed to generate recommendations', 'error')
    } finally {
      setGeneratingRecs(false)
    }
  }

  if (loading) {
    return <div className="screen-content"><div className="loading"><div className="spinner" /></div></div>
  }

  const company = profile?.company
  const recommendations = profile?.recommendations || []
  const gaps = profile?.gaps || []
  const team = profile?.team || []

  return (
    <div className="screen-content">
      <div className="header-bar"><h1>More</h1></div>

      {/* Upload Documents */}
      <div className="section-title">Upload Documents</div>
      <div
        className="drop-zone"
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('active') }}
        onDragLeave={e => e.currentTarget.classList.remove('active')}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('active'); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
      >
        <p style={{ color: 'var(--text-dim)' }}>Drop files here or click to browse</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      {/* Team Management */}
      <div className="section-title">Team</div>
      {team.map(member => (
        <div key={member.id} className="team-member">
          <div className="team-member-info">
            <h3>{member.name}</h3>
            <div className="team-member-role">{member.role}</div>
            <div className="team-member-invite">
              <span className={`status-dot ${member.invite_status === 'complete' ? 'completed' : member.invite_status === 'in_progress' ? 'in-progress' : 'pending'}`} />
              {member.invite_status}
            </div>
          </div>
        </div>
      ))}
      {!showInviteForm ? (
        <button className="btn btn-secondary btn-small" onClick={() => setShowInviteForm(true)}>
          + Invite Team Member
        </button>
      ) : (
        <div className="card">
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <label>Name</label>
              <input value={inviteName} onChange={e => setInviteName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input value={inviteRole} onChange={e => setInviteRole(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email (optional)</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-small" type="submit">Send Invite</button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setShowInviteForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Recommendations */}
      <div className="section-title">Recommendations</div>
      <button
        className="btn btn-secondary btn-small"
        onClick={handleGenerateRecs}
        disabled={generatingRecs}
        style={{ marginBottom: 'var(--gap)' }}
      >
        {generatingRecs ? <><span className="spinner" /> Generating...</> : 'Generate Recommendations'}
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
                  if (companyId) updateRecommendationStatus(companyId, rec.id, e.target.value)
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

      {/* Gap Analysis */}
      <div className="section-title">Gap Analysis</div>
      {gaps.map(topic => {
        const completeness = Math.round(topic.completeness_score || 0)
        const missingAreas = (topic.missing_items || []).slice(0, 3)
        return (
          <div key={topic.id} className="card" style={{ background: 'var(--surface)' }}>
            <div style={{ fontWeight: 600 }}>{topicLabels[topic.topic] || topic.topic}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>{completeness}% complete</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${completeness}%` }} />
            </div>
            {missingAreas.length > 0 && (
              <ul style={{ paddingLeft: '20px', color: 'var(--text-dim)', fontSize: '0.9rem', margin: '8px 0 0' }}>
                {missingAreas.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            )}
          </div>
        )
      })}

      {/* Settings */}
      <div className="section-title">Settings</div>
      <div className="card">
        <div className="list-item">
          <span style={{ color: 'var(--text-dim)' }}>Email Inbox</span>
          <span style={{ fontSize: '0.85rem' }}>{company?.email_inbox_address || 'Not set'}</span>
        </div>
        <div className="list-item">
          <span style={{ color: 'var(--text-dim)' }}>Onboarding Link</span>
          <span style={{ fontSize: '0.85rem' }}>{company?.onboarding_link || 'Not set'}</span>
        </div>
      </div>
      <button className="btn btn-secondary btn-block" onClick={signOut} style={{ marginTop: 'var(--gap)' }}>
        Sign Out
      </button>
    </div>
  )
}
