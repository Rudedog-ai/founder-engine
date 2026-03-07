// connect-integration v5.0.0 — Initiate Composio OAuth flow (v3 API)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3'
const DEFAULT_REDIRECT = 'https://founder-engine-seven.vercel.app/integrations/callback'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

async function getAuthConfigId(toolkit: string): Promise<string | null> {
  const res = await fetch(`${COMPOSIO_BASE}/auth_configs?toolkit=${toolkit.toUpperCase()}`, {
    headers: { 'x-api-key': COMPOSIO_API_KEY },
  })
  if (!res.ok) {
    console.error(`Failed to fetch auth configs for ${toolkit}: ${res.status}`)
    return null
  }
  const data = await res.json()
  const items = data.items || data.data || data
  if (Array.isArray(items) && items.length > 0) {
    return items[0].id || items[0].nanoid || null
  }
  return null
}

async function createLinkSession(
  authConfigId: string,
  userId: string,
  callbackUrl: string,
): Promise<{ ok: boolean; data: Record<string, unknown>; status: number }> {
  const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': COMPOSIO_API_KEY },
    body: JSON.stringify({
      auth_config_id: authConfigId,
      user_id: userId,
      callback_url: callbackUrl,
    }),
  })
  const data = await res.json()
  return { ok: res.ok, data, status: res.status }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

  const { company_id, toolkit, redirect_uri } = await req.json()
  if (!company_id || !toolkit) {
    return jsonResponse({ error: 'Missing company_id or toolkit' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify user owns this company
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return jsonResponse({ error: 'Invalid token' }, 401)
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', company_id)
    .eq('user_id', user.id)
    .single()

  if (!company) {
    return jsonResponse({ error: 'Company not found or not owned by user' }, 403)
  }

  const callbackUrl = redirect_uri || DEFAULT_REDIRECT

  // Step 1: Get auth config ID for this toolkit
  console.log(`Looking up auth config for toolkit=${toolkit}`)
  const authConfigId = await getAuthConfigId(toolkit)
  if (!authConfigId) {
    return jsonResponse({
      error: 'No auth config found for this integration',
      detail: `No Composio auth config exists for ${toolkit.toUpperCase()}. Configure it in the Composio dashboard first.`,
    }, 404)
  }

  // Step 2: Create link session
  console.log(`Creating link session: authConfigId=${authConfigId}, company=${company_id}`)
  const result = await createLinkSession(authConfigId, company_id, callbackUrl)

  if (!result.ok) {
    console.error('Composio link error:', JSON.stringify(result.data))
    return jsonResponse({
      error: 'Failed to initiate connection',
      detail: result.data.message || result.data.error || result.data,
      composio_status: result.status,
    }, 500)
  }

  console.log('Composio link success:', JSON.stringify(result.data))

  // Upsert integration record
  const { error: upsertError } = await supabase
    .from('integrations')
    .upsert({
      company_id,
      toolkit: toolkit.toLowerCase(),
      status: 'pending',
      composio_connection_id: result.data.connected_account_id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,toolkit' })

  if (upsertError) {
    console.error('Failed to upsert integration record:', upsertError)
  }

  return jsonResponse({
    redirect_url: result.data.redirect_url || null,
    connection_id: result.data.connected_account_id || null,
    link_token: result.data.link_token || null,
    status: 'initiated',
  })
})
