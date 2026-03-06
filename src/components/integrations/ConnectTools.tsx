// ConnectTools v1 — Integration cards for Composio-powered tool connections
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
  { id: 'slack', label: 'Slack', desc: 'Team communication', icon: 'M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zM20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' },
  { id: 'hubspot', label: 'HubSpot', desc: 'CRM & sales pipeline', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { id: 'googledrive', label: 'Google Drive', desc: 'Documents & files', icon: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' },
  { id: 'stripe', label: 'Stripe', desc: 'Payments & billing', icon: 'M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2zM1 10h22' },
  { id: 'notion', label: 'Notion', desc: 'Notes & wiki', icon: 'M4 4h16v16H4zM9 9h6M9 13h6M9 17h4' },
]

interface Props {
  companyId: string
}

export default function ConnectTools({ companyId }: Props) {
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

  // Check for callback return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('integration_connected')) {
      showToast('Integration connected!')
      window.history.replaceState({}, '', window.location.pathname)
      // Reload integrations
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
      <div className="section-title">Connect Tools</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
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
