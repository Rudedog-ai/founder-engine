# AGENT ARCHITECTURE
**Version 1.0 | 9 March 2026**

## The Core Principle

**Angus Synthesises, Never Originates.**

The orchestration layer (Angus) reads outputs from specialist tools and agents. It NEVER:
- Generates financial numbers
- Writes to source systems  
- Makes up data

Every claim must trace back to a connected data source.

Angus's job: connect dots across domains, surface conflicts and opportunities, present synthesised intelligence to the founder in plain language.

---

## The 3-Tier Architecture

### Tier 1: Angus (Orchestration Layer)

**Role:** Founder-facing agent

**Responsibilities:**
- Handles natural language interaction (voice and text)
- Routes queries to specialist agents
- Synthesises cross-domain insights
- Generates action plans
- Manages overall business context
- Detects conflicts ("Revenue up 15% but cash flow down 8% - here's why")
- Prioritises across functions ("SEO wants £5K budget, Sales wants £5K budget, cash runway is 4 months - here's the decision framework")

**What Angus Does NOT Do:**
- Deep domain work (that's Tier 2)
- Direct platform access (Tier 2 agents own their tool connections)
- Originate numbers or make assumptions

**Example Interaction:**

**Founder:** "Should I hire a content writer?"

**Angus orchestration:**
1. Query **Finance Agent:** "What's the budget headroom for a £40K hire?"
2. Query **Marketing Agent:** "What's the content gap? How much revenue would 2 posts/week generate?"
3. Query **People Agent:** "What's current team capacity? Is this hire vs existing workload optimisation?"
4. **Synthesise:** "Based on your £4.2mo cash runway, I'd delay the hire. Marketing Agent shows your SEO content frequency isn't the bottleneck - it's content quality. Your existing writer (Jane) publishes 2x/week but average time-on-page is 34 seconds (industry average: 2m 15s). Investing in content coaching (£2K one-time) will have higher ROI than a new hire. Here's the 90-day plan."

### Tier 2: Domain Agents (8 Functions)

Each owns:
- Its tool connections (OAuth, API keys)
- Its data context (historical patterns, benchmarks)
- Its domain-specific reasoning
- Its knowledge completeness score

Can operate independently on queries within its domain.

**The 8 Domain Agents:**

1. **Finance Agent** (CFO)
   - Tools: Xero, QuickBooks, Stripe, bank feeds, payroll
   - Knowledge: P&L, balance sheet, cash flow, unit economics, forecasting
   - Outputs: "Cash runway 4.2 months", "Burn rate £18K/month", "Break-even at 47 customers"

2. **Sales Agent** (CRO / VP Sales)
   - Tools: HubSpot, Pipedrive, Salesforce, Gong, email sequences
   - Knowledge: Pipeline health, win/loss patterns, deal velocity, churn
   - Outputs: "Pipeline £280K, 68% likely to close £190K this quarter", "Top objection: pricing (42% of lost deals)"

3. **Marketing Agent** (CMO)
   - Owns multiple sub-agents (Tier 3)
   - Orchestrates across: SEO, Paid Search, Paid Social, Email, Content, PR, CRO, Attribution
   - Knowledge: Channel performance, CAC by channel, LTV, attribution
   - Outputs: "Organic traffic 12K/mo, paid 3K/mo. Organic CAC £47, Paid CAC £180. Shift budget to organic."

4. **Operations Agent** (COO)
   - Tools: Asana, Monday, Zendesk, Intercom, fulfilment systems
   - Knowledge: Workflows, bottlenecks, support volume, SLA compliance
   - Outputs: "Support tickets 180/week, avg resolution 18 hours. Bottleneck: onboarding (32% of tickets). Automation candidate."

5. **People Agent** (CHRO / VP People)
   - Tools: Charlie HR, BambooHR, Rippling, Workable, Greenhouse
   - Knowledge: Org chart, hiring pipeline, engagement, turnover, compliance
   - Outputs: "Team: 12 people, 2 open roles, avg time-to-hire 47 days. Flight risk: Jane (tenure 11mo, engagement score 4/10)"

6. **Product Agent** (CTO / CPO)
   - Tools: GitHub, GitLab, Sentry, Mixpanel, Amplitude, feature flags
   - Knowledge: Roadmap, feature usage, technical health, development velocity
   - Outputs: "Feature X launched 3 weeks ago, adoption 18%. Error rate 2.3% (above threshold). Dev velocity 14 story points/sprint."

7. **Legal Agent** (CLO / GC)
   - Tools: Contract repository, compliance calendar, IP register
   - Knowledge: All contracts, regulatory obligations, risk register, GDPR compliance
   - Outputs: "3 contracts expiring next quarter. GDPR audit due in 45 days. Outstanding dispute: vendor X (£12K exposure)."

8. **Strategy Agent** (CEO / Board)
   - Synthesises insights from all 7 other agents
   - Owns: OKRs, market position, capital allocation, governance
   - Outputs: "Q1 OKR progress: Revenue 87% (on track), Customer NPS 6.8/10 (below target 8), Churn 4.2% (target 3%)."

### Tier 3: Sub-Domain Agents (As Needed)

Within each Tier 2 agent, deploy sub-agents for specific complexity.

**Example: Marketing Agent Sub-Agents**

- **SEO Sub-Agent**
  - Tools: Google Search Console, GA4, Ahrefs, CMS
  - Knowledge: Keyword rankings, backlinks, technical health, content performance
  - Outputs: "Domain authority 42. Top keyword 'alcohol-free challenge' position 4. Content gap: 18 competitor topics not covered."

- **Paid Search Sub-Agent**
  - Tools: Google Ads
  - Knowledge: CPA, ROAS, quality scores, impression share, search term analysis
  - Outputs: "CPA £47, ROAS 2.8x. Quality score avg 6/10. Wasting £340/mo on broad match."

- **Email Sub-Agent**
  - Tools: Mailchimp, Klaviyo
  - Knowledge: Open rates, click rates, list growth, segmentation, revenue per email
  - Outputs: "Open rate 22% (industry avg 18%). Revenue per email £1.40. Segmentation only 2 groups - opportunity."

- **Content Sub-Agent**
  - Tools: CMS, editorial calendar, GA4
  - Knowledge: Traffic per post, conversion rates, content ROI
  - Outputs: "Blog traffic 8K/mo. Top post: '10 alcohol-free recipes' (2.4K/mo, 3.2% conversion). Publish more like this."

Similar sub-agent structures exist within Finance (Cash Flow, Forecasting, Tax), Operations (Support, Fulfilment, Quality), etc.

---

## Data Flow: The 6-Phase Pipeline

Every domain agent follows the same pattern:

### 1. Connect
OAuth or API key to the client's actual platform (Xero, HubSpot, GA4, etc.)

**Implementation:**
- Supabase edge function: `connect-integration`
- Composio layer for OAuth flows
- Store tokens encrypted in `connected_accounts` table
- Webhook registration where supported (Google Drive, Stripe)

### 2. Sync
Scheduled data pull (hourly/daily depending on source) into client's isolated Supabase store.

**Implementation:**
- Supabase cron triggers edge functions
- Finance Agent: daily at 06:00 UTC (pull yesterday's transactions)
- Marketing Agent: hourly (rankings can change fast)
- Sales Agent: every 4 hours (pipeline updates)
- Data stored in domain-specific tables: `finance_data`, `sales_pipeline`, `marketing_metrics`

### 3. Index
Transform raw data into knowledge base entries with source tags, timestamps, confidence scores.

**Implementation:**
- Edge function: `process-[domain]-data`
- Extract structured facts: `finance.revenue.monthly.2026-02 = £47,234`
- Store in `knowledge_elements` table:
  ```json
  {
    "company_id": "...",
    "domain": "finance",
    "key": "revenue.monthly.2026-02",
    "value": "47234",
    "unit": "GBP",
    "source": "Xero invoice #1847",
    "source_id": "xero_invoice_1847",
    "confidence": 1.0,
    "extracted_at": "2026-03-09T06:15:00Z"
  }
  ```
- Update domain knowledge completeness score

### 4. Monitor
Anomaly detection running against incoming data.

**Implementation:**
- Edge function: `monitor-anomalies` (runs every 6 hours)
- Checks:
  - **Finance:** Cash flow negative? Burn rate spike? Invoice overdue >30 days?
  - **Sales:** Deal stuck in stage >14 days? Pipeline value dropped 20%? Churn spike?
  - **Marketing:** Traffic dropped 15%? Conversion rate halved? Ad spend 2x budget?
  - **Operations:** Support ticket backlog >50? SLA breach rate >10%? Error spike?
- Alert stored in `anomalies` table
- Angus surfaces to founder: "Cash flow negative £8K this week - here's why"

### 5. Synthesise
Domain agent interprets its data in context. Angus connects insights across domains.

**Implementation:**
- Domain agent queries its `knowledge_elements`
- Applies domain-specific reasoning (Finance Agent understands cash flow cycles, Marketing Agent understands attribution models)
- Angus queries ALL domain agents for cross-function synthesis
- LLM prompt: "Finance shows £4.2mo runway. Sales shows £280K pipeline closing next quarter. Marketing wants £5K SEO budget. People wants £40K hire. What should the founder prioritise?"

### 6. Act
Recommendations surfaced to founder. Implementation plans generated. Team tasks assigned.

**Implementation:**
- Founder asks question via voice (ElevenLabs) or text (dashboard chat)
- Angus routes to appropriate domain agent(s)
- Synthesis happens
- Output formatted for delivery:
  - Voice: Short summary with key number + one action
  - Dashboard: Full breakdown with sources, confidence scores, recommended actions
  - Email: Weekly digest with top 3 priorities
- If founder approves action → task created in `action_items` table → routed to appropriate team member

---

## The Nathan-Proofing Principle

**The Nathan Problem:**
Agencies gather 10% of information → make assumptions → break dependencies they didn't know existed → kill the business.

**How This Architecture Prevents It:**

### 1. Depth Before Breadth
Build ONE domain to Layer 4+ depth before touching the next. Don't build 8 shallow agents. Build 1 deep agent, prove it works, then scale.

**Current priority:** Finance Agent to Layer 4 (35% knowledge) using OYNB as test case.

### 2. Honest Knowledge Scoring
Agent always shows what it knows AND what it doesn't know.

**Example output:**
```
Finance Agent Knowledge: 20%

What I know:
- Monthly revenue: £47K (source: Xero)
- Top client: Acme Ltd, £18K/mo (source: Xero invoice analysis)
- Cash runway: 4.2 months (source: bank balance £76K / burn rate £18K)

What I DON'T know:
- Unit economics per product (need: product-level cost data)
- Customer lifetime value (need: churn data + cohort analysis)
- Payment terms by client (need: invoice terms + collection history)
- Tax liabilities (need: tax categorisation in Xero)

Connect Stripe → 28% knowledge (adds payment data, revenue attribution)
Add 12 months history → 35% knowledge (enables forecasting, seasonal pattern detection)
```

### 3. Clarifying Questions, Not Assumptions
When agent encounters a gap, it ASKS instead of guessing.

**Example:**

Agent sees: "Consulting revenue: £12,000" in Xero

**Instead of assuming:**
- "This is probably one-time project work"
- "This is likely the founder's billable hours"

**Agent asks:**
- "I see £12K consulting revenue in February. Who is the client?"
- "Is this recurring or one-time?"
- "Are there other consulting projects not yet invoiced?"

Founder answers → Agent updates knowledge → Confidence score increases.

### 4. Source Attribution Always
Every fact cites its source. Founder can verify.

**Example:**

**Founder:** "What's my cash runway?"

**Agent:** "4.2 months. Based on:
- Cash balance: £76,234 (source: Barclays Business Account, synced 09:15 today)
- Monthly burn rate: £18,150 (source: average of last 3 months' net cash flow from Xero)
- Calculation: £76,234 / £18,150 = 4.2 months

**Confidence: High** (real-time bank data + 3 months burn average)"

If founder says "That's wrong, burn is actually £22K" → Agent updates, recalculates, asks "What's driving the higher burn?"

### 5. Cross-Domain Dependency Checking
Before recommending action in one domain, check impact on other domains.

**Example:**

**Marketing Agent alone:** "Increase SEO content to 4 posts/week. Expected traffic lift: 18%. Budget: £5K/mo for freelance writer."

**Angus cross-domain check:**
- **Finance Agent:** Cash runway 4.2 months. New £5K/mo commitment reduces runway to 3.8 months.
- **People Agent:** Existing writer (Jane) currently at 60% capacity. Could write 4 posts/week if workflow optimised.
- **Sales Agent:** Sales team isn't converting current traffic well (2.1% conversion, industry avg 3.5%). More traffic won't help until conversion improves.

**Angus recommendation:** "Don't hire yet. Three blockers:
1. Cash runway risk (4.2mo → 3.8mo)
2. Existing capacity underutilised (Jane at 60%, could hit 4 posts/week with workflow changes)
3. Conversion problem (2.1% vs 3.5% industry avg) - more traffic won't convert until this is fixed

**Recommended sequence:**
1. Week 1-2: Optimise Jane's workflow (estimated 2 hours with Operations Agent)
2. Week 3-4: Fix conversion bottleneck (Sales + Marketing Agents collaboration)
3. Month 2: Re-evaluate content frequency increase once conversion is 3%+
4. If still needed: hire writer when cash runway >6 months"

This is Nathan-proofing. Dependencies surfaced BEFORE action, not after breakage.

---

## Implementation Roadmap

### Phase 1: Finance Agent Deep (March 2026)

**Goal:** Reach Layer 4 (35% knowledge) on OYNB test company

**Build:**
- OAuth integration: Xero
- Data sync: Daily at 06:00 UTC
- Knowledge extraction: P&L, balance sheet, cash flow, invoices, bills, bank transactions
- Structured facts: `finance.revenue.monthly.*`, `finance.runway`, `finance.burn_rate`, `finance.top_client.*`
- Clarifying questions: Client names, recurring vs one-time, payment terms
- Honest scoring: Show 20% → 35% progression as data accumulates

**Success metric:** Founder (Richard for Chocolate & Love, or OYNB context) says "This knows more about my finances than I do."

### Phase 2: Second Domain (April 2026)

**Pick:** Sales OR Marketing (whichever OYNB/C&L needs most)

**Build same depth as Finance:**
- Layer 1-4 (35% knowledge)
- Platform connections, historical context, domain intelligence, technical infrastructure
- Honest scoring, clarifying questions, source attribution

**Success metric:** Two domains at 35%+ knowledge. Angus can synthesise across them.

### Phase 3: Orchestration Layer (May 2026)

**Build Angus cross-domain synthesis:**
- Route queries to correct domain agent(s)
- Detect conflicts ("Revenue up, cash down")
- Check dependencies before recommendations
- Prioritise across competing requests

**Success metric:** Founder asks "Should I hire?" and gets answer that incorporates Finance + People + Sales + current priorities.

### Phase 4: Scale Remaining Domains (June-August 2026)

**Build remaining 6 functions to Layer 3-4:**
- Operations
- People  
- Product
- Legal
- Strategy
- Remaining Marketing sub-domains

**Each new client tests and improves the architecture.**

---

## Why This Architecture Works

### 1. Modular
Each domain agent is independent. Finance Agent doesn't need to know how Marketing Agent works. They communicate via Angus orchestration layer.

### 2. Scalable
Add new domain by cloning the pattern: Connect → Sync → Index → Monitor → Synthesise → Act.

### 3. Testable
Each domain agent can be tested in isolation. "Does Finance Agent correctly calculate burn rate?" is a testable assertion.

### 4. Honest
Knowledge scores are derived from Layer framework, not made up. Agent shows what it knows AND what it doesn't.

### 5. Client-Specific
Every client has their own isolated Supabase project. Their data never touches another client's. Their agents learn their business specifically.

### 6. Compound Learning
Patterns learned across clients improve the architecture (not the individual client data). "Businesses in hospitality have seasonal cash flow patterns" → all hospitality clients benefit from this insight.

---

## The Moat

**First client is hardest.**

Every subsequent client makes the system smarter because:
- Pattern library grows (what kinds of businesses have what kinds of problems)
- Diagnostic questions improve (we learn what questions surface the most valuable information)
- Integration playbooks mature (OAuth flow for Xero is built once, works for every client)
- Agent reasoning improves (Finance Agent learns what "good" cash flow management looks like across 50 businesses)

**The management bot (Phase 5 in original pipeline design) is the ultimate moat:**

When a founder can say:
- "Angus, my SEO person just quit, redistribute their tasks"
- "Angus, we just lost our biggest client, re-forecast cash flow"
- "Angus, I'm thinking about a US expansion, run the scenario"

And the system **actually does it** without developer intervention → that's the moat. No competitor can replicate that by reading a blog post.

---

**End of Architecture Document**
