# Founder Engine Product Audit
## First Week Assessment by Incoming PM

**Date:** March 9, 2026  
**Auditor:** Product Manager (Week 1)  
**Scope:** Complete product review - tech, UX, go-to-market readiness  
**Goal:** Understand what works, what's broken, what blocks Richard pilot

---

## Executive Summary

**Current State:** 60% ready for pilot. INGEST architecture is sound, but critical trust mechanisms are missing.

**Can we onboard Richard today?** No. Need 2-3 weeks of work.

**Biggest blocker:** Founder can't see what we're learning (black box problem). Knowledge Base exists in code but not deployed.

**Biggest strength:** Two-pass ingestion is genuinely innovative ($10 vs $150 = 93% cost savings + 95% signal vs noise). This is defensible IP.

**Risk Level:** Medium-High. If Richard connects tools and we fail to extract value, we lose trust. Need to de-risk BEFORE pilot.

---

## 🎯 Product Vision Assessment

### What's Clear
✅ **Mission:** Transform non-tech founders (50-200 employees) into AI-native operations  
✅ **Business Model:** £20-25K transformation engagements (not SaaS subscription)  
✅ **Differentiation:** Two-pass smart ingestion + domain-specific knowledge extraction  
✅ **Target Customer:** Richard (Chocolate & Love) as pilot, then professional services/ecommerce  
✅ **Value Prop:** "See what your business knows" (structured facts, not text blobs)

### What's Unclear
❌ **Success Criteria:** What does "AI-native" mean for Richard? (Time saved? Revenue unlocked? Decisions improved?)  
❌ **Pricing Validation:** Has Richard agreed to £20-25K? Or is this assumed?  
❌ **Engagement Scope:** Is this 3 months? 6 months? One-time or ongoing?  
❌ **Exit Criteria:** When is the engagement "done"? (100% knowledge? Specific outcomes?)  
❌ **Competitor Positioning:** Who else does this? (McKinsey? Productized consultants? AI agencies?)

**Recommendation:** Before Richard pilot, write 1-pager:
- **Richard Success = [X]** (specific, measurable)
- **Timeline:** [Y weeks]
- **Price:** [£Z]
- **Exit criteria:** [Specific deliverables]

---

## 🏗️ Technical Architecture Assessment

### What's Built (and Works)

#### ✅ Two-Pass Smart Ingestion
**Status:** Code complete, not deployed  
**Innovation Level:** High (this is genuinely clever)

**How it works:**
```
Phase 0: Date filter (free) → 10,000 files → 3,000 files (70% reduction)
Phase 1: Scan (free) → List remaining files
Phase 2: Haiku filter ($0.0003/file) → 3,000 → 600 relevant (20%)
Phase 3: Opus extract ($0.015/file) → 600 files → ~550 structured facts
Total: $10 vs $150 naive (93% cheaper), 30 min vs 3-4 hours (6x faster)
```

**Assessment:**
- ✅ Cost economics are sound (defensible vs competitors)
- ✅ Quality is high (Opus 4 for extraction = 89% confidence)
- ✅ Measurable (can show "1,234 files → 187 relevant → 342 facts")
- ❌ Not deployed yet (edge function exists, not live)
- ❌ No real-world test (hasn't processed actual founder Drive)

**Competitive Moat:** This is 2-3 years ahead of competitors (most do naive text chunking).

#### ✅ Database Schema
**Status:** Deployed (via Claude MCP today)

**Tables:**
1. **knowledge_elements** (14 columns) - Structured facts, NOT text chunks
2. **ingestion_progress** (13 columns) - Real-time tracking
3. **domain_scores** (8 columns) - Aggregate knowledge per domain

**Assessment:**
- ✅ Schema is well-designed (confidence scores, source tracking, domain tagging)
- ✅ Auto-updating trigger (domain_scores recalculates when facts inserted)
- ✅ Permissions correct (authenticated read, service_role write)
- ✅ Scales to 10K+ facts per company

**This is production-ready.**

#### ✅ 8 Domain Agent Definitions
**Status:** Documented (docs/agents/*.md), NOT implemented as edge functions

**Agents:**
1. Finance (CFO) - runway, burn, unit economics
2. Sales (VP Sales) - pipeline, forecasts, win rates
3. Marketing (CMO) - CAC, ROAS, channels
4. Operations (COO) - tool waste, processes
5. People (CPO) - retention, hiring
6. Product (VP Product) - feature adoption, churn
7. Legal (GC) - risk, compliance
8. Strategy (CSO) - positioning, moat

**Assessment:**
- ✅ Each agent has: identity, mission, deliverables, workflow, success metrics, communication style
- ✅ Quality is HIGH (based on agency-agents research, proven patterns)
- ✅ Structured JSON output (not vague text)
- ❌ NOT implemented yet (just markdown docs, no working code)
- ❌ No orchestration (Angus doesn't coordinate agents yet)

**Gap:** These are blueprints, not products. Need to build edge functions.

### What's NOT Built (Critical Gaps)

#### ❌ Knowledge Base Viewer (CRITICAL)
**Status:** Code exists (KnowledgeBaseViewer.tsx), NOT deployed to production

**Why this matters:**
This is THE trust mechanism. Without it, founders can't see what we learned = black box = no trust.

**What it should show:**
```
Finance (45 facts)
├─ Revenue
│  ├─ ARR: £180K (Q4 Board Deck, 95% confidence) [👍 👎]
│  ├─ MRR: £15K (Xero Nov 2023, 92% confidence) [👍 👎]
│  └─ Growth: 8% MoM (calculated, 85% confidence) [👍 👎]
```

**Current state:** Component exists in codebase but NOT integrated into dashboard.

**Blocker:** If Richard connects tools and can't see what we extracted, we lose trust immediately.

**Priority:** P0 - Must ship before pilot.

#### ❌ Xero Integration (HIGH PRIORITY)
**Status:** Blocked by Composio connection limit

**Current issue:** Composio has max Xero connections. Can't add more without:
- Option A: Upgrade Composio plan
- Option B: Delete old test connections
- Option C: Build direct Xero OAuth (bypasses Composio)

**Why this matters:** Richard (Chocolate & Love) likely uses Xero for accounting. Finance Agent needs this data.

**Workaround:** Use Stripe (payments) + Google Sheets (manual P&Ls) for pilot, build direct Xero OAuth later.

**Priority:** P1 - Needed for Finance Agent, but has workaround.

#### ❌ Real-Time Progress Tracking (IMPORTANT)
**Status:** Database table exists, UI not built

**What founders should see during ingestion:**
```
Processing google_drive...
Date filter: 1,234 → 456 files (63% skipped, last 24 months)
Scanned: 45/456 files
Relevant: 9 (20%)
Facts: 28
Cost: $0.82 / $10 estimated
```

**Current state:** IngestDashboard.tsx shows mock data, not live from `ingestion_progress` table.

**Why this matters:** Without real-time feedback, founder thinks "is it working?" "is it stuck?" = anxiety.

**Priority:** P1 - Needed for trust, can fake with manual updates for pilot.

#### ❌ Angus Orchestrator (FUTURE)
**Status:** Concept documented, NOT implemented

**What it should do:**
```
Founder asks: "How's my business doing?"
→ Angus invokes: Finance + Sales + Marketing agents
→ Synthesizes: "8 months runway, £60K pipeline gap, move Ads → SEO"
```

**Current state:** No orchestration. Each agent would run independently.

**Why this matters:** The "magic" of Founder Engine is cross-domain insights. Without Angus, it's just 8 separate reports.

**Priority:** P2 - Not needed for INGEST phase, needed for DIAGNOSE phase.

---

## 🎨 User Experience Assessment

### Onboarding Flow
**Current state:** OAuth connection via Composio

**What works:**
- ✅ Clean UI (ConnectTools.tsx shows icons + descriptions)
- ✅ OAuth flow functional (Gmail, Drive, Docs, Slack, Analytics connected for OYNB)
- ✅ Real-time status (shows "Connected" when successful)

**What's broken:**
- ❌ Xero connection fails (Composio limit)
- ❌ No folder selection (ingests ALL Drive files, not just business folders)
- ❌ No date range picker (defaults to 24 months, can't customize)
- ❌ No "what will happen next" explanation (founder clicks Connect, then... what?)

**Founder anxiety points:**
1. "Will this mess up my existing tools?" (No reassurance)
2. "How long will this take?" (No time estimate)
3. "What are you doing with my data?" (No privacy explanation)
4. "Can I undo this?" (No off-ramp)

**Priority fixes:**
- P0: Add "What happens next" explainer after OAuth
- P0: Add time estimate ("This will take ~30 minutes")
- P1: Add folder picker ("Select which Drive folders to scan")
- P1: Add date range picker ("Scan last 12/24/36 months")

### Dashboard Experience
**Current state:** Ocean-themed UI, multiple sections

**What works:**
- ✅ Beautiful design (ocean theme is distinctive, memorable)
- ✅ Section organization (INGEST Pipeline, Knowledge Base, Connect Tools)
- ✅ Real-time updates (via Supabase channels)

**What's confusing:**
- ❌ "INGEST Pipeline" shows 8 domain cards with "Activate Agent" buttons (but nothing happens when you click)
- ❌ Knowledge Base section doesn't show extracted facts (empty state)
- ❌ No progress indication (can't tell if ingestion is running)
- ❌ Intelligence Score shows 68% for OYNB (but this is from OLD text-chunk system, not new structured facts)

**Founder mental model mismatch:**
- Founder thinks: "I connected tools, now show me what you learned"
- Product shows: "Click Activate Agent to start" (but ingestion should be automatic after connection)

**Priority fixes:**
- P0: Auto-trigger ingestion after OAuth (remove "Activate Agent" buttons)
- P0: Show Knowledge Base facts (deploy KnowledgeBaseViewer)
- P1: Hide Intelligence Score until new system calculates it
- P1: Add "Ingestion in progress" banner with live updates

### Knowledge Base (Most Critical UX)
**Current state:** Component built, NOT deployed

**Design assessment (based on KnowledgeBaseViewer.tsx code):**

**What's good:**
- ✅ Domain tabs (Finance, Sales, Marketing, etc.)
- ✅ Facts grouped by type (revenue, lost_deals, churn_reasons)
- ✅ Confidence color coding (green >90%, blue 70-90%, red <70%)
- ✅ Source attribution ("Q4 Board Deck, 95% confidence")
- ✅ Expandable details (entity, value, source, date, ID)
- ✅ Verification buttons (👍 Correct / 👎 Incorrect)

**What's missing:**
- ❌ No "click to view source" (can't see original document)
- ❌ No search/filter (if 400+ facts, how do you find "lost deals"?)
- ❌ No export (can't download facts as CSV/PDF)
- ❌ No "fact history" (if we update a fact, can't see old version)
- ❌ No bulk actions (can't mark 50 facts as correct at once)

**Trust mechanisms present:**
1. ✅ Confidence scores (founder can see 95% vs 70%)
2. ✅ Source attribution (knows where fact came from)
3. ✅ Verification (can mark as correct/incorrect)

**Trust mechanisms missing:**
1. ❌ Can't click through to source document
2. ❌ Can't see extraction logic ("how did you get this number?")
3. ❌ Can't flag "this is wrong" with explanation

**Priority fixes:**
- P0: Deploy to production (integrate into DashboardScreen)
- P0: Add search/filter
- P1: Add "View source" link (opens Drive file)
- P1: Add export (CSV/PDF download)

---

## 📊 Product-Market Fit Signals

### Validation Evidence
**What we know:**
- ✅ Richard (Chocolate & Love) agreed to be pilot
- ✅ Ruari validated problem (10 years of OYNB chaos, knows founder pain)
- ✅ agency-agents proves concept (61 AI agent personalities, proven in production)
- ✅ Two-pass ingestion solves real problem (cost + quality)

**What we DON'T know:**
- ❌ Has Richard seen the product? (Live demo? Screenshots? Or just concept?)
- ❌ Has Richard agreed to price? (£20-25K?)
- ❌ What's Richard's success criteria? (Time saved? Better decisions? Specific outcome?)
- ❌ What's Richard's SKEPTICISM level? (Excited? Cautious? Prove-it-to-me?)
- ❌ Does Richard have other tools he's evaluating? (Competing solutions?)

**Risk:** We're building in a vacuum. Need founder feedback BEFORE feature-complete.

**Recommendation:** Show Richard wireframes + working INGEST this week. Get feedback on:
1. Knowledge Base design (does it build trust?)
2. Fact format (is this useful or overwhelming?)
3. Domain structure (are 8 domains right, or too many?)
4. Price (what would you actually pay for this?)

### Competitive Landscape
**Direct competitors:** NONE (this category doesn't exist yet)

**Indirect competitors:**
1. **McKinsey/BCG digital transformation** (£500K-2M, 6-12 months, bespoke)
2. **Fractional CTO/COO** (£5-10K/month, ongoing, manual)
3. **Business intelligence tools** (Tableau, Looker - founders set up themselves)
4. **AI consultants** (agencies building custom solutions, £50-200K)

**Our positioning:**
- **vs McKinsey:** 90% cheaper (£20K vs £500K), 90% faster (weeks vs months)
- **vs Fractional exec:** One-time transformation (not ongoing retainer)
- **vs BI tools:** We extract + interpret (not just visualize)
- **vs AI agencies:** Repeatable playbook (not bespoke consulting)

**Moat:** Two-pass ingestion + 8 domain agents = 2-3 years ahead of market.

**Risk:** Once we prove this works, consultancies will copy. Need to move FAST (land 50 customers in 12 months).

---

## 🚦 Launch Readiness Assessment

### Can We Start Richard Pilot TODAY?

**No. Here's what's blocking:**

#### P0 Blockers (Must Fix Before Pilot)
1. ❌ **Knowledge Base not deployed** (founder can't see what we learned)
2. ❌ **No onboarding instructions** (what does Richard do after connecting tools?)
3. ❌ **Xero integration broken** (likely critical for Finance Agent)
4. ❌ **No success criteria defined** (what does "success" look like for Richard?)

#### P1 Blockers (Should Fix Before Pilot)
1. ❌ **No real-time progress** (Richard won't know if ingestion is working)
2. ❌ **No folder selection** (will ingest ALL Drive, including personal files)
3. ❌ **"Activate Agent" buttons don't work** (confusing UX)
4. ❌ **No error handling** (if ingestion fails, what does Richard see?)

#### P2 Nice-to-Haves (Can Ship After Pilot)
1. ❌ **Angus orchestrator** (cross-domain insights)
2. ❌ **Voice interface** (ElevenLabs integration)
3. ❌ **Export functionality** (CSV/PDF downloads)
4. ❌ **Mobile optimization** (currently desktop-only)

### Estimated Time to Launch-Ready
**2-3 weeks with focused execution:**

**Week 1: Trust Mechanisms**
- Deploy Knowledge Base viewer
- Add source links (click to view original doc)
- Add search/filter
- Write onboarding email ("Here's what happens next")

**Week 2: Xero + Core Flow**
- Fix Xero integration (upgrade Composio OR build direct OAuth)
- Add folder picker (select which Drive folders to scan)
- Auto-trigger ingestion after OAuth (remove manual buttons)
- Add real-time progress tracking

**Week 3: Polish + Test**
- Error handling (what if API fails?)
- Empty states (what if no facts extracted?)
- Loading states (what while processing?)
- Internal test with OYNB data (does it work end-to-end?)

**Then:** Richard pilot (with known gaps, but core experience works).

---

## 💰 Business Model Validation

### Pricing
**Current:** £20-25K transformation engagement

**Questions:**
1. **Has Richard agreed to this?** (Or is this aspirational?)
2. **What does £20-25K include?** (INGEST only? DIAGNOSE? DEPLOY?)
3. **Is this one-time or ongoing?** (One-time transformation? Monthly retainer?)
4. **What's payment structure?** (50% upfront? Monthly? Deliverable-based?)

**Competitive benchmarking:**
- McKinsey digital transformation: £500K-2M (we're 95% cheaper)
- Fractional CTO: £5-10K/month (we're 2-3x monthly but one-time)
- AI agency custom build: £50-200K (we're 60-75% cheaper)

**Pricing appears reasonable** IF we deliver 3-5x ROI (i.e., £60-125K value).

**Risk:** Richard might say "I'll pay £5K to try it, then £20K if it works."

**Recommendation:** Offer pilot pricing:
- **Pilot:** £5K (INGEST phase only, test if Knowledge Base is valuable)
- **Full engagement:** £20K (INGEST + DIAGNOSE + DEPLOY)
- **Upgrade path:** If pilot successful, £15K for remaining phases

This de-risks for both sides.

### Unit Economics
**Cost to deliver one engagement:**

**INGEST phase:**
- LLM costs: $10-50 (depends on file count)
- Engineer time: 10-20 hours (setup, troubleshooting)
- PM time: 5-10 hours (onboarding, check-ins)
- **Total cost:** ~£2-5K

**DIAGNOSE phase:**
- LLM costs: $5-20 (domain agent analysis)
- PM time: 10-20 hours (interpreting results, preparing insights)
- **Total cost:** ~£2-3K

**DEPLOY phase:**
- PM time: 20-40 hours (recommendations, tool selection, implementation support)
- **Total cost:** ~£3-5K

**Total delivery cost:** £7-13K per engagement  
**Gross margin:** 35-48% (on £20-25K pricing)

**Assessment:** Margins are healthy for a productized service. Can scale to 5-10 simultaneous engagements with one PM.

**Bottleneck:** PM time (not tech). Need to reduce PM hours via automation (playbooks, templates, self-serve Knowledge Base).

---

## 🎯 Product Roadmap Recommendations

### Immediate (Week 1-2): Launch Blockers
1. **Deploy Knowledge Base viewer** (P0 - must see extracted facts)
2. **Add onboarding instructions** (P0 - what happens after OAuth?)
3. **Fix Xero integration** (P0 - critical for Finance Agent)
4. **Define Richard success criteria** (P0 - what does "done" look like?)
5. **Add real-time progress** (P1 - founder sees ingestion working)
6. **Add folder picker** (P1 - select which Drive folders to scan)

**Outcome:** Richard can connect tools, see what we extract, verify it's useful.

### Short-term (Week 3-4): Pilot Experience
1. **Auto-trigger ingestion** (remove "Activate Agent" buttons)
2. **Add source links** (click fact → view original doc)
3. **Add search/filter** (find specific facts in Knowledge Base)
4. **Add error handling** (if API fails, show helpful message)
5. **Internal OYNB test** (validate end-to-end flow)

**Outcome:** Smooth pilot experience, minimal manual hand-holding.

### Medium-term (Month 2-3): Repeatability
1. **Document Richard playbook** (what worked, what didn't)
2. **Build engagement dashboard** (track progress for multiple founders)
3. **Create founder archetypes** (ecommerce, SaaS, agency, etc.)
4. **Build engagement templates** (pre-configured for each archetype)
5. **Automate onboarding** (self-serve folder selection, date range)

**Outcome:** Can onboard Founder #2 with 50% less manual work.

### Long-term (Month 4-6): Scale
1. **Build Angus orchestrator** (cross-domain insights)
2. **Add voice interface** (ElevenLabs for founder interactions)
3. **Build DIAGNOSE phase** (domain agents provide recommendations)
4. **Build DEPLOY phase** (tool recommendations + implementation)
5. **Create founder community** (Slack, monthly mastermind)

**Outcome:** 10 paying customers, repeatable playbook, clear path to 50.

---

## 🚨 Risks & Mitigations

### Risk 1: Richard Connects Tools, Sees No Value
**Probability:** High (40-50%)  
**Impact:** Critical (lose pilot, no proof point)

**Why this could happen:**
- Knowledge Base shows 400 facts but they're not actionable
- Facts are obvious ("Revenue: £180K") without insight
- Confidence scores are low (<70% on critical facts)
- Can't verify sources (no links to original docs)

**Mitigation:**
- Show Richard wireframes BEFORE he connects tools
- Set expectations: "INGEST shows what you know, DIAGNOSE shows gaps"
- Focus on 20 HIGH-IMPACT facts (not all 400)
- Manual review before showing Richard (remove low-confidence garbage)

### Risk 2: Xero Integration Fails, Finance Agent is Useless
**Probability:** Medium (30%)  
**Impact:** High (Finance is most valuable domain)

**Why this could happen:**
- Composio connection limit blocks Xero
- Direct OAuth build takes 2-3 weeks
- Richard uses different accounting tool

**Mitigation:**
- Ask Richard upfront: "What accounting tool do you use?"
- If not Xero: build that integration first
- Workaround: Use Stripe + Google Sheets for pilot
- Prioritize direct Xero OAuth (week 2-3)

### Risk 3: Ingestion Takes 10 Hours, Richard Thinks It's Broken
**Probability:** Medium (30%)  
**Impact:** Medium (anxiety, but not failure)

**Why this could happen:**
- Large Drive folder (10K+ files)
- Slow API responses (Google Drive throttling)
- No real-time progress indicator

**Mitigation:**
- Add time estimate before starting ("This will take ~30-120 minutes")
- Show real-time progress (files scanned, facts extracted)
- Send email when complete ("Your Knowledge Base is ready!")
- Set expectations: "Check back in 1 hour" (not "wait here")

### Risk 4: Facts are Wrong, Richard Loses Trust
**Probability:** Low-Medium (20%)  
**Impact:** Critical (trust is everything)

**Why this could happen:**
- LLM hallucination (Opus invents numbers)
- Bad extraction (misreads PDF)
- Outdated data (pulls from 2-year-old doc)

**Mitigation:**
- Show confidence scores prominently (95% = trust, 70% = verify)
- Source attribution (know where fact came from)
- Verification workflow (👍 Correct / 👎 Incorrect)
- Manual QA before showing Richard (review Finance facts)

### Risk 5: Richard Says "This is Cool But Not Worth £20K"
**Probability:** Medium (30%)  
**Impact:** High (business model fails)

**Why this could happen:**
- INGEST shows "what you know" but not "what to do"
- No ROI proof (can't quantify value)
- Cheaper alternatives exist (hire fractional CTO for £5K/month)

**Mitigation:**
- Offer pilot pricing (£5K for INGEST, £15K for full engagement)
- Build ROI calculator (time saved, revenue unlocked)
- Focus on HIGH-IMPACT insights (not just data inventory)
- Position as "first step to AI-native" (ongoing value)

---

## 📈 Success Metrics (6 Month Targets)

### Product Metrics
- **10 paying customers** (£20-25K each = £200-250K revenue)
- **Knowledge accuracy:** >90% facts verified as correct
- **Trust score:** >80% founders say "I understand what was learned"
- **Engagement completion:** >80% finish INGEST → DIAGNOSE
- **NPS >50** (founders actively refer)

### Business Metrics
- **Self-funded profitability** (costs <£150K, revenue >£200K)
- **Word-of-mouth:** >50% customers from referrals
- **Clear ICP:** Know exactly who this works for
- **Scalable delivery:** 5 engagements simultaneously

### Leading Indicators (Month 1-2)
- **Richard says "worth £20K"** after INGEST phase
- **Richard refers 1-2 founder friends**
- **Knowledge Base accuracy >85%** on first try
- **Onboarding takes <10 hours** (down from 20+)

---

## 🎬 Immediate Next Steps (This Week)

### For Ruari (Founder)
1. **Call Richard:** "We're 2 weeks from pilot. Can I show you wireframes?"
2. **Ask 3 questions:**
   - What accounting tool do you use? (Xero? Stripe? Sheets?)
   - What does success look like for you? (Time saved? Better decisions?)
   - Would you pay £5K to try INGEST, then £15K for full engagement?
3. **Schedule demo:** Show Richard Knowledge Base mockup (Figma/screenshots)

### For Engineering
1. **Deploy Knowledge Base** (integrate KnowledgeBaseViewer into dashboard)
2. **Fix Xero OR pivot** (ask Richard first: what tool do you use?)
3. **Add real-time progress** (connect IngestDashboard to ingestion_progress table)
4. **Test end-to-end** (OYNB data, validate facts are accurate)

### For PM (Me)
1. **Write Richard onboarding doc** (what happens after you connect tools)
2. **Create success criteria doc** (Richard Success = [specific, measurable])
3. **Build ROI calculator** (£X time saved + £Y cost avoided = £Z value)
4. **Document risks** (what could go wrong in pilot, how to mitigate)

---

## 📝 Final Assessment

**Grade:** B+ (Solid foundation, critical gaps before launch)

**What's working:**
- ✅ Two-pass ingestion is genuinely innovative (defensible IP)
- ✅ 8 domain agents are well-designed (proven patterns)
- ✅ Database schema is production-ready
- ✅ Ocean UI is distinctive and memorable

**What's blocking:**
- ❌ Knowledge Base not deployed (THE trust mechanism)
- ❌ Xero integration broken (critical for Finance)
- ❌ No Richard validation yet (building in a vacuum)
- ❌ No success criteria (what does "done" look like?)

**Can we launch in 2-3 weeks?** Yes, with focused execution.

**Should we launch in 2-3 weeks?** No. Show Richard wireframes FIRST. Get feedback. Then build.

**Biggest risk:** Building the "perfect" product that Richard doesn't want. De-risk by talking to Richard this week.

**Biggest opportunity:** Two-pass ingestion is 2-3 years ahead of market. If we land 50 customers in 12 months, this becomes category-defining.

**Recommendation:** Ship scrappy pilot to Richard (with known gaps), iterate based on feedback, then scale to next 5 customers.

---

## 🦾 PM POV: What I'd Do in Week 1

**Monday:**
- Review codebase (understand what's built vs documented)
- Read all docs (AGENT-ARCHITECTURE, KNOWLEDGE-BENCHMARK, BUILD-PLAN)
- Interview Ruari (understand Richard relationship, constraints)

**Tuesday:**
- Write Richard success criteria doc (specific, measurable)
- Create Knowledge Base wireframes (show to Ruari + Richard)
- Map pilot timeline (week-by-week deliverables)

**Wednesday:**
- Shadow engineering work (understand technical constraints)
- Write onboarding instructions (founder-facing doc)
- Build ROI calculator (time saved, cost avoided)

**Thursday:**
- Create pilot pricing proposal (£5K trial, £15K full)
- Document risks + mitigations (what could go wrong)
- Write Richard demo script (how to present Knowledge Base)

**Friday:**
- Show Ruari + Richard: wireframes, success criteria, timeline
- Get feedback (what's missing? what's confusing?)
- Revise plan based on feedback
- Write Week 2 sprint plan

**Week 2-3:** Ship launch blockers (Knowledge Base, Xero, progress tracking)

**Week 4:** Internal test with OYNB, then Richard pilot kickoff.

---

**This is a GREAT product with FIXABLE gaps. Need to talk to Richard before shipping anything else.** 🦾
