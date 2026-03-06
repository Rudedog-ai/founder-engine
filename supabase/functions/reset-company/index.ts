// reset-company v1 — Erase all intelligence data, reset to onboarding Stage 1
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const { company_id } = await req.json()
  if (!company_id) return new Response(JSON.stringify({ error: 'Missing company_id' }), { status: 400 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify the requesting user owns this company
  const userToken = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!)
    .auth.getUser(userToken)

  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', company_id)
    .eq('user_id', user.id)
    .single()

  if (!company) return new Response(JSON.stringify({ error: 'Not found or not yours' }), { status: 403 })

  // Delete all intelligence data
  await supabase.from('knowledge_base').delete().eq('company_id', company_id)
  await supabase.from('knowledge_chunks').delete().eq('company_id', company_id)
  await supabase.from('knowledge_corrections').delete().eq('company_id', company_id)
  await supabase.from('knowledge_elements').delete().eq('company_id', company_id)
  await supabase.from('onboarding_questions').delete().eq('company_id', company_id)

  // Reset company to Stage 1
  await supabase
    .from('companies')
    .update({
      onboarding_stage: 1,
      welcome_complete: false,
      intelligence_score: 0,
      domain_scores: { financials: 0, sales: 0, marketing: 0, operations: 0, team: 0, strategy: 0 },
      google_folder_id: null,
      google_access_token: null,
      google_refresh_token: null,
      google_connected_at: null,
      google_webhook_channel_id: null,
      google_webhook_expiry: null,
      source_of_truth_doc_id: null,
    })
    .eq('id', company_id)

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
