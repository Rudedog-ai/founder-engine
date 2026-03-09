// initial-enrichment
// v1.0 | 9 March 2026
// Auto-runs on first dashboard load: Scrapling + Perplexity + DataForSEO + NewsAPI + Listen Notes

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

    const { company_id } = await req.json()

    if (!company_id) {
      throw new Error('Missing company_id')
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, website, ingest_status')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      throw new Error('Company not found')
    }

    // Skip if already enriched
    if (company.ingest_status !== 'not_started') {
      return new Response(
        JSON.stringify({ message: 'Initial enrichment already completed', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status
    await supabase
      .from('companies')
      .update({ ingest_status: 'in_progress' })
      .eq('id', company_id)

    const enrichments = []

    // 1. SCRAPLING - Social media, PR, blogs
    try {
      const scraplingResult = await runScrapling(company.name, company.website)
      if (scraplingResult) {
        await supabase.from('raw_api_data').insert({
          company_id,
          platform: 'scrapling',
          endpoint: 'social_pr_blogs',
          data: scraplingResult,
          domain: 'marketing'
        })
        enrichments.push({ source: 'Scrapling', status: 'success', items: scraplingResult.items?.length || 0 })
      }
    } catch (e) {
      enrichments.push({ source: 'Scrapling', status: 'error', error: e.message })
    }

    // 2. PERPLEXITY - Company research
    try {
      const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')
      if (perplexityKey) {
        const perplexityResult = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${perplexityKey}`
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [{
              role: 'user',
              content: `Research ${company.name}${company.website ? ` (${company.website})` : ''}. Provide: industry, founding year, key products/services, target market, notable achievements, recent news.`
            }]
          })
        })
        const perplexityData = await perplexityResult.json()
        await supabase.from('raw_api_data').insert({
          company_id,
          platform: 'perplexity',
          endpoint: 'company_research',
          data: perplexityData,
          domain: 'strategy'
        })
        enrichments.push({ source: 'Perplexity', status: 'success' })
      }
    } catch (e) {
      enrichments.push({ source: 'Perplexity', status: 'error', error: e.message })
    }

    // 3. DATAFORSEO - Domain authority, SEO metrics
    try {
      const dataForSeoLogin = Deno.env.get('DATAFORSEO_LOGIN')
      const dataForSeoPassword = Deno.env.get('DATAFORSEO_PASSWORD')
      
      if (dataForSeoLogin && dataForSeoPassword && company.website) {
        const domain = new URL(company.website).hostname
        const auth = btoa(`${dataForSeoLogin}:${dataForSeoPassword}`)
        
        const seoResult = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/domain_metrics/live', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify([{ target: domain }])
        })
        const seoData = await seoResult.json()
        await supabase.from('raw_api_data').insert({
          company_id,
          platform: 'dataforseo',
          endpoint: 'domain_metrics',
          data: seoData,
          domain: 'marketing'
        })
        enrichments.push({ source: 'DataForSEO', status: 'success' })
      }
    } catch (e) {
      enrichments.push({ source: 'DataForSEO', status: 'error', error: e.message })
    }

    // 4. NEWSAPI - Press coverage
    try {
      const newsApiKey = Deno.env.get('NEWSAPI_KEY')
      if (newsApiKey) {
        const newsResult = await fetch(
          `https://newsapi.org/v2/everything?q="${company.name}"&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`
        )
        const newsData = await newsResult.json()
        await supabase.from('raw_api_data').insert({
          company_id,
          platform: 'newsapi',
          endpoint: 'press_coverage',
          data: newsData,
          domain: 'strategy'
        })
        enrichments.push({ source: 'NewsAPI', status: 'success', articles: newsData.totalResults || 0 })
      }
    } catch (e) {
      enrichments.push({ source: 'NewsAPI', status: 'error', error: e.message })
    }

    // 5. LISTEN NOTES - Podcast mentions
    try {
      const listenNotesKey = Deno.env.get('LISTENNOTES_KEY')
      if (listenNotesKey) {
        const podcastResult = await fetch(
          `https://listen-api.listennotes.com/api/v2/search?q="${company.name}"&type=episode`,
          { headers: { 'X-ListenAPI-Key': listenNotesKey } }
        )
        const podcastData = await podcastResult.json()
        await supabase.from('raw_api_data').insert({
          company_id,
          platform: 'listennotes',
          endpoint: 'podcast_mentions',
          data: podcastData,
          domain: 'marketing'
        })
        enrichments.push({ source: 'ListenNotes', status: 'success', mentions: podcastData.count || 0 })
      }
    } catch (e) {
      enrichments.push({ source: 'ListenNotes', status: 'error', error: e.message })
    }

    // Trigger classification + scoring
    const classifyPromises = []
    const { data: apiData } = await supabase
      .from('raw_api_data')
      .select('id')
      .eq('company_id', company_id)
      .is('processed', false)

    for (const item of (apiData || [])) {
      classifyPromises.push(
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/classify-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({ company_id, api_data_id: item.id })
        })
      )
    }

    await Promise.all(classifyPromises)

    // Calculate scores
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-domain-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ company_id })
    })

    // Log enrichment
    await supabase.from('ingest_log').insert({
      company_id,
      event_type: 'initial_enrichment',
      details: { enrichments }
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        enrichments,
        total_sources: enrichments.length,
        successful: enrichments.filter(e => e.status === 'success').length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Initial enrichment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Scrapling integration - calls GitHub D4Vinci/Scrapling tool
async function runScrapling(companyName: string, website: string | null) {
  // TODO: Integrate with Scrapling Python library
  // For now, return mock structure
  // Real implementation would:
  // 1. Install Scrapling: pip install scrapling
  // 2. Run scraper for social media, blogs, PR mentions
  // 3. Return structured results
  
  return {
    company: companyName,
    timestamp: new Date().toISOString(),
    sources: {
      twitter: { found: false, reason: 'Not implemented yet' },
      linkedin: { found: false, reason: 'Not implemented yet' },
      blogs: { found: false, reason: 'Not implemented yet' },
      press_releases: { found: false, reason: 'Not implemented yet' }
    },
    items: [],
    note: 'Scrapling integration pending - requires Python runtime'
  }
}
