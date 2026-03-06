# Founder Engine — Decisions Log
**Last updated: March 2026**
*Add every architectural and product decision here. Never delete entries. Superseded decisions get a SUPERSEDED tag and a reason.*

---

## Format

```
[Date] — [Decision]
Context: why this came up
Decision: what was decided
Rationale: why
Impact: what it affects
Status: ACTIVE | SUPERSEDED
```

---

## March 2026

**[Mar 2026] — Core positioning: total transformation, not subscription tool**
Context: Early builds focused on an intelligence subscription (Starter/Growth/Scale tiers).
Decision: Founder Engine is a total business transformation partner. Goes in, agentifies functions, trains team, leaves.
Rationale: Aligned with Sequoia thesis — TAM is labour spend not software spend. Scale With Systems model proven at £20–25k. Transformation model has better margin, better retention, better referral mechanics.
Impact: Business model, pitch deck, all marketing copy, pricing model.
Status: ACTIVE

**[Mar 2026] — Methodology: diagnostic decides the sequence, not us**
Context: Early thinking assumed revenue function always first.
Decision: Ingest → Diagnose → Deploy → Train → Leave. The diagnostic produces a ranked bottleneck map. Founder agrees the order of attack. Data decides where to start, not Founder Engine.
Rationale: More compelling sales pitch. Founder can't argue with their own data. More flexible across different business types.
Impact: Onboarding flow, sales narrative, engagement structure.
Status: ACTIVE

**[Mar 2026] — Angus architecture: synthesises never originates**
Context: Risk of Angus hallucinating financial data or making up business facts.
Decision: Angus reads from certified source tools only. Never invents numbers. Every fact cited with source. Read-only from all connected tools.
Rationale: Resolves trust and compliance objection in one sentence. Essential for financial data.
Impact: Every Angus prompt, every edge function that feeds context to Angus.
Status: ACTIVE

**[Mar 2026] — Document storage: Google Drive replaces Supabase Storage**
Context: Supabase Storage meant documents lived in two places. Sync problems. Stale data. GDPR exposure.
Decision: Client connects Google Drive via OAuth. We create "Founder Engine" folder in their Drive. They drag docs in. We read on demand. Never copy or store.
Rationale: Client controls their data completely. No GDPR exposure. No sync problem. Works with existing workflow. Removing file = immediate revocation.
Impact: All document ingestion, RAG pipeline, onboarding flow.
Status: ACTIVE

**[Mar 2026] — OAuth scope: drive.file not drive**
Context: Full Drive access (drive scope) would give us access to everything in client's Drive.
Decision: Use drive.file scope only — access limited to files we create and files client explicitly shares.
Rationale: Minimum necessary access. Client trust. GDPR. Simpler to explain to clients.
Impact: Google Drive OAuth implementation.
Status: ACTIVE

**[Mar 2026] — Supabase Storage coexists during transition**
Context: Can't remove old upload flow until Google Drive pipeline is stable in production.
Decision: Both run in parallel during transition. DO NOT remove Supabase Storage upload until Google Drive pipeline has been live and tested for at least one full client engagement.
Rationale: Safety. No data loss risk during migration.
Impact: Sprint 2 and 3 build approach.
Status: ACTIVE

**[Mar 2026] — knowledge_chunks (pgvector) runs alongside existing knowledge_base**
Context: Existing flat knowledge_base table used by current Angus. Can't break it while migrating.
Decision: Build knowledge_chunks table with pgvector as new layer. Run both in parallel. Migrate Angus to read from chunks when pipeline is stable. Deprecate knowledge_base at Sprint 3 completion.
Rationale: Zero downtime migration. Current Angus keeps working.
Impact: Sprint 2 database and RAG implementation.
Status: ACTIVE

**[Mar 2026] — Correction layer: separate table, always wins**
Context: Multiple data sources create conflicts. Need a clear hierarchy.
Decision: knowledge_corrections table sits between raw data and Angus context window. Corrections checked first on every read path. Active correction always overrides source document. New document ingest never overwrites an active correction.
Rationale: Founder must be able to trust that what they've corrected stays corrected. This is core to the product's reliability.
Impact: Every Angus read path. Sprint 4 implementation.
Status: ACTIVE

**[Mar 2026] — Build approach: sprint not monolith**
Context: Initial brief described 3–4 months of work as one document.
Decision: Six sprints. Each sprint independently testable in production before next begins.
Rationale: Happy (Claude Code) correctly identified monolith risk. Sprinting avoids compounding bugs, keeps the product usable throughout, and allows course correction.
Impact: All build planning and sequencing.
Status: ACTIVE

**[Mar 2026] — Multi-mode question answering**
Context: Voice-only onboarding excluded founders who prefer to write, think asynchronously, or are on the move.
Decision: Four modes — voice conversation with Angus, live transcription, written in platform, email (send questions, reply when ready). All four equal options. Platform remembers preference.
Rationale: Founders are time-poor. Meeting them in their preferred mode removes every excuse not to complete onboarding.
Impact: Sprint 5 implementation. Onboarding completion rates.
Status: ACTIVE

**[Mar 2026] — First client: Chocolate and Love, free**
Context: Need a case study before charging. Methodology needs real-world validation.
Decision: Richard at Chocolate and Love is client zero. Free engagement. Document everything including time spent per stage.
Rationale: Case study is worth more than the fee at this stage. Time data will inform pricing model.
Impact: Revenue timing. The C&L engagement IS the product validation.
Status: ACTIVE

**[Mar 2026] — Revenue model: TBD post Chocolate and Love**
Context: Multiple viable structures — lump sum, monthly retainer, rev share, hybrid.
Decision: Do not lock in revenue model until C&L engagement produces time and impact data. Options remain open: £20–50k lump sum, £3–5k/month retainer, rev share on revenue uplift, or hybrid.
Rationale: Need real data before committing. Wrong pricing model at launch is hard to unwind.
Impact: All investor conversations, pricing page, sales conversations.
Status: ACTIVE

**[Mar 2026] — SEIS round: £150–250k, 10–20 UK angels**
Context: Need runway to reach first 10 paying clients and build advisor network.
Decision: Target angels who are themselves SME founders. File HMRC Advance Assurance immediately (4–8 week process).
Rationale: SEIS gives 50% income tax relief — 50p in £1 for investors. Angels who are founders become distribution channels.
Impact: Fundraising timeline. GTM via angel network.
Status: ACTIVE

