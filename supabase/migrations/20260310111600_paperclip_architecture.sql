-- Paperclip-Inspired Architecture for Founder Engine
-- Multi-company orchestration with domain agents, hierarchical goals, and cost tracking

-- ==================================================
-- 1. COMPANIES TABLE UPDATES
-- ==================================================

-- Add Paperclip-style company management fields
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS transformation_budget_cents INTEGER DEFAULT 2000000, -- £20K default
ADD COLUMN IF NOT EXISTS spent_this_engagement_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active', -- active, paused, churned
ADD COLUMN IF NOT EXISTS require_approval_for_new_domains BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS monthly_cost_limit_cents INTEGER DEFAULT 50000; -- £500 max API costs

COMMENT ON COLUMN companies.transformation_budget_cents IS 'Max spend for engagement (£20K = 2,000,000 cents)';
COMMENT ON COLUMN companies.spent_this_engagement_cents IS 'Actual spend so far (API costs)';
COMMENT ON COLUMN companies.status IS 'active, paused (budget exceeded), churned';
COMMENT ON COLUMN companies.require_approval_for_new_domains IS 'Founder must approve adding new domain agents';

-- ==================================================
-- 2. DOMAIN AGENTS (Employees in Org Chart)
-- ==================================================

CREATE TABLE IF NOT EXISTS domain_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identity
  domain TEXT NOT NULL, -- finance, sales, marketing, operations, people, product, legal, strategy
  name TEXT NOT NULL, -- "Sarah (CFO)", "David (VP Sales)"
  role TEXT NOT NULL DEFAULT 'analyst', -- analyst, advisor, orchestrator
  title TEXT, -- "Chief Financial Officer"
  capabilities TEXT, -- What this agent does
  
  -- Org Chart
  reports_to_agent_id UUID REFERENCES domain_agents(id), -- All domain agents report to Angus (orchestrator)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'idle', -- idle, analyzing, complete, paused
  
  -- Adapter Config (how to run this agent)
  adapter_type TEXT NOT NULL DEFAULT 'edge_function', -- edge_function, openClaw, http
  adapter_config JSONB NOT NULL DEFAULT '{}', -- { edgeFunctionUrl, promptTemplate, model }
  
  -- Budget & Cost Tracking
  budget_monthly_cents INTEGER NOT NULL DEFAULT 200, -- £2 per domain per month
  spent_monthly_cents INTEGER NOT NULL DEFAULT 0,
  budget_per_analysis_cents INTEGER NOT NULL DEFAULT 50, -- £0.50 per analysis run
  
  -- Activity Tracking
  last_run_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,
  total_analyses_completed INTEGER DEFAULT 0,
  total_facts_extracted INTEGER DEFAULT 0,
  average_confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domain_agents_company ON domain_agents(company_id);
CREATE INDEX idx_domain_agents_status ON domain_agents(company_id, status);
CREATE INDEX idx_domain_agents_domain ON domain_agents(company_id, domain);

COMMENT ON TABLE domain_agents IS 'Domain agents (Finance, Sales, etc.) = employees in org chart';
COMMENT ON COLUMN domain_agents.adapter_type IS 'How to run: edge_function (Supabase), openClaw, http webhook';

-- ==================================================
-- 3. TRANSFORMATION GOALS (Hierarchical Task System)
-- ==================================================

CREATE TABLE IF NOT EXISTS transformation_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Goal Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchy
  level TEXT NOT NULL DEFAULT 'action', -- company, domain, action
  parent_id UUID REFERENCES transformation_goals(id), -- Links to parent goal
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  
  -- Ownership
  owner_domain TEXT, -- Which domain agent owns this (finance, sales, etc.)
  owner_agent_id UUID REFERENCES domain_agents(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, complete, skipped
  
  -- Recommendations
  recommended_tool TEXT, -- "Nume", "HappyRobot", "manual", "internal"
  recommended_action TEXT, -- "Deploy tool", "Manual fix", "Process change"
  estimated_monthly_cost_cents INTEGER, -- Tool subscription cost
  estimated_annual_value_cents INTEGER, -- ROI (revenue unlocked, cost saved)
  
  -- Tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  skipped_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transformation_goals_company ON transformation_goals(company_id);
CREATE INDEX idx_transformation_goals_parent ON transformation_goals(parent_id);
CREATE INDEX idx_transformation_goals_status ON transformation_goals(company_id, status);
CREATE INDEX idx_transformation_goals_level ON transformation_goals(company_id, level);

COMMENT ON TABLE transformation_goals IS 'Hierarchical goals: Company Goal → Domain Goals → Actions';
COMMENT ON COLUMN transformation_goals.level IS 'company (top), domain (Finance), action (Deploy Nume)';

-- ==================================================
-- 4. ANALYSIS TASKS (Jira for AI Agents)
-- ==================================================

CREATE TABLE IF NOT EXISTS analysis_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES transformation_goals(id), -- Links to goal (why this task exists)
  
  -- Task Content
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL, -- Which domain agent handles this
  
  -- Priority & Status
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  status TEXT NOT NULL DEFAULT 'queued', -- queued, analyzing, complete, failed
  
  -- Assignment
  assigned_to_agent_id UUID REFERENCES domain_agents(id),
  
  -- Atomic Checkout (prevent double-work)
  locked_at TIMESTAMPTZ, -- When task was checked out
  locked_by_agent_id UUID REFERENCES domain_agents(id),
  
  -- Execution Tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Output
  output JSONB, -- Agent's analysis results { gaps: [], recommendations: [] }
  facts_extracted INTEGER DEFAULT 0,
  gaps_identified INTEGER DEFAULT 0,
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  
  -- Cost Tracking
  cost_cents INTEGER DEFAULT 0, -- API costs for this task
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_tasks_company_status ON analysis_tasks(company_id, status);
CREATE INDEX idx_analysis_tasks_domain ON analysis_tasks(domain, status);
CREATE INDEX idx_analysis_tasks_locked ON analysis_tasks(locked_at) WHERE locked_at IS NOT NULL;

COMMENT ON TABLE analysis_tasks IS 'Tasks for domain agents to analyze (like Jira for AI)';
COMMENT ON COLUMN analysis_tasks.locked_at IS 'Atomic checkout: prevents Finance Agent running twice simultaneously';

-- ==================================================
-- 5. API COST EVENTS (Per-Call Tracking)
-- ==================================================

CREATE TABLE IF NOT EXISTS api_cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_domain TEXT, -- finance, sales, marketing, etc.
  agent_id UUID REFERENCES domain_agents(id),
  task_id UUID REFERENCES analysis_tasks(id),
  
  -- Event Details
  event_type TEXT NOT NULL, -- haiku_relevance, opus_extraction, opus_analysis
  provider TEXT NOT NULL DEFAULT 'anthropic',
  model TEXT NOT NULL, -- claude-haiku-4, claude-opus-4
  
  -- Usage
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,
  cost_cents INTEGER NOT NULL, -- 0.03 cents (Haiku), 1.5 cents (Opus)
  
  -- Context
  file_name TEXT, -- Which file triggered this cost (for ingestion)
  facts_extracted INTEGER, -- If extraction, how many facts
  
  -- Timestamp
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_cost_events_company ON api_cost_events(company_id);
CREATE INDEX idx_api_cost_events_domain ON api_cost_events(agent_domain);
CREATE INDEX idx_api_cost_events_occurred ON api_cost_events(occurred_at);
CREATE INDEX idx_api_cost_events_company_occurred ON api_cost_events(company_id, occurred_at);

COMMENT ON TABLE api_cost_events IS 'Track every Anthropic API call with cost';

-- ==================================================
-- 6. TRANSFORMATION LOG (Audit Trail)
-- ==================================================

CREATE TABLE IF NOT EXISTS transformation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Actor (who did this?)
  actor_type TEXT NOT NULL, -- agent, user, system
  actor_id UUID, -- Agent ID or user ID
  actor_name TEXT, -- "Finance Agent", "Ruari", "System Cron"
  
  -- Action (what happened?)
  action_type TEXT NOT NULL, -- ingestion_started, facts_extracted, gaps_found, recommendation_made, budget_exceeded, agent_paused
  
  -- Target (what was affected?)
  target_type TEXT, -- knowledge_elements, analysis_tasks, transformation_goals, domain_agents
  target_id UUID,
  
  -- Details
  metadata JSONB, -- {domain: "finance", facts_count: 45, confidence_avg: 0.87}
  message TEXT, -- Human-readable message
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transformation_log_company ON transformation_log(company_id);
CREATE INDEX idx_transformation_log_created ON transformation_log(created_at);
CREATE INDEX idx_transformation_log_actor ON transformation_log(actor_type, actor_id);
CREATE INDEX idx_transformation_log_action ON transformation_log(action_type);

COMMENT ON TABLE transformation_log IS 'Immutable audit trail (SOC-2 ready)';

-- ==================================================
-- 7. DOMAIN AGENT HEARTBEATS (Execution Log)
-- ==================================================

CREATE TABLE IF NOT EXISTS domain_agent_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES domain_agents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, running, complete, failed
  
  -- Execution
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- How long this heartbeat took
  
  -- Results
  tasks_completed INTEGER DEFAULT 0, -- How many analysis_tasks finished
  facts_extracted INTEGER DEFAULT 0,
  gaps_identified INTEGER DEFAULT 0,
  recommendations_made INTEGER DEFAULT 0,
  
  -- Cost
  cost_cents INTEGER DEFAULT 0, -- API costs for this heartbeat
  
  -- Output
  output_summary TEXT, -- "Analyzed Finance, found 3 gaps, recommended Nume"
  error_message TEXT, -- If failed, why?
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domain_agent_heartbeats_agent ON domain_agent_heartbeats(agent_id);
CREATE INDEX idx_domain_agent_heartbeats_company ON domain_agent_heartbeats(company_id);
CREATE INDEX idx_domain_agent_heartbeats_status ON domain_agent_heartbeats(status);

COMMENT ON TABLE domain_agent_heartbeats IS 'Log of every domain agent execution (heartbeat pattern)';

-- ==================================================
-- 8. AUTO-UPDATE TRIGGERS
-- ==================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domain_agents_updated_at BEFORE UPDATE ON domain_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER transformation_goals_updated_at BEFORE UPDATE ON transformation_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER analysis_tasks_updated_at BEFORE UPDATE ON analysis_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update company spend when api_cost_events inserted
CREATE OR REPLACE FUNCTION update_company_spend()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companies
  SET spent_this_engagement_cents = spent_this_engagement_cents + NEW.cost_cents
  WHERE id = NEW.company_id;
  
  -- Auto-pause if budget exceeded
  UPDATE companies
  SET status = 'paused'
  WHERE id = NEW.company_id
  AND spent_this_engagement_cents >= transformation_budget_cents
  AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_spend_on_cost AFTER INSERT ON api_cost_events
  FOR EACH ROW EXECUTE FUNCTION update_company_spend();

-- Auto-update domain agent spend when api_cost_events inserted
CREATE OR REPLACE FUNCTION update_agent_spend()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL THEN
    UPDATE domain_agents
    SET spent_monthly_cents = spent_monthly_cents + NEW.cost_cents
    WHERE id = NEW.agent_id;
    
    -- Auto-pause agent if budget exceeded
    UPDATE domain_agents
    SET status = 'paused'
    WHERE id = NEW.agent_id
    AND spent_monthly_cents >= budget_monthly_cents
    AND status != 'paused';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_spend_on_cost AFTER INSERT ON api_cost_events
  FOR EACH ROW EXECUTE FUNCTION update_agent_spend();

-- ==================================================
-- 9. PERMISSIONS (RLS)
-- ==================================================

-- Enable RLS on new tables
ALTER TABLE domain_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_agent_heartbeats ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their company's data
CREATE POLICY domain_agents_read ON domain_agents FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY transformation_goals_read ON transformation_goals FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY analysis_tasks_read ON analysis_tasks FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY api_cost_events_read ON api_cost_events FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY transformation_log_read ON transformation_log FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY domain_agent_heartbeats_read ON domain_agent_heartbeats FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Service role can do everything (for edge functions)
CREATE POLICY domain_agents_service ON domain_agents FOR ALL TO service_role USING (true);
CREATE POLICY transformation_goals_service ON transformation_goals FOR ALL TO service_role USING (true);
CREATE POLICY analysis_tasks_service ON analysis_tasks FOR ALL TO service_role USING (true);
CREATE POLICY api_cost_events_service ON api_cost_events FOR ALL TO service_role USING (true);
CREATE POLICY transformation_log_service ON transformation_log FOR ALL TO service_role USING (true);
CREATE POLICY domain_agent_heartbeats_service ON domain_agent_heartbeats FOR ALL TO service_role USING (true);

-- ==================================================
-- 10. INITIAL DATA (Create Angus Orchestrator)
-- ==================================================

-- This will be inserted per-company when they sign up
-- Example for OYNB (4e0cce04-ed81-4e60-aa32-15aae72c6bf5):

-- INSERT INTO domain_agents (company_id, domain, name, role, title, capabilities, reports_to_agent_id, adapter_type)
-- VALUES 
--   ('4e0cce04-ed81-4e60-aa32-15aae72c6bf5', 'orchestrator', 'Angus', 'orchestrator', 'Chief Operating Officer', 
--    'Coordinates all 8 domain agents, synthesizes insights, prioritizes recommendations', NULL, 'edge_function'),
--   
--   ('4e0cce04-ed81-4e60-aa32-15aae72c6bf5', 'finance', 'Sarah (CFO)', 'analyst', 'Chief Financial Officer',
--    'Analyzes financial data, calculates runway/burn, identifies finance gaps', 
--    (SELECT id FROM domain_agents WHERE domain = 'orchestrator' AND company_id = '4e0cce04-ed81-4e60-aa32-15aae72c6bf5'), 
--    'edge_function');
--   ... (more agents)

COMMENT ON COLUMN domain_agents.domain IS 'orchestrator, finance, sales, marketing, operations, people, product, legal, strategy';
