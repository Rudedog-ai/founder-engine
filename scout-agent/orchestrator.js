// Scout Agent Orchestrator
// Runs all scrapers, stores discoveries, evaluates them

import { scrapeGitHubTrending } from './scrapers/github-trending.js'
import { scrapeProductHunt } from './scrapers/producthunt.js'
import { scrapeHackerNews } from './scrapers/hackernews.js'
import { evaluateDiscovery } from './evaluators/llm-evaluator.js'

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
  
  // Evaluate each new discovery with LLM
  const evaluations = []
  
  for (const discovery of newDiscoveries) {
    console.log(`[Scout Agent] Evaluating: ${discovery.title}`)
    
    const evaluation = await evaluateDiscovery(discovery, anthropicApiKey)
    
    if (!evaluation) {
      console.error(`[Scout Agent] Failed to evaluate: ${discovery.title}`)
      continue
    }
    
    // Store evaluation
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
  
  return {
    discoveries: newDiscoveries.length,
    evaluations: evaluations.length,
    investigate: evaluations.filter(e => e.recommendation === 'INVESTIGATE').length,
    watch: evaluations.filter(e => e.recommendation === 'WATCH').length,
    ignore: evaluations.filter(e => e.recommendation === 'IGNORE').length
  }
}
