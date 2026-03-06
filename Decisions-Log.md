# Founder Engine — Decisions Log
**Last updated: March 2026 — Post Happy Sprint Session**
*Add every architectural and product decision here. Never delete entries.*

---

## March 2026

**[Mar 2026] — Core positioning: total transformation, not subscription tool**
Context: Early builds focused on intelligence subscription tiers.
Decision: Founder Engine is a total business transformation partner. Ingest → Diagnose → Deploy → Train → Leave.
Rationale: Aligned with Sequoia thesis. Scale With Systems model proven at £20–25k. Better margin, retention, referral mechanics.
Impact: Business model, pricing, all marketing copy.
Status: ACTIVE

**[Mar 2026] — Angus architecture: synthesises never originates**
Context: Risk of Angus hallucinating financial data or business facts.
Decision: Angus reads from certified source tools only. Never invents numbers. Every fact cited with source. Read-only from all connected tools.
Rationale: Resolves trust and compliance objection in one sentence.
Impact: Every Angus prompt, every edge function that feeds context.
Status: ACTIVE

**[Mar 2026] — Document storage: Google Drive replaces Supabase Storage**
Context: Supabase Storage meant documents in two places. Sync problems. GDPR exposure.
Decision: Client connects Google Drive. We create "Founder Engine" folder in their Drive. We read on demand. Never copy or store.
Rationale: Client controls their data completely. No GDPR exposure. No sync problem.
Impact: All document ingestion, RAG pipeline, onboarding flow.
Status: ACTIVE

**[Mar 2026] — OAuth scope: drive.file not drive**
Decision: drive.file scope only — access limited to files we create and files client explicitly shares.
Rationale: Minimum necessary access. Client trust. GDPR.
Status: ACTIVE

**[Mar 2026] — Supabase Storage coexists during transition**
Decision: Both run in parallel. DO NOT remove Supabase Storage upload until Google Drive pipeline has been live through at least one full client engagement.
Status: ACTIVE

**[Mar 2026] — knowledge_chunks (pgvector) runs alongside existing knowledge_base**
Decision: Build knowledge_chunks as new layer. Run both in parallel. Migrate Angus to read from chunks when stable. Deprecate knowledge_base post Sprint 3.
Status: ACTIVE — monitor after C&L engagement

**[Mar 2026] — Correction layer: separate table, always wins**
Decision: knowledge_corrections sits between raw data and Angus context. Active correction always overrides source document. New document ingest never overwrites active correction.
Impact: Every Angus read path. Implemented in Sprint 4.
Status: ACTIVE — SHIPPED

**[Mar 2026] — Build approach: sprint not monolith**
Context: Initial brief described 3–4 months of work as one document. Happy correctly identified monolith risk.
Decision: Six sprints. Each independently testable before next begins.
Result: All 6 sprints completed in one session. Zero build errors.
Status: COMPLETE

**[Mar 2026] — Multi-mode question answering: four equal modes**
Decision: Voice conversation, live transcription, written in platform, email. All four equal options. Platform remembers preference.
Rationale: Founders are time-poor. Meeting them in their preferred mode removes every excuse not to complete onboarding.
Status: ACTIVE — SHIPPED

**[Mar 2026] — No file over 200 lines; one edge function per job**
Context: MoreScreen.tsx was already 700+ lines before sprint work.
Decision: Every new file <200 lines. OnboardingFlow.tsx is routing only. Edge functions single-responsibility.
Result: Enforced throughout all 6 sprints. MoreScreen refactored.
Status: ACTIVE — ongoing standard

**[Mar 2026] — First client: Chocolate and Love, free**
Decision: Richard at Chocolate and Love is client zero. Free engagement. Document time spent per stage to inform pricing model.
Status: ACTIVE — engagement not yet started, product now ready

**[Mar 2026] — Revenue model: TBD post Chocolate and Love**
Decision: Do not lock in revenue model until C&L produces time and impact data.
Options: £20–50k lump sum | £3–5k/month retainer | rev share | hybrid.
Status: ACTIVE — revisit after first C&L session

**[Mar 2026] — SEIS round: £150–250k, 10–20 UK angels**
Decision: Target founders as angels. File HMRC Advance Assurance immediately (4–8 week process).
Status: ACTIVE — Ruari to file this week

**[Mar 2026] — Market Intelligence RAG: Perplexity daily crawl, 30 sources**
Decision: Daily crawl via Perplexity API across 30 curated sources (see Market-Intelligence-RAG-Sources.md). Sources span 5 categories: practitioners, tool reviews, case studies, SME research, tool-specific blogs.
Rationale: Makes Angus a cutting-edge expert on AI transformation, not a static knowledge base.
Status: ACTIVE — sources identified, pipeline build queued for post-C&L

**[Mar 2026] — Working docs live in Google Drive folder 1rFvmIe0dQuPLEluh36u6gBNqvFIv0rT1**
Decision: All Founder Engine working docs (CLAUDE.md, Architecture.md, Product-Status.md, Decisions-Log.md, briefs, RAG sources) stored in Ruari's Google Drive folder. Claude (architect) produces updated docs each session. Happy reads CLAUDE.md before every build session.
Status: ACTIVE — folder live, docs uploaded



---

## Session 8 Decisions — 06 March 2026

---

### Decision 14: The Frigate Model — Don't Build Cannons, Bolt Them On

**Decision:** Founder Engine will not build proprietary SEO tools, social listening tools, or financial analytics. Instead it will integrate best-in-class third-party tools via API and agency licences, presenting their data through the Founder Engine interface with Angus as the intelligence layer.

**Context:** The conversation started with "should we build SEO into the platform?" and evolved into a much sharper answer: we are a platform that makes other tools usable, not a tool builder.

**Rationale:**
- Building a competitive SEO tool would take 2+ years and tens of millions
- Best-in-class tools already exist (SearchAtlas, Semrush, Mention, DataForSEO)
- Founders don't want more tools — they want outcomes
- Angus as the interface means the underlying tool is invisible

**Impact:** Defines the entire platform architecture. Every new domain gets the same treatment: find the best tool, get an agency licence, bolt it on, let Angus present the output.

**Status:** ACTIVE — core architectural principle

---

### Decision 15: Every Integration Has Two Jobs

**Decision:** Every tool integration must serve two purposes: (1) onboarding enrichment — fires automatically on signup to show instant value, and (2) ongoing usage — the founder uses the tool through Founder Engine to replace something they were doing manually or paying an agency to do.

**Context:** The risk with API integrations is that they become expensive data sources that don't justify their cost. Two-job rule ensures every integration earns its place.

**Rationale:** Onboarding-only integrations are a cost with no ongoing retention benefit. Ongoing-only integrations create no "wow" moment. Both together create a compounding value loop.

**Impact:** Changes how every integration is specced. DataForSEO isn't just "show domain score on signup" — it's also "draft blogs from keyword data" and "run weekly SEO audit."

**Status:** ACTIVE — applies to every future integration

---

### Decision 16: The Partner Channel Model

**Decision:** Tool integrations will be built as channel partnerships where possible. Founder Engine holds the agency licence, the founder sits underneath it during engagement, then takes their own subscription at the LEAVE stage. Founder Engine earns partner rev share passively post-engagement.

**Context:** Ruari identified that the TRAIN → LEAVE methodology creates a natural handoff moment that can be monetised via referral/rev share.

**Rationale:**
- Partners get free, trained, committed clients — strong incentive to say yes
- Founders get a better deal than going direct (we negotiate agency rates)
- Founder Engine earns subscription revenue during engagement AND passive income after
- Creates a fundamentally different and more defensible business than pure SaaS

**Impact:** Transforms the business model from subscription-only SaaS to managed services + SaaS + passive partner channel. Better unit economics, better defensibility.

**Status:** ACTIVE — principle established, partnerships not yet initiated

**First partnership to pursue:** SearchAtlas (when at 3+ clients to show traction)

---

### Decision 17: Intelligence Enrichment APIs — Priority Order

**Decision:** The intelligence enrichment stack will be built in this order:

1. DataForSEO (pay-per-call, fills Marketing domain, no monthly seat cost) — Sprint 3
2. NewsAPI (£50/mo, fills Strategy domain with press/government/articles) — Sprint 3
3. Listen Notes (£50/mo, podcast appearances, founder profile) — Sprint 3
4. Mention API (£40/mo, social listening, brand mentions) — Sprint 4
5. Semrush Agency API (£500/mo, only when 10+ clients justify it) — Sprint 6+

**Rationale:** DataForSEO + NewsAPI at ~£80/mo fills two full domains automatically on every new signup. No document upload required. Maximum impact for minimum cost at early stage.

**Status:** ACTIVE — Sprint 3 will build the enrich-company edge function

---

### Decision 18: Scrape Loading Indicator Is a Trust Moment, Not a UX Detail

**Decision:** The post-signup loading screen showing API calls in progress is a product feature, not a technical placeholder. It should show named progress steps ("Researching [company name] online", "Checking your online presence", "Finding press coverage") that map to real API calls completing.

**Context:** Current experience after signup is a blank dashboard with no feedback. Founders don't know anything is happening.

**Rationale:** The loading screen is the product's first proof that it works. If a founder sees Angus finding 12 press articles about their company before they've uploaded a single document, the value proposition is proven in 30 seconds.

**Status:** PENDING — brief written, not yet built

---

### Decision 19: Domain Name Strategy

**Decision:** Buy `founder-engine.com` now ($11/year, protect the name). Hold `founder-engine.co.uk` (already owned on IONOS). Skip `founder-engine.ai` (£80/year) until name is confirmed post-C&L feedback. `founderengine.com` and `founderengine.ai` are already taken.

**Context:** Product may change name based on C&L feedback. No point spending on .ai until name is confirmed.

**Status:** ACTIVE — founder-engine.com purchase pending

---

### Decision 20: Landing Page Strategy — One Page, Full Job

**Decision:** The Founder Engine marketing site will be a single-page site built by Lovable. It will explain the product, walk through the journey, and convert. All CTAs link to the live app. No separate pages.

**Sections in order:** Hero → Problem → Product Explanation → Meet Angus → The Journey → Intelligence Score → Use Cases → Pricing → Social Proof → Why Now → Final CTA → Footer

**Design direction:** Dark, premium, near-black. Electric blue accent. Vercel/Linear aesthetic. No stock photos.

**Copy rule:** Never use: AI-powered, cutting-edge, revolutionary, seamless, leverage. Always be specific. Write for the founder's day, not the investor's thesis.

**Status:** BRIEF WRITTEN — ready for Lovable

---

### Decision 21: The "Walk Away" Vision Is Concrete, Not Theoretical

**Decision:** The LEAVE stage of the methodology has a concrete mechanism: the founder owns their tool subscriptions (SearchAtlas, Mention, Xero etc.), Angus remains as their permanent intelligence layer, and Founder Engine collects passive partner rev share. This is achievable now, not in 3 years.

**Context:** Discussion of "fully autonomous" vs "human-accelerated" tools. Conclusion: full autonomy is not the goal and not the honest sell. The goal is a founder who is more capable than before, using tools they understand, with Angus as their analyst.

**Rationale:** More honest, more achievable, more sellable. Founders are not looking for magic — they're looking for leverage. "Cancel your agencies" is a better pitch than "fully autonomous AI."

**Status:** ACTIVE — informs all marketing copy and product positioning
