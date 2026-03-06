import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { supabase } from '../supabase'
import { getCompanyProfile, uploadDocument, inviteTeamMember } from '../api'
import WhatsAppSection from '../components/more/WhatsAppSection'
import DocumentsSection from '../components/more/DocumentsSection'
import RecommendationsSection from '../components/more/RecommendationsSection'
import type { CompanyProfile, Document } from '../types'

const ACCEPTED_TYPES = '.pdf,.docx,.xlsx,.pptx,.csv,.txt,.png,.jpg,.jpeg,.webp'

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

interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  result?: { document: Document }
}

async function readAllEntries(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file((f) => resolve([f]), () => resolve([]))
    })
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const entries: FileSystemEntry[] = await new Promise((resolve) => {
      reader.readEntries((e) => resolve(e), () => resolve([]))
    })
    const files: File[] = []
    for (const e of entries) files.push(...(await readAllEntries(e)))
    return files
  }
  return []
}

export default function MoreScreen() {
  const { companyId, signOut } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [driveConnected, setDriveConnected] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(setProfile)
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false))
    // Check Drive connection
    supabase.from('companies').select('google_connected_at').eq('id', companyId).single()
      .then(({ data }) => { if (data?.google_connected_at) setDriveConnected(true) })
  }, [companyId])

  const reloadProfile = useCallback(async () => {
    if (!companyId) return
    try { setProfile(await getCompanyProfile(companyId)) } catch { /* silent */ }
  }, [companyId])

  async function processFiles(files: File[]) {
    if (!companyId) return
    const newUploads: UploadItem[] = files.map(f => ({ id: crypto.randomUUID(), file: f, progress: 0, status: 'uploading' as const }))
    setUploads(prev => [...newUploads, ...prev])
    for (const item of newUploads) {
      try {
        const result = await uploadDocument(companyId, item.file, (p) => {
          setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: p } : u))
        })
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'done', progress: 100, result } : u))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'error', error: msg } : u))
        showToast(`Failed: ${item.file.name} — ${msg}`, 'error')
      }
    }
    await reloadProfile()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const items = e.dataTransfer.items
    const allFiles: File[] = []
    if (items) {
      const entries: FileSystemEntry[] = []
      for (let i = 0; i < items.length; i++) { const entry = items[i].webkitGetAsEntry?.(); if (entry) entries.push(entry) }
      if (entries.length > 0) { for (const entry of entries) allFiles.push(...(await readAllEntries(entry))); await processFiles(allFiles); return }
    }
    if (e.dataTransfer.files.length > 0) await processFiles(Array.from(e.dataTransfer.files))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) { processFiles(Array.from(e.target.files)); e.target.value = '' }
  }

  async function copyInboxAddress() {
    const addr = profile?.company?.email_inbox_address
    if (!addr) return
    try { await navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { showToast('Failed to copy', 'error') }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId || !inviteName.trim() || !inviteRole.trim()) return
    try {
      await inviteTeamMember(companyId, inviteName.trim(), inviteRole.trim(), inviteEmail.trim() || undefined)
      showToast('Team member invited!')
      setInviteName(''); setInviteRole(''); setInviteEmail(''); setShowInviteForm(false)
      await reloadProfile()
    } catch { showToast('Failed to invite team member', 'error') }
  }

  if (loading) return <div className="screen-content"><div className="loading"><div className="spinner" /></div></div>

  const company = profile?.company
  const gaps = profile?.gaps || []
  const team = profile?.team || []
  const documents = (profile?.documents || []) as Document[]
  const storageUsedMB = Math.round((company?.storage_used_bytes || 0) / 1024 / 1024)
  const storagePercent = Math.min(100, Math.round(((company?.storage_used_bytes || 0) / (500 * 1024 * 1024)) * 100))

  return (
    <div className="screen-content">
      <div className="header-bar"><h1>Settings & Data</h1></div>

      {/* Email Inbox */}
      {company?.email_inbox_address && (
        <>
          <div className="section-title">Email Inbox</div>
          <div className="card" style={{ background: 'var(--surface)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>Forward any document to this address and we'll analyse it automatically.</p>
            <div className="copy-text" onClick={copyInboxAddress} style={{ cursor: 'pointer' }}>
              <span style={{ flex: 1, wordBreak: 'break-all' }}>{company.email_inbox_address}</span>
              <button className="copy-btn" type="button">
                {copied ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--biolum)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* WhatsApp */}
      <WhatsAppSection companyId={companyId!} initialPhone={company?.founder_phone || ''} onSaved={reloadProfile} />

      {/* Upload Documents */}
      <div className="section-title">Upload Documents</div>
      <div className={`drop-zone ${dragActive ? 'active' : ''}`} onDragOver={e => { e.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} style={{ padding: '32px 20px', textAlign: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '8px' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        <p style={{ color: 'var(--text-dim)', margin: '0 0 4px' }}>{dragActive ? 'Drop files or folders here' : 'Drag & drop files or folders here'}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>PDF, Word, Excel, CSV, TXT, PNG, JPEG — up to 50MB each</p>
      </div>
      <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_TYPES} style={{ display: 'none' }} onChange={handleFileInput} />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 4px' }}>
        <span>Storage: {storageUsedMB}MB / 500MB</span><span>{storagePercent}%</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: '16px' }}><div className="progress-fill" style={{ width: `${storagePercent}%` }} /></div>

      {uploads.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {uploads.map(item => (
            <div key={item.id} style={{ background: 'var(--abyss)', border: '1px solid var(--sea)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>{item.file.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{formatFileSize(item.file.size)}</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%`, background: item.status === 'error' ? 'var(--coral)' : item.status === 'done' ? 'var(--biolum)' : undefined }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: item.status === 'error' ? 'var(--coral)' : item.status === 'done' ? 'var(--biolum)' : 'var(--text-muted)' }}>
                  {item.status === 'uploading' && `${item.progress}%`}{item.status === 'done' && 'Uploaded & analysed'}{item.status === 'error' && (item.error || 'Failed')}
                </span>
                {item.status === 'done' && item.result?.document?.extracted_data?.primary_topic && (
                  <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{topicLabels[item.result.document.extracted_data.primary_topic] || item.result.document.extracted_data.primary_topic}</span>
                )}
              </div>
            </div>
          ))}
          <button className="btn btn-secondary btn-small" onClick={() => setUploads([])} style={{ marginTop: '4px' }}>Clear upload history</button>
        </div>
      )}

      {/* Documents */}
      <DocumentsSection documents={documents} />

      {/* Connect Storage */}
      <div className="section-title">Connect Storage</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <div className="card" style={{ background: 'var(--surface)', textAlign: 'center', padding: '16px', opacity: driveConnected ? 1 : undefined }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Google Drive</div>
          {driveConnected ? (
            <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Connected</span>
          ) : (
            <button className="btn btn-primary btn-small" disabled={driveLoading} onClick={async () => {
              if (!companyId || driveLoading) return
              setDriveLoading(true)
              try {
                const { data, error } = await supabase.functions.invoke('google-drive-oauth', {
                  body: { action: 'get_auth_url', company_id: companyId },
                })
                if (error || !data?.auth_url) { setDriveLoading(false); return }
                window.location.href = data.auth_url
              } catch { setDriveLoading(false) }
            }} style={{ fontSize: '0.75rem', marginTop: 4 }}>
              {driveLoading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
        <div className="card" style={{ background: 'var(--surface)', opacity: 0.6, textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Dropbox</div>
          <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
        </div>
      </div>

      {/* Team */}
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
        <button className="btn btn-secondary btn-small" onClick={() => setShowInviteForm(true)}>+ Invite Team Member</button>
      ) : (
        <div className="card">
          <form onSubmit={handleInvite}>
            <div className="form-group"><label>Name</label><input value={inviteName} onChange={e => setInviteName(e.target.value)} required /></div>
            <div className="form-group"><label>Role</label><input value={inviteRole} onChange={e => setInviteRole(e.target.value)} required /></div>
            <div className="form-group"><label>Email (optional)</label><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} /></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-small" type="submit">Send Invite</button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setShowInviteForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Recommendations */}
      <RecommendationsSection companyId={companyId!} recommendations={profile?.recommendations || []} onGenerated={reloadProfile} />

      {/* Gap Analysis */}
      <div className="section-title">Gap Analysis</div>
      {gaps.map(topic => {
        const completeness = Math.round(topic.completeness_score || 0)
        const missingAreas = (topic.missing_items || []).slice(0, 3)
        return (
          <div key={topic.id} className="card" style={{ background: 'var(--surface)' }}>
            <div style={{ fontWeight: 600 }}>{topicLabels[topic.topic] || topic.topic}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>{completeness}% complete</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${completeness}%` }} /></div>
            {missingAreas.length > 0 && (
              <ul style={{ paddingLeft: '20px', color: 'var(--text-dim)', fontSize: '0.9rem', margin: '8px 0 0' }}>
                {missingAreas.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            )}
          </div>
        )
      })}

      {/* Plan & Billing */}
      <div className="section-title">Plan & Billing</div>
      <div className="card" style={{ background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {(company as any)?.subscription_plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {(company as any)?.subscription_status === 'active'
                ? 'Active subscription'
                : 'Upgrade to unlock unlimited voice sessions, priority processing, and team seats'}
            </div>
          </div>
          {(company as any)?.subscription_status !== 'active' && (
            <button className="btn btn-primary btn-small" onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke('create-checkout', {
                  body: {
                    company_id: companyId,
                    price_id: 'price_placeholder',
                    success_url: window.location.origin + '?checkout=success',
                    cancel_url: window.location.origin + '?checkout=cancel',
                  },
                })
                if (error || !data?.checkout_url) {
                  showToast(data?.error || 'Billing not configured yet', 'error')
                  return
                }
                window.location.href = data.checkout_url
              } catch { showToast('Billing coming soon', 'error') }
            }} style={{ flexShrink: 0 }}>
              Upgrade
            </button>
          )}
        </div>
        {(company as any)?.subscription_status === 'active' && (
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
            Thank you for subscribing!
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="section-title">Settings</div>
      <div className="card">
        <div className="list-item">
          <span style={{ color: 'var(--text-dim)' }}>Onboarding Link</span>
          <span style={{ fontSize: '0.85rem' }}>{company?.onboarding_link || 'Not set'}</span>
        </div>
      </div>
      <button className="btn btn-secondary btn-block" onClick={signOut} style={{ marginTop: 'var(--gap)' }}>Sign Out</button>
    </div>
  )
}
