// angus-chat v2 — Text chat with Angus, grounded in company knowledge
// v2.0 | 12 March 2026
// Fixed: reads knowledge_elements (not dead knowledge_base table)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { message, company_id } = await req.json()
  if (!message || !company_id) {
    return new Response(JSON.stringify({ error: 'Missing message or company_id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify user owns this company
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, founder_name, intelligence_score, domain_scores, source_of_truth_doc_id')
    .eq('id', company_id)
    .eq('user_id', user.id)
    .single()

  if (!company) {
    return new Response(JSON.stringify({ error: 'Company not found' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Gather context: knowledge elements (extracted facts)
  const { data: knowledge } = await supabase
    .from('knowledge_elements')
    .select('domain, fact_type, entity, value, text, confidence, source_name')
    .eq('company_id', company_id)
    .order('confidence', { ascending: false })
    .limit(50)

  // Gather context: active corrections (always win)
  const { data: corrections } = await supabase
    .from('knowledge_corrections')
    .select('element_label, corrected_value, applied_at')
    .eq('company_id', company_id)
    .eq('active', true)
    .order('applied_at', { ascending: false })
    .limit(20)

  // Build knowledge context
  let knowledgeContext = ''
  if (corrections && corrections.length > 0) {
    knowledgeContext += 'FOUNDER CORRECTIONS (these override everything else):\n'
    corrections.forEach(c => {
      knowledgeContext += `- ${c.element_label}: ${c.corrected_value}\n`
    })
    knowledgeContext += '\n'
  }

  if (knowledge && knowledge.length > 0) {
    knowledgeContext += 'COMPANY KNOWLEDGE BASE:\n'
    const byDomain: Record<string, string[]> = {}
    knowledge.forEach(k => {
      const d = k.domain || 'general'
      if (!byDomain[d]) byDomain[d] = []
      byDomain[d].push(`${k.fact_type}: ${k.text} [source: ${k.source_name || 'unknown'}]`)
    })
    Object.entries(byDomain).forEach(([domain, entries]) => {
      knowledgeContext += `\n[${domain.toUpperCase()}]\n`
      entries.forEach(e => { knowledgeContext += `- ${e}\n` })
    })
  }

  // Source of truth summary
  let sotSummary = ''
  if (company.source_of_truth_doc_id) {
    try {
      const sot = JSON.parse(company.source_of_truth_doc_id)
      if (sot.overall_summary) {
        sotSummary = `\nSOURCE OF TRUTH SUMMARY:\n${sot.overall_summary}\n`
      }
    } catch { /* not valid JSON, skip */ }
  }

  const systemPrompt = `You are Angus, the AI business advisor for Founder Engine. You are speaking with ${company.founder_name || 'the founder'} of ${company.name}.

Your personality:
- Warm, direct, Scottish-accented warmth (but text, so just the tone)
- You synthesise, never originate — every fact must come from the knowledge base below
- If you don't have data on something, say so honestly and suggest the founder upload a document or answer a question to fill the gap
- Be concise and actionable — founders are busy
- When citing information, mention the source if available

Company Intelligence Score: ${company.intelligence_score || 0}%
Domain Scores: ${JSON.stringify(company.domain_scores || {})}

${knowledgeContext}
${sotSummary}

Rules:
- Never invent facts not in the knowledge base
- If a correction exists, use the corrected value and mention "based on your correction"
- If data is old or low confidence, flag it
- Keep responses under 300 words unless the founder asks for detail
- Be helpful, warm, and practical`

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Claude API error:', errText)
    return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const result = await response.json()
  const reply = result.content?.[0]?.text || 'Sorry, I couldn\'t generate a response.'

  return new Response(JSON.stringify({ reply, model: result.model }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
