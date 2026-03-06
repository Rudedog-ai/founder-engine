import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import {
  getCompanyProfile,
  uploadDocument,
  inviteTeamMember,
  generateRecommendations,
  updateRecommendationStatus,
} from '../api'
import type { CompanyProfile, Document } from '../types'

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
  'business_fundamentals',
  'revenue_financials',
  'customers',
  'team_operations',
  'marketing_sales',
  'technology_systems',
  'founder_headspace',
]

const ACCEPTED_TYPES = '.pdf,.docx,.xlsx,.pptx,.csv,.txt,.png,.jpg,.jpeg,.webp'

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

interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  result?: { document: Document }
}

// Recursively read a dropped folder via webkitGetAsEntry
async function readAllEntries(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve([f]),
        () => resolve([])
      )
    })
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const entries: FileSystemEntry[] = await new Promise((resolve) => {
      reader.readEntries((e) => resolve(e), () => resolve([]))
    })
    const files: File[] = []
    for (const e of entries) {
      files.push(...(await readAllEntries(e)))
    }
    return files
  }
  return []
}

export default function MoreScreen() {
  const { companyId, signOut } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingRecs, setGeneratingRecs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload state
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Document category expansion
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  // Invite form state
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  // Email copy
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(setProfile)
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }, [companyId])

  const reloadProfile = useCallback(async () => {
    if (!companyId) return
    try {
      const updated = await getCompanyProfile(companyId)
      setProfile(updated)
    } catch { /* silent */ }
  }, [companyId])

  async function processFiles(files: File[]) {
    if (!companyId) return

    const newUploads: UploadItem[] = files.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploads(prev => [...newUploads, ...prev])

    for (const item of newUploads) {
      try {
        const result = await uploadDocument(companyId, item.file, (percent) => {
          setUploads(prev => prev.map(u =>
            u.id === item.id ? { ...u, progress: percent } : u
          ))
        })
        setUploads(prev => prev.map(u =>
          u.id === item.id ? { ...u, status: 'done', progress: 100, result } : u
        ))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setUploads(prev => prev.map(u =>
          u.id === item.id ? { ...u, status: 'error', error: msg } : u
        ))
        showToast(`Failed: ${item.file.name} — ${msg}`, 'error')
      }
    }

    // Reload profile to get updated documents list
    await reloadProfile()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)

    const items = e.dataTransfer.items
    const allFiles: File[] = []

    // Check for folder drops via webkitGetAsEntry
    if (items) {
      const entries: FileSystemEntry[] = []
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.()
        if (entry) entries.push(entry)
      }

      if (entries.length > 0) {
        for (const entry of entries) {
          allFiles.push(...(await readAllEntries(entry)))
        }
        await processFiles(allFiles)
        return
      }
    }

    // Fallback: plain file drop
    if (e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files))
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
      e.target.value = '' // reset so same file can be picked again
    }
  }

  async function copyInboxAddress() {
    const addr = profile?.company?.email_inbox_address
    if (!addr) return
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy', 'error')
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
      await reloadProfile()
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
      await reloadProfile()
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
  const documents = (profile?.documents || []) as Document[]

  // Group documents by their primary topic (from extracted_data) or 'uncategorized'
  const docsByTopic: Record<string, Document[]> = {}
  for (const doc of documents) {
    const topic = doc.extracted_data?.primary_topic ||
      (doc.extracted_data?.data_points?.[0]?.topic) ||
      'uncategorized'
    if (!docsByTopic[topic]) docsByTopic[topic] = []
    docsByTopic[topic].push(doc)
  }

  const storageUsedMB = Math.round((company?.storage_used_bytes || 0) / 1024 / 1024)
  const storagePercent = Math.min(100, Math.round(((company?.storage_used_bytes || 0) / (500 * 1024 * 1024)) * 100))

  return (
    <div className="screen-content">
      <div className="header-bar"><h1>Settings & Data</h1></div>

      {/* ===== EMAIL INBOX ===== */}
      {company?.email_inbox_address && (
        <>
          <div className="section-title">Email Inbox</div>
          <div className="card" style={{ background: 'var(--surface)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
              Forward any document to this address and we'll analyse it automatically.
            </p>
            <div
              className="copy-text"
              onClick={copyInboxAddress}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ flex: 1, wordBreak: 'break-all' }}>{company.email_inbox_address}</span>
              <button className="copy-btn" type="button">
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--biolum)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== UPLOAD DOCUMENTS ===== */}
      <div className="section-title">Upload Documents</div>
      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ padding: '32px 20px', textAlign: 'center' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p style={{ color: 'var(--text-dim)', margin: '0 0 4px' }}>
          {dragActive ? 'Drop files or folders here' : 'Drag & drop files or folders here'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
          PDF, Word, Excel, CSV, TXT, PNG, JPEG — up to 50MB each
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* Storage usage */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 4px' }}>
        <span>Storage: {storageUsedMB}MB / 500MB</span>
        <span>{storagePercent}%</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: '16px' }}>
        <div className="progress-fill" style={{ width: `${storagePercent}%` }} />
      </div>

      {/* Upload progress items */}
      {uploads.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {uploads.map(item => (
            <div key={item.id} style={{
              background: 'var(--abyss)',
              border: '1px solid var(--sea)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '6px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                  {item.file.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {formatFileSize(item.file.size)}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${item.progress}%`,
                  background: item.status === 'error'
                    ? 'var(--coral)'
                    : item.status === 'done'
                      ? 'var(--biolum)'
                      : undefined,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: item.status === 'error' ? 'var(--coral)' : item.status === 'done' ? 'var(--biolum)' : 'var(--text-muted)' }}>
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'done' && 'Uploaded & analysed'}
                  {item.status === 'error' && (item.error || 'Failed')}
                </span>
                {item.status === 'done' && item.result?.document?.extracted_data?.primary_topic && (
                  <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                    {topicLabels[item.result.document.extracted_data.primary_topic] || item.result.document.extracted_data.primary_topic}
                  </span>
                )}
              </div>
            </div>
          ))}
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setUploads([])}
            style={{ marginTop: '4px' }}
          >
            Clear upload history
          </button>
        </div>
      )}

      {/* ===== DOCUMENT CATEGORIES ===== */}
      {documents.length > 0 && (
        <>
          <div className="section-title">Documents ({documents.length})</div>
          {topicOrder.map(topic => {
            const topicDocs = docsByTopic[topic] || []
            if (topicDocs.length === 0) return null
            const dataPoints = topicDocs.reduce((sum, d) =>
              sum + (d.extracted_data?.data_points?.length || 0), 0)
            const isExpanded = expandedTopic === topic
            return (
              <div key={topic} className={`knowledge-topic ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="knowledge-topic-header"
                  onClick={() => setExpandedTopic(isExpanded ? null : topic)}
                >
                  <span>{topicLabels[topic] || topic}</span>
                  <span className="knowledge-topic-count">{topicDocs.length} docs, {dataPoints} points</span>
                  <span className="knowledge-chevron">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                </div>
                <div className="knowledge-topic-body">
                  {topicDocs.map(doc => {
                    const isDocExpanded = expandedDoc === doc.id
                    return (
                      <div key={doc.id} className="knowledge-entry" style={{ cursor: 'pointer' }} onClick={() => setExpandedDoc(isDocExpanded ? null : doc.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="badge badge-accent" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                            {fileTypeIcon(doc.file_type)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.file_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                              <span>{formatDate(doc.uploaded_at)}</span>
                              <span>{formatFileSize(doc.file_size_bytes)}</span>
                              <span>{doc.source}</span>
                              <span className={`status-dot ${doc.processed ? 'completed' : 'pending'}`} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                              <span>{doc.processed ? 'Processed' : 'Pending'}</span>
                            </div>
                          </div>
                        </div>
                        {isDocExpanded && doc.extracted_data && (
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--sea)' }}>
                            {doc.extracted_data.document_summary && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                                {doc.extracted_data.document_summary}
                              </p>
                            )}
                            {doc.extracted_data.data_points && doc.extracted_data.data_points.length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  Extracted {doc.extracted_data.data_points.length} data points:
                                </div>
                                {doc.extracted_data.data_points.slice(0, 5).map((dp, i) => (
                                  <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(13,48,85,0.3)' }}>
                                    <span style={{ color: 'var(--glow)', fontWeight: 500 }}>{dp.key}</span>
                                    <span style={{ color: 'var(--text-dim)' }}> — {dp.value}</span>
                                  </div>
                                ))}
                                {doc.extracted_data.data_points.length > 5 && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    + {doc.extracted_data.data_points.length - 5} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {/* Uncategorized docs */}
          {docsByTopic['uncategorized'] && docsByTopic['uncategorized'].length > 0 && (
            <div className={`knowledge-topic ${expandedTopic === 'uncategorized' ? 'expanded' : ''}`}>
              <div
                className="knowledge-topic-header"
                onClick={() => setExpandedTopic(expandedTopic === 'uncategorized' ? null : 'uncategorized')}
              >
                <span>Uncategorized</span>
                <span className="knowledge-topic-count">{docsByTopic['uncategorized'].length} docs</span>
                <span className="knowledge-chevron">{expandedTopic === 'uncategorized' ? '\u25BC' : '\u25B6'}</span>
              </div>
              <div className="knowledge-topic-body">
                {docsByTopic['uncategorized'].map(doc => (
                  <div key={doc.id} className="knowledge-entry">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{fileTypeIcon(doc.file_type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(doc.uploaded_at)} — {formatFileSize(doc.file_size_bytes)} — {doc.processed ? 'Processed' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== CONNECT STORAGE ===== */}
      <div className="section-title">Connect Storage</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <div className="card" style={{ background: 'var(--surface)', opacity: 0.6, textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Google Drive</div>
          <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
        </div>
        <div className="card" style={{ background: 'var(--surface)', opacity: 0.6, textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Dropbox</div>
          <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
        </div>
      </div>

      {/* ===== TEAM ===== */}
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

      {/* ===== RECOMMENDATIONS ===== */}
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

      {/* ===== GAP ANALYSIS ===== */}
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

      {/* ===== SETTINGS ===== */}
      <div className="section-title">Settings</div>
      <div className="card">
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
