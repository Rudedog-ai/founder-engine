# Founder Engine — Architecture
**Last updated: March 2026**
*Update when architectural decisions change. Never let this go stale.*

---

## Core Principles

1. **Angus synthesises, never originates.** Every fact cites a certified source tool.
2. **Client owns their data.** We read it, never copy or store it. Google Drive folder is theirs.
3. **Corrections always win.** Priority order: corrections > voice sessions > source of truth doc > connected tools > uploaded documents > auto-research.
4. **Small functions. Small components.** One job each. No file over 200 lines.
5. **Read only from all tools.** Never write back to Xero, HubSpot, Rippling, or anything.

---

## System Layers

| Layer | What It Does | Technology |
|-------|-------------|------------|
| Data Ingestion | Reads from client Google Drive folder. Reads from connected tools via OAuth. Never stores copies. | Google Drive API (drive.file scope), Xero OAuth, HubSpot OAuth. Read-only. |
| Company Brain | Structured knowledge base. 7 domains. Confidence scores and source tags on every entry. | Supabase PostgreSQL + pgvector. Semantic chunking. |
| RAG Layer | Hybrid retrieval for Angus queries. Semantic vector search + BM25 keyword. Cross-encoder reranking. | pgvector (Supabase). Top 3–8 chunks to Claude. |
| Correction Layer | Sits between raw data and Angus context. Corrections always override source. | knowledge_corrections table. Priority checked on every Angus read. |
| Market Intelligence RAG | Daily-updating knowledge base on AI transformation tools and methodologies. | Perplexity API daily crawl. Curated source list (to build). |
| Angus (Orchestration) | Voice AI. Synthesises company brain + corrections + market RAG + live tool data. | ElevenLabs voice. Claude Sonnet LLM. Deepgram STT. |
| Learning Portal | Auto-generated team training from company brain. Company-specific, not generic. | NotebookLM, Claude generation. |
| Frontend | React dashboard. Onboarding flow. Intelligence sliders. Source of truth cards. | React 18 + TypeScript + Vite. Vercel. |
| Backend | Edge functions. Auth. RLS. API orchestration. Webhooks. | Supabase Deno edge functions. PostgreSQL with RLS. |

---

## Database Schema

### companies table — all columns added across sprints (all LIVE)

```sql
-- Sprint 1: Onboarding
onboarding_stage INTEGER DEFAULT 1,
welcome_complete BOOLEAN DEFAULT FALSE,
preferred_answer_mode TEXT,
source_of_truth_doc_id TEXT,
domain_scores JSONB DEFAULT '{"financials":0,"sales":0,"marketing":0,"operations":0,"team":0,"strategy":0}',

-- Sprint 2: Google Drive OAuth
google_folder_id TEXT,
google_access_token TEXT,
google_refresh_token TEXT,
google_connected_at TIMESTAMPTZ,
google_webhook_channel_id TEXT,
google_webhook_expiry TIMESTAMPTZ,

-- Sprint 6: Stripe Billing
stripe_customer_id TEXT,
stripe_subscription_id TEXT,
subscription_status TEXT DEFAULT 'free',
subscription_plan TEXT
```

### knowledge_chunks (new table — Sprint 2)

```sql
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_id TEXT,
  source_name TEXT,
  domain TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536),
  confidence_score FLOAT DEFAULT 1.0,
  document_date TIMESTAMPTZ,
  is_stale BOOLEAN DEFAULT FALSE,
  stale_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON knowledge_chunks (company_id, domain);
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON knowledge_chunks
  FOR ALL USING (company_id = get_current_company_id());
```

### knowledge_corrections (new table — Sprint 4)

```sql
CREATE TABLE knowledge_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  element_key TEXT NOT NULL,
  element_label TEXT NOT NULL,
  domain TEXT NOT NULL,
  original_value TEXT,
  corrected_value TEXT NOT NULL,
  correction_context TEXT,
  source TEXT NOT NULL,
  source_detail TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES knowledge_corrections(id)
);
ALTER TABLE knowledge_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON knowledge_corrections
  FOR ALL USING (company_id = get_current_company_id());
```

### knowledge_elements (new table — Sprint 3)

```sql
CREATE TABLE knowledge_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  element_key TEXT NOT NULL,
  element_label TEXT NOT NULL,
  domain TEXT NOT NULL,
  current_value TEXT NOT NULL,
  source_chunk_ids UUID[],
  has_correction BOOLEAN DEFAULT FALSE,
  correction_id UUID REFERENCES knowledge_corrections(id),
  last_verified_at TIMESTAMPTZ,
  document_age_months INTEGER,
  is_stale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE knowledge_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON knowledge_elements
  FOR ALL USING (company_id = get_current_company_id());
```

### onboarding_questions (new table — Sprint 5)

```sql
CREATE TABLE onboarding_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  domain TEXT NOT NULL,
  why_asking TEXT,
  priority INTEGER DEFAULT 2,
  related_to_stale_doc BOOLEAN DEFAULT FALSE,
  stale_doc_name TEXT,
  status TEXT DEFAULT 'pending',
  answer_text TEXT,
  answer_mode TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);
ALTER TABLE onboarding_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON onboarding_questions
  FOR ALL USING (company_id = get_current_company_id());
```

---

## Google Drive Integration

**OAuth scope:** `https://www.googleapis.com/auth/drive.file` — NOT full drive access.

**Folder creation:** On successful OAuth, create "Founder Engine" folder in client's Drive root. Store `folder_id` in companies table.

**Document flow:**
```
Doc added to Drive folder
→ webhook fires (or poll every 5 min as fallback)
→ fetch file content from Drive API
→ semantic chunking (400–600 tokens, 50-token overlap)
→ domain classification (Claude Haiku)
→ embed (pgvector)
→ age detection (google_modified_time)
→ store in knowledge_chunks
→ recalculate domain scores
→ update Intelligence Score
→ notify frontend via Supabase Realtime
```

**Age thresholds:**
- < 3 months: fresh, no flag
- 3–12 months: amber, soft prompt when cited
- > 12 months: red, Angus asks before using
- > 24 months: prominent flag

**Never store documents.** Read from Drive on demand. Client removes file = Angus immediately loses access.

---

## Intelligence Score

Overall score = weighted average of 6 domain scores (0–100 each).

| Domain | Weight | What Fills It |
|--------|--------|---------------|
| Financials | 20% | Xero connection, P&L, cashflow, management accounts |
| Sales & Revenue | 20% | CRM, pipeline docs, sales decks |
| Marketing | 15% | Marketing plan, brand docs, content strategy |
| Operations | 15% | SOPs, process docs, org chart, contracts |
| Team & People | 15% | Org chart, team bios, hiring plan |
| Strategy & Investors | 15% | Pitch deck, business plan, investor updates |

Stage 4 (questions) unlocks at 25% overall.
Source of truth document generates at 25% overall.

---

## Correction Priority System

When Angus reads any knowledge element:

```
1. Check knowledge_corrections WHERE element_key = X AND active = TRUE
   → If found: use corrected_value, cite "based on your correction from [date]"
2. Check recent voice session transcripts (last 30 days)
3. Check knowledge_elements (source of truth)
4. Check connected tool data (Xero = real-time, always fresh)
5. Check knowledge_chunks (weighted by recency)
6. Check auto-research (lowest priority, background context only)
```

Never let a new document ingest overwrite an active correction.

---

## Edge Functions — Full List

| Function | Sprint | Status | Version |
|----------|--------|--------|---------|
| google-drive-oauth | 2 | SHIPPED | v1 |
| google-drive-webhook | 2 | SHIPPED | v1 |
| process-drive-document | 2 | SHIPPED | v1 |
| refresh-google-tokens | 2 | SHIPPED | v1 |
| calculate-domain-scores | 3 | SHIPPED | v3 |
| generate-source-of-truth | 3 | SHIPPED | v1 |
| apply-correction | 4 | SHIPPED | v1 |
| generate-onboarding-questions | 5 | SHIPPED | v1 |
| process-question-answer | 5 | SHIPPED | v1 |
| create-checkout | 6 | SHIPPED | v1 |
| stripe-webhook | 6 | SHIPPED | v1 |
| process-inbound-email | 5 | DEFERRED | — |
| send-questions-email | 5 | DEFERRED | — |

---

## Frontend Components — Full List

| Component | Sprint | Status |
|-----------|--------|--------|
| OnboardingFlow.tsx | 1 | SHIPPED |
| ConnectToolsStage.tsx | 1+2 | SHIPPED (wired to real Drive OAuth) |
| IntelligenceBuilder.tsx | 3 | SHIPPED |
| IntelligenceSlider.tsx | 3 | SHIPPED |
| DocumentChecklist.tsx | 3 | SHIPPED |
| SourceOfTruth.tsx | 3 | SHIPPED (+ edit buttons Sprint 4) |
| KnowledgeCard.tsx | 3 | SHIPPED (+ edit button Sprint 4) |
| CorrectionPanel.tsx | 4 | SHIPPED |
| CorrectionHistory.tsx | 4 | SHIPPED |
| StaleDocAlert.tsx | 4 | SHIPPED |
| QuestionBatch.tsx | 5 | SHIPPED |
| QuestionItem.tsx | 5 | SHIPPED |
| ModeSelector.tsx | 5 | SHIPPED |
| WrittenAnswerMode.tsx | 5 | SHIPPED |
| VoiceAnswerMode.tsx | 5 | SHIPPED |
| TranscribeAnswerMode.tsx | 5 | SHIPPED |
| EmailAnswerMode.tsx | 5 | SHIPPED |
| ErrorBoundary.tsx | 6 | SHIPPED |

