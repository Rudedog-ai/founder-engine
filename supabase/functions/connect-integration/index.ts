// connect-integration v4.0.0 — Initiate Composio OAuth flow (v2 API with v1 fallback)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!
const COMPOSIO_BASE = 'https://backend.composio.dev/api'
const DEFAULT_REDIRECT = 'https://founder-engine-seven.vercel.app/integrations/callback'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

async function tryComposioV2(
  companyId: string,
  toolkit: string,
  redirectUri: string,
): Promise<{ ok: boolean; data: Record<string, unknown>; status: number }> {
  const res = await fetch(`${COMPOSIO_BASE}/v2/connectedAccounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': COMPOSIO_API_KEY },
    body: JSON.stringify({
      entityId: companyId,
      appName: toolkit.toUpperCase(),
      redirectUri,
      authMode: 'OAUTH2',
    }),
  })
  const data = await res.json()
  return { ok: res.ok, data, status: res.status }
}

async function tryComposioV1(
  companyId: string,
  toolkit: string,
  redirectUri: string,
): Promise<{ ok: boolean; data: Record<string, unknown>; status: number }> {
  const res = await fetch(`${COMPOSIO_BASE}/v1/connectedAccounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': COMPOSIO_API_KEY },
    body: JSON.stringify({
      entityId: companyId,
      appName: toolkit.toUpperCase(),
      redirectUri,
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

  const redirectUri = redirect_uri || DEFAULT_REDIRECT

  // Try Composio v2 first, fall back to v1 on 404/400
  console.log(`Initiating Composio connection: toolkit=${toolkit}, company=${company_id}`)
  let result = await tryComposioV2(company_id, toolkit, redirectUri)

  if (!result.ok && (result.status === 404 || result.status === 400)) {
    console.log(`Composio v2 returned ${result.status}, falling back to v1`)
    result = await tryComposioV1(company_id, toolkit, redirectUri)
  }

  if (!result.ok) {
    console.error('Composio error response:', JSON.stringify(result.data))
    return jsonResponse({
      error: 'Failed to initiate connection',
      detail: result.data.message || result.data.error || result.data,
      composio_status: result.status,
    }, 500)
  }

  console.log('Composio success:', JSON.stringify(result.data))

  // Upsert integration record
  const { error: upsertError } = await supabase
    .from('integrations')
    .upsert({
      company_id,
      toolkit: toolkit.toLowerCase(),
      status: 'pending',
      composio_connection_id: result.data.connectedAccountId || result.data.id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,toolkit' })

  if (upsertError) {
    console.error('Failed to upsert integration record:', upsertError)
  }

  return jsonResponse({
    redirect_url: result.data.redirectUrl || result.data.redirectUri || null,
    connection_id: result.data.connectedAccountId || result.data.id || null,
    status: result.data.connectionStatus || 'initiated',
  })
})
