// process-finance-data
// v1.0 | 9 March 2026
// Extracts structured financial facts from raw data using Claude Sonnet

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    })

    const { company_id, limit = 10 } = await req.json()

    if (!company_id) {
      throw new Error('Missing company_id')
    }

    // Fetch unprocessed finance documents
    const { data: documents, error: docError } = await supabase
      .from('raw_documents')
      .select('*')
      .eq('company_id', company_id)
      .eq('domain', 'finance')
      .eq('processed', false)
      .limit(limit)

    if (docError) throw docError

    // Fetch unprocessed finance API data
    const { data: apiData, error: apiError } = await supabase
      .from('raw_api_data')
      .select('*')
      .eq('company_id', company_id)
      .eq('domain', 'finance')
      .eq('processed', false)
      .limit(limit)

    if (apiError) throw apiError

    const allSources = [
      ...documents.map(d => ({ ...d, source_type: 'document' })),
      ...apiData.map(a => ({ ...a, source_type: 'api' }))
    ]

    if (allSources.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No unprocessed finance data found', extracted_count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalFactsExtracted = 0
    const extractedFacts = []

    // Process each source
    for (const source of allSources) {
      const content = source.source_type === 'document' 
        ? source.content_text 
        : JSON.stringify(source.data)

      if (!content || content.length < 50) continue

      // Truncate if too long
      const truncatedContent = content.length > 20000 
        ? content.substring(0, 20000) + '\n[truncated]'
        : content

      // Claude Sonnet forensic extraction prompt
      const extractionPrompt = `You are the Finance Agent building knowledge about this company.

Raw data:
${truncatedContent}

Your job:
1. Extract structured facts (NO ASSUMPTIONS - only what's explicitly stated)
2. Every fact must cite source (mention page number, line item, API field)
3. Flag gaps (missing data needed for Layer 2 depth)
4. Detect hints of tools they use (e.g., "Xero invoice #123" suggests they use Xero)
5. Calculate confidence based on data completeness (0.0-1.0)

Output JSON only (no markdown):
{
  "facts": [
    {
      "key": "finance.revenue.monthly.2026-02",
      "value": "47234",
      "unit": "GBP",
      "source": "P&L February 2026.pdf, page 1, line 'Total Revenue'",
      "confidence": 1.0
    },
    {
      "key": "finance.top_client.name",
      "value": "Acme Ltd",
      "source": "Invoice #1847 recipient",
      "confidence": 1.0
    }
  ],
  "gaps": [
    "No January or December revenue data (need: 3 months for Layer 2)",
    "No cost breakdown (need: COGS data)"
  ],
  "tool_hints": [
    "Document mentions 'Xero invoice #1847' → suggest connecting Xero API"
  ]
}`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: extractionPrompt
        }]
      })

      const responseText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : ''

      // Parse extraction
      let extraction
      try {
        const cleanJson = responseText
          .replace(/```json\n/g, '')
          .replace(/```\n/g, '')
          .replace(/```/g, '')
          .trim()
        
        extraction = JSON.parse(cleanJson)
      } catch (e) {
        console.error('Failed to parse extraction:', responseText)
        continue
      }

      // Store extracted facts
      if (extraction.facts && extraction.facts.length > 0) {
        for (const fact of extraction.facts) {
          await supabase.from('knowledge_elements').insert({
            company_id,
            domain: 'finance',
            key: fact.key,
            value: fact.value,
            unit: fact.unit || null,
            source: fact.source,
            source_type: source.source_type,
            source_id: source.id,
            confidence: fact.confidence || 1.0
          })

          totalFactsExtracted++
          extractedFacts.push(fact)
        }
      }

      // Store tool suggestions if any hints found
      if (extraction.tool_hints && extraction.tool_hints.length > 0) {
        for (const hint of extraction.tool_hints) {
          // Parse hint to extract platform name
          const platformMatch = hint.match(/(Xero|QuickBooks|Stripe|PayPal|Wave)/i)
          if (platformMatch) {
            await supabase.from('tool_suggestions').insert({
              company_id,
              platform: platformMatch[1].toLowerCase(),
              domain: 'finance',
              evidence: hint,
              source_document_id: source.source_type === 'document' ? source.id : null
            })
          }
        }
      }

      // Mark source as processed
      if (source.source_type === 'document') {
        await supabase
          .from('raw_documents')
          .update({ processed: true })
          .eq('id', source.id)
      } else {
        await supabase
          .from('raw_api_data')
          .update({ processed: true })
          .eq('id', source.id)
      }
    }

    // Log indexing event
    await supabase.from('ingest_log').insert({
      company_id,
      event_type: 'indexing',
      source_type: 'finance',
      details: {
        sources_processed: allSources.length,
        facts_extracted: totalFactsExtracted
      }
    })

    // Trigger scoring recalculation
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-domain-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ company_id, domain: 'finance' })
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        sources_processed: allSources.length,
        facts_extracted: totalFactsExtracted,
        sample_facts: extractedFacts.slice(0, 5)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Finance processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
