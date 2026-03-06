# CLAUDE.md — Founder Engine
## Read this before every session. Update it after every build.

**Repo:** github.com/Rudedog-ai/founder-engine
**Prod:** founder-engine-seven.vercel.app
**Working docs folder:** Google Drive `1rFvmIe0dQuPLEluh36u6gBNqvFIv0rT1`

---

## Current State — March 2026

**All 6 sprints complete. 3 commits ahead of origin. Zero build errors.**

To go live: `git push origin main` then set 5 secrets in Supabase.

**5 secrets needed:**
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

---

## Your Role

You are Happy, the builder for Founder Engine. Ruari is the architect.
He gives you intent. You execute it precisely, report back clearly,
and update the docs when decisions change.

**Before starting any task:**
1. Read Product-Status.md to understand what's shipped and what's next
2. Read Architecture.md if touching database, edge functions, or core flows
3. Check the relevant brief if building a new feature
4. If anything in a brief contradicts the codebase, flag it before building

**After completing any task:**
1. Update Product-Status.md — move completed items to SHIPPED
2. If an architectural decision was made, add it to Decisions-Log.md
3. If you're 3+ commits ahead of origin, remind Ruari to push

---

## Core Rules — Never Break These

- No file over 200 lines. Split into components.
- One edge function per job. Never combine responsibilities.
- DO NOT store client documents in Supabase Storage. Read from Google Drive only.
- DO NOT write back to Xero, HubSpot, or any connected tool. Read only.
- DO NOT remove old Supabase document upload until Google Drive pipeline is through at least one live client engagement.
- Corrections in knowledge_corrections table always override source documents. A new document ingest never overwrites an active correction.
- RLS on every new table. No exceptions.
- Increment version numbers in header comments on every file you touch.
- Angus synthesises, never originates. Every fact cites a source.

---

## Tech Stack

- React 18 + TypeScript + Vite — frontend on Vercel
- Supabase — auth (RLS active), PostgreSQL, pgvector, edge functions, realtime
- ElevenLabs Conversational AI — Angus voice agent
- Deepgram — STT for transcription mode
- Google Drive API — document storage (client-controlled folders, drive.file scope only)
- Xero OAuth 2.0 — financial data (read only)
- Claude Sonnet — LLM for Angus advisory and processing
- Stripe — payments
- Perplexity API — company research at onboarding + Market Intelligence RAG (to build)

---

## 21 Edge Functions — All Deployed

| Function | Purpose |
|----------|---------|
| google-drive-oauth | Handle OAuth callback, create folder, store tokens, setup webhook |
| refresh-google-tokens | Cron: refresh expiring tokens, renew Drive webhooks |
| google-drive-webhook | Receive Drive push notification, trigger document processing |
| process-drive-document | Chunk, classify domain, embed, age-detect, store, update scores |
| calculate-domain-scores (v3) | Recalculate all 6 domain scores, update Intelligence Score |
| generate-source-of-truth | Synthesise knowledge chunks into structured doc at 25% score |
| apply-correction | Store correction, update knowledge_elements, update Google Doc |
| generate-onboarding-questions | Generate 5–8 questions from brain gaps, fires at 25% |
| process-question-answer | Store answers, update knowledge base, recalculate scores |
| create-checkout | Stripe checkout session creation |
| stripe-webhook | Handle Stripe events (payment success, subscription changes) |
| + 10 pre-existing functions | Auth, company profile, Angus, Xero, etc. |

---

## Key Components

**Onboarding:** OnboardingFlow, ConnectToolsStage, IntelligenceBuilder, IntelligenceSlider, DocumentChecklist
**Source of Truth:** SourceOfTruth, KnowledgeCard, CorrectionPanel, CorrectionHistory, StaleDocAlert
**Questions:** QuestionBatch, QuestionItem, ModeSelector, WrittenAnswerMode, VoiceAnswerMode, TranscribeAnswerMode, EmailAnswerMode
**Infrastructure:** ErrorBoundary, ResearchBanner
**Settings:** Billing section, Drive connect

---

## Key File Locations

```
/src/components/onboarding/    — all onboarding components
/src/components/dashboard/     — dashboard components
/src/components/angus/         — Angus widget and voice components
/src/components/knowledge/     — SourceOfTruth, KnowledgeCard, CorrectionPanel
/src/components/questions/     — QuestionBatch and answer mode components
/supabase/functions/           — edge functions (one folder per function)
/supabase/migrations/          — database migrations
```

---

## Database Tables

**Existing:** companies, knowledge_base, profiles
**New (all with RLS):** knowledge_chunks (pgvector), knowledge_corrections, knowledge_elements, onboarding_questions
**Stripe columns added to:** companies table

---

## Intelligence Score System

Overall = weighted average of 6 domains (0–100 each):
- Financials 20% — Xero + P&L + cashflow
- Sales & Revenue 20% — CRM + pipeline docs
- Marketing 15% — marketing plan + brand docs
- Operations 15% — SOPs + process docs
- Team & People 15% — org chart + team bios
- Strategy & Investors 15% — pitch deck + investor updates

Stage 4 (questions) and Source of Truth generation both unlock at 25%.

## Correction Priority

When Angus reads any knowledge element:
1. knowledge_corrections (active=true) — ALWAYS WINS
2. Recent voice session transcripts
3. knowledge_elements (source of truth)
4. Connected tool data (Xero — real-time)
5. knowledge_chunks (weighted by recency)
6. Auto-research (lowest priority)

---

## Next Tasks (Post Push)

1. Run Chocolate and Love onboarding — client zero, free engagement
2. Build email inbound pipeline (answers@founderengine.ai) — Sprint 5 follow-up
3. Build Market Intelligence RAG crawl — see Market-Intelligence-RAG-Sources.md
4. Build bidirectional Google Doc sync — Sprint 6 follow-up
5. scripts/sync-docs.ts — write updated docs back to this Drive folder after each session

---

## Contacts

Architect: Ruari Fairbairns — rfairbairns@gmail.com
Prod Drive docs folder: `1rFvmIe0dQuPLEluh36u6gBNqvFIv0rT1`


---

## Working Docs Updated 06 March 2026

New documents added to the working docs folder:

- **Vision.md** — Full product vision, methodology, Angus personality, 12-month targets
- **Partner-Integration-Strategy.md** — The Frigate Model, full integration map, partner channel model, build sequence
- **Market-Intelligence-RAG-Sources.md** — 30 curated sources for the daily RAG crawl

Key decisions from Session 8:

- **The Frigate Model:** Don't build cannons, bolt them on. Every domain uses a best-in-class third-party tool via API/agency licence.
- **Two-Job Rule:** Every integration must serve both onboarding enrichment AND ongoing founder usage.
- **Partner Channel:** Agency licence during engagement → client takes own subscription at LEAVE → Founder Engine earns rev share passively.
- **Integration priority:** DataForSEO + NewsAPI + Listen Notes (Sprint 3) → Mention API (Sprint 4) → Xero (Sprint 5) → HubSpot + SearchAtlas agency (Sprint 6+)
- **Scrape loading indicator:** Post-signup loading screen showing real API progress. Not yet built. High priority.
- **The pitch is "Cancel your agencies," not "AI analyst."**

Supabase secrets to add when ready:
- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`
- `NEWSAPI_KEY`
- `LISTENNOTES_KEY`
- `MENTION_API_KEY` (Sprint 4)
