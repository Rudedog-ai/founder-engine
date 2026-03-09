// Scout Agent Weekly Digest
// Generates and sends weekly report to #agent-builder Discord channel
// Triggered every Monday at 08:00 UTC via cron

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
    const discordWebhook = Deno.env.get('DISCORD_SCOUT_WEBHOOK')

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[Scout Weekly Digest] Generating...')

    // Get evaluations from past 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: evaluations, error } = await supabase
      .from('scout_evaluations')
      .select(`
        *,
        discovery:scout_discoveries(*)
      `)
      .gte('evaluated_at', weekAgo.toISOString())
      .order('overall_score', { ascending: false })

    if (error) throw error

    // Group by recommendation
    const investigate = evaluations.filter((e: any) => e.recommendation === 'INVESTIGATE')
    const watch = evaluations.filter((e: any) => e.recommendation === 'WATCH')
    const ignore = evaluations.filter((e: any) => e.recommendation === 'IGNORE')

    // Generate markdown digest
    let digest = `# 🔍 SCOUT AGENT WEEKLY REPORT\n\n`
    digest += `**${weekAgo.toISOString().split('T')[0]} → ${new Date().toISOString().split('T')[0]}**\n\n`
    
    if (investigate.length > 0) {
      digest += `## 🔥 HIGH PRIORITY (${investigate.length})\n\n`
      for (const eval of investigate.slice(0, 5)) {
        const disc = eval.discovery
        digest += `**${disc.title}**\n`
        digest += `Scores: R:${eval.relevance_score} Rep:${eval.reputation_score} S:${eval.safety_score} M:${eval.maturity_score}\n`
        digest += `Domain: ${eval.domain} | ${eval.use_case}\n`
        digest += `${disc.url}\n\n`
      }
    }

    if (watch.length > 0) {
      digest += `\n## 📊 WORTH WATCHING (${watch.length})\n\n`
      for (const eval of watch.slice(0, 5)) {
        digest += `**${eval.discovery.title}** - ${eval.domain} (${eval.overall_score.toFixed(1)}/10)\n`
      }
    }

    digest += `\n**Summary:** ${evaluations.length} reviewed, ${investigate.length} high priority, ${watch.length} watching, ${ignore.length} ignored`

    // Store digest
    await supabase.from('scout_digests').insert({
      period_start: weekAgo.toISOString(),
      period_end: new Date().toISOString(),
      high_priority_count: investigate.length,
      watch_count: watch.length,
      ignored_count: ignore.length,
      content: digest,
      sent_to: discordWebhook ? ['discord:#agent-builder'] : []
    })

    // Send to Discord if webhook configured
    if (discordWebhook) {
      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: digest.substring(0, 2000) // Discord limit
        })
      })
    }

    console.log('[Scout Weekly Digest] Sent successfully')

    return new Response(
      JSON.stringify({ success: true, digest }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Scout weekly digest error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
