# Founder Engine Leadership Team Meeting
## Strategy Session: Vision, Product, 3-Week MLP Plan

**Date:** March 10, 2026 (7:00 AM GMT)  
**Location:** Virtual (Founder Engine HQ)  
**Attendees:**
- **CEO (Ruari)** - Founder, commercial vision, customer relationships
- **CTO** - Technical architecture, engineering execution
- **CPO (Product Manager)** - Product strategy, user experience, roadmap
- **CFO** - Financial model, unit economics, cash management
- **CMO** - Go-to-market, positioning, customer acquisition
- **COO** - Operations, delivery, scaling execution

**Agenda:**
1. Review current state (PM critique, YC research, costs)
2. Define vision (what are we actually building?)
3. Determine MLP scope (what can we ship in 3 weeks?)
4. Assign roles and responsibilities
5. Commit to 3-week plan

---

## Meeting Transcript

**CEO (Ruari):** Right, let's get to it. Angus did great research—found 31 YC companies we could integrate. But my gut says that's bollocks. Too expensive, too complex, not focused. PM agrees. So what ARE we building?

**CPO (PM):** I'll be direct—the "bolt together" strategy is a C-. Here's why: if we integrate HappyRobot, Nume, item, and the others, we're looking at £750-2,250/month per customer in pass-through costs. That's £56-128K over 5 years. Customer thinks they're paying £20K, then gets hit with ongoing tool subscriptions. They'll cancel.

**CFO:** Hold on—let me get the economics straight. If we charge £20K one-time and pass through £2,250/month in tools for 3 months, that's £6,750 in costs. Margin is £13,250 or 66%. That's... actually not terrible?

**CPO:** Except the tools don't stop after 3 months. Customers need ongoing subscriptions or the transformation doesn't stick. Who pays? If they do, they're angry. If we do, we lose money. Either way, we fail.

**CTO:** Plus, I'd spend 2 years building 31 integrations. That's 2-3 weeks per integration, managing APIs, webhooks, version changes, failures. We don't have 2 years.

**CEO:** Exactly. HappyRobot raised $62M to build ONE thing. Nume raised £3M to do ONE thing. We're self-funded trying to do EIGHT domains. The math doesn't work.

**CMO:** So what's the positioning? If we're not "the platform that connects everything," what are we?

**CPO:** We're the intelligence layer. We read your Google Drive, extract structured facts across 8 domains, show you what you know and what you're missing, then RECOMMEND the best tools to fill gaps. We don't integrate them—we just point you to them.

**COO:** So we're a diagnostic tool, not a treatment tool?

**CPO:** We're both. INGEST = extraction. DIAGNOSE = analysis. DEPLOY = recommendations. We do all three, but we don't become the tools themselves.

**CEO:** I like it. But here's the question: if we're just recommending Nume for finance, why would Richard pay £20K? Can't he just sign up for Nume himself for £50/month?

**CFO:** Because he doesn't know he needs Nume. He doesn't even know his runway is 6 months or that he's burning £50K/month. We TELL him that, THEN recommend Nume. The value is in the diagnosis, not the prescription.

**CPO:** Exactly. Think of it like a doctor. You don't pay a doctor to give you medicine—you pay them to diagnose what's wrong. THEN you go to the pharmacy (Nume, HappyRobot, item).

**CTO:** Okay, so what do we actually BUILD in the next 3 weeks?

**CPO:** Three things:
1. Two-pass smart ingestion (already built, just deploy and test)
2. Lightweight domain agents (not full CFO, just gap identification)
3. Angus orchestrator (synthesize agents, prioritize recommendations)

**COO:** What about the Knowledge Base UI? Richard needs to SEE what we extracted.

**CPO:** Yes, add that. Four things. But keep it simple—facts grouped by domain, confidence scores, source links. Don't over-engineer.

**CEO:** And we test this with OYNB first, then Richard?

**CPO:** Correct. OYNB is our internal test. If it works, we show Richard. If it doesn't, we iterate.

**CMO:** What's the pitch to Richard? "We'll diagnose your business and tell you which tools to buy"?

**CEO:** No—"We'll read your entire business, show you exactly what you know and what you're missing, then give you a prioritized plan to become AI-native. Some gaps you can fix yourself, some need tools, some need people. We'll tell you which is which."

**CFO:** And the £20K price holds?

**CEO:** Yes. £20K for the diagnosis + plan. If Richard adopts Nume, HappyRobot, or item, we earn 20-30% affiliate commission ongoing. So £20K upfront + recurring revenue.

**CFO:** That's actually a better model. One-time transformation revenue + recurring affiliate revenue. I like it.

**CTO:** Okay, so my 3-week scope is:
1. Deploy two-pass ingestion edge function
2. Build lightweight domain agents (8 of them, simple)
3. Build Angus orchestrator (synthesis + prioritization)
4. Build Knowledge Base viewer (facts by domain)

**CPO:** Add one more: DEPLOY phase UI. Show recommendations with links to tools (affiliate tracking).

**CTO:** Fine. Five things. Can I hire a contractor?

**CEO:** Yes, budget is £5-10K for 3 weeks if it gets us to MLP faster.

**COO:** What about Richard's timeline? When are we showing him?

**CEO:** Week 4. We test with OYNB in Week 3, then Richard demo in Week 4. So we have 3 weeks to build, 1 week to test.

**CPO:** That's tight but doable IF we keep scope ruthlessly focused. No fancy UI, no integrations, just: ingest → extract facts → show gaps → recommend tools.

**CMO:** And the positioning is "AI-native business transformation"?

**CEO:** Yes, but simpler. "We read your business, show you what's missing, tell you how to fix it."

**CMO:** I can work with that. Tagline: "See what your business knows. Fix what it doesn't."

**CFO:** Pricing is £20K one-time + optional tool recommendations (£50-500/month customer's choice)?

**CEO:** Correct. And we earn 20-30% commission on tool adoptions.

**CFO:** What's our cost to deliver one engagement?

**CTO:** Anthropic API: $10-50 per ingestion. Supabase: $10-25/month. Composio: $10-20/month. Total: $30-95 or ~£75.

**CFO:** So £20K revenue, £75 cost, £19,925 margin = 99.6% gross margin. MUCH better than passing through tool costs.

**COO:** Okay, so what's NOT in the MLP? Because you're all talking about 8 domains, but that sounds like a lot.

**CPO:** Good catch. We do NOT build full-featured agents. We build gap identification only:
- Finance: "You have 6 months runway, burn is £50K/month, missing: real-time dashboard → recommend Nume"
- Sales: "200 dormant accounts, missing: reactivation workflow → recommend HappyRobot or manual outreach"
- Marketing: "CAC £800, LTV £600 (upside-down), missing: channel analysis → recommend fixing before scaling"

**CTO:** So each agent is just: read facts from Knowledge Base → identify gaps → output recommendations?

**CPO:** Exactly. 100-200 lines of code per agent, not 2,000. We're not building Nume (full CFO), we're building the layer ABOVE Nume (diagnostics).

**CEO:** I'm sold. Let's commit to this plan. What do each of you need to deliver in 3 weeks?

---

## Role Assignments

**CTO (Engineering Lead):**
- Deploy two-pass ingestion (Week 1)
- Build 8 lightweight domain agents (Week 2)
- Build Angus orchestrator + DEPLOY UI (Week 3)
- Hire contractor if needed (£5-10K budget)

**CPO (Product Lead):**
- Define domain agent specs (gap identification, not full features)
- Design Knowledge Base UI (facts by domain, confidence, sources)
- Design DEPLOY UI (recommendations with affiliate links)
- Write Richard demo script

**CFO (Finance Lead):**
- Model unit economics (£20K revenue, £75 cost, 99.6% margin)
- Set up affiliate partnerships (Nume, HappyRobot, item)
- Track costs per engagement
- Build ROI calculator for customers

**CMO (Marketing Lead):**
- Positioning: "See what your business knows. Fix what it doesn't."
- Richard pitch deck (why £20K is worth it)
- Case study template (OYNB → Richard)
- Affiliate landing pages (Nume, HappyRobot, item)

**COO (Operations Lead):**
- OYNB test plan (Week 3)
- Richard engagement playbook (Day 1-30 flow)
- Quality checklist (what must work before Richard demo)
- Post-engagement survey (measure success)

**CEO (Ruari):**
- Richard relationship (schedule demo Week 4)
- Final decisions (scope cuts if we're behind)
- Fundraising prep (once Richard proves it works)
- Investor updates (YC network, potential angels)

---

## Decisions Made

### ✅ What We're Building (MLP Scope)
1. Two-pass smart ingestion (INGEST phase)
2. Knowledge Base viewer (show extracted facts)
3. 8 lightweight domain agents (gap identification only, NOT full CFO/CMO/etc.)
4. Angus orchestrator (synthesize agents, prioritize recommendations)
5. DEPLOY UI (show recommendations with affiliate links)

### ✅ What We're NOT Building
1. ❌ Full-featured Finance Agent (recommend Nume instead)
2. ❌ Voice AI integration (recommend HappyRobot instead)
3. ❌ Advanced CRM features (recommend item instead)
4. ❌ 31 YC tool integrations (recommend, don't integrate)
5. ❌ Fancy UI (simple, functional only)

### ✅ Business Model
- **Upfront:** £20K transformation engagement
- **Ongoing:** 20-30% affiliate commission on tool adoptions
- **Cost:** £75 per engagement (99.6% gross margin)
- **Target:** 10 customers in 6 months (£200K revenue)

### ✅ Timeline
- **Week 1-3:** Build MLP
- **Week 3:** Test with OYNB
- **Week 4:** Richard demo
- **Month 2:** Iterate based on Richard feedback
- **Month 3-6:** Scale to 10 customers

### ✅ Focus Strategy
- Start with Finance + Sales domains (highest ROI for SMBs)
- Add Marketing + Operations in Month 2
- Add remaining 4 domains (People, Product, Legal, Strategy) in Month 3-6
- Don't try to do all 8 perfectly in Week 1

---

## Meeting Outcome

**CEO:** Alright, we have a plan. CTO builds, CPO defines, CFO models, CMO pitches, COO operationalizes. Three weeks to MLP. No distractions, no scope creep. If we're behind in Week 2, we cut domains, not quality. Questions?

**CTO:** What if two-pass ingestion doesn't work with OYNB data?

**CEO:** We fix it. That's our core IP—it HAS to work.

**CPO:** What if Richard says "I can just sign up for Nume myself, why pay you £20K?"

**CEO:** We show him the diagnosis FIRST. He doesn't know he needs Nume until we tell him his runway is 6 months and trending down. THEN Nume makes sense.

**CFO:** What if affiliate partnerships don't work out?

**CEO:** Plan B: We just recommend tools without affiliate links. We still deliver value (the diagnosis). Affiliate revenue is bonus, not core business model.

**COO:** What if we can't ship in 3 weeks?

**CEO:** We cut scope. Start with Finance + Sales domains only. Ship those, prove value, add the rest later.

**CMO:** What if Richard doesn't convert?

**CEO:** We iterate. This is a pilot, not a sale. If Richard doesn't see value, we haven't solved the problem yet. Back to the drawing board.

**CTO:** Okay, I'm in. Let me start building.

**CEO:** Good. Meeting adjourned. See you all in Week 1 standup.

---

## End of Meeting
