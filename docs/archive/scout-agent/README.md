# Scout Agent

**Automated tool discovery and evaluation system for Founder Engine**

Scout Agent runs daily to discover new AI/automation/business tools from GitHub, Product Hunt, and Hacker News. Each discovery is evaluated by Claude Sonnet across 4 dimensions (relevance, reputation, safety, maturity), then filtered into HIGH PRIORITY, WORTH WATCHING, or IGNORE categories.

Weekly digests are posted to #agent-builder Discord channel.

---

## Architecture

```
┌─────────────────┐
│  Daily Scrapers │ ← GitHub Trending, Product Hunt, Hacker News
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │ ← scout_discoveries table
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Haiku 4 Filter  │ ← Quick relevance check (all discoveries)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 Noise    Relevant
    │         │
    ▼         ▼
 IGNORE  ┌─────────────────┐
         │ Opus 4.6 Review │ ← Deep analysis (only relevant ~30%)
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Evaluations   │ ← scout_evaluations table
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Weekly Digest   │ ← Posted to Discord every Monday
         └─────────────────┘
```

---

## Database Schema

### `scout_discoveries`

Raw finds from all sources.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source | TEXT | 'github' \| 'producthunt' \| 'hackernews' |
| source_id | TEXT | External ID (repo ID, product ID, etc.) |
| url | TEXT | Link to tool/repo |
| title | TEXT | Name of the tool/repo |
| description | TEXT | Short description |
| author | TEXT | Creator/maker |
| tags | TEXT[] | Keywords (e.g. ['finance', 'ai']) |
| raw_data | JSONB | Full API response |
| discovered_at | TIMESTAMPTZ | When found |

### `scout_evaluations`

LLM analysis of each discovery.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| discovery_id | UUID | FK to scout_discoveries |
| relevance_score | INT | 0-10, does it help Founder Engine? |
| reputation_score | INT | 0-10, is it credible? |
| safety_score | INT | 0-10, can we trust it? |
| maturity_score | INT | 0-10, is it production-ready? |
| overall_score | NUMERIC | Average of 4 scores (auto-calculated) |
| use_case | TEXT | Specific application in Founder Engine |
| domain | TEXT | Which agent benefits (finance/sales/etc.) |
| recommendation | TEXT | INVESTIGATE \| WATCH \| IGNORE |
| reasoning | TEXT | Why the scores/recommendation |
| evaluated_by | TEXT | Model version (e.g. 'claude-sonnet-4') |

### `scout_digests`

Weekly reports sent to Discord.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| period_start | TIMESTAMPTZ | Start of week |
| period_end | TIMESTAMPTZ | End of week |
| high_priority_count | INT | Number of INVESTIGATE items |
| watch_count | INT | Number of WATCH items |
| ignored_count | INT | Number of IGNORE items |
| content | TEXT | Full markdown digest |
| sent_to | TEXT[] | Where it was posted |

---

## Setup

### 1. Create Database Tables

Run the schema migration:

```bash
supabase db push supabase/migrations/scout-agent-schema.sql
```

Or run manually in Supabase SQL Editor:

```sql
-- Copy contents of scout-agent/schemas/supabase-schema.sql
```

### 2. Set Environment Variables

In Supabase Dashboard → Project Settings → Vault:

```
ANTHROPIC_API_KEY = your-anthropic-key
PRODUCTHUNT_API_KEY = your-product-hunt-key (optional)
DISCORD_SCOUT_WEBHOOK = discord-webhook-url-for-agent-builder-channel
```

### 3. Deploy Edge Functions

```bash
cd supabase/functions

# Deploy daily scraper
supabase functions deploy scout-daily-run

# Deploy weekly digest
supabase functions deploy scout-weekly-digest
```

### 4. Set Up Cron Jobs

In Supabase Dashboard → Database → Cron Jobs:

**Daily scraper (runs at 06:00 UTC):**

```sql
SELECT cron.schedule(
  'scout-daily-run',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/scout-daily-run',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

**Weekly digest (runs Mondays at 08:00 UTC):**

```sql
SELECT cron.schedule(
  'scout-weekly-digest',
  '0 8 * * 1',
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/scout-weekly-digest',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

---

## Two-Tier Evaluation Pipeline

Scout Agent uses a cost-optimized two-tier approach:

### Tier 1: Haiku 4 Quick Filter (~$0.0003/call)

**Purpose:** Fast relevance check on ALL discoveries
**Question:** Is this tool related to business intelligence, AI agents, or automation?

**Output:**
```json
{
  "relevance_score": 0-10,
  "quick_verdict": "relevant|maybe|noise",
  "one_line_reason": "..."
}
```

**Decision:**
- `noise` → Store as IGNORE, skip Tier 2
- `relevant` or `maybe` → Send to Tier 2 for deep analysis

**Expected filter rate:** 70% noise, 30% pass to Tier 2

---

### Tier 2: Opus 4.6 Deep Analysis (~$0.015/call)

**Purpose:** Comprehensive evaluation ONLY for relevant tools
**Question:** How good is this tool across 4 dimensions?

**Output:** Full evaluation (see Evaluation Criteria below)

**Why Opus 4.6:**
- 20-30% better reasoning vs Sonnet (learned from BrokerAgent experience)
- Only runs on ~6 tools/day (the relevant ones)
- $0.09/day for Opus quality on high-value finds

---

## Evaluation Criteria

Opus 4.6 scores each relevant discovery across 4 dimensions:

### 1. Relevance (0-10)

Does this tool help Founder Engine's domain agents?

- **10:** Perfect fit, solves a specific agent need (e.g. Xero connector for Finance Agent)
- **7-9:** Strong fit, applicable to multiple domains
- **4-6:** Tangentially relevant, might be useful later
- **1-3:** Interesting but not directly applicable
- **0:** Completely irrelevant

### 2. Reputation (0-10)

Can we trust this tool/maker?

**Signals for GitHub repos:**
- 1000+ stars = +3 points
- 100+ forks = +2 points
- Active maintenance (commits in last 30 days) = +2 points
- Known maker/organization = +2 points
- Funding/backing = +1 point

**Signals for Product Hunt:**
- 500+ upvotes = +3 points
- Featured/Product of the Day = +2 points
- Known maker = +2 points
- Real testimonials = +2 points
- Funded startup = +1 point

### 3. Safety (0-10)

Can we deploy this without risk?

- **10:** Open source, MIT/Apache license, no external dependencies, GDPR-compliant
- **7-9:** Open source with some dependencies, secure API design
- **4-6:** Closed source but reputable, clear data handling
- **1-3:** Unclear data practices, heavy dependencies, legal concerns
- **0:** Red flags (malware risk, data exfiltration, GPL license conflicts)

### 4. Maturity (0-10)

Is this production-ready?

- **10:** v1.0+, stable API, versioned releases, extensive docs, battle-tested
- **7-9:** Beta with active development, some production users
- **4-6:** Alpha/MVP, promising but early
- **1-3:** Prototype/demo, frequent breaking changes
- **0:** Vaporware, abandoned, or concept-only

---

## Recommendation Logic

Based on overall score and individual dimensions:

### INVESTIGATE (Review This Week)

- Overall score ≥ 7.0
- AND relevance ≥ 7
- AND safety ≥ 6
- = High priority, actionable this week

### WATCH (Revisit in 3 Months)

- Overall score 5.0–6.9
- OR relevance ≥ 7 but maturity < 5
- = Promising but not ready, check back later

### IGNORE

- Overall score < 5.0
- OR safety < 5
- OR relevance < 4
- = Not worth time/risk

---

## Weekly Digest Format

Posted every Monday to #agent-builder:

```markdown
# 🔍 SCOUT AGENT WEEKLY REPORT

**2026-03-02 → 2026-03-09**

## 🔥 HIGH PRIORITY (3)

**1. ai-cfo-agent - Financial Analysis Multi-Agent**
Scores: R:9 Rep:7 S:8 M:6 (Overall: 7.5/10)
Domain: finance | Use Case: Drop-in forecasting engine for Finance Agent
Why: Open source, proven analysis patterns, needs Xero integration
https://github.com/daniel-st3/ai-cfo-agent

**2. ComfyUI Workflows for Business Intelligence**
...

## 📊 WORTH WATCHING (12)

**1. AutoGen Studio 2.0** - general (6.8/10)
**2. LangGraph Cloud Beta** - general (6.5/10)
...

**Summary:** 47 reviewed, 3 high priority, 12 watching, 32 ignored
```

---

## Manual Review Interface

Founders can upvote/downvote discoveries to train the scoring:

```sql
-- Approve a tool (signals "this was a good find")
INSERT INTO scout_manual_reviews (discovery_id, decision, notes)
VALUES ('uuid-here', 'approved', 'Excellent find, integrated into Finance Agent');

-- Reject a tool (signals "this was noise")
INSERT INTO scout_manual_reviews (discovery_id, decision, notes)
VALUES ('uuid-here', 'rejected', 'Not relevant, too early stage');
```

Over time, Scout Agent learns from manual reviews to improve scoring accuracy.

---

## Extending Scout Agent

### Add New Sources

Create a scraper in `scout-agent/scrapers/[source].js`:

```javascript
export async function scrapeNewSource() {
  // Fetch from API or scrape
  // Return array of discoveries in standard format
  return [{
    source: 'newsource',
    source_id: '...',
    url: '...',
    title: '...',
    description: '...',
    author: '...',
    tags: [...],
    raw_data: {...}
  }]
}
```

Add to orchestrator:

```javascript
import { scrapeNewSource } from './scrapers/newsource.js'

const newResults = await scrapeNewSource()
allDiscoveries.push(...newResults)
```

### Customize Evaluation Prompt

Edit `evaluators/llm-evaluator.js` → prompt section to:

- Change scoring rubrics
- Add new evaluation dimensions
- Filter for specific use cases
- Adjust recommendation thresholds

---

## Cost Estimate

**Two-tier evaluation approach:**
1. **Haiku 4** - Quick filter (all discoveries): $0.0003/call
2. **Opus 4.6** - Deep analysis (only relevant ~30%): $0.015/call

**Daily run:**
- GitHub API: Free
- Product Hunt API: Free (with token)
- Hacker News API: Free
- Haiku filter: ~20 discoveries/day × $0.0003 = **$0.006/day**
- Opus analysis: ~6 relevant/day × $0.015 = **$0.09/day**
- **Total LLM cost: ~$0.096/day = $2.88/month**

**Storage:**
- ~600 discoveries/month × 2KB = 1.2 MB/month
- Supabase free tier: 500 MB
- **Storage cost: $0**

**Total monthly cost: ~$3 USD** (mostly Opus calls on high-quality finds)

**Cost savings vs single-tier Sonnet:** 70% cheaper (was ~$2/month with Sonnet for everything, now ~$3/month but with Opus quality on relevant tools)

---

## Roadmap

**Phase 1 (Current):** GitHub + Product Hunt + Hacker News scrapers, Claude evaluation, weekly digest

**Phase 2 (March):** Reddit scraper (r/LocalLLaMA, r/AutomationTools), Twitter/X monitoring

**Phase 3 (April):** Manual review interface in dashboard, scoring ML model trained on manual reviews

**Phase 4 (May):** Auto-integration testing (can we use this tool with 5 minutes of setup?), cost/benefit analysis per tool

---

## Status

**Live:** ⚠️ Built, not yet deployed (waiting for Supabase deployment)

**Next steps:**
1. Push schema to Supabase
2. Deploy edge functions
3. Set up cron jobs
4. Test with first weekly run

---

**Questions? Post in #agent-builder**
