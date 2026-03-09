// Scout Agent Orchestrator
// Runs all scrapers, stores discoveries, evaluates them

import { scrapeGitHubTrending } from './scrapers/github-trending.js'
import { scrapeProductHunt } from './scrapers/producthunt.js'
import { scrapeHackerNews } from './scrapers/hackernews.js'
import { initialFilter, deepEvaluation } from './evaluators/llm-evaluator.js'

export async function runScoutAgent(supabase, anthropicApiKey) {
  console.log('[Scout Agent] Starting daily run...')
  
  const allDiscoveries = []
  
  // Run all scrapers in parallel
  const [githubResults, phResults, hnResults] = await Promise.all([
    scrapeGitHubTrending().catch(err => { console.error('GitHub scraper failed:', err); return [] }),
    scrapeProductHunt().catch(err => { console.error('Product Hunt scraper failed:', err); return [] }),
    scrapeHackerNews().catch(err => { console.error('Hacker News scraper failed:', err); return [] })
  ])
  
  allDiscoveries.push(...githubResults, ...phResults, ...hnResults)
  console.log(`[Scout Agent] Found ${allDiscoveries.length} total discoveries`)
  
  // Deduplicate by URL
  const uniqueDiscoveries = []
  const seenUrls = new Set()
  
  for (const discovery of allDiscoveries) {
    if (!seenUrls.has(discovery.url)) {
      seenUrls.add(discovery.url)
      uniqueDiscoveries.push(discovery)
    }
  }
  
  console.log(`[Scout Agent] ${uniqueDiscoveries.length} unique discoveries after deduplication`)
  
  // Store discoveries in Supabase
  const newDiscoveries = []
  
  for (const discovery of uniqueDiscoveries) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('scout_discoveries')
      .select('id')
      .eq('url', discovery.url)
      .single()
    
    if (existing) {
      console.log(`[Scout Agent] Skipping duplicate: ${discovery.title}`)
      continue
    }
    
    // Insert new discovery
    const { data: inserted, error } = await supabase
      .from('scout_discoveries')
      .insert(discovery)
      .select()
      .single()
    
    if (error) {
      console.error(`[Scout Agent] Error storing discovery:`, error)
      continue
    }
    
    newDiscoveries.push(inserted)
  }
  
  console.log(`[Scout Agent] Stored ${newDiscoveries.length} new discoveries`)
  
  // Two-tier evaluation process
  const evaluations = []
  let haikuCalls = 0
  let opusCalls = 0
  
  for (const discovery of newDiscoveries) {
    console.log(`[Scout Agent] Quick filter: ${discovery.title}`)
    
    // Tier 1: Haiku does quick relevance check ($0.0003/call)
    const filter = await initialFilter(discovery, anthropicApiKey)
    haikuCalls++
    
    if (!filter || filter.quick_verdict === 'noise') {
      console.log(`[Scout Agent] ❌ Filtered out: ${discovery.title}`)
      
      // Store minimal evaluation for 'noise' items
      await supabase.from('scout_evaluations').insert({
        discovery_id: discovery.id,
        relevance_score: filter?.relevance_score || 0,
        reputation_score: 0,
        safety_score: 0,
        maturity_score: 0,
        use_case: 'Not relevant',
        domain: 'general',
        recommendation: 'IGNORE',
        reasoning: filter?.one_line_reason || 'Failed initial filter',
        evaluated_by: 'claude-haiku-4'
      })
      continue
    }
    
    console.log(`[Scout Agent] ✅ Relevant - deep analysis: ${discovery.title}`)
    
    // Tier 2: Opus does full analysis ($0.015/call - only for relevant tools)
    const evaluation = await deepEvaluation(discovery, anthropicApiKey)
    opusCalls++
    
    if (!evaluation) {
      console.error(`[Scout Agent] Failed deep evaluation: ${discovery.title}`)
      continue
    }
    
    // Store full evaluation
    const { error } = await supabase
      .from('scout_evaluations')
      .insert(evaluation)
    
    if (error) {
      console.error(`[Scout Agent] Error storing evaluation:`, error)
      continue
    }
    
    evaluations.push(evaluation)
  }
  
  console.log(`[Scout Agent] Completed ${evaluations.length} evaluations`)
  console.log(`[Scout Agent] Cost: ${haikuCalls} Haiku calls (~$${(haikuCalls * 0.0003).toFixed(3)}), ${opusCalls} Opus calls (~$${(opusCalls * 0.015).toFixed(2)})`)
  
  return {
    discoveries: newDiscoveries.length,
    evaluations: evaluations.length,
    investigate: evaluations.filter(e => e.recommendation === 'INVESTIGATE').length,
    watch: evaluations.filter(e => e.recommendation === 'WATCH').length,
    ignore: evaluations.filter(e => e.recommendation === 'IGNORE').length,
    cost: {
      haiku_calls: haikuCalls,
      opus_calls: opusCalls,
      estimated_usd: (haikuCalls * 0.0003) + (opusCalls * 0.015)
    }
  }
}
