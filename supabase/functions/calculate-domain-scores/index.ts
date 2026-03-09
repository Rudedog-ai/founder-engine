// calculate-domain-scores
// v1.0 | 9 March 2026
// Calculates Layer 1 (Platform Access) + Layer 2 (Historical Context) scores

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { company_id, domain } = await req.json()

    if (!company_id) {
      throw new Error('Missing company_id')
    }

    const domainsToScore = domain 
      ? [domain] 
      : ['finance', 'sales', 'marketing', 'operations', 'people', 'product', 'legal', 'strategy']

    const scores = []

    for (const domainName of domainsToScore) {
      const score = await calculateDomainScore(supabase, company_id, domainName)
      scores.push(score)

      // Upsert score to domain_scores table
      await supabase.from('domain_scores').upsert({
        company_id,
        domain: domainName,
        layer_1_score: score.layer_1,
        layer_2_score: score.layer_2,
        total_score: score.total,
        gaps: score.gaps,
        last_calculated: new Date().toISOString()
      }, {
        onConflict: 'company_id,domain'
      })
    }

    // Log scoring event
    await supabase.from('ingest_log').insert({
      company_id,
      event_type: 'scoring',
      details: { scores }
    })

    return new Response(
      JSON.stringify({ success: true, scores }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
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

async function calculateDomainScore(supabase: any, company_id: string, domain: string) {
  let layer_1 = 0
  let layer_2 = 0
  const gaps: string[] = []

  // Get all knowledge elements for this domain
  const { data: elements, error } = await supabase
    .from('knowledge_elements')
    .select('*')
    .eq('company_id', company_id)
    .eq('domain', domain)

  if (error) throw error

  // Get connected sources for this domain
  const { data: sources } = await supabase
    .from('connected_sources')
    .select('*')
    .eq('company_id', company_id)
    .eq('domain', domain)
    .eq('is_active', true)

  const hasApiConnected = sources && sources.length > 0
  const hasManualData = elements && elements.length > 0

  // Layer 1 Scoring (Platform Access: 0-15)
  if (domain === 'finance') {
    if (hasApiConnected) {
      layer_1 = 15
    } else if (hasManualData) {
      // Check if they have at least 3 months of manual P&L data
      const monthlyRevenue = elements.filter((e: any) => 
        e.key.startsWith('finance.revenue.monthly')
      )
      if (monthlyRevenue.length >= 3) {
        layer_1 = 15
      } else {
        layer_1 = 10
        gaps.push('Need 3+ months of revenue data for full Layer 1 score')
      }
    } else {
      gaps.push('No financial data source connected')
    }
  } else if (domain === 'sales') {
    if (hasApiConnected) {
      layer_1 = 15
    } else if (hasManualData) {
      layer_1 = 12
      gaps.push('Connect CRM (HubSpot, Pipedrive, Salesforce) for real-time pipeline data')
    } else {
      gaps.push('No sales data source connected')
    }
  } else if (domain === 'marketing') {
    if (hasApiConnected) {
      layer_1 = 15
    } else if (hasManualData) {
      layer_1 = 10
      gaps.push('Connect Google Search Console or GA4 for real-time traffic data')
    } else {
      gaps.push('No marketing data source connected')
    }
  } else {
    // Generic scoring for other domains
    if (hasApiConnected) {
      layer_1 = 15
    } else if (hasManualData) {
      layer_1 = 12
    }
  }

  // Layer 2 Scoring (Historical Context: 0-15)
  if (elements && elements.length > 0) {
    // Count months of historical data
    const monthlyKeys = elements.filter((e: any) => e.key.includes('.monthly.'))
    const uniqueMonths = new Set(
      monthlyKeys.map((e: any) => {
        const match = e.key.match(/\d{4}-\d{2}/)
        return match ? match[0] : null
      }).filter(Boolean)
    )

    const monthsOfData = uniqueMonths.size

    if (monthsOfData >= 6) {
      layer_2 = 15
    } else if (monthsOfData >= 3) {
      layer_2 = 10
      gaps.push(`Have ${monthsOfData} months of data - need 6+ months for full Layer 2 score`)
    } else if (monthsOfData >= 1) {
      layer_2 = 5
      gaps.push(`Have ${monthsOfData} month(s) of data - need 3+ months for Layer 2`)
    } else {
      gaps.push('No historical monthly data found')
    }

    // Bonus points for key metrics calculated
    if (domain === 'finance') {
      const hasCashRunway = elements.some((e: any) => e.key === 'finance.runway_months')
      const hasBurnRate = elements.some((e: any) => e.key === 'finance.burn_rate')
      const hasTopClients = elements.some((e: any) => e.key.startsWith('finance.top_client'))

      if (hasCashRunway && hasBurnRate && hasTopClients) {
        layer_2 = Math.min(15, layer_2 + 2)
      } else {
        if (!hasCashRunway) gaps.push('Missing: cash runway calculation')
        if (!hasBurnRate) gaps.push('Missing: burn rate calculation')
        if (!hasTopClients) gaps.push('Missing: top clients analysis')
      }
    }
  } else {
    gaps.push('No knowledge elements extracted yet')
  }

  return {
    domain,
    layer_1,
    layer_2,
    total: layer_1 + layer_2,
    gaps,
    elements_count: elements?.length || 0,
    sources_connected: sources?.length || 0
  }
}
