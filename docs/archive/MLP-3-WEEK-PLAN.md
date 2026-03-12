# Founder Engine: MLP 3-Week Plan
## From Leadership Team Meeting → Executable Roadmap

**Date:** March 10, 2026  
**Goal:** Ship Minimum Lovable Product in 3 weeks  
**Demo:** Richard (Chocolate & Love) in Week 4  
**Success Metric:** Richard says "This is worth £20K"

---

## 🎯 VISION

### Company Vision
**"Make every founder AI-native in 30 days"**

We turn scattered, manual businesses into data-driven, AI-assisted operations—without breaking anything, without replacing people, without expensive consultants.

### Product Vision
**"The diagnostic layer for AI-native business"**

We don't compete with Nume (Finance), HappyRobot (Operations), or item (Sales). We're the intelligence layer ABOVE them:
1. INGEST: Read your entire business (Drive, Gmail, Slack)
2. DIAGNOSE: Show what you know + what you're missing (8 domains)
3. DEPLOY: Recommend exactly how to fix gaps (tools, people, processes)

### Market Position
**"See what your business knows. Fix what it doesn't."**

- **Target:** Non-tech founders, £500K-£3M revenue, 10-200 employees
- **Price:** £20K transformation + 20-30% affiliate commission on tool adoptions
- **Differentiator:** Two-pass smart ingestion ($10 vs $150) + 8-domain holistic view

---

## 📦 PRODUCT (MLP Scope)

### What We're Shipping (5 Components)

**1. Two-Pass Smart Ingestion** (CTO lead)
- Date filter (free) → 10,000 files → 3,000 files (70% cut)
- Scan (free) → List remaining files
- Haiku relevance ($0.0003/file) → 3,000 → 600 relevant (20%)
- Opus extraction ($0.015/file) → 600 files → ~550 structured facts
- **Cost:** $10 vs $150 naive (93% savings)
- **Time:** 30 minutes vs 3-4 hours (6x faster)
- **Output:** Structured facts in knowledge_elements table

**2. Knowledge Base Viewer** (CPO lead, CTO build)
- Facts grouped by domain (Finance, Sales, Marketing, Operations)
- Confidence scores (color-coded: green >90%, blue 70-90%, red <70%)
- Source attribution (click to view original doc)
- Search/filter (find specific facts)
- **Goal:** Founder sees "Here's what you know" (transparency builds trust)

**3. 8 Lightweight Domain Agents** (CTO lead, CPO spec)
- **NOT** full-featured CFO/CMO/COO agents
- **YES** gap identification: "You're missing X, here's the impact"
- Each agent: Read Knowledge Base → Identify gaps → Output recommendations
- **Focus:** Start with Finance + Sales (highest ROI), add others Week 2-3

**4. Angus Orchestrator** (CTO build, CEO input)
- Synthesize 8 domain agents
- Prioritize recommendations (high-impact first)
- Generate transformation plan (30-day roadmap)
- **Goal:** "Fix these 3 things first, then these 5, then scale"

**5. DEPLOY UI** (CPO design, CTO build)
- Show recommendations by domain
- Link to recommended tools (Nume, HappyRobot, item) with affiliate tracking
- Estimate cost + ROI for each recommendation
- **Goal:** "Here's how to fix your gaps" (actionable, not vague)

### What We're NOT Shipping (Scope Cuts)

❌ Full-featured Finance Agent (recommend Nume instead)  
❌ Voice AI integration (recommend HappyRobot instead)  
❌ Advanced CRM features (recommend item instead)  
❌ 31 YC tool integrations (recommend, don't integrate)  
❌ Fancy animations, dark mode, mobile optimization  
❌ All 8 domains at once (start with Finance + Sales)  
❌ Automated onboarding (manual for pilot)  

---

## 👥 ROLES & RESPONSIBILITIES

### CEO (Ruari Fairbairns)

**Vision:** Commercial strategy, customer relationships, final decisions

**Week 1 Tasks:**
- [ ] Schedule Richard demo for Week 4
- [ ] Review CPO's domain agent specs (approve scope)
- [ ] Approve affiliate partnership approach (Nume, HappyRobot, item)
- [ ] Write Richard pitch email (why this is worth £20K)

**Week 2 Tasks:**
- [ ] Review CTO's progress (INGEST + Knowledge Base working?)
- [ ] Approve scope cuts if we're behind schedule
- [ ] Prepare Richard demo script (what to show, what to say)

**Week 3 Tasks:**
- [ ] Review OYNB test results (does it work end-to-end?)
- [ ] Final Richard prep (slides, demo environment, pricing discussion)
- [ ] Investor prep (if Richard converts, who do we talk to?)

**Success Metric:** Richard demo scheduled, pitch refined, scope cuts approved if needed

---

### CTO (Engineering Lead)

**Vision:** Build fast, ship quality, no over-engineering

**Week 1 Tasks:**
- [ ] Deploy `two-pass-ingest` edge function to Supabase
- [ ] Run database migration (knowledge_elements, ingestion_progress, domain_scores)
- [ ] Test ingestion with OYNB Drive folder (50-100 files)
- [ ] Verify facts extracted correctly (spot-check 20 facts)
- [ ] Build Knowledge Base viewer (basic: facts grouped by domain)

**Week 2 Tasks:**
- [ ] Build Finance Agent (gap identification: runway, burn, missing dashboard)
- [ ] Build Sales Agent (gap identification: dormant accounts, pipeline gaps)
- [ ] Build Marketing Agent (gap identification: CAC/LTV, channel performance)
- [ ] Build Operations Agent (gap identification: tool waste, process bottlenecks)
- [ ] Each agent: 100-200 lines of code (simple, focused)

**Week 3 Tasks:**
- [ ] Build Angus Orchestrator (synthesize 4 agents, prioritize recommendations)
- [ ] Build DEPLOY UI (show recommendations with affiliate links)
- [ ] Full OYNB test (INGEST → Knowledge Base → Agents → Orchestrator → DEPLOY)
- [ ] Fix critical bugs (anything that breaks the flow)
- [ ] Deploy to production (Vercel main branch)

**Hiring:** Budget £5-10K for contractor if behind schedule

**Success Metric:** OYNB test passes end-to-end, all 5 components working

---

### CPO (Product Lead)

**Vision:** Define what to build, ensure user value, prevent scope creep

**Week 1 Tasks:**
- [ ] Write domain agent specs (Finance, Sales, Marketing, Operations)
- [ ] For each agent: What facts to read, what gaps to identify, what to recommend
- [ ] Design Knowledge Base UI (wireframes: facts by domain, confidence, sources)
- [ ] Design DEPLOY UI (wireframes: recommendations with links, cost estimates)
- [ ] Define success criteria for OYNB test (what must work?)

**Week 2 Tasks:**
- [ ] Review CTO's Knowledge Base implementation (does UI match spec?)
- [ ] Write Richard demo script (what to show in each phase)
- [ ] Define engagement playbook (Day 1-30 flow for customers)
- [ ] Create affiliate landing pages (Nume, HappyRobot, item)

**Week 3 Tasks:**
- [ ] Run OYNB test with CTO (does product deliver value?)
- [ ] Document what works / what doesn't (iteration plan for Month 2)
- [ ] Finalize Richard demo flow (INGEST → DIAGNOSE → DEPLOY walkthrough)
- [ ] Write Richard success criteria ("This is worth £20K" = what deliverables?)

**Success Metric:** Clear specs, smooth demo, Richard engagement playbook ready

---

### CFO (Finance Lead)

**Vision:** Prove unit economics, secure affiliate revenue, manage cash

**Week 1 Tasks:**
- [ ] Model unit economics (£20K revenue, £75 cost, 99.6% margin)
- [ ] Calculate 5-year LTV (£20K + affiliate commissions)
- [ ] Research affiliate programs (Nume, HappyRobot, item - do they have them?)
- [ ] Set up tracking (how to attribute tool signups to FE referrals)

**Week 2 Tasks:**
- [ ] Build ROI calculator for customers (show "£20K spend = £60K savings")
- [ ] Reach out to Nume/HappyRobot/item (affiliate partnership discussions)
- [ ] Define commission structure (20-30% of tool subscriptions)
- [ ] Track engagement costs (Anthropic API, Supabase, Composio)

**Week 3 Tasks:**
- [ ] Finalize affiliate agreements (or Plan B: referral links without formal partnership)
- [ ] Build financial dashboard (track: revenue, costs, margin per engagement)
- [ ] Prepare investor deck (if Richard converts, what's the fundraising story?)

**Success Metric:** Clear unit economics, affiliate partnerships initiated, ROI calculator ready

---

### CMO (Marketing Lead)

**Vision:** Position product, acquire customers, prove word-of-mouth

**Week 1 Tasks:**
- [ ] Refine positioning: "See what your business knows. Fix what it doesn't."
- [ ] Write Richard pitch deck (why £20K is worth it)
- [ ] Define ICP (Ideal Customer Profile): Who's next after Richard?
- [ ] Create case study template (OYNB test → Richard pilot)

**Week 2 Tasks:**
- [ ] Write website copy (value prop, how it works, pricing)
- [ ] Create Richard demo slides (visual walkthrough of INGEST → DIAGNOSE → DEPLOY)
- [ ] Build affiliate landing pages (Nume: "FE customers get 20% off first 3 months")
- [ ] Draft social proof (testimonials template for post-Richard)

**Week 3 Tasks:**
- [ ] Finalize Richard pitch (deck + email + demo script)
- [ ] Prepare OYNB case study (internal proof: "Here's how FE analyzed OYNB")
- [ ] Plan post-Richard strategy (if he converts: LinkedIn post, case study, referrals)
- [ ] Identify next 5 prospects (who's similar to Richard?)

**Success Metric:** Compelling pitch, clear positioning, Richard excited to pay £20K

---

### COO (Operations Lead)

**Vision:** Smooth delivery, repeatable process, quality control

**Week 1 Tasks:**
- [ ] Write OYNB test plan (what to test, what success looks like)
- [ ] Define Richard engagement playbook (Day 1-30 step-by-step)
- [ ] Create quality checklist (what must work before Richard demo?)
- [ ] Set up project tracking (Notion/Linear: tasks, blockers, decisions)

**Week 2 Tasks:**
- [ ] Monitor CTO progress (are we on track for Week 3 OYNB test?)
- [ ] Escalate blockers to CEO (scope cuts, contractor hiring, delays)
- [ ] Write post-engagement survey (measure customer success)
- [ ] Document known issues (what to warn Richard about)

**Week 3 Tasks:**
- [ ] Run OYNB test with CTO + CPO (end-to-end validation)
- [ ] Document bugs/issues (critical vs nice-to-have)
- [ ] Prepare Richard demo environment (clean data, working features)
- [ ] Final pre-demo checklist (does everything work?)

**Success Metric:** OYNB test passes, Richard engagement playbook ready, quality bar met

---

## 📅 3-WEEK SPRINT PLAN

### WEEK 1: INGEST + Knowledge Base (Foundation)

**Goal:** Prove we can extract structured facts from Google Drive

**CTO Builds:**
- Deploy two-pass ingestion edge function
- Run database migration
- Test with OYNB Drive (50-100 files)
- Build Knowledge Base viewer (basic UI)

**CPO Defines:**
- Domain agent specs (Finance, Sales, Marketing, Operations)
- Knowledge Base UI design
- DEPLOY UI design
- Success criteria

**CFO Models:**
- Unit economics (£20K - £75 = 99.6% margin)
- Affiliate research (Nume, HappyRobot, item programs)

**CMO Positions:**
- Refine tagline: "See what your business knows. Fix what it doesn't."
- Write Richard pitch deck

**COO Operationalizes:**
- OYNB test plan
- Richard engagement playbook
- Quality checklist

**CEO Approves:**
- Domain agent specs
- Scope cuts if needed
- Schedule Richard demo Week 4

**Week 1 Output:** Two-pass ingestion working, Knowledge Base showing facts, specs approved

---

### WEEK 2: DIAGNOSE (Domain Agents)

**Goal:** Prove we can identify gaps across 4 domains

**CTO Builds:**
- Finance Agent (runway, burn, missing dashboard → recommend Nume)
- Sales Agent (dormant accounts, pipeline gaps → recommend outreach/HappyRobot)
- Marketing Agent (CAC/LTV, channel performance → recommend fixes)
- Operations Agent (tool waste, bottlenecks → recommend automation)

**CPO Guides:**
- Review Knowledge Base UI (does it match spec?)
- Write Richard demo script
- Define engagement playbook

**CFO Executes:**
- Build ROI calculator
- Reach out to Nume/HappyRobot/item for partnerships

**CMO Creates:**
- Website copy
- Demo slides
- Affiliate landing pages

**COO Monitors:**
- Track CTO progress (on schedule?)
- Escalate blockers
- Document issues

**CEO Reviews:**
- Agent output quality (do recommendations make sense?)
- Demo script (is pitch compelling?)

**Week 2 Output:** 4 domain agents working, demo script ready, affiliate outreach started

---

### WEEK 3: DEPLOY + OYNB Test (End-to-End)

**Goal:** Prove full product works (INGEST → DIAGNOSE → DEPLOY)

**CTO Builds:**
- Angus Orchestrator (synthesize 4 agents, prioritize)
- DEPLOY UI (show recommendations with affiliate links)
- Full OYNB test (run end-to-end)
- Fix critical bugs

**CPO Validates:**
- Run OYNB test (does product deliver value?)
- Document what works / what doesn't
- Finalize Richard demo flow

**CFO Finalizes:**
- Affiliate agreements (or Plan B: referral links)
- Financial dashboard
- Investor deck prep

**CMO Prepares:**
- Finalize Richard pitch
- OYNB case study draft
- Post-Richard strategy

**COO Executes:**
- OYNB test with team
- Document bugs (critical vs nice-to-have)
- Richard demo environment ready

**CEO Decides:**
- OYNB test: Pass or iterate?
- Richard demo: Go or delay?
- Scope cuts if needed

**Week 3 Output:** Full product working, OYNB test passed, Richard demo Week 4 confirmed

---

## 🎯 SUCCESS CRITERIA (Definition of Done)

### Product (Technical)
- [ ] Two-pass ingestion processes 50-100 OYNB files in <30 minutes
- [ ] Knowledge Base shows 100+ facts across 4 domains
- [ ] 4 domain agents identify 3-5 gaps each
- [ ] Angus Orchestrator prioritizes recommendations (high-impact first)
- [ ] DEPLOY UI shows tools with affiliate links + cost estimates
- [ ] Zero critical bugs (product doesn't crash or lose data)

### Customer Value (Business)
- [ ] OYNB test reveals insights Ruari didn't know
- [ ] Recommendations are actionable (not vague)
- [ ] ROI calculator shows £20K spend = £60K+ value
- [ ] Pitch deck convinces Richard this is worth £20K
- [ ] Engagement playbook is clear (Day 1-30 flow)

### Team Readiness (Operations)
- [ ] CTO can run ingestion for any customer
- [ ] CPO can demo product confidently
- [ ] CFO can explain unit economics + affiliate model
- [ ] CMO can pitch Richard and close deal
- [ ] COO can manage customer engagement end-to-end
- [ ] CEO can decide: go/no-go on Richard demo

---

## 🚨 RISKS & MITIGATIONS

### Risk 1: Two-pass ingestion doesn't work with real data
**Probability:** Medium (30%)  
**Impact:** Critical (blocks everything)  
**Mitigation:** Test with OYNB in Week 1. If fails, debug immediately. Contractor help if needed.

### Risk 2: Domain agents don't find meaningful gaps
**Probability:** Medium (40%)  
**Impact:** High (product has no value)  
**Mitigation:** CPO spot-checks agent output in Week 2. If generic/obvious, refine prompts.

### Risk 3: Can't ship all 4 agents in Week 2
**Probability:** High (50%)  
**Impact:** Medium (can demo with 2 agents)  
**Mitigation:** Start with Finance + Sales only. Add Marketing + Operations if time permits.

### Risk 4: Richard says "Not worth £20K"
**Probability:** Medium (30%)  
**Impact:** High (business model fails)  
**Mitigation:** ROI calculator shows clear value. Offer pilot pricing (£5K for INGEST only, £15K for full).

### Risk 5: Affiliate partnerships don't materialize
**Probability:** Low (20%)  
**Impact:** Low (recommend tools anyway, no commission)  
**Mitigation:** Plan B = referral links without formal partnership. Core value is diagnosis, not commission.

---

## 🎬 WEEK 4: RICHARD DEMO

**Goal:** Richard says "This is worth £20K, let's do it"

**Demo Flow (60 minutes):**

**0-10 min: The Problem**
- "Richard, you run Chocolate & Love. You have Drive, Gmail, Slack, Xero. But do you KNOW what your business knows?"
- "Most founders can't answer: What's our runway? Where are we overspending? Which customers are about to churn?"
- "That's not because you're bad at business—it's because the data is scattered."

**10-25 min: INGEST Phase**
- "We connected to your Drive folder (with permission)."
- "Here's what we found: 87 files over last 24 months."
- "Our two-pass system filtered to 42 relevant files, extracted 156 structured facts."
- "Let me show you the Knowledge Base..."
- [Demo: Facts grouped by domain, confidence scores, source links]

**25-40 min: DIAGNOSE Phase**
- "Now here's where it gets interesting. We ran 4 domain agents:"
- **Finance Agent:** "You have 8.3 months runway, burning £42K/month. Missing: real-time dashboard."
- **Sales Agent:** "You have 73 dormant accounts worth ~£180K ARR. Missing: reactivation workflow."
- **Marketing Agent:** "Your CAC is £650, LTV is £580. You're losing money on every customer. Missing: channel analysis."
- **Operations Agent:** "You're paying for 12 SaaS tools, using 7. Waste: £3,600/year. Missing: tool audit."
- [Demo: Each agent's output, gaps identified]

**40-50 min: DEPLOY Phase**
- "Angus (our orchestrator) synthesized these findings and prioritized:"
- **Priority 1 (Critical):** Fix Marketing CAC/LTV (stop the bleeding)
- **Priority 2 (High-Impact):** Reactivate 73 dormant accounts (£180K opportunity)
- **Priority 3 (Quick Win):** Cut 5 unused SaaS tools (save £3,600/year)
- "Here are our recommendations:"
  - Finance: "You need real-time dashboard → Try Nume (£50/month)"
  - Sales: "You need reactivation workflow → Try HappyRobot (£200/month) OR manual outreach"
  - Marketing: "Fix CAC/LTV before scaling → Audit Ads spend, test cheaper channels"
  - Operations: "Cancel unused tools → List provided, save £3,600/year"

**50-55 min: ROI**
- "Here's the math:"
- "You pay us: £20K"
- "You save: £3,600/year (tool waste) + £180K (dormant accounts) = £183K+ over 12 months"
- "ROI: 9.15x in Year 1"
- "Plus you get the Knowledge Base (your data, forever), the transformation plan (30-day roadmap), and tool recommendations (optional, you choose)."

**55-60 min: Close**
- "Questions?"
- "If this makes sense, let's start. We'll onboard you next week, run ingestion, deliver your diagnosis in 2 weeks."
- "£20K, one-time. Tools are optional (£50-500/month, your choice)."
- "Deal?"

---

## 📊 METRICS (How We Measure Success)

### Week 3 (OYNB Test)
- [ ] Ingestion completes in <30 minutes ✅
- [ ] 100+ facts extracted ✅
- [ ] 4 agents identify 3-5 gaps each ✅
- [ ] Angus prioritizes recommendations ✅
- [ ] DEPLOY UI shows actionable tools ✅

### Week 4 (Richard Demo)
- [ ] Richard attends demo ✅
- [ ] Richard sees value in diagnosis ✅
- [ ] Richard asks "How do I get started?" ✅
- [ ] Richard commits to £20K (or £5K pilot) ✅

### Month 2 (Post-Richard)
- [ ] Richard engagement completes (30 days)
- [ ] Richard NPS score >8 (would recommend)
- [ ] Richard adopts 1-3 recommended tools
- [ ] Richard provides testimonial
- [ ] Richard refers 1-2 founder friends

### Month 3-6 (Scale)
- [ ] 10 paying customers (£200K revenue)
- [ ] 99.6% gross margin (£75 cost per engagement)
- [ ] 50% adopt recommended tools (£5-15K/year affiliate revenue)
- [ ] Word-of-mouth: 3-5 inbound referrals/month

---

## 💰 FINANCIAL PROJECTIONS

### Year 1 (10 Customers)
**Revenue:**
- Transformations: 10 × £20K = £200K
- Affiliate commissions: 5 customers × £150/month × 12 months = £9K
- **Total: £209K**

**Costs:**
- Engagement delivery: 10 × £75 = £750
- Contractor: £10K (3 weeks)
- SaaS (Supabase, Anthropic, Vercel): £2,400/year
- **Total: £13,150**

**Profit: £195,850 (93.7% margin)**

### Year 2 (50 Customers)
**Revenue:**
- Transformations: 50 × £20K = £1M
- Affiliate commissions: 25 customers × £150/month × 12 months = £45K
- **Total: £1.045M**

**Costs:**
- Engagement delivery: 50 × £75 = £3,750
- Team: £150K (hire PM + engineer)
- SaaS: £12,000/year
- **Total: £165,750**

**Profit: £879,250 (84.1% margin)**

---

## 🎯 FINAL COMMITMENTS

**CTO:** "I'll deliver all 5 components in 3 weeks. If I'm behind, I'll hire a contractor."

**CPO:** "I'll define clear specs, prevent scope creep, and ensure product delivers value."

**CFO:** "I'll prove unit economics, secure affiliate revenue, and manage cash."

**CMO:** "I'll position the product, pitch Richard, and prove word-of-mouth works."

**COO:** "I'll ensure smooth delivery, repeatable process, and quality bar."

**CEO (Ruari):** "I'll make final decisions, manage Richard relationship, and cut scope if needed. Let's ship this."

---

**END OF PLAN. SHIP IN 3 WEEKS. 🚀**
