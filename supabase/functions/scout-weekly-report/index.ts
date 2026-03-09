// Scout Agent Weekly Report
// Sends blog-style email with full week's discoveries
// Runs Mondays at 08:00 UTC via cron

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
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const toEmail = Deno.env.get('SCOUT_EMAIL_TO') || 'rfairbairns@gmail.com'

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[Scout Weekly Report] Generating...')

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

    console.log(`Investigate: ${investigate.length}, Watch: ${watch.length}, Ignore: ${ignore.length}`)

    const today = new Date().toISOString().split('T')[0]
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    // Generate blog-style email
    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; line-height: 1.8; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 40px 20px; background: #fafafa; }
    .container { background: white; padding: 60px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 36px; margin-bottom: 10px; color: #000; font-weight: 700; }
    .subtitle { font-size: 16px; color: #666; margin-bottom: 40px; font-family: -apple-system, sans-serif; }
    .intro { font-size: 18px; line-height: 1.8; margin-bottom: 40px; color: #333; }
    h2 { font-size: 28px; margin-top: 50px; margin-bottom: 20px; color: #FF6B35; font-weight: 600; }
    .tool { background: #f8f9fa; padding: 30px; margin-bottom: 30px; border-radius: 6px; border-left: 4px solid #FF6B35; }
    .tool h3 { margin-top: 0; font-size: 22px; color: #000; font-weight: 600; }
    .meta { font-family: -apple-system, sans-serif; font-size: 13px; color: #666; margin: 10px 0; }
    .scores { display: inline-flex; gap: 10px; margin: 15px 0; }
    .score { background: white; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    .domain-tag { display: inline-block; background: #4A90E2; color: white; padding: 5px 15px; border-radius: 15px; font-size: 13px; font-family: -apple-system, sans-serif; margin-right: 10px; }
    .use-case { background: white; padding: 20px; border-radius: 4px; margin: 15px 0; font-size: 16px; line-height: 1.6; }
    .reasoning { font-size: 16px; line-height: 1.7; margin: 15px 0; }
    .link { display: inline-block; background: #FF6B35; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 15px; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 600; }
    .link:hover { background: #E55A25; }
    .watch-list { list-style: none; padding: 0; }
    .watch-item { background: #f8f9fa; padding: 20px; margin-bottom: 15px; border-radius: 4px; }
    .watch-item h4 { margin: 0 0 10px 0; font-size: 18px; color: #000; }
    .summary { background: #1a1a1a; color: white; padding: 30px; border-radius: 6px; margin: 50px 0; }
    .summary h3 { color: white; margin-top: 0; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px; }
    .stat { text-align: center; }
    .stat-number { font-size: 36px; font-weight: 700; color: #FF6B35; }
    .stat-label { font-size: 13px; color: #999; font-family: -apple-system, sans-serif; }
    .footer { margin-top: 60px; padding-top: 30px; border-top: 2px solid #eee; font-size: 14px; color: #999; text-align: center; font-family: -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Scout Agent Weekly Report</h1>
    <p class="subtitle">${weekAgoStr} → ${today}</p>
    
    <p class="intro">
      This week, Scout Agent reviewed <strong>${evaluations.length} tools, APIs, and frameworks</strong> across GitHub, Product Hunt, and Hacker News. 
      Each discovery was evaluated by Claude Opus 4.6 for relevance to Founder Engine's domain agents (Finance, Sales, Marketing, Operations, Product).
    </p>
`

    if (investigate.length > 0) {
      html += `
    <h2>🔥 High-Impact Tools (Review This Week)</h2>
    <p>These ${investigate.length} ${investigate.length === 1 ? 'tool has' : 'tools have'} scored ≥7.0 overall and passed safety/maturity checks.</p>
`
      for (const eval of investigate) {
        const disc = eval.discovery
        html += `
    <div class="tool">
      <div class="meta">
        <span class="domain-tag">${eval.domain.toUpperCase()}</span>
        <span>Overall: ${eval.overall_score.toFixed(1)}/10</span>
      </div>
      <h3>${disc.title}</h3>
      <div class="scores">
        <span class="score">R: ${eval.relevance_score}/10</span>
        <span class="score">Rep: ${eval.reputation_score}/10</span>
        <span class="score">S: ${eval.safety_score}/10</span>
        <span class="score">M: ${eval.maturity_score}/10</span>
      </div>
      <div class="use-case">
        <strong>Use Case:</strong> ${eval.use_case}
      </div>
      <p class="reasoning">${eval.reasoning}</p>
      <p class="meta">Source: ${disc.source} • Author: ${disc.author}</p>
      <a href="${disc.url}" class="link">Review Tool →</a>
    </div>
`
      }
    }

    if (watch.length > 0) {
      html += `
    <h2>📊 Worth Watching</h2>
    <p>These ${watch.length} ${watch.length === 1 ? 'tool is' : 'tools are'} promising but not yet ready for production. Revisit in 3 months.</p>
    <ul class="watch-list">
`
      for (const eval of watch.slice(0, 10)) {
        html += `
      <li class="watch-item">
        <h4>${eval.discovery.title}</h4>
        <p class="meta">
          Domain: ${eval.domain} | Overall: ${eval.overall_score.toFixed(1)}/10 | 
          <a href="${eval.discovery.url}" style="color: #4A90E2;">View →</a>
        </p>
        <p>${eval.reasoning}</p>
      </li>
`
      }
      html += `    </ul>\n`
      
      if (watch.length > 10) {
        html += `    <p class="meta">+ ${watch.length - 10} more in the "watch" category</p>\n`
      }
    }

    html += `
    <div class="summary">
      <h3>This Week's Summary</h3>
      <div class="stats">
        <div class="stat">
          <div class="stat-number">${evaluations.length}</div>
          <div class="stat-label">Tools Reviewed</div>
        </div>
        <div class="stat">
          <div class="stat-number">${investigate.length}</div>
          <div class="stat-label">High Priority</div>
        </div>
        <div class="stat">
          <div class="stat-number">${watch.length}</div>
          <div class="stat-label">Worth Watching</div>
        </div>
        <div class="stat">
          <div class="stat-number">${ignore.length}</div>
          <div class="stat-label">Filtered Out</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Scout Agent</strong> runs daily at 6am UTC. High-priority discoveries are sent via daily nudge emails.</p>
      <p>Next weekly report: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</p>
    </div>
  </div>
</body>
</html>
`

    // Send via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: 'Scout Agent <scout@minimoguls.co.uk>',
        to: toEmail,
        subject: `🔍 Scout Weekly Report: ${investigate.length} High-Impact ${investigate.length === 1 ? 'Tool' : 'Tools'} • ${today}`,
        html: html
      })
    })

    if (!emailRes.ok) {
      const errorText = await emailRes.text()
      throw new Error(`Resend API error: ${errorText}`)
    }

    // Store digest
    await supabase.from('scout_digests').insert({
      digest_type: 'weekly_report',
      period_start: weekAgo.toISOString(),
      period_end: new Date().toISOString(),
      high_priority_count: investigate.length,
      watch_count: watch.length,
      ignored_count: ignore.length,
      sent_to: [toEmail],
      content: html
    })

    console.log(`[Scout Weekly Report] Email sent to ${toEmail}`)

    return new Response(
      JSON.stringify({
        success: true,
        investigate: investigate.length,
        watch: watch.length,
        ignore: ignore.length,
        sent_to: toEmail
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Scout Weekly Report] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
