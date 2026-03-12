// calculate-domain-scores
// v2.0 | 12 March 2026
// Calculates Layer 1 (Platform Access) + Layer 2 (Historical Context) scores
// Fixed: reads integrations table (not dead connected_sources)
// Fixed: uses fact_type/confidence from knowledge_elements (not key patterns)
// Fixed: syncs back to companies.domain_scores JSONB for Intelligence Builder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Which integrations feed each domain
const DOMAIN_INTEGRATIONS: Record<string, string[]> = {
  finance: ['xero', 'quickbooks'],
  sales: ['hubspot', 'pipedrive', 'salesforce'],
  marketing: ['google_analytics', 'google_search_console'],
  operations: ['slack', 'google_drive'],
  people: ['google_drive', 'slack'],
  product: ['google_drive'],
  legal: ['google_drive'],
  strategy: ['google_drive'],
}

// Map domain_scores domains → companies.domain_scores JSONB keys
const DOMAIN_TO_JSONB: Record<string, string> = {
  finance: 'financials',
  sales: 'sales',
  marketing: 'marketing',
  operations: 'operations',
  people: 'team',
  strategy: 'strategy',
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

    const { company_id, domain } = await req.json()

    if (!company_id) {
      throw new Error('Missing company_id')
    }

    // Get all connected integrations for this company
    const { data: integrations } = await supabase
      .from('integrations')
      .select('toolkit, status')
      .eq('company_id', company_id)
      .eq('status', 'connected')

    const connectedToolkits = new Set((integrations || []).map((i: any) => i.toolkit))

    const domainsToScore = domain
      ? [domain]
      : ['finance', 'sales', 'marketing', 'operations', 'people', 'product', 'legal', 'strategy']

    const scores = []

    for (const domainName of domainsToScore) {
      const score = await calculateDomainScore(supabase, company_id, domainName, connectedToolkits)
      scores.push(score)

      // Upsert score to domain_scores table
      await supabase.from('domain_scores').upsert({
        company_id,
        domain: domainName,
        layer_1_score: score.layer_1,
        layer_2_score: score.layer_2,
        total_score: score.total,
        fact_count: score.elements_count,
        gaps: score.gaps,
        last_calculated: new Date().toISOString()
      }, {
        onConflict: 'company_id,domain'
      })
    }

    // Sync back to companies.domain_scores JSONB (0-100 scale for Intelligence Builder)
    const jsonbScores: Record<string, number> = {}
    for (const s of scores) {
      const jsonbKey = DOMAIN_TO_JSONB[s.domain]
      if (jsonbKey) {
        // Convert 0-30 → 0-100
        jsonbScores[jsonbKey] = Math.round((s.total / 30) * 100)
      }
    }

    // Merge with existing JSONB (preserve domains we didn't score)
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('domain_scores')
      .eq('id', company_id)
      .single()

    const mergedScores = {
      ...(existingCompany?.domain_scores || {}),
      ...jsonbScores,
    }

    await supabase
      .from('companies')
      .update({ domain_scores: mergedScores })
      .eq('id', company_id)

    // Log scoring event
    await supabase.from('ingest_log').insert({
      company_id,
      event_type: 'scoring',
      details: { scores, jsonb_scores: jsonbScores }
    })

    return new Response(
      JSON.stringify({ success: true, scores, jsonb_scores: jsonbScores }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Scoring error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function calculateDomainScore(
  supabase: any,
  company_id: string,
  domain: string,
  connectedToolkits: Set<string>
) {
  let layer_1 = 0
  let layer_2 = 0
  const gaps: string[] = []

  // Get all knowledge elements for this domain
  const { data: elements, error } = await supabase
    .from('knowledge_elements')
    .select('fact_type, entity, value, text, confidence, document_date')
    .eq('company_id', company_id)
    .eq('domain', domain)

  if (error) throw error

  // Check if relevant API integrations are connected
  const relevantToolkits = DOMAIN_INTEGRATIONS[domain] || []
  const hasApiConnected = relevantToolkits.some(t => connectedToolkits.has(t))
  const hasElements = elements && elements.length > 0

  // Layer 1 Scoring (Platform Access: 0-15)
  if (hasApiConnected && hasElements) {
    layer_1 = 15
  } else if (hasApiConnected) {
    layer_1 = 10
    gaps.push(`${domain}: API connected but no facts extracted yet — run ingestion`)
  } else if (hasElements) {
    layer_1 = 12
    gaps.push(`${domain}: Document data only — connect a live API for real-time data`)
  } else {
    gaps.push(`${domain}: No data source connected and no documents ingested`)
  }

  // Layer 2 Scoring (Historical Context: 0-15)
  if (hasElements) {
    const factCount = elements.length
    const avgConfidence = elements.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) / factCount
    const hasNumericValues = elements.some((e: any) => e.value !== null && e.value !== undefined)

    // Score based on fact richness
    if (factCount >= 20 && avgConfidence >= 0.7 && hasNumericValues) {
      layer_2 = 15
    } else if (factCount >= 10 && avgConfidence >= 0.6) {
      layer_2 = 12
      gaps.push(`${domain}: Good coverage but could use more numeric data`)
    } else if (factCount >= 5) {
      layer_2 = 8
      gaps.push(`${domain}: Have ${factCount} facts — need 10+ for strong Layer 2`)
    } else if (factCount >= 1) {
      layer_2 = 4
      gaps.push(`${domain}: Only ${factCount} fact(s) — upload more documents`)
    }

    // Bonus: temporal coverage (facts from multiple months)
    const months = new Set(
      elements
        .filter((e: any) => e.document_date)
        .map((e: any) => new Date(e.document_date).toISOString().slice(0, 7))
    )
    if (months.size >= 6) {
      layer_2 = Math.min(15, layer_2 + 2)
    } else if (months.size < 3 && factCount > 0) {
      gaps.push(`${domain}: Data from only ${months.size} month(s) — need 6+ months for trends`)
    }
  } else {
    gaps.push(`${domain}: No knowledge elements extracted yet`)
  }

  return {
    domain,
    layer_1,
    layer_2,
    total: layer_1 + layer_2,
    gaps,
    elements_count: elements?.length || 0,
  }
}
