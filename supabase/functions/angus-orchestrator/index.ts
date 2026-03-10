import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomainAgent {
  id: string
  domain: string
  name: string
  status: string
  budget_monthly_cents: number
  spent_monthly_cents: number
}

interface AnalysisTask {
  id: string
  domain: string
  title: string
  priority: number
  status: string
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
        return await runAngusHeartbeat(companyId, supabase, anthropic)
      
      case 'initialize':
        return await initializeCompanyAgents(companyId, supabase)
      
      case 'synthesize':
        return await synthesizeRecommendations(companyId, supabase, anthropic)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Angus orchestrator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/**
 * Main heartbeat function - coordinates all domain agents
 */
async function runAngusHeartbeat(
  companyId: string, 
  supabase: any,
  anthropic: Anthropic
): Promise<Response> {
  console.log(`[Angus] Starting heartbeat for company ${companyId}`)
  
  // 1. Check if INGEST is complete
  const { data: ingestProgress } = await supabase
    .from('ingestion_progress')
    .select('status, facts_extracted')
    .eq('company_id', companyId)
    .single()
  
  if (!ingestProgress || ingestProgress.status !== 'complete') {
    console.log('[Angus] Ingestion not complete, skipping analysis')
    return new Response(
      JSON.stringify({ 
        status: 'waiting',
        message: 'Waiting for ingestion to complete'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // 2. Check company budget
  const { data: company } = await supabase
    .from('companies')
    .select('name, transformation_budget_cents, spent_this_engagement_cents, status')
    .eq('id', companyId)
    .single()
  
  if (company.status === 'paused') {
    console.log('[Angus] Company paused (budget exceeded)')
    return new Response(
      JSON.stringify({ 
        status: 'paused',
        message: 'Company paused - budget exceeded',
        spent: company.spent_this_engagement_cents,
        budget: company.transformation_budget_cents
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // 3. Get or create company goal
  let companyGoal = await getOrCreateCompanyGoal(companyId, company.name, supabase)
  
  // 4. Get all domain agents
  const { data: domainAgents } = await supabase
    .from('domain_agents')
    .select('*')
    .eq('company_id', companyId)
    .neq('domain', 'orchestrator')
    .order('domain')
  
  if (!domainAgents || domainAgents.length === 0) {
    console.log('[Angus] No domain agents found, initializing...')
    await initializeCompanyAgents(companyId, supabase)
  }
  
  // 5. Create analysis tasks for each domain
  const domains = ['finance', 'sales', 'marketing', 'operations', 'people', 'product', 'legal', 'strategy']
  const createdTasks = []
  
  for (const domain of domains) {
    // Create domain goal
    const domainGoal = await getOrCreateDomainGoal(
      companyId, 
      companyGoal.id, 
      domain, 
      supabase
    )
    
    // Check if task already exists
    const { data: existingTask } = await supabase
      .from('analysis_tasks')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('domain', domain)
      .eq('goal_id', domainGoal.id)
      .single()
    
    if (!existingTask || existingTask.status === 'failed') {
      // Create new analysis task
      const priority = getDomainPriority(domain)
      const { data: newTask } = await supabase
        .from('analysis_tasks')
        .insert({
          company_id: companyId,
          goal_id: domainGoal.id,
          domain,
          title: `Analyze ${domain} gaps and opportunities`,
          description: `Extract ${domain} facts from knowledge base and identify improvement areas`,
          priority,
          status: 'queued'
        })
        .select()
        .single()
      
      createdTasks.push(newTask)
      
      // Log action
      await logAction(supabase, {
        company_id: companyId,
        actor_type: 'agent',
        actor_name: 'Angus (Orchestrator)',
        action_type: 'task_created',
        target_type: 'analysis_tasks',
        target_id: newTask.id,
        message: `Created ${domain} analysis task`,
        metadata: { domain, priority }
      })
    }
  }
  
  // 6. Trigger domain agent heartbeats (via edge function calls)
  const triggeredAgents = []
  for (const domain of ['finance', 'sales', 'marketing', 'operations']) {
    // Start with top 4 domains only (to control costs)
    const agent = domainAgents.find(a => a.domain === domain)
    if (agent && agent.status !== 'paused') {
      console.log(`[Angus] Triggering ${domain} agent heartbeat`)
      
      // Call domain agent edge function
      const agentUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${domain}-agent`
      const response = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          companyId,
          action: 'heartbeat'
        })
      })
      
      triggeredAgents.push({
        domain,
        status: response.ok ? 'triggered' : 'failed',
        statusCode: response.status
      })
    }
  }
  
  console.log('[Angus] Heartbeat complete')
  
  return new Response(
    JSON.stringify({
      status: 'success',
      company: company.name,
      factsAvailable: ingestProgress.facts_extracted,
      tasksCreated: createdTasks.length,
      agentsTriggered: triggeredAgents,
      message: `Orchestration complete. ${triggeredAgents.length} domain agents triggered.`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Initialize all domain agents for a company
 */
async function initializeCompanyAgents(
  companyId: string,
  supabase: any
): Promise<Response> {
  console.log(`[Angus] Initializing agents for company ${companyId}`)
  
  // Create Angus (orchestrator) first
  const { data: angus } = await supabase
    .from('domain_agents')
    .insert({
      company_id: companyId,
      domain: 'orchestrator',
      name: 'Angus',
      role: 'orchestrator',
      title: 'Chief Operating Officer',
      capabilities: 'Coordinates all 8 domain agents, synthesizes insights, prioritizes recommendations',
      adapter_type: 'edge_function',
      adapter_config: {
        edgeFunctionName: 'angus-orchestrator',
        model: 'claude-3-5-sonnet-20241022'
      },
      budget_monthly_cents: 10000, // £100 for orchestrator
      status: 'idle'
    })
    .select()
    .single()
  
  // Domain agents with their configurations
  const domainConfigs = [
    {
      domain: 'finance',
      name: 'Sarah (CFO)',
      title: 'Chief Financial Officer',
      capabilities: 'Analyzes financial data, runway/burn calculations, cash flow gaps, pricing insights',
      budget: 5000 // £50
    },
    {
      domain: 'sales',
      name: 'David (VP Sales)',
      title: 'VP Sales',
      capabilities: 'Analyzes sales pipeline, conversion rates, deal velocity, customer segments',
      budget: 4000 // £40
    },
    {
      domain: 'marketing',
      name: 'Maya (CMO)',
      title: 'Chief Marketing Officer',
      capabilities: 'Analyzes CAC/LTV, channel performance, content gaps, brand positioning',
      budget: 3000 // £30
    },
    {
      domain: 'operations',
      name: 'Oliver (COO)',
      title: 'Chief Operating Officer',
      capabilities: 'Analyzes operational efficiency, process gaps, automation opportunities',
      budget: 3000 // £30
    },
    {
      domain: 'people',
      name: 'Priya (VP People)',
      title: 'VP People & Culture',
      capabilities: 'Analyzes team structure, hiring gaps, culture insights, compensation',
      budget: 2000 // £20
    },
    {
      domain: 'product',
      name: 'Paul (VP Product)',
      title: 'VP Product',
      capabilities: 'Analyzes product metrics, feature requests, user feedback, roadmap gaps',
      budget: 2000 // £20
    },
    {
      domain: 'legal',
      name: 'Laura (Legal)',
      title: 'General Counsel',
      capabilities: 'Analyzes contracts, compliance gaps, risk exposure, IP protection',
      budget: 1000 // £10
    },
    {
      domain: 'strategy',
      name: 'Stefan (Strategy)',
      title: 'VP Strategy',
      capabilities: 'Analyzes market position, competitive landscape, growth opportunities',
      budget: 1000 // £10
    }
  ]
  
  // Create all domain agents
  const agents = []
  for (const config of domainConfigs) {
    const { data: agent } = await supabase
      .from('domain_agents')
      .insert({
        company_id: companyId,
        domain: config.domain,
        name: config.name,
        role: 'analyst',
        title: config.title,
        capabilities: config.capabilities,
        reports_to_agent_id: angus.id,
        adapter_type: 'edge_function',
        adapter_config: {
          edgeFunctionName: `${config.domain}-agent`,
          model: 'claude-3-5-sonnet-20241022',
          promptTemplate: `${config.domain}_analysis_v1`
        },
        budget_monthly_cents: config.budget,
        status: 'idle'
      })
      .select()
      .single()
    
    agents.push(agent)
  }
  
  console.log(`[Angus] Created ${agents.length} domain agents`)
  
  return new Response(
    JSON.stringify({
      status: 'success',
      orchestrator: angus,
      domainAgents: agents,
      message: `Initialized Angus + ${agents.length} domain agents`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Synthesize all domain analyses into final recommendations
 */
async function synthesizeRecommendations(
  companyId: string,
  supabase: any,
  anthropic: Anthropic
): Promise<Response> {
  console.log(`[Angus] Synthesizing recommendations for company ${companyId}`)
  
  // Get all completed analysis tasks
  const { data: completedTasks } = await supabase
    .from('analysis_tasks')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'complete')
    .order('priority')
  
  if (!completedTasks || completedTasks.length === 0) {
    return new Response(
      JSON.stringify({
        status: 'waiting',
        message: 'No completed analyses to synthesize yet'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Get company goal
  const { data: companyGoal } = await supabase
    .from('transformation_goals')
    .select('*')
    .eq('company_id', companyId)
    .eq('level', 'company')
    .single()
  
  // Prepare synthesis prompt
  const domainSummaries = completedTasks.map(task => ({
    domain: task.domain,
    gaps: task.output?.gaps || [],
    recommendations: task.output?.recommendations || [],
    confidence: task.confidence_score
  }))
  
  const synthesisPrompt = `You are Angus, the Chief Operating Officer orchestrating business transformation.

Company Goal: ${companyGoal.title} - ${companyGoal.description}

Domain Analyses Completed:
${JSON.stringify(domainSummaries, null, 2)}

Your task:
1. Synthesize insights across all domains
2. Identify the TOP 5 highest-impact recommendations
3. Prioritize by ROI and implementation ease
4. For each recommendation, explain the cross-domain benefits

Format each recommendation:
{
  "title": "Deploy Nume for real-time financial insights",
  "domain": "finance",
  "impact": "HIGH",
  "cost_monthly": 5000,  // cents
  "estimated_annual_value": 240000,  // cents  
  "reasoning": "Finance identified 6-month runway visibility gap. Nume provides real-time dashboards. Benefits: Sales can see deal impact on runway, Marketing can optimize CAC with financial context.",
  "dependencies": ["xero_connected", "stripe_connected"],
  "implementation_days": 1
}

Focus on practical, high-ROI improvements that can be implemented quickly.`

  // Call Anthropic for synthesis
  const completion = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: synthesisPrompt }],
    temperature: 0.3
  })
  
  const synthesisText = completion.content[0].type === 'text' 
    ? completion.content[0].text 
    : ''
  
  // Parse recommendations
  const recommendationMatches = synthesisText.match(/\{[^}]+\}/g) || []
  const recommendations = recommendationMatches
    .map(match => {
      try {
        return JSON.parse(match)
      } catch {
        return null
      }
    })
    .filter(Boolean)
  
  // Create transformation goals for each recommendation
  const createdGoals = []
  for (const rec of recommendations) {
    // Find domain goal
    const { data: domainGoal } = await supabase
      .from('transformation_goals')
      .select('id')
      .eq('company_id', companyId)
      .eq('level', 'domain')
      .eq('owner_domain', rec.domain)
      .single()
    
    if (domainGoal) {
      const { data: actionGoal } = await supabase
        .from('transformation_goals')
        .insert({
          company_id: companyId,
          title: rec.title,
          description: rec.reasoning,
          level: 'action',
          parent_id: domainGoal.id,
          owner_domain: rec.domain,
          recommended_tool: rec.tool || 'manual',
          estimated_monthly_cost_cents: rec.cost_monthly || 0,
          estimated_annual_value_cents: rec.estimated_annual_value || 0,
          priority: createdGoals.length + 1,
          status: 'planned'
        })
        .select()
        .single()
      
      createdGoals.push(actionGoal)
    }
  }
  
  // Track synthesis cost
  await trackApiCost(supabase, {
    company_id: companyId,
    agent_domain: 'orchestrator',
    event_type: 'synthesis',
    model: 'claude-3-5-sonnet-20241022',
    cost_cents: 15 // ~$0.15 for synthesis
  })
  
  // Log completion
  await logAction(supabase, {
    company_id: companyId,
    actor_type: 'agent',
    actor_name: 'Angus (Orchestrator)',
    action_type: 'synthesis_complete',
    message: `Synthesized ${completedTasks.length} domain analyses into ${createdGoals.length} recommendations`,
    metadata: {
      domains_analyzed: completedTasks.length,
      recommendations_created: createdGoals.length,
      top_recommendation: recommendations[0]?.title
    }
  })
  
  console.log(`[Angus] Created ${createdGoals.length} recommendations`)
  
  return new Response(
    JSON.stringify({
      status: 'success',
      domainsAnalyzed: completedTasks.length,
      recommendationsCreated: createdGoals.length,
      topRecommendations: recommendations.slice(0, 5),
      message: `Synthesis complete. ${createdGoals.length} actionable recommendations created.`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper functions

async function getOrCreateCompanyGoal(companyId: string, companyName: string, supabase: any) {
  const { data: existing } = await supabase
    .from('transformation_goals')
    .select('*')
    .eq('company_id', companyId)
    .eq('level', 'company')
    .single()
  
  if (existing) return existing
  
  const { data: newGoal } = await supabase
    .from('transformation_goals')
    .insert({
      company_id: companyId,
      title: `Transform ${companyName} into an AI-native business`,
      description: 'Leverage AI tools and automation to run more efficiently, make data-driven decisions, and scale without proportional headcount growth',
      level: 'company',
      status: 'in_progress'
    })
    .select()
    .single()
  
  return newGoal
}

async function getOrCreateDomainGoal(companyId: string, parentId: string, domain: string, supabase: any) {
  const { data: existing } = await supabase
    .from('transformation_goals')
    .select('*')
    .eq('company_id', companyId)
    .eq('level', 'domain')
    .eq('owner_domain', domain)
    .single()
  
  if (existing) return existing
  
  const domainTitles = {
    finance: 'Optimize financial operations and insights',
    sales: 'Accelerate sales velocity and conversion',
    marketing: 'Improve marketing efficiency and ROI',
    operations: 'Streamline operations and reduce manual work',
    people: 'Build high-performance team and culture',
    product: 'Enhance product-market fit and user satisfaction',
    legal: 'Ensure compliance and minimize risk',
    strategy: 'Identify growth opportunities and competitive advantages'
  }
  
  const { data: newGoal } = await supabase
    .from('transformation_goals')
    .insert({
      company_id: companyId,
      title: domainTitles[domain] || `Analyze ${domain} domain`,
      level: 'domain',
      parent_id: parentId,
      owner_domain: domain,
      status: 'in_progress'
    })
    .select()
    .single()
  
  return newGoal
}

function getDomainPriority(domain: string): number {
  const priorities = {
    finance: 1,    // Always first - need to understand money
    sales: 2,      // Revenue generation
    marketing: 3,   // Customer acquisition
    operations: 4,  // Efficiency
    people: 5,      // Team building
    product: 6,     // Product improvements
    strategy: 7,    // Long-term planning
    legal: 8        // Compliance (unless critical)
  }
  return priorities[domain] || 5
}

async function trackApiCost(supabase: any, costEvent: any) {
  await supabase
    .from('api_cost_events')
    .insert(costEvent)
}

async function logAction(supabase: any, logEntry: any) {
  await supabase
    .from('transformation_log')
    .insert(logEntry)
}