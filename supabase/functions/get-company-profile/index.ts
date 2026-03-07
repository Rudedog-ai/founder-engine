// get-company-profile v20 — Fetch full company profile with resilient per-table queries
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

async function safeQuery<T>(
  label: string,
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  fallback: T,
): Promise<T> {
  try {
    const { data, error } = await queryFn()
    if (error) {
      console.error(`Query failed [${label}]:`, error)
      return fallback
    }
    return data ?? fallback
  } catch (err) {
    console.error(`Query exception [${label}]:`, err)
    return fallback
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { company_id, founder_email } = await req.json()
  if (!company_id && !founder_email) {
    return jsonResponse({ error: 'Missing company_id or founder_email' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Resolve company
  let companyQuery = supabase.from('companies').select('*')
  if (company_id) {
    companyQuery = companyQuery.eq('id', company_id)
  } else {
    companyQuery = companyQuery.eq('founder_email', founder_email)
  }
  const { data: company, error: companyError } = await companyQuery.single()

  if (companyError || !company) {
    return jsonResponse({ error: 'Company not found' }, 404)
  }

  const cid = company.id

  // Run all queries in parallel — each wrapped so a missing table doesn't kill the request
  const [knowledgeRaw, gaps, sessions, team, recommendations, documents, recentActivity] =
    await Promise.all([
      safeQuery('knowledge_base', () =>
        supabase.from('knowledge_base').select('*').eq('company_id', cid), []),
      safeQuery('gap_analysis', () =>
        supabase.from('gap_analysis').select('*').eq('company_id', cid), []),
      safeQuery('sessions', () =>
        supabase.from('sessions').select('*').eq('company_id', cid)
          .order('created_at', { ascending: false }), []),
      safeQuery('team_members', () =>
        supabase.from('team_members').select('*').eq('company_id', cid), []),
      safeQuery('recommendations', () =>
        supabase.from('recommendations').select('*').eq('company_id', cid)
          .order('priority', { ascending: true }), []),
      safeQuery('documents', () =>
        supabase.from('documents').select('*').eq('company_id', cid)
          .order('uploaded_at', { ascending: false }), []),
      safeQuery('audit_log', () =>
        supabase.from('audit_log').select('action, created_at').eq('company_id', cid)
          .order('created_at', { ascending: false }).limit(20), []),
    ])

  // Group knowledge by topic
  const knowledge: Record<string, unknown[]> = {}
  for (const entry of knowledgeRaw as Record<string, unknown>[]) {
    const topic = (entry.topic as string) || 'general'
    if (!knowledge[topic]) knowledge[topic] = []
    knowledge[topic].push(entry)
  }

  // Parse domain_scores from company record
  const domainScores = company.domain_scores || {
    financials: 0, sales: 0, marketing: 0,
    operations: 0, team: 0, strategy: 0,
  }

  return jsonResponse({
    company: { ...company, domain_scores: domainScores },
    knowledge,
    knowledge_raw: knowledgeRaw,
    gaps,
    sessions,
    team,
    recommendations,
    documents,
    recent_activity: recentActivity,
  })
})
