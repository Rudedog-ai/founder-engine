// ConnectTools v2 — Integration cards for Composio-powered tool connections
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useToast } from '../Toast'

interface Integration {
  toolkit: string
  status: string
  connected_at: string | null
}

const TOOLKITS = [
  { id: 'xero', label: 'Xero', desc: 'Financials & accounting', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id: 'hubspot', label: 'HubSpot', desc: 'CRM & sales pipeline', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { id: 'salesforce', label: 'Salesforce', desc: 'CRM & customer data', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 14l2-2 2 2 4-4' },
  { id: 'quickbooks', label: 'QuickBooks', desc: 'Accounting & invoicing', icon: 'M3 3h18v18H3zM12 8v8M8 12h8' },
  { id: 'linkedin', label: 'LinkedIn', desc: 'Professional network', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z' },
  { id: 'apollo', label: 'Apollo', desc: 'Lead intelligence', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
]

interface Props {
  companyId: string
  compact?: boolean
}

export default function ConnectTools({ companyId, compact }: Props) {
  const { showToast } = useToast()
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({})
  const [connecting, setConnecting] = useState<string | null>(null)

  function loadIntegrations() {
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
  }

  useEffect(() => { loadIntegrations() }, [companyId])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('integration_connected')) {
      showToast('Integration connected!')
      window.history.replaceState({}, '', window.location.pathname)
      loadIntegrations()
    }
  }, [])

  async function handleConnect(toolkit: string) {
    if (connecting) return
    setConnecting(toolkit)
    try {
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          company_id: companyId,
          toolkit,
          redirect_uri: window.location.origin + '/integrations/callback?integration_connected=true',
        },
      })
      if (error || !data?.redirect_url) {
        showToast(data?.error || 'Could not start connection', 'error')
        setConnecting(null)
        return
      }
      window.location.href = data.redirect_url
    } catch {
      showToast('Connection failed', 'error')
      setConnecting(null)
    }
  }

  return (
    <>
      {!compact && <div className="section-title">Connect Tools</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
        {TOOLKITS.map(tool => {
          const integration = integrations[tool.id]
          const isConnected = integration?.status === 'connected' || integration?.status === 'active'
          const isPending = integration?.status === 'pending'
          const isConnecting = connecting === tool.id

          return (
            <div key={tool.id} className="card" style={{
              background: 'var(--surface)',
              padding: '14px',
              textAlign: 'center',
              opacity: isConnected ? 1 : 0.85,
              border: isConnected ? '1px solid var(--biolum)' : undefined,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke={isConnected ? 'var(--biolum)' : 'var(--text-dim)'}
                strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                <path d={tool.icon} />
              </svg>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2px' }}>{tool.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{tool.desc}</div>
              {isConnected ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--biolum)' }}>Connected</span>
              ) : (
                <button
                  className="btn btn-primary btn-small"
                  style={{ fontSize: '0.72rem', padding: '4px 12px' }}
                  disabled={isConnecting || isPending}
                  onClick={() => handleConnect(tool.id)}
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
