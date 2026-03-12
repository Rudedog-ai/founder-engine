// reset-company v4 — Full nuclear delete: all data + company row + auth user
// v4.0 | 12 March 2026
// Fixed: added domain_scores, ingestion_progress, ingest_log, integrations to nuclear delete
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const { company_id } = await req.json()
  if (!company_id) return new Response(JSON.stringify({ error: 'Missing company_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify the requesting user owns this company
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', company_id)
    .eq('user_id', user.id)
    .single()

  if (!company) {
    return new Response(JSON.stringify({ error: 'Not found or not yours' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  // Delete all intelligence data (tables may not exist yet — that's fine)
  const tables = ['knowledge_base', 'knowledge_chunks', 'knowledge_corrections', 'knowledge_elements', 'onboarding_questions', 'domain_scores', 'ingestion_progress', 'ingest_log', 'integrations']
  await Promise.all(tables.map(t =>
    supabase.from(t).delete().eq('company_id', company_id)
  ))

  // Delete the company row itself
  await supabase.from('companies').delete().eq('id', company_id)

  // Delete the auth user
  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
  if (deleteUserError) {
    console.error('Failed to delete auth user:', deleteUserError)
  }

  return new Response(JSON.stringify({ success: true, deleted: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
