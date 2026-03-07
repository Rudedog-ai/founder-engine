// ConnectTools v4 — Static app list, API key removed from client
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useToast } from '../Toast'

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
  { key: 'xero', name: 'Xero', logo: '', description: 'Accounting & financials' },
  { key: 'hubspot', name: 'HubSpot', logo: '', description: 'CRM & sales pipeline' },
  { key: 'salesforce', name: 'Salesforce', logo: '', description: 'CRM & customer data' },
  { key: 'quickbooks', name: 'QuickBooks', logo: '', description: 'Accounting & invoicing' },
  { key: 'gmail', name: 'Gmail', logo: '', description: 'Email' },
  { key: 'linkedin', name: 'LinkedIn', logo: '', description: 'Professional network' },
  { key: 'apollo', name: 'Apollo', logo: '', description: 'Lead intelligence' },
  { key: 'slack', name: 'Slack', logo: '', description: 'Team communication' },
  { key: 'notion', name: 'Notion', logo: '', description: 'Docs & knowledge base' },
  { key: 'stripe', name: 'Stripe', logo: '', description: 'Payments & billing' },
]

interface Props {
  companyId: string
  compact?: boolean
}

export default function ConnectTools({ companyId, compact }: Props) {
  const { showToast } = useToast()
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({})
  const [connecting, setConnecting] = useState<string | null>(null)

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
        console.error('connect-integration error:', error)
        showToast(error.message || 'Could not start connection', 'error')
        setConnecting(null)
        return
      }
      if (!data?.redirect_url) {
        console.error('connect-integration: no redirect_url:', data)
        showToast(data?.error || 'No redirect URL returned', 'error')
        setConnecting(null)
        return
      }
      window.open(data.redirect_url, '_blank')
      setConnecting(null)
    } catch (err) {
      console.error('connect-integration exception:', err)
      showToast('Connection failed — try again', 'error')
      setConnecting(null)
    }
  }

  const displayApps = compact ? APPS.slice(0, 12) : APPS

  return (
    <>
      {!compact && <div className="section-title">Connect Tools</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
        {displayApps.map(app => {
          const integration = integrations[app.key]
          const isConnected = integration?.status === 'connected' || integration?.status === 'active'
          const isPending = integration?.status === 'pending'
          const isConnecting = connecting === app.key

          return (
            <div key={app.key} className="card" style={{
              background: 'var(--surface)',
              padding: '14px',
              textAlign: 'center',
              opacity: isConnected ? 1 : 0.85,
              border: isConnected ? '1px solid var(--biolum)' : undefined,
            }}>
              {app.logo ? (
                <img src={app.logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, marginBottom: 8, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', margin: '0 auto 8px',
                }}>
                  {app.name.charAt(0)}
                </div>
              )}
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2px' }}>{app.name}</div>
              {app.description && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{app.description}</div>
              )}
              {isConnected ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--biolum)' }}>Connected</span>
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
