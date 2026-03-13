# CLAUDE.md — Founder Engine
## Read this before every session. Update it after every build.

**Repo:** github.com/Rudedog-ai/founder-engine (PUBLIC)
**Prod:** founder-engine-seven.vercel.app
**Working docs folder:** Google Drive `1rFvmIe0dQuPLEluh36u6gBNqvFIv0rT1`

---

## Current State — 13 March 2026

**All 6 original sprints complete. Pushed to origin. Zero build errors.**

Post-sprint additions: Scout Agent, two-pass ingestion pipeline, native Google Drive OAuth (Composio removed for Drive), 3-stage onboarding redesign.

**Secrets needed in Supabase (some may already be set):**
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- ANTHROPIC_API_KEY
- COMPOSIO_API_KEY (for Xero/Gmail — not Drive)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY (Scout Agent emails)

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

- 200-line soft limit per file. Only split when a file is doing two unrelated jobs.
- One edge function per job. Never combine responsibilities.
- DO NOT store client documents in Supabase Storage. Read from Google Drive only.
- DO NOT write back to Xero, HubSpot, or any connected tool. Read only.
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
- Google Drive API — native OAuth (drive.readonly scope), tokens in companies table
- Xero OAuth 2.0 via Composio — financial data (read only)
- Claude Haiku — relevance filtering (two-pass ingest phase 1)
- Claude Opus — deep fact extraction (two-pass ingest phase 2)
- Claude Sonnet — Angus advisory and processing
- Stripe — payments
- Resend — Scout Agent email delivery
- Perplexity API — company research at onboarding

---

## 25 Edge Functions

| Function | Purpose |
|----------|---------|
| **Google Drive (native OAuth)** | |
| google-drive-oauth | Full OAuth flow — consent URL + callback, stores tokens in companies table |
| create-google-drive-folder | Create/find "Founder Engine" folder in client's Drive |
| list-google-drive-folders | List all folders for folder picker |
| sync-google-drive | Webhook handler + manual sync for Drive file changes |
| two-pass-ingest | Smart 2-phase ingestion: Haiku filter → Opus extraction |
| **Ingestion & Intelligence** | |
| classify-document | Domain classification |
| calculate-domain-scores | Recalculate all 6 domain scores |
| generate-source-of-truth | Synthesise knowledge into structured doc |
| start-domain-ingest | Trigger ingestion pipeline |
| initial-enrichment | Perplexity research at onboarding |
| **Composio integrations (Xero/Gmail)** | |
| connect-integration | Composio OAuth flow for non-Drive tools |
| check-integration-status | Poll Composio connection status |
| sync-xero | Fetch Xero financial data via Composio |
| sync-composio-drive | Legacy Drive sync via Composio (superseded) |
| sync-composio-gmail | Gmail sync via Composio |
| **Scout Agent** | |
| scout-daily-run | Daily tool discovery scrape (6am UTC cron) |
| scout-daily-nudge | Email nudge with new discoveries (9am UTC cron) |
| scout-weekly-digest | Weekly summary generation |
| scout-weekly-report | Email weekly report (Mon 8am UTC cron) |
| **Core** | |
| angus-chat | Angus text chat endpoint |
| get-company-profile | Fetch company profile data |
| export-company | Export full company brain as .txt |
| reset-company | Erase all data, reset to Stage 1 |
| process-finance-data | Process financial documents |
| run-scrapling | Web scraping via Scrapling |

**Shared modules:** `_shared/google-token.ts` — Google OAuth token retrieval + auto-refresh

---

## Onboarding Flow (3 stages)

```
/src/screens/onboarding/OnboardingFlow.tsx  — router
/src/screens/onboarding/ConnectToolsStage.tsx — connect Drive, Xero, Gmail
/src/screens/onboarding/GoogleDriveStage.tsx  — folder selection + ingestion
/src/screens/onboarding/QuestionsStage.tsx    — smart questions at 25% score
/src/screens/onboarding/ProgressIndicator.tsx — step indicator
```

---

## Key File Locations

```
/src/screens/onboarding/       — 3-stage onboarding flow
/src/components/integrations/  — ConnectTools, FolderSelector
/src/components/intelligence/  — IntelligenceBuilder, Sliders, KnowledgeCard, SourceOfTruth
/src/components/corrections/   — CorrectionPanel, CorrectionHistory, StaleDocAlert
/src/components/questions/     — QuestionBatch and answer mode components
/src/components/dashboard/     — IngestDashboard
/src/components/               — AngusChat, BottomNav, ErrorBoundary, ResearchBanner
/src/screens/                  — Dashboard, Knowledge, More, Voice, Welcome, etc.
/supabase/functions/           — edge functions (one folder per function)
/supabase/functions/_shared/   — shared modules (google-token.ts)
/supabase/migrations/          — database migrations
```

---

## Database Tables

**Core:** companies, profiles
**Knowledge:** knowledge_elements, knowledge_chunks (pgvector), knowledge_corrections
**Onboarding:** onboarding_questions
**Ingestion:** ingestion_progress, ingest_log, domain_scores
**Integrations:** integrations
**Scout Agent:** scout_discoveries, scout_evaluations, scout_manual_reviews, scout_digests

---

## Intelligence Score System

Overall = weighted average of 6 domains (0–100 each):
- Financials 20% — Xero + P&L + cashflow
- Sales & Revenue 20% — CRM + pipeline docs
- Marketing 15% — marketing plan + brand docs
- Operations 15% — SOPs + process docs
- Team & People 15% — org chart + team bios
- Strategy & Investors 15% — pitch deck + investor updates

Questions stage and Source of Truth generation both unlock at 25%.

## Correction Priority

When Angus reads any knowledge element:
1. knowledge_corrections (active=true) — ALWAYS WINS
2. Recent voice session transcripts
3. knowledge_elements (source of truth)
4. Connected tool data (Xero — real-time)
5. knowledge_chunks (weighted by recency)
6. Auto-research (lowest priority)

---

## Next Tasks

1. Run Chocolate and Love onboarding — client zero, free engagement
2. Users who connect Google Drive must re-auth (scope changed from drive.file to drive.readonly)
3. Build email inbound pipeline (answers@founderengine.ai)
4. Build Market Intelligence RAG crawl — see Market-Intelligence-RAG-Sources.md
5. Build bidirectional Google Doc sync
6. scripts/sync-docs.ts — write updated docs back to this Drive folder after each session

---

## Contacts

Architect: Ruari Fairbairns — rfairbairns@gmail.com
Prod Drive docs folder: `1rFvmIe0dQuPLEluh36u6gBNqvFIv0rT1`
