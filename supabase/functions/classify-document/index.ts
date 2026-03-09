// classify-document
// v1.0 | 9 March 2026
// Classifies raw documents/API data into business domains using Claude Haiku

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

    const { document_id, api_data_id, company_id } = await req.json()

    if (!company_id || (!document_id && !api_data_id)) {
      throw new Error('Missing required parameters')
    }

    let content = ''
    let source_type = ''
    let source_id = ''

    // Fetch document or API data
    if (document_id) {
      const { data, error } = await supabase
        .from('raw_documents')
        .select('*')
        .eq('id', document_id)
        .eq('company_id', company_id)
        .single()

      if (error) throw error
      
      content = data.content_text || ''
      source_type = 'document'
      source_id = document_id
    } else if (api_data_id) {
      const { data, error } = await supabase
        .from('raw_api_data')
        .select('*')
        .eq('id', api_data_id)
        .eq('company_id', company_id)
        .single()

      if (error) throw error
      
      content = JSON.stringify(data.data)
      source_type = 'api'
      source_id = api_data_id
    }

    // Truncate content if too long (Claude context limit)
    if (content.length > 15000) {
      content = content.substring(0, 15000) + '\n[truncated]'
    }

    // Claude Haiku classification prompt
    const classificationPrompt = `You are classifying business data for domain assignment.

Document/API response:
${content}

Which business domain(s) does this belong to?
- finance: Accounting, invoices, cash flow, P&L, expenses, tax
- sales: CRM, pipeline, deals, customers, revenue tracking
- marketing: Campaigns, SEO, ads, content, brand, social media
- operations: Support tickets, processes, fulfillment, logistics
- people: HR, payroll, team structure, hiring, performance
- product: Features, roadmap, bugs, deployments, user feedback
- legal: Contracts, compliance, IP, GDPR, terms & conditions
- strategy: Business plan, OKRs, board docs, investor updates

Output JSON only (no markdown, no explanation):
{
  "primary_domain": "finance",
  "secondary_domains": ["operations"],
  "confidence": 0.95,
  "reasoning": "P&L statement with cost breakdown"
}`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: classificationPrompt
      }]
    })

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    // Parse JSON response
    let classification
    try {
      // Remove markdown code blocks if present
      const cleanJson = responseText
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim()
      
      classification = JSON.parse(cleanJson)
    } catch (e) {
      console.error('Failed to parse classification:', responseText)
      throw new Error('Invalid classification response from Claude')
    }

    // Update the document or API data with classification
    if (source_type === 'document') {
      await supabase
        .from('raw_documents')
        .update({
          domain: classification.primary_domain,
          secondary_domains: classification.secondary_domains || [],
          classification_confidence: classification.confidence,
          processed: true
        })
        .eq('id', source_id)
    } else {
      await supabase
        .from('raw_api_data')
        .update({
          domain: classification.primary_domain,
          processed: true
        })
        .eq('id', source_id)
    }

    // Log classification event
    await supabase.from('ingest_log').insert({
      company_id,
      event_type: 'classification',
      source_type,
      details: {
        source_id,
        classification
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        classification,
        source_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Classification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
