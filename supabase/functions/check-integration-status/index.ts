// check-integration-status v1.0.0 — Query Composio for connected account status, update DB
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

  const { company_id } = await req.json()
  if (!company_id) return jsonResponse({ error: 'Missing company_id' }, 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify user owns this company
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return jsonResponse({ error: 'Invalid token' }, 401)

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', company_id)
    .eq('user_id', user.id)
    .single()

  if (!company) return jsonResponse({ error: 'Company not found' }, 403)

  // Get all pending integrations for this company
  const { data: pending } = await supabase
    .from('integrations')
    .select('toolkit, composio_connection_id, status')
    .eq('company_id', company_id)
    .eq('status', 'pending')

  if (!pending || pending.length === 0) {
    return jsonResponse({ updated: 0, results: {} })
  }

  const results: Record<string, string> = {}
  let updated = 0

  for (const integration of pending) {
    const connId = integration.composio_connection_id
    if (!connId) continue

    try {
      const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/${connId}`, {
        headers: { 'x-api-key': COMPOSIO_API_KEY },
      })
      if (!res.ok) {
        results[integration.toolkit] = 'check_failed'
        continue
      }
      const data = await res.json()
      const composioStatus = (data.status || '').toUpperCase()

      let newStatus: string | null = null
      if (composioStatus === 'ACTIVE') newStatus = 'connected'
      else if (composioStatus === 'EXPIRED') newStatus = 'expired'
      else if (composioStatus === 'FAILED') newStatus = 'failed'

      if (newStatus) {
        await supabase
          .from('integrations')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('company_id', company_id)
          .eq('toolkit', integration.toolkit)
        results[integration.toolkit] = newStatus
        updated++
      } else {
        results[integration.toolkit] = `still_${composioStatus.toLowerCase()}`
      }
    } catch {
      results[integration.toolkit] = 'error'
    }
  }

  return jsonResponse({ updated, results })
})
