// Weekly Digest Generator
// Creates formatted report of all discoveries from the past week

export async function generateWeeklyDigest(supabase) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  // Fetch all evaluations from the past week, joined with discoveries
  const { data: evaluations, error } = await supabase
    .from('scout_evaluations')
    .select(`
      *,
      discovery:scout_discoveries(*)
    `)
    .gte('evaluated_at', weekAgo.toISOString())
    .order('overall_score', { ascending: false })
  
  if (error) {
    console.error('Error fetching evaluations:', error)
    return null
  }
  
  // Group by recommendation
  const investigate = evaluations.filter(e => e.recommendation === 'INVESTIGATE')
  const watch = evaluations.filter(e => e.recommendation === 'WATCH')
  const ignore = evaluations.filter(e => e.recommendation === 'IGNORE')
  
  // Format digest
  const today = new Date().toISOString().split('T')[0]
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  
  let digest = `# SCOUT AGENT WEEKLY REPORT\n`
  digest += `**${weekAgoStr} → ${today}**\n\n`
  digest += `---\n\n`
  
  // High Priority Section
  if (investigate.length > 0) {
    digest += `## 🔥 HIGH PRIORITY (Investigate This Week)\n\n`
    
    for (const [idx, eval] of investigate.entries()) {
      const disc = eval.discovery
      digest += `### ${idx + 1}. ${disc.title}\n\n`
      digest += `**Relevance:** ${eval.relevance_score}/10 | `
      digest += `**Reputation:** ${eval.reputation_score}/10 | `
      digest += `**Safety:** ${eval.safety_score}/10 | `
      digest += `**Maturity:** ${eval.maturity_score}/10\n\n`
      digest += `**Overall Score:** ${eval.overall_score.toFixed(1)}/10\n\n`
      digest += `**Domain:** ${eval.domain}\n\n`
      digest += `**Use Case:** ${eval.use_case}\n\n`
      digest += `**Why:** ${eval.reasoning}\n\n`
      digest += `**Link:** ${disc.url}\n\n`
      digest += `**Source:** ${disc.source} • **Author:** ${disc.author}\n\n`
      digest += `---\n\n`
    }
  }
  
  // Worth Watching Section
  if (watch.length > 0) {
    digest += `## 📊 WORTH WATCHING\n\n`
    
    for (const [idx, eval] of watch.slice(0, 10).entries()) { // Top 10 only
      const disc = eval.discovery
      digest += `### ${idx + 1}. ${disc.title}\n\n`
      digest += `**Scores:** R:${eval.relevance_score} | Rep:${eval.reputation_score} | S:${eval.safety_score} | M:${eval.maturity_score} (Overall: ${eval.overall_score.toFixed(1)}/10)\n\n`
      digest += `**Domain:** ${eval.domain} | **Why:** ${eval.reasoning}\n\n`
      digest += `**Link:** ${disc.url}\n\n`
      digest += `---\n\n`
    }
    
    if (watch.length > 10) {
      digest += `_+ ${watch.length - 10} more in WATCH category_\n\n`
    }
  }
  
  // Summary Section
  digest += `## 📈 SUMMARY\n\n`
  digest += `- **Reviewed:** ${evaluations.length} tools this week\n`
  digest += `- **High Priority:** ${investigate.length}\n`
  digest += `- **Worth Watching:** ${watch.length}\n`
  digest += `- **Ignored:** ${ignore.length}\n\n`
  digest += `---\n\n`
  digest += `_Scout Agent runs daily. Next digest: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_\n`
  
  // Store digest in database
  const { data: digestRecord, error: digestError } = await supabase
    .from('scout_digests')
    .insert({
      period_start: weekAgo.toISOString(),
      period_end: new Date().toISOString(),
      high_priority_count: investigate.length,
      watch_count: watch.length,
      ignored_count: ignore.length,
      content: digest
    })
    .select()
    .single()
  
  if (digestError) {
    console.error('Error storing digest:', digestError)
  }
  
  return digest
}
