import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      .select('name, founder_name, intelligence_score')
      .eq('id', company_id)
      .single()

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch all knowledge entries
    const { data: knowledge } = await supabase
      .from('knowledge_base')
      .select('topic, key, value, confidence')
      .eq('company_id', company_id)

    if (!knowledge || knowledge.length === 0) {
      return new Response(JSON.stringify({ error: 'No knowledge entries found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build knowledge summary for prompt
    const knowledgeByTopic: Record<string, Array<{ key: string; value: string; confidence: string }>> = {}
    for (const entry of knowledge) {
      if (!knowledgeByTopic[entry.topic]) knowledgeByTopic[entry.topic] = []
      knowledgeByTopic[entry.topic].push({
        key: entry.key,
        value: entry.value,
        confidence: entry.confidence,
      })
    }

    const knowledgeSummary = Object.entries(knowledgeByTopic)
      .map(([topic, entries]) =>
        `## ${topic}\n${entries.map(e => `- ${e.key}: ${e.value} (confidence: ${e.confidence})`).join('\n')}`
      )
      .join('\n\n')

    // Call Claude API
    const prompt = `You are creating a structured Source of Truth document for ${company.name}.
Based on the following knowledge base entries, create a comprehensive summary organised by domain.
Flag any contradictions or gaps.

Knowledge base (${knowledge.length} entries):

${knowledgeSummary}

Format your response as JSON with this exact structure:
{
  "company_name": "${company.name}",
  "generated_at": "${new Date().toISOString()}",
  "domains": {
    "financials": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "sales": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "marketing": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "operations": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "team": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" },
    "strategy": { "summary": "...", "key_facts": ["..."], "gaps": ["..."], "confidence": "high|medium|low" }
  },
  "overall_summary": "2-3 paragraph executive summary",
  "contradictions": ["..."],
  "critical_gaps": ["..."]
}

Rules:
- Do not invent anything not present in the source material
- Be concise — this is a reference document, not an essay
- If a domain has no data, set confidence to "low" and list what's missing in gaps
- Respond with ONLY the JSON, no markdown fences`

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

    // Parse the JSON response
    let sotData
    try {
      sotData = JSON.parse(content)
    } catch {
      // Try extracting JSON from markdown fences if present
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        sotData = JSON.parse(match[0])
      } else {
        throw new Error('Failed to parse Claude response as JSON')
      }
    }

    // Store in companies table as JSON string in source_of_truth_doc_id
    // (Using this field to store the actual SoT data as JSON)
    await supabase
      .from('companies')
      .update({ source_of_truth_doc_id: JSON.stringify(sotData) })
      .eq('id', company_id)

    return new Response(JSON.stringify({
      success: true,
      source_of_truth: sotData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
