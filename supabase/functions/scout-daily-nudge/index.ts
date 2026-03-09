// Scout Agent Daily Nudge
// Sends email with HIGH PRIORITY discoveries from last 24 hours
// Runs daily at 09:00 UTC (10am UK time) via cron

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

    console.log('[Scout Daily Nudge] Checking for high-priority items...')

    // Get HIGH PRIORITY discoveries from last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: evaluations, error } = await supabase
      .from('scout_evaluations')
      .select(`
        *,
        discovery:scout_discoveries(*)
      `)
      .eq('recommendation', 'INVESTIGATE')
      .gte('evaluated_at', yesterday.toISOString())
      .order('overall_score', { ascending: false })

    if (error) throw error

    if (!evaluations || evaluations.length === 0) {
      console.log('[Scout Daily Nudge] No high-priority items today')
      return new Response(
        JSON.stringify({ message: 'No high-priority items', count: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Scout Daily Nudge] Found ${evaluations.length} high-priority items`)

    // Generate email content
    const today = new Date().toISOString().split('T')[0]
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #000; font-size: 24px; margin-bottom: 10px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
    .tool { background: #f8f9fa; border-left: 4px solid #FF6B35; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
    .tool h2 { margin-top: 0; font-size: 18px; color: #000; }
    .scores { display: flex; gap: 15px; margin: 10px 0; font-size: 13px; color: #666; }
    .score { background: white; padding: 5px 10px; border-radius: 4px; }
    .use-case { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; font-size: 14px; }
    .domain { display: inline-block; background: #4A90E2; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 10px; }
    .link { display: inline-block; background: #FF6B35; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <h1>🔥 Scout Agent Daily Nudge</h1>
  <p class="subtitle">${today} • ${evaluations.length} high-impact ${evaluations.length === 1 ? 'tool' : 'tools'} found</p>
`

    for (const eval of evaluations) {
      const disc = eval.discovery
      html += `
  <div class="tool">
    <span class="domain">${eval.domain.toUpperCase()}</span>
    <h2>${disc.title}</h2>
    <div class="scores">
      <span class="score">Relevance: ${eval.relevance_score}/10</span>
      <span class="score">Reputation: ${eval.reputation_score}/10</span>
      <span class="score">Safety: ${eval.safety_score}/10</span>
      <span class="score">Maturity: ${eval.maturity_score}/10</span>
    </div>
    <div class="use-case">
      <strong>Use Case:</strong> ${eval.use_case}
    </div>
    <p><strong>Why it matters:</strong> ${eval.reasoning}</p>
    <a href="${disc.url}" class="link">Review Tool →</a>
  </div>
`
    }

    html += `
  <div class="footer">
    <p>This is your daily nudge from Scout Agent. High-priority tools are automatically evaluated by Claude Opus 4.6 for quality assurance.</p>
    <p>Weekly deep-dive report arrives Monday mornings.</p>
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
        from: 'Scout Agent <scout@founder-engine.co.uk>',
        to: toEmail,
        subject: `🔥 ${evaluations.length} High-Impact ${evaluations.length === 1 ? 'Tool' : 'Tools'} Found — ${today}`,
        html: html
      })
    })

    if (!emailRes.ok) {
      const errorText = await emailRes.text()
      throw new Error(`Resend API error: ${errorText}`)
    }

    // Store digest record
    await supabase.from('scout_digests').insert({
      digest_type: 'daily_nudge',
      period_start: yesterday.toISOString(),
      period_end: new Date().toISOString(),
      high_priority_count: evaluations.length,
      watch_count: 0,
      ignored_count: 0,
      sent_to: [toEmail],
      content: html
    })

    console.log(`[Scout Daily Nudge] Email sent to ${toEmail}`)

    return new Response(
      JSON.stringify({ success: true, count: evaluations.length, sent_to: toEmail }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Scout Daily Nudge] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
