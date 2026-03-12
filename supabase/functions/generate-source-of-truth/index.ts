// generate-source-of-truth
// v2.0 | 12 March 2026
// Synthesises knowledge_elements + corrections into structured SoT document
// Fixed: reads from knowledge_elements (not old knowledge_base table)
// Fixed: applies correction priority per CLAUDE.md

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DOMAINS = ['finance', 'sales', 'marketing', 'operations', 'people', 'product', 'legal', 'strategy']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_id } = await req.json()
    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, founder_name')
      .eq('id', company_id)
      .single()

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // CORRECTION PRIORITY (per CLAUDE.md):
    // 1. knowledge_corrections (active=true) — ALWAYS WINS
    // 2. knowledge_elements (extracted facts)

    const { data: corrections } = await supabase
      .from('knowledge_corrections')
      .select('domain, element_key, element_label, corrected_value, correction_context, source')
      .eq('company_id', company_id)
      .eq('active', true)

    const { data: elements } = await supabase
      .from('knowledge_elements')
      .select('domain, fact_type, entity, value, text, confidence, source_name, document_date')
      .eq('company_id', company_id)
      .order('confidence', { ascending: false })

    if ((!elements || elements.length === 0) && (!corrections || corrections.length === 0)) {
      return new Response(JSON.stringify({ error: 'No knowledge entries found. Run ingestion first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build knowledge summary grouped by domain
    let knowledgeSummary = ''

    for (const domain of DOMAINS) {
      const domainElements = (elements || []).filter(e => e.domain === domain)
      const domainCorrections = (corrections || []).filter(c => c.domain === domain)

      if (domainElements.length === 0 && domainCorrections.length === 0) continue

      knowledgeSummary += `\n## ${domain.toUpperCase()}\n`

      // Corrections first (highest priority)
      if (domainCorrections.length > 0) {
        knowledgeSummary += `### Founder Corrections (HIGHEST PRIORITY)\n`
        for (const c of domainCorrections) {
          knowledgeSummary += `- [CORRECTION] ${c.element_label || c.element_key}: ${c.corrected_value}`
          if (c.correction_context) knowledgeSummary += ` (context: ${c.correction_context})`
          knowledgeSummary += `\n`
        }
      }

      // Knowledge elements
      if (domainElements.length > 0) {
        knowledgeSummary += `### Extracted Facts\n`
        for (const e of domainElements) {
          knowledgeSummary += `- [${e.fact_type}] ${e.text} (confidence: ${e.confidence}`
          if (e.source_name) knowledgeSummary += `, source: ${e.source_name}`
          knowledgeSummary += `)\n`
        }
      }
    }

    const totalEntries = (elements?.length || 0) + (corrections?.length || 0)

    // Call Claude API
    const prompt = `You are creating a structured Source of Truth document for ${company.name}.
Based on the following knowledge base, create a comprehensive summary organised by domain.

CRITICAL RULES:
- Founder corrections ALWAYS override extracted facts — never contradict them
- Do not invent anything not present in the source material
- Be concise — this is a reference document, not an essay
- Flag contradictions between different sources
- If a domain has no data, set confidence to "low" and list what's missing in gaps

Knowledge base (${totalEntries} entries):
${knowledgeSummary}

Return JSON with this exact structure:
{
  "company_name": "${company.name}",
  "generated_at": "${new Date().toISOString()}",
  "domains": {
    "finance": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "sales": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "marketing": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "operations": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "people": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "product": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "legal": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "strategy": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" }
  },
  "overall_summary": "2-3 paragraph executive summary",
  "corrections_applied": ${corrections?.length || 0},
  "contradictions": ["list any contradictions between sources"],
  "critical_gaps": ["list most important missing information"]
}

Respond with ONLY the JSON, no markdown fences.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Claude API error: ${response.status} ${errText}`)
    }

    const claudeResult = await response.json()
    const content = claudeResult.content?.[0]?.text || ''

    // Parse JSON response
    let sotData
    try {
      sotData = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        sotData = JSON.parse(match[0])
      } else {
        throw new Error('Failed to parse Claude response as JSON')
      }
    }

    // Store in companies table
    await supabase
      .from('companies')
      .update({ source_of_truth_doc_id: JSON.stringify(sotData) })
      .eq('id', company_id)

    return new Response(JSON.stringify({
      success: true,
      source_of_truth: sotData,
      entries_processed: totalEntries,
      corrections_applied: corrections?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
