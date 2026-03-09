-- INGEST Pipeline Schema
-- Migration: 20260309_ingest_pipeline.sql
-- Purpose: Multi-source data ingestion for Layer 2 knowledge building

-- ============================================================================
-- CONNECTED SOURCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS connected_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- google_drive | gmail | xero | hubspot | stripe | inbound_email
  domain TEXT NOT NULL, -- finance | sales | marketing | operations | people | product | legal
  platform TEXT, -- xero | stripe | hubspot | gsc | ga4 | etc
  oauth_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expiry TIMESTAMPTZ,
  webhook_id TEXT, -- for platforms that support webhooks
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily', -- realtime | hourly | daily | manual
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_connected_sources_company ON connected_sources(company_id);
CREATE INDEX idx_connected_sources_active ON connected_sources(company_id, is_active);

ALTER TABLE connected_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY connected_sources_isolation ON connected_sources
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- RAW DOCUMENTS (from Drive, Gmail, inbound email)
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- google_drive | gmail | inbound_email
  source_id TEXT, -- drive file ID | email message ID
  file_name TEXT,
  file_type TEXT, -- pdf | xlsx | docx | png | jpg | email
  content_text TEXT, -- extracted text
  metadata JSONB DEFAULT '{}'::jsonb, -- sender, date, size, attachments, etc
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  domain TEXT, -- assigned after classification
  secondary_domains TEXT[], -- additional relevant domains
  classification_confidence FLOAT
);

CREATE INDEX idx_raw_documents_company ON raw_documents(company_id);
CREATE INDEX idx_raw_documents_processed ON raw_documents(company_id, processed);
CREATE INDEX idx_raw_documents_domain ON raw_documents(company_id, domain);

ALTER TABLE raw_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY raw_documents_isolation ON raw_documents
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- RAW API DATA (from Xero, HubSpot, Stripe, etc)
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_api_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- xero | stripe | hubspot | gsc | ga4
  endpoint TEXT NOT NULL, -- invoices | transactions | deals | queries
  data JSONB NOT NULL, -- raw API response
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  domain TEXT, -- assigned after classification
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_raw_api_data_company ON raw_api_data(company_id);
CREATE INDEX idx_raw_api_data_processed ON raw_api_data(company_id, processed);
CREATE INDEX idx_raw_api_data_platform ON raw_api_data(company_id, platform);

ALTER TABLE raw_api_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY raw_api_data_isolation ON raw_api_data
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- KNOWLEDGE ELEMENTS (structured facts extracted from raw data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  key TEXT NOT NULL, -- finance.revenue.monthly.2026-02
  value TEXT NOT NULL,
  unit TEXT, -- GBP | USD | count | percent
  source TEXT NOT NULL, -- human-readable source description
  source_type TEXT NOT NULL, -- document | api | email
  source_id TEXT, -- reference to raw_documents.id or raw_api_data.id
  confidence FLOAT DEFAULT 1.0,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  is_stale BOOLEAN DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_knowledge_elements_company ON knowledge_elements(company_id);
CREATE INDEX idx_knowledge_elements_domain ON knowledge_elements(company_id, domain);
CREATE INDEX idx_knowledge_elements_key ON knowledge_elements(company_id, key);
CREATE INDEX idx_knowledge_elements_stale ON knowledge_elements(company_id, is_stale);

ALTER TABLE knowledge_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_elements_isolation ON knowledge_elements
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- DOMAIN SCORES (track Layer 1 + Layer 2 progress per domain)
-- ============================================================================
CREATE TABLE IF NOT EXISTS domain_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  layer_1_score INT DEFAULT 0, -- Platform Access (0-15)
  layer_2_score INT DEFAULT 0, -- Historical Context (0-15)
  total_score INT DEFAULT 0, -- Sum of layer_1 + layer_2 (0-30)
  gaps TEXT[], -- list of missing data needed for Layer 2
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX idx_domain_scores_unique ON domain_scores(company_id, domain);

ALTER TABLE domain_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY domain_scores_isolation ON domain_scores
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- TOOL SUGGESTIONS (detected tools not yet connected)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tool_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- xero | hubspot | stripe | ga4
  domain TEXT NOT NULL, -- finance | sales | marketing
  evidence TEXT NOT NULL, -- "Found 'Xero invoice #1847' in uploaded P&L"
  source_document_id UUID REFERENCES raw_documents(id),
  suggested_at TIMESTAMPTZ DEFAULT NOW(),
  actioned BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_tool_suggestions_company ON tool_suggestions(company_id);
CREATE INDEX idx_tool_suggestions_active ON tool_suggestions(company_id, actioned, dismissed);

ALTER TABLE tool_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tool_suggestions_isolation ON tool_suggestions
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- INGEST LOG (audit trail of all ingestion activity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- sync_started | sync_completed | classification | indexing | scoring
  source_type TEXT, -- google_drive | gmail | xero | etc
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingest_log_company ON ingest_log(company_id, timestamp DESC);

ALTER TABLE ingest_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ingest_log_isolation ON ingest_log
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- UPDATE companies table with domain_scores summary
-- ============================================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ingest_status TEXT DEFAULT 'not_started';
-- not_started | in_progress | layer_1_complete | layer_2_complete

ALTER TABLE companies ADD COLUMN IF NOT EXISTS ingest_progress JSONB DEFAULT '{
  "finance": {"layer_1": 0, "layer_2": 0, "total": 0},
  "sales": {"layer_1": 0, "layer_2": 0, "total": 0},
  "marketing": {"layer_1": 0, "layer_2": 0, "total": 0},
  "operations": {"layer_1": 0, "layer_2": 0, "total": 0},
  "people": {"layer_1": 0, "layer_2": 0, "total": 0},
  "product": {"layer_1": 0, "layer_2": 0, "total": 0},
  "legal": {"layer_1": 0, "layer_2": 0, "total": 0},
  "strategy": {"layer_1": 0, "layer_2": 0, "total": 0}
}'::jsonb;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update company ingest_progress from domain_scores
CREATE OR REPLACE FUNCTION update_company_ingest_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companies
  SET ingest_progress = (
    SELECT jsonb_object_agg(
      domain,
      jsonb_build_object(
        'layer_1', layer_1_score,
        'layer_2', layer_2_score,
        'total', total_score
      )
    )
    FROM domain_scores
    WHERE company_id = NEW.company_id
  )
  WHERE id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update company ingest_progress
CREATE TRIGGER trigger_update_ingest_progress
AFTER INSERT OR UPDATE ON domain_scores
FOR EACH ROW
EXECUTE FUNCTION update_company_ingest_progress();

-- Function to calculate overall ingest status
CREATE OR REPLACE FUNCTION calculate_ingest_status(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  avg_total FLOAT;
  min_total INT;
BEGIN
  SELECT AVG(total_score), MIN(total_score)
  INTO avg_total, min_total
  FROM domain_scores
  WHERE company_id = p_company_id;
  
  IF avg_total IS NULL THEN
    RETURN 'not_started';
  ELSIF min_total >= 25 THEN
    RETURN 'layer_2_complete';
  ELSIF avg_total >= 15 THEN
    RETURN 'in_progress';
  ELSE
    RETURN 'in_progress';
  END IF;
END;
$$ LANGUAGE plpgsql;
