# INGEST Architecture - Founder Engine
**Version 1.0 | 9 March 2026**

## Overview

The INGEST pipeline builds **Layer 2 depth knowledge** (30% per domain) for 8 business functions **before** Angus begins any consultancy work.

**Goal:** Multi-source data acquisition → domain classification → structured fact extraction → scoring → readiness for DIAGNOSE phase.

---

## The 8 Domain Agents (Target: 30% Each)

1. **Finance** - Revenue, expenses, cash flow, burn rate
2. **Sales** - Pipeline, deals, customers, conversion
3. **Marketing** - Traffic, campaigns, SEO, ads
4. **Operations** - Support, processes, fulfillment
5. **People** - Team, hiring, payroll, culture
6. **Product** - Features, bugs, deployments, adoption
7. **Legal** - Contracts, compliance, IP, GDPR
8. **Strategy** - Synthesized from other 7 domains

---

## Architecture - 6 Stages

### Stage 1: CONNECT
**Purpose:** Establish access to all data sources

**Data Sources (Priority Order):**
1. **Google Drive** - Client drops docs in "Founder Engine" folder (OAuth, realtime webhook)
2. **Gmail** - Business emails, invoices, customer threads (gmail.readonly scope)
3. **API Integrations** - Xero, HubSpot, Stripe, GA4, etc. (Composio OAuth)
4. **Inbound Email** - `ingest@founderengine.ai` for forwarded reports

**Table:** `connected_sources`

---

### Stage 2: EXTRACT
**Purpose:** Pull all raw data into storage

**Edge Functions:**
- `sync-google-drive` - Webhook + manual trigger
- `sync-gmail` - Every 4 hours
- `sync-xero` - Daily at 06:00 UTC
- `sync-hubspot` - Every 4 hours
- `process-inbound-email` - On email arrival

**Tables:**
- `raw_documents` - PDFs, spreadsheets, images (OCR), emails
- `raw_api_data` - JSON responses from APIs

---

### Stage 3: CLASSIFY
**Purpose:** Assign documents/API data to business domains

**Edge Function:** `classify-document`

**Model:** Claude Haiku (fast, cheap)

**Prompt:** Multi-domain classification with confidence scoring

**Output:**
```json
{
  "primary_domain": "finance",
  "secondary_domains": ["operations"],
  "confidence": 0.95,
  "reasoning": "P&L statement with cost breakdown"
}
```

**Updates:** `raw_documents.domain`, `raw_api_data.domain`

---

### Stage 4: INDEX
**Purpose:** Extract structured facts from raw data

**Edge Functions (1 per domain):**
- `process-finance-data`
- `process-sales-data`
- `process-marketing-data`
- (etc. for all 8 domains)

**Model:** Claude Sonnet (forensic extraction)

**Prompt Template:**
```
You are the [DOMAIN] Agent building knowledge about this company.

Raw data:
[content]

Extract structured facts in this format:
{
  "facts": [
    {
      "key": "finance.revenue.monthly.2026-02",
      "value": "47234",
      "unit": "GBP",
      "source": "P&L February 2026.pdf, page 1, line 'Total Revenue'",
      "confidence": 1.0
    }
  ],
  "gaps": ["Need January + December revenue for 3-month trend"],
  "tool_hints": ["Document mentions 'Xero invoice #1847' → suggest Xero connection"]
}
```

**Output Table:** `knowledge_elements`

**Side Effects:**
- Creates `tool_suggestions` for detected but unconnected tools
- Marks `raw_documents.processed = true`

---

### Stage 5: SCORE
**Purpose:** Calculate Layer 1 + Layer 2 scores per domain

**Edge Function:** `calculate-domain-scores`

**Scoring Logic:**

**Layer 1 (Platform Access): 0-15 points**
- API connected (Xero, HubSpot, GA4, etc.) = 15
- 3+ months manual data (uploaded P&Ls, pipeline sheets) = 15
- <3 months manual data = 10
- No data = 0

**Layer 2 (Historical Context): 0-15 points**
- 6+ months historical data = 15
- 3-5 months = 10
- 1-2 months = 5
- No monthly data = 0
- **Bonus:** +2 for key metrics calculated (e.g., cash runway, burn rate, top clients)

**Output Table:** `domain_scores`

**Trigger:** Auto-updates `companies.ingest_progress` via database trigger

---

### Stage 6: DISCOVER
**Purpose:** Proactive tool detection

**Edge Function:** `detect-missing-tools` (runs during classification/indexing)

**Pattern Matching:**
- "Xero invoice #" → Xero not connected
- "HubSpot deal:" → HubSpot not connected
- Email from "noreply@stripe.com" → Stripe not connected

**Output Table:** `tool_suggestions`

**Frontend Display:**
> 💡 We noticed you use Xero (found in your uploaded P&L). Connect it to boost Finance score from 15% to 30%?

---

## Database Schema (7 New Tables)

### 1. `connected_sources`
Tracks all data source connections (Drive, Gmail, APIs)

### 2. `raw_documents`
PDFs, spreadsheets, images, emails with extracted text

### 3. `raw_api_data`
Raw JSON responses from Xero, HubSpot, Stripe, etc.

### 4. `knowledge_elements`
Structured facts extracted from raw data (finance.revenue.monthly.2026-02 = 47234 GBP)

### 5. `domain_scores`
Layer 1 + Layer 2 scores per domain with gaps list

### 6. `tool_suggestions`
Detected tools not yet connected (with evidence)

### 7. `ingest_log`
Audit trail of all ingestion activity

**Plus:** `companies` table updated with `ingest_status` and `ingest_progress` columns

---

## Edge Functions (8 Core)

### Data Sync (3)
1. `sync-google-drive` - Webhook + manual
2. `sync-gmail` - Every 4 hours
3. `sync-[platform]` - Per-platform API sync

### Processing (3)
4. `classify-document` - Domain classification (Claude Haiku)
5. `process-finance-data` - Finance fact extraction (Claude Sonnet)
6. `process-[domain]-data` - Per-domain indexing

### Scoring (2)
7. `calculate-domain-scores` - Layer 1 + Layer 2 calculation
8. `detect-missing-tools` - Proactive tool discovery

---

## Deployment Sequence

### 1. Run Migration
```bash
cd founder-engine
supabase db push
```

Applies: `20260309_ingest_pipeline.sql`

### 2. Deploy Edge Functions
```bash
# Classification
supabase functions deploy classify-document

# Finance indexing
supabase functions deploy process-finance-data

# Scoring
supabase functions deploy calculate-domain-scores

# Drive sync
supabase functions deploy sync-google-drive
```

### 3. Set Environment Variables
In Supabase dashboard → Edge Functions → Secrets:
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
COMPOSIO_API_KEY=... (if using Composio)
```

### 4. Configure Cron Jobs
In Supabase dashboard → Database → Cron:

```sql
-- Gmail sync every 4 hours
SELECT cron.schedule(
  'sync-gmail-all-companies',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/sync-gmail',
    headers := '{"Authorization": "Bearer [service_role_key]"}'::jsonb,
    body := jsonb_build_object('all_companies', true)
  );
  $$
);

-- Xero sync daily at 06:00 UTC
SELECT cron.schedule(
  'sync-xero-all-companies',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/sync-xero',
    headers := '{"Authorization": "Bearer [service_role_key]"}'::jsonb,
    body := jsonb_build_object('all_companies', true)
  );
  $$
);
```

---

## OYNB Test Timeline (5 Days to Layer 2)

**Day 1:**
- Google Drive connected
- Gmail connected
- Client drops 10-15 docs
- Overnight: classify + index
- **Result:** 15-25% across domains

**Day 2:**
- Domain scores calculated
- Tool suggestions surfaced ("Connect Xero?")
- Gaps identified

**Day 3:**
- Client connects Xero, HubSpot
- API data pulled
- Re-index + re-score
- **Result:** 25-30% across domains

**Day 4:**
- Forward emails from accountant to `ingest@founderengine.ai`
- Additional docs uploaded
- Final indexing

**Day 5:**
- INGEST complete (all domains 28-32%)
- Ready for DIAGNOSE phase
- Angus can answer basic questions with confidence

---

## Success Criteria

**INGEST Complete When:**
- ✅ All 8 domains ≥ 25% knowledge
- ✅ Layer 1 (Platform Access) complete for ≥6 domains
- ✅ Layer 2 (Historical Context) started for ≥6 domains
- ✅ Gaps documented and visible to founder
- ✅ Tool suggestions actioned or dismissed

**Then:**
- DIAGNOSE phase begins (clarifying questions, Q&A with founder)
- Angus advisory conversations unlock
- Source of Truth document generated

---

## Monitoring

**Check INGEST progress:**
```sql
SELECT 
  domain,
  layer_1_score,
  layer_2_score,
  total_score,
  gaps
FROM domain_scores
WHERE company_id = '[OYNB company_id]'
ORDER BY domain;
```

**View recent ingestion activity:**
```sql
SELECT 
  event_type,
  source_type,
  details,
  timestamp
FROM ingest_log
WHERE company_id = '[OYNB company_id]'
ORDER BY timestamp DESC
LIMIT 20;
```

**Count knowledge elements per domain:**
```sql
SELECT 
  domain,
  COUNT(*) as fact_count,
  AVG(confidence) as avg_confidence
FROM knowledge_elements
WHERE company_id = '[OYNB company_id]'
GROUP BY domain
ORDER BY fact_count DESC;
```

---

## Next Steps After INGEST

1. **DIAGNOSE** - Clarifying questions to fill gaps
2. **Source of Truth** - Generate structured knowledge doc
3. **Angus Advisory** - Conversational intelligence layer
4. **DEPLOY** - Team training, implementation plans
5. **MONITOR** - Ongoing sync + updates
6. **LEAVE** - Handoff to client with subscriptions + Angus retained

---

## File Locations

```
founder-engine/
├── supabase/
│   ├── migrations/
│   │   └── 20260309_ingest_pipeline.sql
│   └── functions/
│       ├── classify-document/index.ts
│       ├── process-finance-data/index.ts
│       ├── calculate-domain-scores/index.ts
│       ├── sync-google-drive/index.ts
│       ├── sync-gmail/index.ts (to build)
│       ├── sync-xero/index.ts (to build)
│       └── [other sync functions]
└── INGEST-ARCHITECTURE.md (this file)
```

---

**End of Architecture Document**
