// ConnectTools v7 — Match Composio auth configs exactly
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useToast } from '../Toast'
import { LOGOS } from './logos'

interface ComposioApp {
  key: string
  name: string
  logo: string
  description: string
}

interface Integration {
  toolkit: string
  status: string
  connected_at: string | null
}

const APPS: ComposioApp[] = [
  { key: 'xero', name: 'Xero', logo: LOGOS.xero, description: 'Accounting & financials' },
  { key: 'hubspot', name: 'HubSpot', logo: LOGOS.hubspot, description: 'CRM & sales pipeline' },
  { key: 'slack', name: 'Slack', logo: LOGOS.slack, description: 'Team communication' },
  { key: 'google_drive', name: 'Google Drive', logo: LOGOS.google_drive, description: 'Documents & files' },
  { key: 'notion', name: 'Notion', logo: LOGOS.notion, description: 'Docs & knowledge base' },
  { key: 'gmail', name: 'Gmail', logo: LOGOS.gmail, description: 'Email' },
  { key: 'stripe', name: 'Stripe', logo: LOGOS.stripe, description: 'Payments & billing' },
  { key: 'google_calendar', name: 'Google Calendar', logo: LOGOS.google_calendar, description: 'Scheduling' },
  { key: 'google_sheets', name: 'Google Sheets', logo: LOGOS.google_sheets, description: 'Spreadsheets' },
  { key: 'google_docs', name: 'Google Docs', logo: LOGOS.google_docs, description: 'Documents' },
  { key: 'google_analytics', name: 'Google Analytics', logo: LOGOS.google_analytics, description: 'Web analytics' },
  { key: 'google_ads', name: 'Google Ads', logo: LOGOS.google_ads, description: 'Ad campaigns' },
  { key: 'monday', name: 'Monday', logo: LOGOS.monday, description: 'Project management' },
  { key: 'calendly', name: 'Calendly', logo: LOGOS.calendly, description: 'Meeting scheduling' },
]

// Top 5 shown in compact (onboarding) mode
const TOP_5_KEYS = ['xero', 'hubspot', 'slack', 'google_drive', 'notion']

interface Props {
  companyId: string
  compact?: boolean
}

export default function ConnectTools({ companyId, compact }: Props) {
  const { showToast } = useToast()
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({})
  const [connecting, setConnecting] = useState<string | null>(null)
  const [dataPoints, setDataPoints] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase
      .from('integrations')
      .select('toolkit, status, connected_at')
      .eq('company_id', companyId)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, Integration> = {}
        data.forEach(i => { map[i.toolkit] = i })
        setIntegrations(map)
      })

    supabase
      .from('knowledge_chunks')
      .select('domain')
      .eq('company_id', companyId)
      .then(({ data }) => {
        if (!data) return
        const counts: Record<string, number> = {}
        data.forEach(chunk => {
          const d = chunk.domain || 'other'
          counts[d] = (counts[d] || 0) + 1
        })
        setDataPoints(counts)
      })
  }, [companyId])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('integration_connected')) {
      showToast('Integration connected!')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function handleConnect(appKey: string) {
    if (connecting) return
    setConnecting(appKey)
    try {
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          company_id: companyId,
          toolkit: appKey,
          redirect_uri: window.location.origin + '/integrations/callback?integration_connected=true',
        },
      })
      if (error) {
        showToast(error.message || 'Could not start connection', 'error')
        setConnecting(null)
        return
      }
      if (!data?.redirect_url) {
        showToast(data?.error || 'No redirect URL returned', 'error')
        setConnecting(null)
        return
      }
      window.open(data.redirect_url, '_blank')
      setConnecting(null)
    } catch {
      showToast('Connection failed — try again', 'error')
      setConnecting(null)
    }
  }

  const displayApps = compact ? APPS.filter(a => TOP_5_KEYS.includes(a.key)) : APPS
  const connectedCount = displayApps.filter(a => {
    const s = integrations[a.key]?.status
    return s === 'connected' || s === 'active'
  }).length

  const toolkitDomainMap: Record<string, string> = {
    xero: 'financials', stripe: 'financials',
    hubspot: 'sales',
    gmail: 'operations', slack: 'operations', monday: 'operations', calendly: 'operations',
    notion: 'strategy', google_drive: 'strategy', google_docs: 'strategy',
    google_sheets: 'financials', google_analytics: 'marketing', google_ads: 'marketing',
    google_calendar: 'operations',
  }

  return (
    <>
      {!compact && <div className="section-title">Connect Tools</div>}
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginBottom: '10px',
        textAlign: compact ? 'center' : 'left',
      }}>
        {connectedCount} of {displayApps.length} connected
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        {displayApps.map(app => {
          const integration = integrations[app.key]
          const isConnected = integration?.status === 'connected' || integration?.status === 'active'
          const isPending = integration?.status === 'pending'
          const isConnecting = connecting === app.key
          const domain = toolkitDomainMap[app.key]
          const points = domain ? (dataPoints[domain] || 0) : 0

          return (
            <div key={app.key} className="card" style={{
              background: 'var(--surface)',
              padding: '14px',
              textAlign: 'center',
              opacity: isConnected ? 1 : 0.85,
              border: isConnected ? '1px solid var(--biolum)' : undefined,
            }}>
              <img
                src={app.logo}
                alt=""
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  objectFit: 'contain', display: 'block',
                  margin: '0 auto 8px',
                }}
              />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2px' }}>{app.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{app.description}</div>
              {isConnected ? (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--biolum)', fontWeight: 600 }}>Connected ✓</span>
                  {points > 0 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {points} data point{points !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-small"
                  style={{ fontSize: '0.72rem', padding: '4px 12px' }}
                  disabled={isConnecting || isPending}
                  onClick={() => handleConnect(app.key)}
                >
                  {isConnecting ? <><span className="spinner" style={{ width: 12, height: 12 }} /> ...</> : isPending ? 'Pending...' : 'Connect'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
