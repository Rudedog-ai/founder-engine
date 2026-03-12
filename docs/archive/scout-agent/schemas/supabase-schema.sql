-- Scout Agent Database Schema
-- Tables for tracking discovered tools and evaluations

-- Discoveries table (raw finds from all sources)
CREATE TABLE IF NOT EXISTS scout_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'github' | 'producthunt' | 'hackernews' | 'reddit' | 'twitter'
    source_id TEXT, -- External ID (GitHub repo ID, Product Hunt ID, etc.)
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    tags TEXT[], -- e.g. ['finance', 'automation', 'ai']
    raw_data JSONB, -- Full API response for reference
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by source and date
CREATE INDEX IF NOT EXISTS idx_discoveries_source_date ON scout_discoveries(source, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_discoveries_url ON scout_discoveries(url);

-- Evaluations table (LLM analysis of each discovery)
CREATE TABLE IF NOT EXISTS scout_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_id UUID REFERENCES scout_discoveries(id) ON DELETE CASCADE,
    relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 10),
    reputation_score INTEGER CHECK (reputation_score BETWEEN 0 AND 10),
    safety_score INTEGER CHECK (safety_score BETWEEN 0 AND 10),
    maturity_score INTEGER CHECK (maturity_score BETWEEN 0 AND 10),
    overall_score NUMERIC GENERATED ALWAYS AS ((relevance_score + reputation_score + safety_score + maturity_score) / 4.0) STORED,
    use_case TEXT, -- Specific application in Founder Engine
    domain TEXT, -- 'finance' | 'sales' | 'marketing' | 'operations' | 'product' | 'general'
    recommendation TEXT CHECK (recommendation IN ('INVESTIGATE', 'WATCH', 'IGNORE')),
    reasoning TEXT, -- Why the scores/recommendation
    evaluated_by TEXT DEFAULT 'claude-sonnet-4', -- Model version
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(discovery_id) -- One evaluation per discovery
);

-- Index for filtering by recommendation and score
CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation ON scout_evaluations(recommendation, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_domain ON scout_evaluations(domain);

-- Manual reviews (founder upvote/downvote to train scoring)
CREATE TABLE IF NOT EXISTS scout_manual_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_id UUID REFERENCES scout_discoveries(id) ON DELETE CASCADE,
    reviewer TEXT DEFAULT 'ruari', -- Could be 'ruari' | 'team_member' etc.
    decision TEXT CHECK (decision IN ('approved', 'rejected', 'maybe')),
    notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digest history (track what was sent when)
CREATE TABLE IF NOT EXISTS scout_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    high_priority_count INTEGER DEFAULT 0,
    watch_count INTEGER DEFAULT 0,
    ignored_count INTEGER DEFAULT 0,
    sent_to TEXT[], -- e.g. ['discord:#agent-builder', 'email:ruari@...']
    content TEXT, -- Full digest markdown
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) - all tables require authentication
ALTER TABLE scout_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_manual_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_digests ENABLE ROW LEVEL SECURITY;

-- Policies: Allow service role full access
CREATE POLICY "Service role full access discoveries" ON scout_discoveries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access evaluations" ON scout_evaluations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access reviews" ON scout_manual_reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access digests" ON scout_digests FOR ALL USING (auth.role() = 'service_role');
