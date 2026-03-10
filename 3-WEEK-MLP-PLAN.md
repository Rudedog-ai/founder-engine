# Founder Engine: 3-Week MLP Plan
## Leadership Team Output: Vision, Product, Roles, Execution Plan

**Date:** March 10, 2026  
**Team:** CEO (Ruari), CTO, CPO (PM), CFO, CMO, COO  
**Goal:** Ship Minimum Lovable Product in 3 weeks, demo to Richard in Week 4

---

## 🎯 VISION (Company)

### What We're Building
**Founder Engine is the intelligence layer for non-tech founders to become AI-native.**

We read your entire business (Google Drive, Gmail, Slack), extract structured facts across 8 domains, show you exactly what you know and what you're missing, then give you a prioritized plan to fix it.

**We're NOT:**
- ❌ A tool aggregator (not Zapier for AI tools)
- ❌ A CRM replacement (not competing with HubSpot)
- ❌ A CFO replacement (not competing with Nume)

**We ARE:**
- ✅ The diagnostic layer (doctor, not pharmacy)
- ✅ Your source of truth (Knowledge Base of structured facts)
- ✅ Your transformation guide (prioritized plan: fix this, then this, then this)

### Positioning
**Tagline:** "See what your business knows. Fix what it doesn't."

**Customer POV:** "I have 5 years of Google Drive files, scattered emails, endless Slack threads. I don't know what I know. Founder Engine reads it all, shows me exactly what's there, tells me what's missing, and recommends how to fix it—without making me adopt 10 new tools."

### Why This Wins
1. **Focus:** We do ONE thing (diagnosis) exceptionally well, not 8 things poorly
2. **Economics:** 99.6% gross margin (vs 0-66% if we pass through tool costs)
3. **Defensibility:** Our IP is two-pass ingestion + domain framework + Angus orchestration (not 3rd-party integrations)
4. **Scalability:** Recommend tools (affiliate revenue) vs integrate tools (engineering hell)

---

## 📦 PRODUCT (What We Ship in 3 Weeks)

### MLP Scope (Week 1-3)

**Phase 1: INGEST**
- Founder connects Google Drive (folder selection)
- Two-pass smart ingestion runs:
  - Date filter (free) → 70% reduction
  - Scan (free) → List files
  - Haiku filter ($0.0003) → 80% relevant
  - Opus extract ($0.015) → Structured facts
- Output: 50-200 structured facts across 8 domains

**Phase 2: DIAGNOSE**
- 8 lightweight domain agents analyze Knowledge Base:
  - **Finance:** Runway, burn rate, unit economics, cash flow gaps
  - **Sales:** Pipeline health, dormant accounts, win/loss patterns, CRM gaps
  - **Marketing:** CAC/LTV, channel performance, audience insights, attribution gaps
  - **Operations:** Tool waste, process bottlenecks, automation opportunities
  - **People:** Retention, hiring patterns, team health gaps
  - **Product:** Feature adoption, churn analysis, roadmap gaps
  - **Legal:** Risk exposure, compliance gaps, contract insights
  - **Strategy:** Positioning, competitive moat, growth gaps
- Angus orchestrator synthesizes all 8 → Prioritized recommendations

**Phase 3: DEPLOY**
- Show founder:
  - What we found (Knowledge Base by domain)
  - What's missing (gap analysis by domain)
  - What to do (prioritized recommendations)
  - Which tools help (Nume, HappyRobot, item, etc. with affiliate links)
- Founder chooses which recommendations to act on

### MLP Features (Must-Have)

**✅ Folder Selection**
- Founder creates "Founder Engine Data" folder in Google Drive
- Product copies folder ID, ingests ONLY that folder
- 50-100 files (not 10,000)

**✅ Two-Pass Ingestion**
- Edge function already built
- Just deploy to Supabase + test with OYNB

**✅ Knowledge Base Viewer**
- Facts grouped by domain (Finance, Sales, Marketing, etc.)
- Each fact shows: text, confidence score, source, date
- Expandable details: entity, value, source link
- Verification buttons (👍 Correct / 👎 Incorrect)

**✅ 8 Domain Agents (Lightweight)**
- NOT full-featured CFO/CMO/CTO
- Gap identification only: "Here's what you have, here's what's missing"
- Output format: JSON with gaps + recommendations

**✅ Angus Orchestrator**
- Reads all 8 domain agent outputs
- Synthesizes cross-domain insights
- Prioritizes: "Fix this first, then this, then this"
- Outputs transformation plan (30-90 day roadmap)

**✅ DEPLOY UI**
- Show transformation plan
- Link to recommended tools (with affiliate tracking)
- Allow founder to mark "done" or "skip"

### What's NOT in MLP

**❌ Full-Featured Agents**
- Not building AI CFO (recommend Nume)
- Not building voice AI (recommend HappyRobot)
- Not building advanced CRM (recommend item)

**❌ Tool Integrations**
- Not integrating 31 YC companies
- Just recommend them (affiliate links)

**❌ Real-Time Dashboards**
- Not building live Finance dashboard (recommend Nume)
- Just show static facts from ingestion

**❌ Fancy UI**
- Simple, functional only
- Ocean theme, clean layout, no animations

**❌ All 8 Domains Perfect**
- Focus on Finance + Sales first (Week 1-2)
- Add Marketing + Operations (Week 2-3)
- Stub out remaining 4 (People, Product, Legal, Strategy)

---

## 👥 ROLES & RESPONSIBILITIES

### CEO (Ruari) - Commercial Vision

**Vision:**
"We're building the category-defining AI-native transformation platform for SMBs. Not a tool, not a service, a transformation. £20K gets you from chaos to clarity in 30 days."

**Week 1-3 Tasks:**
- [ ] Schedule Richard demo (Week 4, specific date/time)
- [ ] Define success criteria for pilot ("Richard says it's worth £20K")
- [ ] Draft Richard pitch deck (why this is valuable)
- [ ] Prepare investor update (YC network, angels) for Month 2
- [ ] Final scope decisions if team is behind schedule

**Week 4 Goal:** Richard sees demo, says "This is valuable, I want to continue"

---

### CTO - Technical Execution

**Vision:**
"We build the fastest, most accurate business intelligence extraction system in the world. $10 vs $150, 95% signal vs 10% noise. That's our moat."

**Week 1 Tasks:**
- [ ] Deploy two-pass ingestion edge function to Supabase
- [ ] Run database migration (knowledge_elements, ingestion_progress, domain_scores)
- [ ] Test ingestion with OYNB data (50-100 files)
- [ ] Verify facts extracted correctly (manual QA)
- [ ] Fix any accuracy issues

**Week 2 Tasks:**
- [ ] Build 8 lightweight domain agent edge functions:
  - Finance Agent (runway, burn, unit economics)
  - Sales Agent (pipeline, dormant accounts, win/loss)
  - Marketing Agent (CAC/LTV, channels, attribution)
  - Operations Agent (tool waste, processes, automation)
  - People Agent (retention, hiring, team health)
  - Product Agent (adoption, churn, roadmap)
  - Legal Agent (risk, compliance, contracts)
  - Strategy Agent (positioning, moat, growth)
- [ ] Each agent: 100-200 lines, gap identification only
- [ ] Test agents with OYNB Knowledge Base

**Week 3 Tasks:**
- [ ] Build Angus orchestrator edge function (synthesize 8 agents)
- [ ] Build Knowledge Base viewer component (facts by domain)
- [ ] Build DEPLOY UI component (recommendations with affiliate links)
- [ ] Deploy to Vercel (main branch = live)
- [ ] End-to-end test with OYNB

**Contractor Decision:** Hire if behind schedule (£5-10K budget for 3 weeks)

**Week 4 Goal:** Richard sees working product, all features functional

---

### CPO (Product Manager) - Product Strategy

**Vision:**
"We're not building features, we're designing a transformation journey. Every click, every insight, every recommendation moves the founder from chaos to clarity."

**Week 1 Tasks:**
- [ ] Define domain agent specs (gap identification framework for each domain)
- [ ] Design Knowledge Base UI (wireframes: facts by domain, confidence, sources)
- [ ] Design DEPLOY UI (wireframes: recommendations, affiliate links, tracking)
- [ ] Write Richard demo script (30-min flow: INGEST → DIAGNOSE → DEPLOY)
- [ ] Create quality checklist (what must work before Richard demo)

**Week 2 Tasks:**
- [ ] Review domain agent outputs (are gaps identified correctly?)
- [ ] Refine agent prompts (if output quality is poor)
- [ ] Test Knowledge Base UI with OYNB data (is it useful?)
- [ ] Test DEPLOY UI flow (are recommendations clear?)
- [ ] Document assumptions (what we believe but haven't validated)

**Week 3 Tasks:**
- [ ] Write OYNB test plan (what to validate, success criteria)
- [ ] Run OYNB test (act as founder, follow full flow)
- [ ] Document bugs/issues (prioritize: critical vs nice-to-have)
- [ ] Write Richard onboarding doc (how to use the product)
- [ ] Prepare feedback survey (post-demo questions for Richard)

**Week 4 Goal:** Richard has smooth experience, minimal friction, sees value

---

### CFO - Financial Strategy

**Vision:**
"We have the best unit economics in B2B SaaS. 99.6% gross margin on core product + recurring affiliate revenue. Profitable from Day 1."

**Week 1 Tasks:**
- [ ] Model unit economics:
  - Revenue: £20K per engagement
  - Cost: £75 per engagement (Anthropic + Supabase + Composio)
  - Margin: 99.6%
- [ ] Model affiliate revenue:
  - Nume: $50/mo × 20-30% = $10-15/mo per customer
  - HappyRobot: $200/mo × 20-30% = $40-60/mo per customer
  - item: $100/mo × 20-30% = $20-30/mo per customer
- [ ] Build ROI calculator for customers (show £20K → £60-100K value)

**Week 2 Tasks:**
- [ ] Set up affiliate partnerships:
  - Reach out to Nume (request partner program)
  - Reach out to HappyRobot (YC network intro)
  - Reach out to item (request affiliate terms)
- [ ] Set up affiliate tracking (UTM codes, conversion tracking)
- [ ] Create commission payout plan (when/how we get paid)

**Week 3 Tasks:**
- [ ] Track OYNB test costs (actual Anthropic + Supabase spend)
- [ ] Build customer dashboard (show Richard: "We saved you X hours, Y cost")
- [ ] Model scaling economics (10 customers, 50 customers, 100 customers)
- [ ] Prepare fundraising deck (if Richard pilot succeeds, raise £500K-1M)

**Week 4 Goal:** Richard sees clear ROI (£20K → £60K+ value)

---

### CMO - Go-to-Market Strategy

**Vision:**
"We own the category: AI-native business transformation. Every SMB founder who wants to escape chaos knows Founder Engine is the answer."

**Week 1 Tasks:**
- [ ] Positioning doc: "See what your business knows. Fix what it doesn't."
- [ ] Richard pitch deck (why £20K is worth it):
  - Slide 1: Your business is scattered (Drive, Gmail, Slack)
  - Slide 2: You don't know what you know (chaos)
  - Slide 3: We extract structured facts (clarity)
  - Slide 4: We show you what's missing (gaps)
  - Slide 5: We tell you how to fix it (plan)
  - Slide 6: £20K investment → £60-100K value
- [ ] Create case study template (OYNB → Richard)

**Week 2 Tasks:**
- [ ] Write affiliate landing pages:
  - "Finance gaps? Try Nume" (link with tracking)
  - "High call volume? Try HappyRobot" (link with tracking)
  - "CRM chaos? Try item" (link with tracking)
- [ ] Draft Richard testimonial questions (post-pilot survey)
- [ ] Plan co-marketing with Nume/HappyRobot/item (if pilots succeed)

**Week 3 Tasks:**
- [ ] Write OYNB case study (internal proof point)
- [ ] Create Richard onboarding email (welcome, what to expect)
- [ ] Draft Richard follow-up sequence (Day 1, 7, 14, 30 after demo)
- [ ] Plan ICP definition (who's Richard #2-10?)

**Week 4 Goal:** Richard sees clear value prop, refers 1-2 founder friends

---

### COO - Operational Execution

**Vision:**
"We deliver flawless transformations, every time. OYNB test proves it works, Richard pilot proves founders love it, next 10 scale the playbook."

**Week 1 Tasks:**
- [ ] Define OYNB test plan:
  - Connect OYNB Google Drive
  - Select 50-100 business-relevant files
  - Run ingestion
  - Verify facts extracted (accuracy >90%)
  - Run 8 domain agents
  - Verify gaps identified correctly
  - Check Angus synthesis
  - Verify recommendations make sense
- [ ] Create quality checklist (what must work before Richard)

**Week 2 Tasks:**
- [ ] Document Richard engagement playbook:
  - Day 1: Onboarding call (30 min)
  - Day 1-7: Ingestion (founder selects folder, we run ingestion)
  - Day 8: Knowledge Base review (show facts, verify accuracy)
  - Day 9-14: Domain agent analysis (8 agents run, find gaps)
  - Day 15: Angus synthesis (prioritized recommendations)
  - Day 16-30: DEPLOY support (help Richard adopt tools)
- [ ] Define success metrics (what does "success" look like?)

**Week 3 Tasks:**
- [ ] Run OYNB test (end-to-end, full flow)
- [ ] Document bugs/issues (critical vs nice-to-have)
- [ ] Create Richard demo checklist (everything that must work)
- [ ] Prepare contingency plan (if demo breaks, what's Plan B?)
- [ ] Write post-engagement survey (measure Richard's satisfaction)

**Week 4 Goal:** Richard has smooth experience, zero technical issues

---

## 📅 3-WEEK EXECUTION PLAN

### Week 1: Build Foundation (Mar 10-16)

**Monday-Tuesday: Deploy Ingestion**
- CTO: Deploy two-pass ingestion to Supabase
- CTO: Run database migration
- CTO: Test with sample files
- CFO: Model unit economics

**Wednesday-Thursday: Test Ingestion with OYNB**
- COO: Prepare OYNB test data (50-100 files)
- CTO: Run ingestion with OYNB data
- CPO: QA extracted facts (accuracy check)
- CTO: Fix any issues

**Friday: Week 1 Review**
- Team standup: Is ingestion working?
- CEO: Go/no-go decision (continue to Week 2 or fix issues)

**Week 1 Deliverables:**
- ✅ Two-pass ingestion deployed and working
- ✅ OYNB facts extracted (50-200 facts)
- ✅ Accuracy validated (>90%)

---

### Week 2: Build Agents (Mar 17-23)

**Monday-Wednesday: Domain Agents**
- CTO: Build 8 domain agent edge functions (Finance, Sales, Marketing, Ops, People, Product, Legal, Strategy)
- CPO: Write agent specs (gap identification framework)
- CTO: Test agents with OYNB Knowledge Base
- CPO: QA agent outputs (are gaps correct?)

**Thursday: Angus Orchestrator**
- CTO: Build Angus orchestrator (synthesize 8 agents)
- CPO: Test synthesis (are recommendations prioritized correctly?)
- CFO: Set up affiliate partnerships (Nume, HappyRobot, item)

**Friday: Week 2 Review**
- Team standup: Are agents working?
- CEO: Go/no-go decision (continue to Week 3 or fix agents)

**Week 2 Deliverables:**
- ✅ 8 domain agents deployed and working
- ✅ Angus orchestrator deployed
- ✅ OYNB gaps identified correctly

---

### Week 3: Build UI + Test (Mar 24-30)

**Monday-Tuesday: UI Components**
- CTO: Build Knowledge Base viewer (facts by domain)
- CTO: Build DEPLOY UI (recommendations with affiliate links)
- CPO: QA UI (is it usable?)
- CMO: Write Richard pitch deck

**Wednesday: End-to-End Test**
- COO: Run full OYNB test (INGEST → DIAGNOSE → DEPLOY)
- CPO: Document bugs (critical vs nice-to-have)
- CTO: Fix critical bugs
- CMO: Write Richard onboarding email

**Thursday: Final QA**
- Team: Run Richard demo rehearsal
- CPO: Validate every feature works
- COO: Create demo checklist
- CEO: Prepare Richard pitch

**Friday: Week 3 Review**
- Team standup: Are we ready for Richard?
- CEO: Go/no-go decision (demo Week 4 or delay)

**Week 3 Deliverables:**
- ✅ Knowledge Base viewer working
- ✅ DEPLOY UI working
- ✅ OYNB test passed (end-to-end)
- ✅ Team ready for Richard demo

---

### Week 4: Richard Demo (Mar 31-Apr 6)

**Monday: Richard Onboarding**
- CEO: Onboarding call with Richard (30 min)
- Richard connects Google Drive
- Richard selects "Founder Engine Data" folder
- Richard uploads 50-100 files

**Tuesday-Friday: Ingestion**
- Product: Run two-pass ingestion on Richard's data
- Product: Alert team if any issues
- CTO: Monitor ingestion (logs, errors)

**Following Monday: Knowledge Base Review**
- CEO: Show Richard Knowledge Base (facts by domain)
- Richard verifies accuracy
- CPO: Note any feedback

**Following Week: DIAGNOSE + DEPLOY**
- Product: Run 8 domain agents on Richard's data
- Product: Run Angus orchestrator
- CEO: Show Richard transformation plan
- CEO: Walk through recommendations
- Richard decides which to act on

**Week 4 Goal:** Richard says "This is worth £20K, let's continue"

---

## 🎯 SUCCESS METRICS (Week 4)

### Technical Metrics
- ✅ Ingestion completes successfully (no errors)
- ✅ Facts extracted with >90% accuracy (Richard verifies)
- ✅ All 8 domain agents run successfully
- ✅ Angus synthesis produces prioritized recommendations
- ✅ No critical bugs during demo

### Business Metrics
- ✅ Richard says "This is valuable"
- ✅ Richard adopts at least 1 recommendation (Nume, manual action, or tool)
- ✅ Richard refers 1-2 founder friends
- ✅ Richard willing to pay £20K (or pilot pricing)
- ✅ Richard provides testimonial

### Product Metrics
- ✅ Knowledge Base shows 50-200 facts across 8 domains
- ✅ Domain agents identify 10-30 gaps
- ✅ Angus prioritizes top 5 recommendations
- ✅ DEPLOY UI shows affiliate links with tracking
- ✅ Richard completes flow in <2 hours (onboarding to plan)

---

## 🚨 RISK MITIGATION

### Risk 1: Ingestion Doesn't Work with Real Data
**Probability:** 30%  
**Mitigation:** Test with OYNB in Week 1, fix issues before Richard

### Risk 2: Domain Agents Produce Poor Output
**Probability:** 40%  
**Mitigation:** Start with Finance + Sales only, add others if those work

### Risk 3: Richard Sees No Value
**Probability:** 20%  
**Mitigation:** Show OYNB case study first, set expectations, focus on insights not features

### Risk 4: Team Can't Ship in 3 Weeks
**Probability:** 30%  
**Mitigation:** Scope cuts (Finance + Sales only), hire contractor (£5-10K), delay Richard to Week 5

### Risk 5: Affiliate Partnerships Don't Work Out
**Probability:** 50%  
**Mitigation:** Recommend tools anyway (no affiliate links), value is in diagnosis not commissions

---

## 💰 BUDGET (3 Weeks)

### Engineering
- Contractor (optional): £5-10K
- Anthropic API: £50-100
- Supabase: £25-50
- **Total: £5,075-10,150**

### Go-to-Market
- Richard pitch deck: £0 (CEO does it)
- Landing pages: £0 (CMO writes, CTO deploys)
- **Total: £0**

### Operations
- OYNB test: £50 (API costs)
- Richard pilot: £75 (API costs)
- **Total: £125**

**Grand Total: £5,200-10,275**

**Budget Approved:** £10K max (CEO final approval)

---

## ✅ COMMIT

**CEO (Ruari):** I commit to scheduling Richard demo for Week 4 and making final scope decisions if we're behind.

**CTO:** I commit to deploying ingestion (Week 1), building agents (Week 2), building UI (Week 3).

**CPO (PM):** I commit to defining specs, QA, and ensuring Richard has smooth experience.

**CFO:** I commit to modeling economics, setting up affiliates, and showing Richard clear ROI.

**CMO:** I commit to positioning, pitch deck, and case study for Richard.

**COO:** I commit to OYNB test plan, Richard playbook, and quality assurance.

**All:** We commit to shipping MLP in 3 weeks or communicating risks early so we can cut scope.

---

## 🚀 LET'S SHIP

**Next Standup:** Monday, March 10, 9:00 AM GMT  
**First Demo:** OYNB test, Friday March 28  
**Richard Demo:** Week of March 31

**Meeting adjourned. Let's build.** 🦾
