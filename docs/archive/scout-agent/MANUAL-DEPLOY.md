# Scout Agent - Manual Deployment (5 Minutes)

**Deployment via Supabase Dashboard (no CLI needed)**

---

## Step 1: Deploy Database Schema (2 min)

1. Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/sql/new

2. Copy this entire SQL block:

```sql
-- Scout Agent Database Schema

CREATE TABLE IF NOT EXISTS scout_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    source_id TEXT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    tags TEXT[],
    raw_data JSONB,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discoveries_source_date ON scout_discoveries(source, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_discoveries_url ON scout_discoveries(url);

CREATE TABLE IF NOT EXISTS scout_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_id UUID REFERENCES scout_discoveries(id) ON DELETE CASCADE,
    relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 10),
    reputation_score INTEGER CHECK (reputation_score BETWEEN 0 AND 10),
    safety_score INTEGER CHECK (safety_score BETWEEN 0 AND 10),
    maturity_score INTEGER CHECK (maturity_score BETWEEN 0 AND 10),
    overall_score NUMERIC GENERATED ALWAYS AS ((relevance_score + reputation_score + safety_score + maturity_score) / 4.0) STORED,
    use_case TEXT,
    domain TEXT,
    recommendation TEXT CHECK (recommendation IN ('INVESTIGATE', 'WATCH', 'IGNORE')),
    reasoning TEXT,
    evaluated_by TEXT DEFAULT 'claude-opus-4',
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(discovery_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation ON scout_evaluations(recommendation, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_domain ON scout_evaluations(domain);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON scout_evaluations(evaluated_at DESC);

CREATE TABLE IF NOT EXISTS scout_manual_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_id UUID REFERENCES scout_discoveries(id) ON DELETE CASCADE,
    reviewer TEXT DEFAULT 'ruari',
    decision TEXT CHECK (decision IN ('approved', 'rejected', 'maybe')),
    notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digest_type TEXT CHECK (digest_type IN ('daily_nudge', 'weekly_report')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    high_priority_count INTEGER DEFAULT 0,
    watch_count INTEGER DEFAULT 0,
    ignored_count INTEGER DEFAULT 0,
    sent_to TEXT[],
    content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scout_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_manual_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access discoveries" ON scout_discoveries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access evaluations" ON scout_evaluations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access reviews" ON scout_manual_reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access digests" ON scout_digests FOR ALL USING (auth.role() = 'service_role');
```

3. Click **Run**

4. Verify tables created: Editor → should see `scout_discoveries`, `scout_evaluations`, `scout_manual_reviews`, `scout_digests`

---

## Step 2: Configure Secrets (1 min)

1. Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/settings/vault

2. Click **New secret** (3 times):

**Secret 1:**
- Name: `ANTHROPIC_API_KEY`
- Value: (your Anthropic API key - starts with `sk-ant-`)

**Secret 2:**
- Name: `RESEND_API_KEY`
- Value: `re_DmrWW6mr_M5FtrTxSmxW1mFUAvJ58UdVy`

**Secret 3:**
- Name: `SCOUT_EMAIL_TO`
- Value: `rfairbairns@gmail.com`

3. Click **Save** on each

---

## Step 3: Deploy Edge Functions (1 min)

For each function, copy the code and paste into Supabase Functions editor:

### Function 1: scout-daily-run

1. Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/functions

2. Click **Create Function**

3. Name: `scout-daily-run`

4. Copy code from: `~/.openclaw/workspace/founder-engine/supabase/functions/scout-daily-run/index.ts`

5. Click **Deploy**

### Function 2: scout-daily-nudge

1. Click **Create Function**

2. Name: `scout-daily-nudge`

3. Copy code from: `~/.openclaw/workspace/founder-engine/supabase/functions/scout-daily-nudge/index.ts`

4. Click **Deploy**

### Function 3: scout-weekly-report

1. Click **Create Function**

2. Name: `scout-weekly-report`

3. Copy code from: `~/.openclaw/workspace/founder-engine/supabase/functions/scout-weekly-report/index.ts`

4. Click **Deploy**

---

## Step 4: Set Up Cron Jobs (1 min)

1. Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/database/cron-jobs

2. Get your **anon key** from: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/settings/api
   (Copy the `anon` `public` key)

3. Create 3 cron jobs:

### Cron 1: Daily Scraper

- Click **Create Cron Job**
- Name: `scout-daily-run`
- Schedule: `0 6 * * *` (6am UTC daily)
- Command:
```sql
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-run',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY_HERE"}'::jsonb
  ) AS request_id;
```
(Replace `YOUR_ANON_KEY_HERE` with your anon key)

### Cron 2: Daily Nudge

- Click **Create Cron Job**
- Name: `scout-daily-nudge`
- Schedule: `0 9 * * *` (9am UTC / 10am UK daily)
- Command:
```sql
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-nudge',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY_HERE"}'::jsonb
  ) AS request_id;
```

### Cron 3: Weekly Report

- Click **Create Cron Job**
- Name: `scout-weekly-report`
- Schedule: `0 8 * * 1` (8am UTC / 9am UK on Mondays)
- Command:
```sql
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-weekly-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY_HERE"}'::jsonb
  ) AS request_id;
```

---

## Step 5: Test (Optional)

Run this in your terminal (replace `YOUR_ANON_KEY`):

```bash
# Test daily run
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-run \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Should return: {"success": true, "discoveries": X, ...}
```

---

## Done! 🎉

**What happens next:**

- **Tomorrow 6am UTC:** Daily scraper runs (finds tools)
- **Tomorrow 10am UK:** Daily nudge email (if high-priority tools found)
- **Next Monday 9am UK:** Weekly report email

**Monitor:**
- Email: rfairbairns@gmail.com
- Discoveries: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/editor (scout_discoveries table)
- Logs: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/functions

---

**Total time: 5 minutes**
