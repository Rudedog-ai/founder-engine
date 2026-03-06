// connect-integration v1 — Initiate Composio OAuth flow for a toolkit
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!
const COMPOSIO_BASE = 'https://backend.composio.dev/api'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const { company_id, toolkit, redirect_uri } = await req.json()
  if (!company_id || !toolkit) {
    return new Response(JSON.stringify({ error: 'Missing company_id or toolkit' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify user owns this company
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', company_id)
    .eq('user_id', user.id)
    .single()

  if (!company) {
    return new Response(JSON.stringify({ error: 'Company not found' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  // Initiate Composio OAuth connection via REST API
  // entity_id = company_id so each founder has their own connected accounts
  const composioRes = await fetch(`${COMPOSIO_BASE}/v1/connectedAccounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': COMPOSIO_API_KEY,
    },
    body: JSON.stringify({
      entityId: company_id,
      appName: toolkit.toUpperCase(),
      redirectUri: redirect_uri || `${req.headers.get('origin') || 'https://founder-engine-seven.vercel.app'}/integrations/callback`,
    }),
  })

  const composioData = await composioRes.json()

  if (!composioRes.ok) {
    console.error('Composio error:', composioData)
    return new Response(JSON.stringify({ error: 'Failed to initiate connection', detail: composioData.message || composioData }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Upsert integration record
  await supabase
    .from('integrations')
    .upsert({
      company_id,
      toolkit: toolkit.toLowerCase(),
      status: 'pending',
      composio_connection_id: composioData.connectedAccountId || composioData.id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,toolkit' })

  return new Response(JSON.stringify({
    redirect_url: composioData.redirectUrl || composioData.redirectUri || null,
    connection_id: composioData.connectedAccountId || composioData.id || null,
    status: composioData.connectionStatus || 'initiated',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
