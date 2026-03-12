# Paperclip Analysis: What We Can Learn for Founder Engine
## Deep Dive into Open-Source Agent Orchestration Architecture

**Date:** March 10, 2026  
**Analyzed:** https://github.com/paperclipai/paperclip (0.5k GitHub stars, active development)  
**Their Tagline:** "If OpenClaw is an employee, Paperclip is the company"

---

## Executive Summary: This is EXACTLY How We Want to Operate

**What They Built:**
Open-source control plane for orchestrating multiple AI agents into autonomous companies with org charts, budgets, goals, cost tracking, and governance.

**Why It's Relevant:**
We're building Angus orchestrator to manage 8 domain agents. Paperclip has already solved this problem at a more general level. Their architecture patterns are directly applicable.

**Key Insight:**
They don't build agents—they orchestrate them. Same philosophy as our "Build + Recommend" strategy from PM critique.

---

## Core Architecture (What We Should Copy)

### 1. Company as First-Order Object

**Their Model:**
```typescript
companies {
  id: uuid
  name: text
  description: text
  status: text (active/paused)
  budgetMonthlyCents: integer
  spentMonthlyCents: integer
  requireBoardApprovalForNewAgents: boolean
}
```

**For Founder Engine:**
```typescript
companies {
  id: uuid (already have this)
  name: text (already have this)
  
  // ADD THESE:
  monthly_transformation_budget: integer  // £20K one-time → ongoing budget
  spent_this_month: integer  // Track API costs (Anthropic, etc.)
  status: text  // active, paused, churned
  require_approval_for_new_domains: boolean  // Founder approves adding new domain agents
}
```

**Why:** Multi-company support from Day 1. Founder Engine needs to support 10-50 companies simultaneously, not just OYNB.

---

### 2. Agents = Employees (Org Chart)

**Their Model:**
```typescript
agents {
  id: uuid
  companyId: uuid  // Every agent belongs to a company
  name: text  // "Sarah (CFO)"
  role: text  // "CFO"
  title: text  // "Chief Financial Officer"
  status: text  // idle, working, paused
  reportsTo: uuid  // Org chart (CFO → CEO → null)
  capabilities: text  // What this agent does
  adapterType: text  // process, http, openClaw
  adapterConfig: jsonb  // How to run this agent
  budgetMonthlyCents: integer  // Per-agent budget
  spentMonthlyCents: integer  // Per-agent spend tracking
  lastHeartbeatAt: timestamp  // When agent last checked in
}
```

**For Founder Engine:**
```typescript
domain_agents {
  id: uuid
  company_id: uuid
  domain: text  // finance, sales, marketing, operations, people, product, legal, strategy
  status: text  // idle, analyzing, complete, paused
  reports_to: uuid  // All report to Angus (orchestrator)
  capabilities: text  // "Analyzes finance data, calculates runway/burn, identifies gaps"
  budget_monthly_cents: integer  // How much API cost this agent can use
  spent_monthly_cents: integer  // Actual spend (Anthropic API calls)
  last_run_at: timestamp  // When agent last analyzed
  
  // Paperclip-inspired fields:
  adapter_type: text  // "edge_function" (Supabase), "openClaw", "http"
  adapter_config: jsonb  // Edge function URL, prompt template, model settings
}
```

**Why:** 
- Treat each domain agent as an employee with budget, capabilities, reporting structure
- Track per-agent costs (Finance Agent might use more Opus calls than Marketing Agent)
- Org chart visualization (Angus at top, 8 domain agents reporting to him)

---

### 3. Goals = Hierarchical Task System

**Their Model:**
```typescript
goals {
  id: uuid
  companyId: uuid
  title: text  // "Build #1 AI note-taking app"
  description: text
  level: text  // company, department, task
  status: text  // planned, in_progress, complete
  parentId: uuid  // Hierarchical (task → department goal → company goal)
  ownerAgentId: uuid  // Which agent owns this goal
}
```

**For Founder Engine:**
```typescript
transformation_goals {
  id: uuid
  company_id: uuid
  title: text  // "Fix Finance gaps"
  description: text  // "You have 6 months runway, need real-time dashboard"
  level: text  // company (top), domain (Finance), action (deploy Nume)
  status: text  // planned, in_progress, complete, skipped
  parent_id: uuid  // "Deploy Nume" → "Fix Finance gaps" → "Become AI-native"
  owner_domain: text  // Which domain agent owns this (finance, sales, etc.)
  recommended_tool: text  // "Nume", "HappyRobot", "manual fix"
  estimated_cost: integer  // If tool adoption, what's the monthly cost
  estimated_value: integer  // ROI (£X saved, £Y revenue unlocked)
}
```

**Why:**
- Every recommendation traces back to company goal ("Become AI-native")
- Hierarchical: Company Goal → Domain Goals → Specific Actions
- Founder can see WHY we recommend Nume (traces back to "Fix Finance gaps" → "Become AI-native")

**Example Hierarchy:**
```
[Company Goal] Become AI-native business
  ├─ [Domain Goal] Fix Finance gaps (6 months runway, no dashboard)
  │   ├─ [Action] Deploy Nume ($50/month) → Real-time CFO insights
  │   └─ [Action] Set up cash flow alerts
  ├─ [Domain Goal] Fix Sales gaps (200 dormant accounts)
  │   ├─ [Action] Deploy HappyRobot ($200/month) → Reactivate accounts
  │   └─ [Action] Manual outreach to top 20
  └─ [Domain Goal] Fix Marketing gaps (CAC > LTV)
      ├─ [Action] Pause paid ads until CAC fixed
      └─ [Action] Focus on SEO (lower CAC)
```

---

### 4. Issues = Task Management (Jira for AI Agents)

**Their Model:**
```typescript
issues {
  id: uuid
  companyId: uuid
  projectId: uuid
  goalId: uuid  // Links to goal (why this task exists)
  parentId: uuid  // Subtask hierarchy
  title: text
  description: text
  status: text  // backlog, in_progress, done
  priority: text  // low, medium, high, critical
  assigneeAgentId: uuid  // Which agent is working on this
  checkoutRunId: uuid  // Which heartbeat run checked out this task
  executionLockedAt: timestamp  // Atomic task checkout (prevent double-work)
  startedAt: timestamp
  completedAt: timestamp
}
```

**For Founder Engine:**
```typescript
analysis_tasks {
  id: uuid
  company_id: uuid
  goal_id: uuid  // Links to transformation_goals
  domain: text  // Which domain agent should handle this
  title: text  // "Analyze Finance data for OYNB"
  description: text
  status: text  // queued, analyzing, complete, failed
  priority: text  // Angus prioritizes (Finance first, then Sales, etc.)
  assigned_to_agent: text  // Which domain agent is working on this
  locked_at: timestamp  // Atomic checkout (prevent Finance Agent running twice simultaneously)
  started_at: timestamp
  completed_at: timestamp
  output: jsonb  // Agent's analysis output (gaps found, recommendations made)
}
```

**Why:**
- Prevents double-work (Finance Agent doesn't analyze same company twice)
- Atomic task checkout (same pattern as Paperclip)
- Priority system (Angus decides which domain to analyze first)
- Output tracking (what did the agent find?)

---

### 5. Heartbeat-Based Execution

**Their Model:**
- Agents run on scheduled heartbeats (every X minutes/hours)
- Heartbeat = "Wake up, check for work, do it, go back to sleep"
- Prevents continuous execution (saves costs)
- Event-driven: task assignment triggers immediate heartbeat

**For Founder Engine:**
```typescript
domain_agent_heartbeats {
  id: uuid
  agent_id: uuid
  company_id: uuid
  status: text  // scheduled, running, complete, failed
  started_at: timestamp
  completed_at: timestamp
  duration_ms: integer
  cost_cents: integer  // API costs for this run
  tasks_completed: integer  // How many analysis_tasks finished
  output_summary: text  // "Analyzed Finance, found 3 gaps, recommended Nume"
}
```

**Schedule:**
- **INGEST phase:** Triggered by founder (connect tools, upload folder)
- **DIAGNOSE phase:** Angus schedules domain agents (Finance first, then Sales, etc.)
- **DEPLOY phase:** Generate recommendations, present to founder

**Why:**
- Cost control (agents don't run 24/7, only when needed)
- Predictable execution (INGEST → DIAGNOSE → DEPLOY flow)
- Audit trail (every heartbeat logged with cost, duration, output)

---

### 6. Budget Tracking & Hard Stops

**Their Model:**
```typescript
// Per-company budget
companies.budgetMonthlyCents = 100000  // $1,000/month
companies.spentMonthlyCents = 87500  // $875 spent

// Per-agent budget
agents.budgetMonthlyCents = 20000  // $200/month for this agent
agents.spentMonthlyCents = 18000  // $180 spent

// Hard stop when budget hit
if (agent.spentMonthlyCents >= agent.budgetMonthlyCents) {
  agent.status = "paused"  // Agent stops working
  await sendAlert("Agent paused: budget exceeded")
}
```

**For Founder Engine:**
```typescript
// Per-company budget (£20K transformation = max API budget)
companies.transformation_budget_cents = 2000000  // £20K
companies.spent_this_engagement_cents = 500  // £5 spent (Anthropic API)

// Per-domain budget (Finance Agent can use more than Marketing Agent)
domain_agents.budget_cents = 200  // £2 max for this domain
domain_agents.spent_cents = 150  // £1.50 spent

// Hard stop
if (company.spent_this_engagement_cents >= company.transformation_budget_cents) {
  await pauseAllAgents(companyId)
  await sendAlert("Budget exceeded: £20K transformation cap hit")
}
```

**Why:**
- Prevents runaway costs (Opus extractions can get expensive)
- Per-domain fairness (Finance gets more budget, Legal gets less)
- Founder sees real-time cost tracking
- Hard stop at £20K (never exceed engagement price)

**Pricing Model with Budgets:**
- Engagement price: £20K
- API budget: £100-500 (0.5-2.5% of revenue)
- Margin: 97.5-99.5%
- Hard stop at budget cap

---

### 7. Activity Logging & Audit Trail

**Their Model:**
```typescript
activity_log {
  id: uuid
  companyId: uuid
  actorType: text  // agent, user, system
  actorId: uuid
  actionType: text  // task_created, agent_paused, budget_exceeded
  targetType: text  // issue, agent, goal
  targetId: uuid
  metadata: jsonb  // Detailed context
  createdAt: timestamp
}
```

**For Founder Engine:**
```typescript
transformation_log {
  id: uuid
  company_id: uuid
  actor_type: text  // agent (Angus, Finance Agent), user (founder), system
  actor_id: uuid
  action_type: text  // ingestion_started, facts_extracted, gaps_found, recommendation_made
  target_type: text  // knowledge_elements, analysis_tasks, transformation_goals
  target_id: uuid
  metadata: jsonb  // {domain: "finance", facts_count: 45, confidence_avg: 0.87}
  created_at: timestamp
}
```

**Why:**
- Founder sees full audit trail ("What did you analyze? What did you find?")
- Debugging (if Finance Agent fails, see exact error in log)
- Compliance (SOC-2 requires immutable audit log)
- Trust (founder can verify every action taken)

---

### 8. Cost Tracking (Per-Event)

**Their Model:**
```typescript
cost_events {
  id: uuid
  companyId: uuid
  agentId: uuid
  eventType: text  // llm_call, tool_execution
  provider: text  // anthropic, openai
  model: text  // claude-opus-4, gpt-4
  tokens: integer
  costCents: integer
  metadata: jsonb
  occurredAt: timestamp
}
```

**For Founder Engine:**
```typescript
api_cost_events {
  id: uuid
  company_id: uuid
  agent_domain: text  // finance, sales, marketing
  event_type: text  // haiku_relevance, opus_extraction, opus_analysis
  provider: text  // anthropic
  model: text  // claude-haiku-4, claude-opus-4
  tokens: integer
  cost_cents: integer  // 0.03 cents (Haiku), 1.5 cents (Opus)
  file_name: text  // "Q4 2023 Financials.pdf"
  facts_extracted: integer  // If extraction, how many facts
  occurred_at: timestamp
}
```

**Why:**
- Real-time cost tracking (founder sees "$0.50 spent so far")
- Per-domain attribution (Finance Agent cost more than Legal Agent)
- Debugging (if cost spikes, see which file caused it)
- Optimization (if Haiku filter is too loose, adjust threshold)

**Dashboard Display:**
```
Ingestion Progress
──────────────────
Files scanned: 45/50
Facts extracted: 127
Cost so far: $2.34 / $10.00 budget

Breakdown:
- Haiku relevance checks: $0.27 (90 files)
- Opus fact extraction: $2.07 (27 files)
```

---

## Patterns We Should Adopt

### Pattern 1: Atomic Task Checkout

**Problem:** Finance Agent shouldn't analyze same company twice simultaneously

**Paperclip Solution:**
```typescript
// Atomic checkout (SQL transaction)
const task = await db.transaction(async (tx) => {
  const task = await tx
    .update(issues)
    .set({ 
      status: 'in_progress',
      assigneeAgentId: agentId,
      executionLockedAt: new Date(),
      checkoutRunId: heartbeatRunId
    })
    .where(
      and(
        eq(issues.companyId, companyId),
        eq(issues.status, 'queued'),
        isNull(issues.executionLockedAt)
      )
    )
    .returning()
    .limit(1)
  
  return task[0]
})

if (!task) {
  return "No work available"
}
```

**For Founder Engine:**
```typescript
// Finance Agent heartbeat
const analysisTask = await checkoutNextTask('finance', companyId)
if (!analysisTask) return "No work"

await runFinanceAnalysis(analysisTask)
await markTaskComplete(analysisTask.id)
```

---

### Pattern 2: Goal Ancestry (Why Am I Doing This?)

**Problem:** Founder doesn't understand why we recommend Nume

**Paperclip Solution:**
Every task carries full goal ancestry:
```
Task: Deploy Nume
  → Parent: Fix Finance gaps (6 months runway, no dashboard)
    → Parent: Become AI-native business
      → Parent: Company mission ("Run business efficiently")
```

**For Founder Engine:**
```typescript
async function getGoalAncestry(goalId) {
  const goals = []
  let currentGoal = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  
  while (currentGoal) {
    goals.push(currentGoal)
    if (!currentGoal.parentId) break
    currentGoal = await db.query.goals.findFirst({ where: eq(goals.id, currentGoal.parentId) })
  }
  
  return goals  // [Task, Domain Goal, Company Goal]
}
```

**UI Display:**
```
Recommendation: Deploy Nume ($50/month)

Why?
└─ Fix Finance gaps
   └─ You have 6 months runway and no real-time visibility
      └─ Become AI-native business
         └─ Run business efficiently with AI assistance
```

---

### Pattern 3: Agent Config Revisions

**Problem:** We change Finance Agent prompt, breaks something, need to roll back

**Paperclip Solution:**
```typescript
agent_config_revisions {
  id: uuid
  agentId: uuid
  revisionNumber: integer
  adapterConfig: jsonb  // Snapshot of config at this revision
  changedBy: text  // user or agent
  changeDescription: text
  createdAt: timestamp
}

// Every config change creates new revision
await db.insert(agent_config_revisions).values({
  agentId,
  revisionNumber: currentRevision + 1,
  adapterConfig: newConfig,
  changedBy: 'user',
  changeDescription: 'Updated Finance Agent prompt to use Opus instead of Sonnet'
})

// Rollback = set agent.adapterConfig to old revision
await rollbackToRevision(agentId, revisionNumber)
```

**For Founder Engine:**
```typescript
domain_agent_config_revisions {
  id: uuid
  domain: text  // finance, sales, etc.
  revision_number: integer
  prompt_template: text  // Agent's extraction/analysis prompt
  model: text  // claude-opus-4, claude-sonnet-4
  changed_by: text
  change_description: text
  created_at: timestamp
}
```

**Why:** Safe experimentation. If new Finance Agent prompt produces worse results, roll back to previous version.

---

### Pattern 4: Approval Gates for Governed Actions

**Problem:** Founder wants to approve before we send £20K invoice to customer

**Paperclip Solution:**
```typescript
approvals {
  id: uuid
  companyId: uuid
  requestType: text  // hire_agent, spend_over_threshold, deploy_to_production
  requesterId: uuid  // Which agent requested approval
  status: text  // pending, approved, rejected
  metadata: jsonb  // Details of request
  approvedBy: text  // Board member who approved
  createdAt: timestamp
}

// Agent requests approval
const approval = await db.insert(approvals).values({
  companyId,
  requestType: 'hire_agent',
  requesterId: agentId,
  status: 'pending',
  metadata: { agentName: 'New Marketing Agent', estimatedCostMonthly: 5000 }
})

// Block until approved
await waitForApproval(approval.id)
```

**For Founder Engine:**
```typescript
founder_approvals {
  id: uuid
  company_id: uuid
  approval_type: text  // add_new_domain, exceed_budget, send_invoice
  requested_by: text  // angus, finance_agent, system
  status: text  // pending, approved, rejected
  metadata: jsonb
  approved_by_founder: boolean
  approved_at: timestamp
}

// Example: Angus wants to add Product domain agent mid-engagement
const approval = await requestApproval({
  companyId,
  approvalType: 'add_new_domain',
  requestedBy: 'angus',
  metadata: { domain: 'product', reason: 'Founder has software product, need Product Agent to analyze adoption' }
})

await notifyFounder(approval)  // Email/Slack: "Approve adding Product domain?"
```

---

## Database Schema Changes for Founder Engine

### Tables to Add (Inspired by Paperclip)

**1. domain_agents (Replaces our edge function approach)**
```sql
CREATE TABLE domain_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  domain TEXT NOT NULL,  -- finance, sales, marketing, operations, people, product, legal, strategy
  status TEXT NOT NULL DEFAULT 'idle',  -- idle, analyzing, complete, paused
  reports_to_agent_id UUID,  -- All report to Angus (orchestrator)
  capabilities TEXT,  -- What this agent does
  adapter_type TEXT NOT NULL DEFAULT 'edge_function',  -- edge_function, openClaw, http
  adapter_config JSONB NOT NULL DEFAULT '{}',  -- Edge function URL, prompt, model
  budget_monthly_cents INTEGER NOT NULL DEFAULT 200,  -- £2 per domain per month
  spent_monthly_cents INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domain_agents_company ON domain_agents(company_id);
CREATE INDEX idx_domain_agents_status ON domain_agents(company_id, status);
```

**2. transformation_goals (Hierarchical goal system)**
```sql
CREATE TABLE transformation_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'action',  -- company, domain, action
  status TEXT NOT NULL DEFAULT 'planned',  -- planned, in_progress, complete, skipped
  parent_id UUID REFERENCES transformation_goals(id),
  owner_domain TEXT,  -- Which domain owns this goal
  recommended_tool TEXT,  -- Nume, HappyRobot, manual, etc.
  estimated_monthly_cost_cents INTEGER,  -- Tool subscription cost
  estimated_annual_value_cents INTEGER,  -- ROI (revenue unlocked, cost saved)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transformation_goals_company ON transformation_goals(company_id);
CREATE INDEX idx_transformation_goals_parent ON transformation_goals(parent_id);
```

**3. analysis_tasks (Jira for domain agents)**
```sql
CREATE TABLE analysis_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  goal_id UUID REFERENCES transformation_goals(id),
  domain TEXT NOT NULL,  -- Which domain agent handles this
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'queued',  -- queued, analyzing, complete, failed
  priority INTEGER NOT NULL DEFAULT 5,  -- 1 (highest) to 10 (lowest)
  assigned_to_agent_id UUID REFERENCES domain_agents(id),
  locked_at TIMESTAMPTZ,  -- Atomic checkout (prevent double-work)
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output JSONB,  -- Agent's analysis results
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_tasks_company_status ON analysis_tasks(company_id, status);
CREATE INDEX idx_analysis_tasks_domain ON analysis_tasks(domain, status);
```

**4. api_cost_events (Per-call cost tracking)**
```sql
CREATE TABLE api_cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  agent_domain TEXT,  -- finance, sales, etc.
  event_type TEXT NOT NULL,  -- haiku_relevance, opus_extraction, opus_analysis
  provider TEXT NOT NULL DEFAULT 'anthropic',
  model TEXT NOT NULL,  -- claude-haiku-4, claude-opus-4
  tokens INTEGER,
  cost_cents INTEGER NOT NULL,  -- 0.03 cents (Haiku), 1.5 cents (Opus)
  file_name TEXT,  -- Which file triggered this cost
  facts_extracted INTEGER,  -- If extraction, how many facts
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_cost_events_company ON api_cost_events(company_id);
CREATE INDEX idx_api_cost_events_domain ON api_cost_events(agent_domain);
CREATE INDEX idx_api_cost_events_occurred ON api_cost_events(occurred_at);
```

**5. transformation_log (Audit trail)**
```sql
CREATE TABLE transformation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  actor_type TEXT NOT NULL,  -- agent, user, system
  actor_id UUID,
  action_type TEXT NOT NULL,  -- ingestion_started, facts_extracted, gaps_found, recommendation_made
  target_type TEXT,  -- knowledge_elements, analysis_tasks, transformation_goals
  target_id UUID,
  metadata JSONB,  -- Detailed context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transformation_log_company ON transformation_log(company_id);
CREATE INDEX idx_transformation_log_created ON transformation_log(created_at);
```

**6. Add to companies table:**
```sql
ALTER TABLE companies
ADD COLUMN transformation_budget_cents INTEGER DEFAULT 2000000,  -- £20K
ADD COLUMN spent_this_engagement_cents INTEGER DEFAULT 0,
ADD COLUMN status TEXT DEFAULT 'active',
ADD COLUMN require_approval_for_new_domains BOOLEAN DEFAULT true;
```

---

## Immediate Action Items (What to Do This Week)

### 1. Database Schema Updates
- Run migrations above
- Add domain_agents, transformation_goals, analysis_tasks, api_cost_events, transformation_log
- Update companies table

### 2. Angus Orchestrator (Build Paperclip-Style)
```typescript
// supabase/functions/angus-orchestrator/index.ts

export async function runAngusHeartbeat(companyId: string) {
  // 1. Check if INGEST complete
  const ingestStatus = await getIngestionProgress(companyId)
  if (ingestStatus !== 'complete') return
  
  // 2. Create domain analysis tasks (hierarchical goals)
  await createTransformationGoal({
    companyId,
    title: 'Become AI-native business',
    level: 'company',
    status: 'in_progress'
  })
  
  // Create domain-level goals
  for (const domain of ['finance', 'sales', 'marketing', 'operations']) {
    const domainGoal = await createTransformationGoal({
      companyId,
      title: `Analyze ${domain} domain`,
      level: 'domain',
      parentId: companyGoal.id,
      ownerDomain: domain
    })
    
    // Create analysis task for domain agent
    await createAnalysisTask({
      companyId,
      goalId: domainGoal.id,
      domain,
      title: `Analyze ${domain} gaps`,
      priority: domainPriority(domain)  // Finance = 1, Legal = 8
    })
  }
  
  // 3. Trigger domain agent heartbeats
  await triggerDomainAgents(companyId)
}
```

### 3. Domain Agent Pattern
```typescript
// supabase/functions/finance-agent/index.ts

export async function financeAgentHeartbeat(companyId: string) {
  // 1. Atomic task checkout
  const task = await checkoutNextTask('finance', companyId)
  if (!task) return "No work"
  
  // 2. Get knowledge base facts for Finance domain
  const facts = await db
    .select()
    .from(knowledge_elements)
    .where(
      and(
        eq(knowledge_elements.company_id, companyId),
        eq(knowledge_elements.domain, 'finance')
      )
    )
  
  // 3. Analyze gaps (Opus call)
  const costBefore = await getSpentThisMonth(companyId)
  const gaps = await analyzeFinanceGaps(facts)  // Opus API call
  const costAfter = await getSpentThisMonth(companyId)
  
  // 4. Track cost
  await trackCost({
    companyId,
    agentDomain: 'finance',
    eventType: 'opus_analysis',
    model: 'claude-opus-4',
    costCents: costAfter - costBefore
  })
  
  // 5. Create recommendations (transformation goals)
  for (const gap of gaps) {
    await createTransformationGoal({
      companyId,
      title: gap.recommendation,
      level: 'action',
      parentId: task.goalId,
      ownerDomain: 'finance',
      recommendedTool: gap.tool,  // "Nume"
      estimatedMonthlyCostCents: gap.toolCost,
      estimatedAnnualValueCents: gap.estimatedValue
    })
  }
  
  // 6. Mark task complete
  await markTaskComplete(task.id, { gaps, recommendations: gaps.length })
}
```

---

## What This Unlocks

**1. Multi-Company Support**
- One Founder Engine instance serves 10-50 companies simultaneously
- Each company isolated (can't see others' data)
- Org chart per company (8 domain agents + Angus)

**2. Cost Control**
- Per-company budget (£20K transformation = max £500 API budget)
- Per-domain budget (Finance gets £50, Legal gets £10)
- Hard stop when budget exceeded
- Real-time cost dashboard

**3. Hierarchical Goals**
- Every recommendation traces back to company goal
- Founder sees "why" not just "what"
- Goal ancestry: Action → Domain Goal → Company Goal

**4. Audit Trail**
- Every action logged (ingestion, analysis, recommendation)
- Founder can see full history
- Compliance-ready (SOC-2 requires immutable logs)

**5. Scalable Architecture**
- Add new domains easily (just create domain_agent record)
- Add new companies easily (company-scoped everything)
- Add new recommendations easily (transformation_goals hierarchy)

---

## Recommendation: Adopt Paperclip Patterns Immediately

**Week 1 (This Week):**
- Add database tables (domain_agents, transformation_goals, analysis_tasks, api_cost_events)
- Build Angus orchestrator using Paperclip heartbeat pattern
- Build Finance Agent using atomic task checkout

**Week 2:**
- Build remaining 7 domain agents (Sales, Marketing, Operations, People, Product, Legal, Strategy)
- Add cost tracking to every API call
- Build goal ancestry UI (show "why" for each recommendation)

**Week 3:**
- Build DEPLOY UI (show hierarchical goals with recommendations)
- Add approval gates (founder approves recommendations)
- Test with OYNB

**Week 4:**
- Richard pilot with full Paperclip-style orchestration
- Show him org chart (Angus + 8 domain agents)
- Show him goal ancestry (why we recommend each tool)

---

## Files to Reference

**Paperclip GitHub:** https://github.com/paperclipai/paperclip
**Key Files:**
- `doc/PRODUCT.md` - Product philosophy
- `packages/db/src/schema/companies.ts` - Company model
- `packages/db/src/schema/agents.ts` - Agent model
- `packages/db/src/schema/goals.ts` - Goal hierarchy
- `packages/db/src/schema/issues.ts` - Task management

**For Founder Engine:**
Clone their repo to `/tmp/paperclip` and study their patterns. Copy what works, adapt to our domain (business intelligence vs autonomous companies).

---

## Bottom Line

**Paperclip = Exactly How We Want to Operate**

They've solved:
- Multi-company orchestration ✅
- Hierarchical goal system ✅
- Cost tracking & budgets ✅
- Atomic task checkout ✅
- Audit trails ✅
- Heartbeat-based execution ✅

**We should:**
1. Copy their database schema patterns
2. Build Angus orchestrator using their heartbeat model
3. Add cost tracking per API call
4. Add hierarchical goals (every recommendation has "why")
5. Add audit logging (every action tracked)

**This gives us:**
- Professional architecture (not ad-hoc scripts)
- Multi-company support from Day 1
- Cost control (no runaway spend)
- Founder trust (full transparency via logs)
- Scalability (easy to add domains, companies, features)

**Time investment:** 2-3 days to refactor current code to Paperclip patterns
**ROI:** 10x better architecture, ready for 10-50 companies, audit-ready, cost-controlled

**Do it.** 🦾
