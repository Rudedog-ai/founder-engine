import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOPIC_TO_DOMAIN: Record<string, string[]> = {
  revenue_financials: ['financials'],
  marketing_sales: ['sales', 'marketing'],
  team_operations: ['operations', 'team'],
  business_fundamentals: ['strategy'],
  founder_headspace: ['strategy'],
  customers: ['strategy'],
  technology_systems: ['operations'],
}

const EXPECTED_ENTRIES: Record<string, number> = {
  financials: 15,
  sales: 12,
  marketing: 10,
  operations: 10,
  team: 8,
  strategy: 10,
}

const DOMAIN_WEIGHTS: Record<string, number> = {
  financials: 0.20,
  sales: 0.20,
  marketing: 0.15,
  operations: 0.15,
  team: 0.15,
  strategy: 0.15,
}

const GAP_TOPIC_TO_DOMAIN: Record<string, string> = {
  revenue_financials: 'financials',
  marketing_sales: 'sales',
  team_operations: 'operations',
  business_fundamentals: 'strategy',
  founder_headspace: 'strategy',
  customers: 'strategy',
  technology_systems: 'operations',
}

const DOC_TOPIC_TO_DOMAIN: Record<string, string> = {
  revenue_financials: 'financials',
  marketing_sales: 'sales',
  team_operations: 'operations',
  business_fundamentals: 'strategy',
  founder_headspace: 'strategy',
  customers: 'strategy',
  technology_systems: 'operations',
}

const EXPECTED_DOCS: Record<string, number> = {
  financials: 3,
  sales: 3,
  marketing: 3,
  operations: 3,
  team: 3,
  strategy: 3,
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

    // Fetch knowledge entries
    const { data: knowledge } = await supabase
      .from('knowledge_base')
      .select('topic')
      .eq('company_id', company_id)

    // Fetch processed documents
    const { data: documents } = await supabase
      .from('documents')
      .select('extracted_data')
      .eq('company_id', company_id)
      .eq('processed', true)

    // Fetch gap analysis
    const { data: gaps } = await supabase
      .from('gap_analysis')
      .select('topic, completeness_score')
      .eq('company_id', company_id)

    // Count knowledge entries per domain
    const domainKnowledgeCounts: Record<string, number> = {
      financials: 0, sales: 0, marketing: 0, operations: 0, team: 0, strategy: 0,
    }

    for (const entry of knowledge || []) {
      const domains = TOPIC_TO_DOMAIN[entry.topic] || []
      for (const d of domains) {
        domainKnowledgeCounts[d] = (domainKnowledgeCounts[d] || 0) + 1
      }
    }

    // Count documents per domain
    const domainDocCounts: Record<string, number> = {
      financials: 0, sales: 0, marketing: 0, operations: 0, team: 0, strategy: 0,
    }

    for (const doc of documents || []) {
      const topic = doc.extracted_data?.primary_topic
      if (topic && DOC_TOPIC_TO_DOMAIN[topic]) {
        domainDocCounts[DOC_TOPIC_TO_DOMAIN[topic]]++
      }
    }

    // Gap scores per domain
    const domainGapScores: Record<string, number> = {
      financials: 0, sales: 0, marketing: 0, operations: 0, team: 0, strategy: 0,
    }

    for (const gap of gaps || []) {
      const domain = GAP_TOPIC_TO_DOMAIN[gap.topic]
      if (domain) {
        // Take the higher value if multiple topics map to same domain
        domainGapScores[domain] = Math.max(domainGapScores[domain], gap.completeness_score || 0)
      }
    }

    // Calculate domain scores
    const domain_scores: Record<string, number> = {}

    for (const domain of Object.keys(EXPECTED_ENTRIES)) {
      const knowledgeScore = Math.min(
        (domainKnowledgeCounts[domain] / EXPECTED_ENTRIES[domain]) * 60,
        60
      )
      const docScore = Math.min(
        (domainDocCounts[domain] / EXPECTED_DOCS[domain]) * 20,
        20
      )
      const gapScore = (domainGapScores[domain] / 100) * 20

      domain_scores[domain] = Math.min(Math.round(knowledgeScore + docScore + gapScore), 100)
    }

    // Weighted average for overall score
    let intelligence_score = 0
    for (const [domain, weight] of Object.entries(DOMAIN_WEIGHTS)) {
      intelligence_score += (domain_scores[domain] || 0) * weight
    }
    intelligence_score = Math.round(intelligence_score)

    // Determine tier
    let intelligence_tier = 'getting_started'
    if (intelligence_score >= 81) intelligence_tier = 'expert'
    else if (intelligence_score >= 56) intelligence_tier = 'amazing'
    else if (intelligence_score >= 36) intelligence_tier = 'great'
    else if (intelligence_score >= 16) intelligence_tier = 'good'

    // Update company
    await supabase
      .from('companies')
      .update({ domain_scores, intelligence_score, intelligence_tier })
      .eq('id', company_id)

    // Check if source of truth should be generated
    const { data: company } = await supabase
      .from('companies')
      .select('source_of_truth_doc_id')
      .eq('id', company_id)
      .single()

    const should_generate_sot = intelligence_score >= 25 && !company?.source_of_truth_doc_id

    return new Response(JSON.stringify({
      success: true,
      domain_scores,
      intelligence_score,
      intelligence_tier,
      should_generate_sot,
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
