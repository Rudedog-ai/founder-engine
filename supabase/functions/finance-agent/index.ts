import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisTask {
  id: string
  company_id: string
  goal_id: string
  domain: string
  title: string
  status: string
}

interface KnowledgeElement {
  fact_type: string
  entity: string
  value: string
  confidence: number
  document_date: string
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { companyId, action } = await req.json()
    
    if (!companyId) {
      throw new Error('Company ID required')
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize Anthropic
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    switch (action) {
      case 'heartbeat':
        return await financeAgentHeartbeat(companyId, supabase, anthropic)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Finance agent error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/**
 * Finance Agent Heartbeat - Analyze financial data and identify gaps
 */
async function financeAgentHeartbeat(
  companyId: string,
  supabase: any,
  anthropic: Anthropic
): Promise<Response> {
  console.log(`[Finance Agent] Starting heartbeat for company ${companyId}`)
  
  // 1. Get agent info
  const { data: agent } = await supabase
    .from('domain_agents')
    .select('*')
    .eq('company_id', companyId)
    .eq('domain', 'finance')
    .single()
  
  if (!agent || agent.status === 'paused') {
    return new Response(
      JSON.stringify({ 
        status: 'skipped',
        message: 'Finance agent not found or paused'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // 2. Check agent budget
  if (agent.spent_monthly_cents >= agent.budget_monthly_cents) {
    await supabase
      .from('domain_agents')
      .update({ status: 'paused' })
      .eq('id', agent.id)
    
    return new Response(
      JSON.stringify({ 
        status: 'paused',
        message: 'Agent budget exceeded',
        spent: agent.spent_monthly_cents,
        budget: agent.budget_monthly_cents
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // 3. Atomic task checkout
  const task = await checkoutNextTask(companyId, 'finance', agent.id, supabase)
  if (!task) {
    console.log('[Finance Agent] No tasks available')
    return new Response(
      JSON.stringify({ 
        status: 'idle',
        message: 'No finance analysis tasks available'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // 4. Create heartbeat record
  const { data: heartbeat } = await supabase
    .from('domain_agent_heartbeats')
    .insert({
      agent_id: agent.id,
      company_id: companyId,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single()
  
  try {
    // 5. Get finance facts from knowledge base
    const { data: financeFacts } = await supabase
      .from('knowledge_elements')
      .select('*')
      .eq('company_id', companyId)
      .eq('domain', 'finance')
      .order('confidence', { ascending: false })
    
    console.log(`[Finance Agent] Found ${financeFacts?.length || 0} finance facts`)
    
    // 6. Analyze gaps with Claude
    const analysis = await analyzeFinanceGaps(
      financeFacts || [], 
      agent.name,
      anthropic,
      supabase,
      companyId
    )
    
    // 7. Update task with results
    await supabase
      .from('analysis_tasks')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        output: analysis,
        facts_extracted: financeFacts?.length || 0,
        gaps_identified: analysis.gaps.length,
        confidence_score: analysis.confidence
      })
      .eq('id', task.id)
    
    // 8. Create action goals for each recommendation
    const createdGoals = []
    for (const rec of analysis.recommendations) {
      const { data: actionGoal } = await supabase
        .from('transformation_goals')
        .insert({
          company_id: companyId,
          title: rec.title,
          description: rec.description,
          level: 'action',
          parent_id: task.goal_id,
          owner_domain: 'finance',
          owner_agent_id: agent.id,
          recommended_tool: rec.tool,
          estimated_monthly_cost_cents: rec.monthly_cost_cents,
          estimated_annual_value_cents: rec.annual_value_cents,
          status: 'planned'
        })
        .select()
        .single()
      
      createdGoals.push(actionGoal)
    }
    
    // 9. Update heartbeat with results
    const endTime = new Date()
    const duration = endTime.getTime() - new Date(heartbeat.started_at).getTime()
    
    await supabase
      .from('domain_agent_heartbeats')
      .update({
        status: 'complete',
        completed_at: endTime.toISOString(),
        duration_ms: duration,
        tasks_completed: 1,
        facts_extracted: financeFacts?.length || 0,
        gaps_identified: analysis.gaps.length,
        recommendations_made: createdGoals.length,
        cost_cents: analysis.cost_cents,
        output_summary: `Analyzed ${financeFacts?.length || 0} finance facts, found ${analysis.gaps.length} gaps, made ${createdGoals.length} recommendations`
      })
      .eq('id', heartbeat.id)
    
    // 10. Log completion
    await logAction(supabase, {
      company_id: companyId,
      actor_type: 'agent',
      actor_id: agent.id,
      actor_name: agent.name,
      action_type: 'analysis_complete',
      target_type: 'analysis_tasks',
      target_id: task.id,
      message: `Finance analysis complete: ${analysis.gaps.length} gaps found`,
      metadata: {
        facts_analyzed: financeFacts?.length || 0,
        gaps_found: analysis.gaps.length,
        recommendations_made: createdGoals.length,
        top_gap: analysis.gaps[0]?.title
      }
    })
    
    console.log(`[Finance Agent] Analysis complete: ${analysis.gaps.length} gaps, ${createdGoals.length} recommendations`)
    
    return new Response(
      JSON.stringify({
        status: 'success',
        task_id: task.id,
        facts_analyzed: financeFacts?.length || 0,
        gaps_found: analysis.gaps.length,
        recommendations_made: createdGoals.length,
        cost_cents: analysis.cost_cents,
        top_gaps: analysis.gaps.slice(0, 3).map(g => g.title),
        top_recommendations: createdGoals.slice(0, 3).map(g => g.title)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    // Mark task as failed
    await supabase
      .from('analysis_tasks')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: error.message
      })
      .eq('id', task.id)
    
    // Update heartbeat as failed
    await supabase
      .from('domain_agent_heartbeats')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', heartbeat.id)
    
    throw error
  }
}

/**
 * Atomic task checkout - prevents double work
 */
async function checkoutNextTask(
  companyId: string,
  domain: string,
  agentId: string,
  supabase: any
): Promise<AnalysisTask | null> {
  
  // Use Postgres transaction for atomic checkout
  const { data, error } = await supabase.rpc('checkout_analysis_task', {
    p_company_id: companyId,
    p_domain: domain,
    p_agent_id: agentId
  })
  
  if (error) {
    console.error('Task checkout error:', error)
    return null
  }
  
  return data?.[0] || null
}

/**
 * Analyze finance gaps using Claude
 */
async function analyzeFinanceGaps(
  facts: KnowledgeElement[],
  agentName: string,
  anthropic: Anthropic,
  supabase: any,
  companyId: string
) {
  const startTime = Date.now()
  
  // Group facts by type
  const factsByType = facts.reduce((acc, fact) => {
    if (!acc[fact.fact_type]) acc[fact.fact_type] = []
    acc[fact.fact_type].push(fact)
    return acc
  }, {} as Record<string, KnowledgeElement[]>)
  
  // Prepare analysis prompt
  const prompt = `You are ${agentName}, the Chief Financial Officer analyzing a company's financial health.

Financial Facts Available:
${JSON.stringify(factsByType, null, 2)}

Total facts: ${facts.length}

Analyze these financial facts and identify:

1. CRITICAL GAPS (things missing that every business needs):
   - Cash runway visibility
   - Real-time financial dashboards
   - Automated invoicing/collections
   - Expense tracking/approval workflows
   - Financial forecasting
   - Unit economics understanding

2. IMPROVEMENT OPPORTUNITIES:
   - Better payment terms
   - Cost reduction areas
   - Revenue optimization
   - Working capital improvements
   - Financial process automation

3. RECOMMENDATIONS with specific tools:
   - Nume: Real-time financial insights ($50/month)
   - Expensify: Expense management ($5/user/month)
   - Bill.com: AP/AR automation ($45/month)
   - Stripe Billing: Recurring revenue management
   - Manual improvements (free but time-intensive)

Format your response as JSON:
{
  "gaps": [
    {
      "title": "No real-time cash runway visibility",
      "severity": "CRITICAL",
      "description": "Company has 6 months runway but no dashboard to track burn rate changes",
      "impact": "Could run out of cash without warning"
    }
  ],
  "recommendations": [
    {
      "title": "Deploy Nume for real-time CFO dashboard",
      "description": "Connect Xero + Stripe to get instant runway, burn rate, and revenue metrics",
      "tool": "Nume",
      "monthly_cost_cents": 5000,
      "annual_value_cents": 240000,
      "implementation_days": 1,
      "priority": "HIGH"
    }
  ],
  "confidence": 0.85,
  "summary": "Strong financial foundation but lacks real-time visibility. 3 critical gaps that could be fixed in 1 week."
}`

  try {
    // Call Claude Opus for deep analysis
    const completion = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',  // Using Opus for complex financial analysis
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2  // Low temperature for consistent financial analysis
    })
    
    const responseText = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : '{}'
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    
    // Calculate API cost (Opus pricing)
    const inputTokens = prompt.length / 4  // Rough estimate
    const outputTokens = responseText.length / 4
    const costCents = Math.ceil(
      (inputTokens * 0.015 + outputTokens * 0.075) / 10  // Opus pricing
    )
    
    // Track API cost
    await supabase
      .from('api_cost_events')
      .insert({
        company_id: companyId,
        agent_domain: 'finance',
        event_type: 'opus_analysis',
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        tokens_input: Math.ceil(inputTokens),
        tokens_output: Math.ceil(outputTokens),
        tokens_total: Math.ceil(inputTokens + outputTokens),
        cost_cents: costCents
      })
    
    // Add cost to analysis
    analysis.cost_cents = costCents
    analysis.analysis_time_ms = Date.now() - startTime
    
    return analysis
    
  } catch (error) {
    console.error('Claude analysis error:', error)
    
    // Return fallback analysis
    return {
      gaps: [
        {
          title: "Analysis failed - insufficient data",
          severity: "UNKNOWN",
          description: "Could not complete financial analysis",
          impact: "Manual review required"
        }
      ],
      recommendations: [],
      confidence: 0.1,
      summary: "Analysis failed. Manual review required.",
      cost_cents: 0,
      error: error.message
    }
  }
}

async function logAction(supabase: any, logEntry: any) {
  await supabase
    .from('transformation_log')
    .insert(logEntry)
}