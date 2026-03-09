// Scout Agent Daily Run
// Scrapes GitHub/ProductHunt/HackerNews, evaluates with Haiku+Opus
// Runs daily at 06:00 UTC via cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[Scout Daily Run] Starting...')

    // Scrape GitHub Trending
    const githubResults = await scrapeGitHub()
    console.log(`GitHub: ${githubResults.length} repos`)

    // Scrape Product Hunt
    const phResults = await scrapeProductHunt()
    console.log(`Product Hunt: ${phResults.length} products`)

    // Scrape Hacker News
    const hnResults = await scrapeHackerNews()
    console.log(`Hacker News: ${hnResults.length} posts`)

    const allDiscoveries = [...githubResults, ...phResults, ...hnResults]
    console.log(`Total discoveries: ${allDiscoveries.length}`)

    // Deduplicate and store
    const stored = []
    for (const discovery of allDiscoveries) {
      const { data: existing } = await supabase
        .from('scout_discoveries')
        .select('id')
        .eq('url', discovery.url)
        .maybeSingle()

      if (existing) continue

      const { data, error } = await supabase
        .from('scout_discoveries')
        .insert(discovery)
        .select()
        .single()

      if (!error && data) stored.push(data)
    }

    console.log(`Stored ${stored.length} new discoveries`)

    // Two-tier evaluation
    let haikuCalls = 0
    let opusCalls = 0
    const evaluations = []

    for (const discovery of stored) {
      // Tier 1: Haiku filter
      const filter = await haikuFilter(discovery, anthropicKey)
      haikuCalls++

      if (!filter || filter.quick_verdict === 'noise') {
        await supabase.from('scout_evaluations').insert({
          discovery_id: discovery.id,
          relevance_score: filter?.relevance_score || 0,
          reputation_score: 0,
          safety_score: 0,
          maturity_score: 0,
          use_case: 'Not relevant',
          domain: 'general',
          recommendation: 'IGNORE',
          reasoning: filter?.one_line_reason || 'Failed filter',
          evaluated_by: 'claude-haiku-4'
        })
        continue
      }

      // Tier 2: Opus deep analysis
      const evaluation = await opusEvaluate(discovery, anthropicKey)
      opusCalls++

      if (evaluation) {
        await supabase.from('scout_evaluations').insert(evaluation)
        evaluations.push(evaluation)
      }
    }

    const cost = (haikuCalls * 0.0003) + (opusCalls * 0.015)
    console.log(`Evaluations: ${evaluations.length}, Cost: $${cost.toFixed(3)}`)

    return new Response(
      JSON.stringify({
        success: true,
        discoveries: stored.length,
        evaluations: evaluations.length,
        haiku_calls: haikuCalls,
        opus_calls: opusCalls,
        cost_usd: cost
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Scout Daily Run] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function scrapeGitHub() {
  const categories = ['ai', 'machine-learning', 'automation', 'agents', 'finance']
  const discoveries = []
  
  for (const category of categories) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=topic:${category}+created:>2026-02-01+stars:>50&sort=stars&order=desc&per_page=10`,
        { headers: { 'User-Agent': 'FounderEngine-Scout', 'Accept': 'application/vnd.github.v3+json' }}
      )
      if (!res.ok) continue
      
      const data = await res.json()
      for (const repo of data.items) {
        discoveries.push({
          source: 'github',
          source_id: repo.id.toString(),
          url: repo.html_url,
          title: repo.full_name,
          description: repo.description || '',
          author: repo.owner.login,
          tags: [category, ...(repo.topics || [])],
          raw_data: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            license: repo.license?.spdx_id
          }
        })
      }
    } catch (e) { console.error(`GitHub ${category}:`, e) }
  }
  
  return discoveries
}

async function scrapeProductHunt() {
  // Product Hunt requires API key - skip if not configured
  const apiKey = Deno.env.get('PRODUCTHUNT_API_KEY')
  if (!apiKey) return []
  
  // Implementation would go here
  return []
}

async function scrapeHackerNews() {
  try {
    const query = 'Show HN (AI OR automation OR agent OR SaaS)'
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=show_hn&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60}`
    )
    if (!res.ok) return []
    
    const data = await res.json()
    return data.hits.slice(0, 10).map((hit: any) => ({
      source: 'hackernews',
      source_id: hit.objectID,
      url: hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      title: hit.title.replace(/^Show HN:\s*/i, ''),
      description: hit.story_text || '',
      author: hit.author,
      tags: ['hackernews'],
      raw_data: { points: hit.points, comments: hit.num_comments }
    }))
  } catch (e) {
    console.error('HN scrape:', e)
    return []
  }
}

async function haikuFilter(discovery: any, apiKey: string) {
  const prompt = `Is this tool relevant to business intelligence/AI agents/automation?

Tool: ${discovery.title}
Description: ${discovery.description}

JSON only (no markdown):
{"relevance_score": 0-10, "quick_verdict": "relevant|noise", "one_line_reason": "..."}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    
    if (!res.ok) return null
    const data = await res.json()
    return JSON.parse(data.content[0].text)
  } catch (e) {
    console.error('Haiku filter:', e)
    return null
  }
}

async function opusEvaluate(discovery: any, apiKey: string) {
  const prompt = `Evaluate this tool for Founder Engine (AI business intelligence platform).

**Title:** ${discovery.title}
**URL:** ${discovery.url}
**Description:** ${discovery.description}
**Source:** ${discovery.source}

Score 0-10:
1. Relevance: Does this help Finance/Sales/Marketing/Ops/Product agents?
2. Reputation: Stars, credibility, funding
3. Safety: Open source? Data handling? License?
4. Maturity: Production-ready?

JSON only:
{
  "relevance_score": 0-10,
  "reputation_score": 0-10,
  "safety_score": 0-10,
  "maturity_score": 0-10,
  "use_case": "...",
  "domain": "finance|sales|marketing|operations|product|general",
  "recommendation": "INVESTIGATE|WATCH|IGNORE",
  "reasoning": "..."
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    
    if (!res.ok) return null
    const data = await res.json()
    const evaluation = JSON.parse(data.content[0].text)
    
    return {
      discovery_id: discovery.id,
      ...evaluation,
      evaluated_by: 'claude-opus-4'
    }
  } catch (e) {
    console.error('Opus eval:', e)
    return null
  }
}
