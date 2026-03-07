// connect-integration v7.0.0 — v3 connected_accounts API, direct OAuth redirect
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3'
const DEFAULT_REDIRECT = 'https://founder-engine-seven.vercel.app/integrations/callback'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

// Map our app keys to Composio toolkit slugs
const TOOLKIT_SLUG_MAP: Record<string, string> = {
  google_drive: 'googledrive',
  google_docs: 'googledocs',
  google_sheets: 'googlesheets',
  google_calendar: 'googlecalendar',
  google_analytics: 'google_analytics',
  google_ads: 'googleads',
}

function toComposioSlug(toolkit: string): string {
  const lower = toolkit.toLowerCase()
  return TOOLKIT_SLUG_MAP[lower] || lower
}

async function getAuthConfigId(toolkit: string): Promise<string | null> {
  const slug = toComposioSlug(toolkit)
  const res = await fetch(`${COMPOSIO_BASE}/auth_configs`, {
    headers: { 'x-api-key': COMPOSIO_API_KEY },
  })
  if (!res.ok) {
    console.error(`Failed to fetch auth configs: ${res.status}`)
    return null
  }
  const data = await res.json()
  const items = data.items || data.data || data
  if (!Array.isArray(items) || items.length === 0) return null

  const match = items.find((i: Record<string, unknown>) => {
    const tk = i.toolkit as Record<string, string> | undefined
    return (tk?.slug || '').toLowerCase() === slug
  })

  if (match) {
    console.log(`Auth config for ${slug}: ${match.id}`)
    return (match.id || null) as string | null
  }

  console.error(`No auth config for slug=${slug} among ${items.length} configs`)
  return null
}

// deno-lint-ignore no-explicit-any
type AnyObj = Record<string, any>

async function initiateConnection(
  authConfigId: string,
  entityId: string,
  callbackUrl: string,
): Promise<{ ok: boolean; data: AnyObj; status: number }> {
  const res = await fetch(`${COMPOSIO_BASE}/connected_accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': COMPOSIO_API_KEY },
    body: JSON.stringify({
      auth_config: { id: authConfigId },
      connection: {
        entity_id: entityId,
        callback_url: callbackUrl,
      },
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
      detail: `No Composio auth config for ${toolkit}. Configure it in Composio dashboard.`,
    }, 404)
  }

  // Step 2: Initiate connection (v3 connected_accounts API)
  console.log(`Initiating connection: config=${authConfigId}, entity=${company_id}`)
  const result = await initiateConnection(authConfigId, company_id, callbackUrl)

  if (!result.ok) {
    console.error('Composio error:', JSON.stringify(result.data))
    const errMsg = result.data?.error?.message || result.data?.message || 'Connection failed'
    return jsonResponse({
      error: 'Failed to initiate connection',
      detail: errMsg,
      composio_status: result.status,
    }, 500)
  }

  console.log('Composio success:', JSON.stringify(result.data))

  // Extract redirect URL — prefer direct backend redirect over hosted page
  const directUrl = result.data?.connectionData?.val?.redirectUrl
  const hostedUrl = result.data?.redirect_url || result.data?.redirect_uri
  const redirectUrl = directUrl || hostedUrl || null

  // Upsert integration record
  const { error: upsertError } = await supabase
    .from('integrations')
    .upsert({
      company_id,
      toolkit: toolkit.toLowerCase(),
      status: 'pending',
      composio_connection_id: result.data.id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,toolkit' })

  if (upsertError) {
    console.error('Upsert error:', upsertError)
  }

  return jsonResponse({
    redirect_url: redirectUrl,
    connection_id: result.data.id || null,
    status: 'initiated',
  })
})
