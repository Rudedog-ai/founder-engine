-- Two-pass ingestion tables
-- Stores structured facts (not text chunks) + ingestion progress

-- knowledge_elements: Structured facts extracted from docs
CREATE TABLE IF NOT EXISTS knowledge_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Classification
  domain TEXT NOT NULL, -- finance, sales, marketing, operations, people, product, legal, strategy
  fact_type TEXT NOT NULL, -- revenue, lost_deal, churn_reason, bottleneck, etc.
  
  -- Content
  entity TEXT, -- Company/person/tool name (e.g., "Acme Corp", "Sarah", "Slack")
  value NUMERIC, -- Numerical value if applicable (e.g., 180000 for £180K ARR)
  text TEXT NOT NULL, -- Human-readable fact (e.g., "Lost Acme Corp deal ($25K) due to missing Slack integration")
  confidence NUMERIC NOT NULL, -- 0.0-1.0 confidence score
  
  -- Source tracking
  source TEXT NOT NULL, -- google_drive, gmail, slack, etc.
  source_id TEXT, -- External ID (Drive file ID, email ID, etc.)
  source_name TEXT, -- Filename, email subject, etc.
  document_date TIMESTAMPTZ, -- When the source doc was created
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT knowledge_elements_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_elements_company ON knowledge_elements(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_elements_domain ON knowledge_elements(company_id, domain);
CREATE INDEX IF NOT EXISTS idx_knowledge_elements_confidence ON knowledge_elements(confidence);
CREATE INDEX IF NOT EXISTS idx_knowledge_elements_source ON knowledge_elements(company_id, source);

-- ingestion_progress: Real-time progress tracking
CREATE TABLE IF NOT EXISTS ingestion_progress (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- google_drive, gmail, etc.
  
  -- Progress metrics
  total_files INTEGER DEFAULT 0,
  scanned_files INTEGER DEFAULT 0,
  relevant_files INTEGER DEFAULT 0,
  facts_extracted INTEGER DEFAULT 0,
  
  -- Cost tracking
  estimated_cost NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, scanning, filtering, extracting, complete, failed
  error TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  PRIMARY KEY (company_id, source)
);

CREATE INDEX IF NOT EXISTS idx_ingestion_progress_status ON ingestion_progress(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_progress_updated ON ingestion_progress(updated_at DESC);

-- domain_scores: Aggregate knowledge scores per domain (updated by triggers)
CREATE TABLE IF NOT EXISTS domain_scores (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  
  -- Layer scores (0-100)
  layer1_score INTEGER DEFAULT 0, -- Platform access + live data (0-15)
  layer2_score INTEGER DEFAULT 0, -- Historical context (15-30)
  total_score INTEGER DEFAULT 0, -- Overall knowledge percentage
  
  -- Gap analysis
  gaps TEXT[], -- Array of missing data points
  
  -- Metadata
  fact_count INTEGER DEFAULT 0, -- Number of facts in this domain
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (company_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_domain_scores_company ON domain_scores(company_id);

-- Function: Auto-update domain scores when facts added
CREATE OR REPLACE FUNCTION update_domain_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate scores for affected domain
  INSERT INTO domain_scores (company_id, domain, fact_count, layer1_score, layer2_score, total_score, updated_at)
  SELECT 
    company_id,
    domain,
    COUNT(*) as fact_count,
    LEAST(15, COUNT(*) / 3) as layer1_score, -- 3 facts per point, max 15
    LEAST(15, COUNT(*) / 5) as layer2_score, -- 5 facts per point, max 15
    LEAST(30, COUNT(*) / 4) as total_score, -- 4 facts per point, max 30
    NOW() as updated_at
  FROM knowledge_elements
  WHERE company_id = NEW.company_id AND domain = NEW.domain
  GROUP BY company_id, domain
  ON CONFLICT (company_id, domain) 
  DO UPDATE SET
    fact_count = EXCLUDED.fact_count,
    layer1_score = EXCLUDED.layer1_score,
    layer2_score = EXCLUDED.layer2_score,
    total_score = EXCLUDED.total_score,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update scores when facts inserted
DROP TRIGGER IF EXISTS trigger_update_domain_scores ON knowledge_elements;
CREATE TRIGGER trigger_update_domain_scores
  AFTER INSERT OR UPDATE ON knowledge_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_scores();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON knowledge_elements TO authenticated;
GRANT SELECT ON ingestion_progress TO authenticated;
GRANT SELECT ON domain_scores TO authenticated;

-- Service role needs full access
GRANT ALL ON knowledge_elements TO service_role;
GRANT ALL ON ingestion_progress TO service_role;
GRANT ALL ON domain_scores TO service_role;
