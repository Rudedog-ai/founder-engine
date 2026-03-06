# Founder Engine — Claude Code Brief
## Onboarding Redesign + Google Drive + Multi-Mode Input + Living Source of Truth
**March 2026 | Architect: Ruari Fairbairns | Builder: Claude Code (Happy)**
**Repo:** github.com/Rudedog-ai/founder-engine
**Prod:** founder-engine-seven.vercel.app

---

## Read First — Context and Rules

Founder Engine transforms businesses from manual operations to AI-agent-led operations. Angus is the voice AI orchestration layer. He knows the business because he reads the data.

The onboarding flow is the foundation of everything. Frictionless onboarding = brain fills fast = Angus becomes useful fast = clients stay.

**Hard rules — do not break these:**
- Angus never makes things up. Every insight comes from connected tools or uploaded documents
- We never store client documents. We read from their Google Drive folder. They own it
- Read-only from all connected tools. Never write back to Xero, HubSpot, or anything
- Simple always wins. Every extra click is a founder who doesn't complete onboarding
- The correction layer always takes precedence over the original source document
- When a correction exists for a fact, Angus cites the correction not the original

---

## Current State — What Exists

- React 18 + TypeScript + Vite frontend on Vercel
- Supabase auth (email/password), RLS active
- Xero OAuth 2.0 — connected but buried in settings, not surfaced in onboarding
- ElevenLabs Conversational AI — Angus voice agent live
- Supabase Storage for documents — **being replaced by Google Drive**
- Company profile creation with Perplexity auto-research
- Intelligence Score (0–100) exists in data model
- 7-domain company brain in Supabase

---

## What This Brief Delivers

1. Redesigned 5-stage onboarding flow
2. Angus opening prompt — short, warm, explains how he works, hands off to setup
3. Google Drive OAuth + folder creation — replaces Supabase document storage
4. Google Drive read pipeline — docs in folder → chunked → embedded → Angus reads
5. Document age detection — Angus flags old documents and asks for confirmation
6. **Living Source of Truth document** — auto-generated, editable by founder, Angus reads corrections first
7. Intelligence slider UI — visual progress across 6 domains, updates as docs land
8. Document recommendation checklist — what to upload and why
9. Multi-mode question answering — voice, live transcribe, written, email
10. Xero properly surfaced in onboarding
11. Email ingestion — platform emails questions, founder replies, system processes

---

## The 5-Stage Onboarding Flow

```
Stage 1 → Welcome (Angus explains himself, no questions)
Stage 2 → Connect Tools (Google Drive + Xero, one screen, two clicks)
Stage 3 → Feed Angus (document checklist + intelligence sliders)
Stage 4 → Questions unlock at 25% (founder chooses answer mode)
Stage 5 → Ongoing (brain fills, Angus gets smarter, corrections applied)
```

Each stage unlocks the next. Progress always visible. Every step has a skip option with a warning.

---

## Stage 1 — Angus Welcome Prompt

Update the ElevenLabs agent system prompt. This fires **once only** on first login (`welcome_complete = false`). It is a monologue — Angus does not ask questions here.

```
SYSTEM PROMPT (first login only):

You are Angus, the AI advisor for Founder Engine. This is your first time
meeting this founder. Deliver the following welcome. Do not deviate.
Do not ask questions. Do not extend the conversation.

---

"Hi, I'm Angus. I'm going to be your AI business advisor —
available whenever you need me, day or night.

But here's the thing: I'm only as smart as what you feed me.
Right now I know almost nothing about your business.
That changes once you connect your tools and share your documents.

In a moment you'll see two things to connect — your Google Drive
and your Xero account. Both take about a minute each.

Then I'll show you a list of documents to drop into your Founder Engine
folder. The more you add, the more I know, and the more useful I become.
You'll see exactly how well I know your business on your dashboard —
it updates in real time as you feed me.

One more thing: documents go stale. If you share something old,
I'll flag it and ask whether it's still accurate. You can correct
any specific detail without having to re-upload everything.

Once I know enough, I'll start asking you questions — and you can
answer them however works best for you. Voice, text, or email
if you'd rather think about it first.

Let's get started. Connect your tools — you'll see them right below."

---

After delivering: set welcome_complete = true
Transition UI to Stage 2 automatically
Do not replay on subsequent logins
```

---

## Stage 2 — Connect Tools Screen

One screen. Two cards. Nothing else. No navigation. No distractions.

### Google Drive Card

```
Title: Connect Google Drive
Subtitle: Give Angus a folder to read from. You control what goes in it.
          Remove a file anytime — Angus immediately loses access to it.

Button: [Connect Google Drive] — standard Google OAuth button

On successful OAuth:
1. Scope: https://www.googleapis.com/auth/drive.file (NOT full drive access)
2. Create folder named "Founder Engine" in root of their Drive
3. Store folder_id in companies table
4. Show success state: green tick + "Founder Engine folder created"
5. Show link: "Open your folder" → Google Drive folder in new tab

Store in companies table:
- google_folder_id
- google_access_token
- google_refresh_token  
- google_connected_at
```

### Xero Card

```
Title: Connect Xero
Subtitle: Live financial data. Angus reads your accounts in real time.

Button: [Connect Xero] — existing OAuth flow, just move it to this screen

On successful OAuth:
1. Show account selector — which Xero organisation to connect
2. Store xero_tenant_id
3. Show success state: green tick + organisation name + last sync time
4. Trigger initial Xero data pull in background

NOTE: Xero OAuth is already built. This task is moving it to the onboarding screen only.
Auto-refresh Xero data every 6 hours once connected.
```

### Screen Rules

- Both cards start in default (not connected) state
- Cards connect independently — any order
- Continue button appears once BOTH connected
- "Skip for now" link under each card with warning: "Angus will be limited without this"
- Progress indicator at top: Step 2 of 5

---

## Stage 3 — Feed Angus (Intelligence Builder)

### Intelligence Sliders

Six domain progress bars. Each fills 0–100% based on documents received and tools connected. Overall Intelligence Score shown prominently. Fills visibly and immediately as docs land — this is the core satisfaction mechanic.

| Domain | What Fills It |
|--------|---------------|
| Financials | Xero connection (large boost), P&L, cashflow docs, budget |
| Sales & Revenue | CRM connection, pipeline docs, sales decks, customer data |
| Marketing | Marketing plan, brand docs, content strategy, social data |
| Operations | SOPs, process docs, org chart, supplier contracts |
| Team & People | Org chart, team bios, hiring plan, HR docs |
| Strategy & Investors | Pitch deck, business plan, investor updates, vision docs |

Overall Intelligence Score = weighted average of 6 domains.
Stage 4 unlocks visually when overall score hits 25%. Show this threshold on the UI.

### Recommended Document Checklist

Show as a checklist. Not mandatory — guidance only. Each item has a description. Auto-tick as documents are detected in the folder.

| Document | Domain | Why Angus Needs It |
|----------|--------|--------------------|
| P&L (last 12 months) | Financials | Revenue trends, margin, cost structure |
| Cashflow forecast | Financials | Cash position, runway, upcoming pressure |
| Latest management accounts | Financials | Current trading position |
| Pitch deck / business plan | Strategy | What the business does, market, vision |
| Sales pipeline / CRM export | Sales | Deal sizes, conversion, pipeline health |
| Marketing plan | Marketing | Channels, budget, targets, what's working |
| Org chart | Team | Who does what, reporting lines, gaps |
| Key contracts | Operations | Dependencies, risks, renewal dates |
| SOPs / process docs | Operations | How the business actually runs |
| Investor updates | Strategy | Commitments made, metrics tracked |
| Product/service pricing sheet | Sales | Current pricing, packaging, tiers |
| Competitor analysis | Strategy | Market positioning, threats |

---

## Document Age Detection

When a document is processed, extract or estimate its creation/last-modified date. Compare against today. Apply the following rules:

```
AGE DETECTION LOGIC:

1. On document ingestion, record:
   - google_modified_time (from Drive API metadata — always available)
   - document_date_detected (date found within document content if present)
   - Use google_modified_time as the authoritative age signal

2. Age thresholds:
   - < 3 months: fresh — no flag
   - 3–12 months: amber — flag with soft prompt
   - > 12 months: red — flag with direct question
   - > 24 months: flag prominently, ask before using in any advice

3. When Angus references content from a flagged document, prepend:
   "This is based on your [document name] which was last updated 
   [X months] ago — is this still accurate, or has anything changed?"

4. If founder confirms it's still accurate: store confirmation, 
   suppress future age warnings for that document for 90 days

5. If founder says something has changed: route to correction flow (see below)
```

**Do not block document ingestion based on age. Ingest everything. Just flag when using old content.**

---

## Living Source of Truth Document

This is one of the most important features in this brief.

### What It Is

After a company has an Intelligence Score of 25%+, the system auto-generates a **"What Angus Knows About [Company Name]"** document. This document lives in the Founder Engine Google Drive folder. It is the canonical version of what Angus believes to be true about the business.

It is:
- Auto-generated from everything Angus has ingested
- Editable by the founder (directly in Google Docs, or via the dashboard)
- The highest-priority source for Angus — corrections here override anything in other documents
- Updated automatically as new documents are ingested (additive, never overwrites founder edits)
- Versioned — Angus can see what changed and when

### Document Structure

```
# What Angus Knows About [Company Name]
# Last auto-updated: [timestamp]
# Founder corrections: [N corrections applied]
# Intelligence Score at generation: [score]

---

## Business Overview
[auto-generated summary from ingested docs]

## Products and Services
[auto-generated — each line is individually correctable]
Example:
- Complete Control 2: 8-week programme, £10,000 [SOURCE: pitch-deck-2024.pdf | FLAGGED: 14 months old]

## Pricing
[auto-generated]

## Revenue and Financials
[auto-generated from Xero + financial docs]

## Customers
[auto-generated]

## Team
[auto-generated]

## Marketing and Sales
[auto-generated]

## Operations
[auto-generated]

## Strategic Context
[auto-generated]

---
## Founder Corrections Log
[timestamp] Ruari: "Complete Control 2 is now 12 weeks and £8,000. Rest of context correct."
→ Applied to: Products and Services > Complete Control 2
→ Status: ACTIVE — overrides source document
```

### How Corrections Work

The founder has three ways to apply a correction:

**Method 1 — Voice or chat with Angus:**
```
Founder: "Complete Control 2 is actually now 12 weeks and £8,000 but the rest is correct"

Angus processing:
1. Identify what fact is being corrected (product name, attribute, old value, new value)
2. Locate the relevant entry in the source of truth document
3. Apply correction with timestamp and source ("voice session [date]")
4. Confirm back: "Got it — I've updated Complete Control 2 to 12 weeks at £8,000. 
   The programme description and other details are unchanged."
5. Write correction to knowledge_corrections table
6. Update the source of truth Google Doc via Drive API
```

**Method 2 — Dashboard inline edit:**
```
Dashboard shows the source of truth document as structured cards.
Each card = one knowledge element (product, price, person, process, etc.)

Each card has:
- The current value (with source tag)
- An "Edit" button
- An "Add context" button (for additions, not corrections)
- A "Still accurate" button (dismisses age warning for 90 days)
- Version history (what it said before)

Editing a card:
1. Founder clicks Edit
2. Inline text edit opens
3. Founder updates the value
4. Optional: "What changed?" note
5. Save → stored as correction, source of truth updated, Angus reads new value
```

**Method 3 — Email:**
```
Founder replies to any Angus email with a correction.
"Actually re point 3 — the pricing is now £8,000 not £10,000"
Inbound email processor identifies this as a correction (not a new answer)
and routes to the correction pipeline.
```

### Correction Priority — How Angus Reads Knowledge

```
Priority order (highest first):
1. Founder corrections (knowledge_corrections table) — always wins
2. Voice session transcripts (recent sessions)
3. Source of truth document (auto-generated, founder-edited)
4. Connected tool data (Xero, HubSpot — real-time, always fresh)
5. Uploaded documents (weighted by recency — newer = higher weight)
6. Auto-research (Perplexity scrape — lowest priority, background context only)

When Angus surfaces a fact, it must cite which priority level it came from.
Example: "Based on your correction from last Tuesday, Complete Control 2 is 
now 12 weeks at £8,000."
```

### Dashboard — Source of Truth View

Add a "What Angus Knows" section to the dashboard. This renders the source of truth document as interactive cards grouped by domain.

```
Each domain section (e.g. Products and Services):
- Expandable
- Each knowledge element shown as a card
- Card shows: value | source | age | correction status
- Age colour coding: green < 3mo | amber 3–12mo | red > 12mo
- Correction badge if founder has edited this element
- Inline edit on click
- "Add context" for supplementary information without replacing existing

Global controls:
- "Review all flagged items" — filtered view of all amber/red items
- "Export source of truth" — download as PDF or Google Doc
- "Ask Angus about this" — opens conversation with that element in context
```

---

## Stage 4 — Multi-Mode Question Answering

Unlocks at 25% Intelligence Score.

### Question Generation Prompt

```
SYSTEM:
You are Angus. You have a partial knowledge base about a business.
Identify the most important gaps and generate questions to fill them.

Rules:
- Generate exactly 5–8 questions per batch
- Questions must be specific to THIS business, not generic
- Reference what you already know: "I can see your revenue is growing 
  but I don't have visibility on your cost structure — can you..."
- Prioritise gaps in lowest-scoring domains
- Never ask something answerable by connecting a tool
- Ask about bottlenecks and problems, not just facts
- Tone: curious, direct, like a smart advisor who has done the reading
- If a document is flagged as old and the founder hasn't confirmed it,
  include a question to verify the key facts from that document

Context provided:
{company_brain_summary}
{domain_scores}
{documents_ingested_with_ages}
{corrections_applied}
{tools_connected}

Output: JSON array
[{
  id: string,
  question: string,
  domain: string,
  why_asking: string,
  priority: 1–3,
  related_to_stale_doc: boolean,
  stale_doc_name: string | null
}]
```

### The Four Answer Modes

Show all four as equal options. Remember the founder's preference.

**Mode 1 — Talk to Angus (voice conversation)**
- Founder clicks "Talk to Angus"
- ElevenLabs opens with questions passed as context
- Angus asks naturally in conversation
- Deepgram STT transcribes
- Transcript parsed, stored, domain scores updated

**Mode 2 — Speak your answers (live transcribe)**
- Questions shown on screen one at a time
- Founder speaks — Deepgram transcribes live on screen
- Founder corrects if needed, submits each answer
- No Angus back-and-forth — founder just answers to the questions

**Mode 3 — Write your answers**
- Questions with text input fields
- Auto-save, partial answers fine
- Can leave and return
- Works offline, syncs when back

**Mode 4 — Email me the questions**

```
Outbound email:
Subject: Angus has [N] questions for you — [Company Name]

Hi [First Name],

I've been reading everything you've shared and I have some questions.
Answer as many as you like — even partial answers help.
Reply to this email with your answers (numbered or free-form).

[For each question:]
---
[N]. [QUESTION]
    (Why I'm asking: [WHY_ASKING])
---

Take your time. Send from the plane, the car, whenever works.

Reply-to: answers@founderengine.ai
```

```
Inbound processing:
1. Email received at answers@founderengine.ai
2. Match sender to company record by email address
3. Claude extracts answers, matches to pending questions
4. If correction detected ("actually it's now...") → route to correction pipeline
5. Knowledge base updated, scores recalculated
6. Confirmation email sent: "Got your answers. I've updated what I know."

Infrastructure: Resend inbound parse or Postmark inbound webhook
```

---

## Database Schema Changes

### companies table — new columns

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  google_folder_id TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_connected_at TIMESTAMPTZ,
  google_webhook_channel_id TEXT,
  google_webhook_expiry TIMESTAMPTZ,
  onboarding_stage INTEGER DEFAULT 1,
  welcome_complete BOOLEAN DEFAULT FALSE,
  preferred_answer_mode TEXT,
  source_of_truth_doc_id TEXT,
  domain_scores JSONB DEFAULT '{
    "financials": 0,
    "sales": 0,
    "marketing": 0,
    "operations": 0,
    "team": 0,
    "strategy": 0
  }';
```

### New table: knowledge_chunks

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

### New table: knowledge_corrections

```sql
CREATE TABLE knowledge_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  element_key TEXT NOT NULL,        -- e.g. "products.complete_control_2.price"
  element_label TEXT NOT NULL,      -- human-readable: "Complete Control 2 — Price"
  domain TEXT NOT NULL,
  original_value TEXT,
  corrected_value TEXT NOT NULL,
  correction_context TEXT,          -- "rest of context is correct"
  source TEXT NOT NULL,             -- 'voice'|'dashboard'|'email'
  source_detail TEXT,               -- session ID, email timestamp
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT DEFAULT 'founder',
  active BOOLEAN DEFAULT TRUE,      -- false = correction itself has been superseded
  superseded_by UUID REFERENCES knowledge_corrections(id)
);

CREATE INDEX ON knowledge_corrections (company_id, element_key, active);
ALTER TABLE knowledge_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON knowledge_corrections
  FOR ALL USING (company_id = get_current_company_id());
```

### New table: onboarding_questions

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
```

---

## Google Drive Integration — Technical Spec

### OAuth and folder creation

```typescript
// Scope: drive.file only — not full drive access
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email'
]

async function createFounderEngineFolder(accessToken: string, companyId: string) {
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Founder Engine',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Documents shared with Angus. Add any doc for Angus to read. Remove to revoke access.'
    })
  })
  const folder = await response.json()
  await supabase.from('companies').update({
    google_folder_id: folder.id,
    google_connected_at: new Date().toISOString()
  }).eq('id', companyId)
  return folder.id
}
```

### Webhook setup

```typescript
async function setupDriveWebhook(accessToken: string, folderId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}/watch`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        type: 'web_hook',
        address: 'https://[project].supabase.co/functions/v1/google-drive-webhook',
        expiration: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })
    }
  )
  // Set cron job to renew every 6 days
  // Fallback: poll folder every 5 minutes if webhook fails
}
```

### Document processing pipeline

```
On new file detected in folder:
1. Fetch file from Drive API (using stored access token)
2. Extract text by file type:
   - PDF → pdf-parse
   - DOCX → mammoth
   - XLSX/CSV → structured extraction
   - PPTX → slide text extraction
3. Extract document date:
   - google_modified_time from Drive metadata (always present)
   - Scan first 500 chars of content for explicit dates
   - Use google_modified_time as authoritative age signal
4. Semantic chunking:
   - Split on paragraph/section boundaries
   - Target 400–600 tokens per chunk
   - 50-token overlap between chunks
5. Domain classification per chunk:
   - Claude Haiku: which domain does this belong to?
6. Embed each chunk (pgvector)
7. Store in knowledge_chunks with document_date
8. Apply age flag if document_date > 3 months ago
9. Recalculate domain scores
10. Update Intelligence Score
11. If score now ≥ 25% for first time → trigger question generation
12. Notify frontend via Supabase Realtime
13. If score crosses 25% → offer to generate source of truth document

Supported: PDF, DOCX, XLSX, TXT, CSV, PPTX
Unsupported: show warning in UI, do not fail silently
Target: visible score update within 60 seconds of doc landing
```

---

## Source of Truth Document — Generation and Sync

### Initial generation

```
Triggered when: Intelligence Score first crosses 25%
OR founder clicks "Generate source of truth" manually

Steps:
1. Gather all knowledge_chunks for company, sorted by domain
2. Apply any existing knowledge_corrections (override relevant chunks)
3. Send to Claude with prompt:

PROMPT:
You are creating a structured source of truth document for [Company Name].
Synthesise the following knowledge chunks into a clean, factual document.
For each fact, note the source file and its age.
Flag any facts that come from documents older than 6 months with [REVIEW NEEDED].
Format as structured markdown with clear sections.
Do not invent anything not present in the source material.
Be concise — this is a reference document, not an essay.

[knowledge chunks with source metadata]

4. Write generated document to Google Drive as Google Doc
   (so founder can edit it directly in Drive)
5. Store google_doc_id in companies.source_of_truth_doc_id
6. Parse document into structured elements for dashboard card view
7. Store elements in knowledge_elements table (see below)
```

### New table: knowledge_elements

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
```

### Keeping it current

```
When new documents ingested:
- Re-run synthesis for affected domains only (not full regeneration)
- Merge new facts into existing elements (additive)
- Never overwrite an element that has an active correction
- Append new facts as new elements
- Update the Google Doc to reflect changes
- Notify founder: "Angus has updated his knowledge with [filename]"

When founder edits the Google Doc directly:
- Drive webhook fires on doc change
- System detects change, re-parses affected elements
- Applies as a correction (source: 'google_doc_edit')
- Stores in knowledge_corrections with previous value

This means the Google Doc and the dashboard card view stay in sync bidirectionally.
```

---

## New Edge Functions

| Function | Type | What It Does |
|----------|------|--------------|
| google-drive-oauth | NEW | Handle OAuth callback. Create folder. Store tokens. Setup webhook. |
| google-drive-webhook | NEW | Receive Drive push notification. Fetch new/changed file. Trigger processing. |
| process-drive-document | NEW | Chunk, classify, embed, age-detect, store, update scores. |
| generate-source-of-truth | NEW | Synthesise knowledge chunks into structured doc. Write to Drive as Google Doc. |
| update-source-of-truth | NEW | Incremental update when new docs arrive. Merge new facts, preserve corrections. |
| apply-correction | NEW | Store correction, update knowledge_elements, update Google Doc. |
| calculate-domain-scores | NEW | Recalculate all 6 domain scores. Update Intelligence Score. |
| generate-onboarding-questions | NEW | Generate 5–8 questions from brain gaps. Include stale doc flags. |
| process-inbound-email | NEW | Parse inbound email. Match to company. Extract answers or corrections. |
| send-questions-email | NEW | Format and send question email. Store question batch. |
| refresh-google-tokens | NEW | Cron: refresh expiring OAuth tokens. Renew Drive webhooks. |
| onboard-company | UPDATE | Add Google Drive and Xero steps to existing flow. |
| process-transcript | UPDATE | Extract Q&A pairs and corrections from voice session transcript. |

---

## New Frontend Components

| Component | Type | What It Does |
|-----------|------|--------------|
| OnboardingFlow.tsx | NEW | Container for 5-stage flow. Stage progression. Progress indicator. |
| ConnectToolsScreen.tsx | NEW | Stage 2. Google Drive + Xero cards. OAuth flows. Connected states. |
| IntelligenceBuilder.tsx | NEW | Stage 3. Document checklist. Domain sliders. Real-time updates. |
| IntelligenceSlider.tsx | NEW | Single domain progress bar. Animated fill. Age-flagged doc warnings. |
| DocumentChecklist.tsx | NEW | Recommended docs list. Auto-tick on detection. Age badges. |
| SourceOfTruth.tsx | NEW | Dashboard section. Cards by domain. Edit inline. Correction history. |
| KnowledgeCard.tsx | NEW | Single knowledge element. Value + source + age + edit + add context. |
| CorrectionPanel.tsx | NEW | Inline correction flow. Old value → new value. Context note. Confirm. |
| StaleDocAlert.tsx | NEW | Banner/badge on old document. "Still accurate?" + Yes / Update buttons. |
| QuestionBatch.tsx | NEW | Stage 4. Question list. Mode selector. Routes to answer component. |
| VoiceAnswerMode.tsx | NEW | Launch Angus with questions as context. |
| TranscribeAnswerMode.tsx | NEW | Question on screen. Record. Deepgram live transcription. Edit + submit. |
| WrittenAnswerMode.tsx | NEW | Questions with text inputs. Auto-save. Partial submit. |
| EmailAnswerMode.tsx | NEW | Confirm email. Send. Confirmation state. |
| Dashboard.tsx | UPDATE | Add Intelligence Score. Domain sliders. Source of truth section. |
| AngusWidget.tsx | UPDATE | Available from Stage 2 onward. Correction-aware. |

---

## Angus Behaviour — Using Corrections

When Angus references any knowledge element that has an active correction:

```
ALWAYS use the corrected value, not the original
ALWAYS cite the correction: "Based on your update from [date]..."
NEVER cite the original source document for a corrected fact
IF a document is stale and unconfirmed, prepend:
  "This is from your [doc name] which is [X] months old — 
   still accurate or has anything changed?"
IF founder responds with a correction mid-conversation:
  Extract the correction immediately
  Apply to knowledge_corrections
  Confirm back: "Got it, I've updated [element] to [new value]"
  Continue conversation with corrected knowledge
```

---

## Build Order

Build in this exact sequence. Each step must be working in production before the next starts.

| Step | Build | Test Condition |
|------|-------|----------------|
| 1 | Database schema (all new tables and columns) | Migrations run clean, RLS policies work |
| 2 | Google Drive OAuth + folder creation | OAuth completes, folder appears in test Google Drive |
| 3 | Update Angus welcome prompt | New user sees welcome once only, not on return visits |
| 4 | Connect Tools screen (Stage 2 UI) | Both cards connect and show success state |
| 5 | Xero moved to onboarding screen | Xero OAuth appears as card in Stage 2 |
| 6 | Document processing pipeline | PDF in Drive folder → chunks in DB → score updates |
| 7 | Age detection | Old PDF flagged correctly, age stored on chunk |
| 8 | Intelligence sliders UI (Stage 3) | Sliders fill in real time as docs processed |
| 9 | Source of truth generation | At 25%, Google Doc created in client's Drive folder |
| 10 | Knowledge cards on dashboard | Source of truth renders as editable cards |
| 11 | Correction flow — dashboard | Edit card → stored in knowledge_corrections → Angus reads new value |
| 12 | Stale doc alerts | Old document flagged in UI, "Still accurate?" prompt shown |
| 13 | Question generation | At 25% score, 5–8 specific questions generated, stale doc questions included |
| 14 | Written answer mode | Answers stored, knowledge base updated, scores rise |
| 15 | Transcribe answer mode | Deepgram transcribes, answer stored correctly |
| 16 | Email outbound + inbound pipeline | Question email sent, reply received, knowledge updated |
| 17 | Correction detection in email | "Actually it's now X" in email → correction pipeline, not answer pipeline |
| 18 | Voice answer mode + correction detection | Angus conversation, corrections mid-session applied live |
| 19 | Bidirectional Google Doc sync | Edit in Drive → webhook → dashboard cards update |
| 20 | Stripe payments | Payment flow works end to end, before first paying client |

---

## Hard Constraints

```
DO NOT store document copies in Supabase Storage. Read from Google Drive on demand.
DO NOT request drive (full Drive access) scope. Use drive.file only.
DO NOT write back to Xero or any connected tool. Read only.
DO NOT make any step mandatory except welcome. Every connection has a skip option.
DO NOT let a correction be overwritten by a new document ingest. Corrections always win.
DO NOT regenerate the full source of truth document on every ingest. Incremental updates only.
DO NOT send more than one question email per 24 hours unless founder explicitly requests.
DO NOT process inbound email from unrecognised senders. Log and ignore.
DO NOT make the UI complicated. One action per screen. Progress always visible.
DO NOT remove old Supabase document upload until Google Drive pipeline is tested and stable in production.
DO NOT use facts from stale unconfirmed documents in advice without flagging the age first.
```

---

## Perplexity / Manus Research Task (not a build task — run separately)

The following is a research prompt to run in Perplexity or Manus to populate the Market Intelligence RAG source list. This is not a coding task.

```
I am building a daily-updating AI knowledge base for a business transformation 
platform. Find and return a curated list of 30 high-signal sources across these categories:

CATEGORY 1 — Practitioners writing about AI-native business building, agentic 
workflows, replacing human labour with AI agents. Include their blog URL, 
newsletter, LinkedIn, or wherever they publish.

CATEGORY 2 — Tool review and comparison sites covering AI agents for business 
functions: voice SDRs, outbound automation, social media agents, AI bookkeeping, 
ops automation. Sites that do honest head-to-head comparisons with real data.

CATEGORY 3 — Case study sources: businesses documenting their transition from 
manual operations to AI-agent-led operations.

CATEGORY 4 — Research and frameworks on AI transformation for sub-£10M businesses. 
Not enterprise AI — specifically SME and founder-led businesses.

CATEGORY 5 — Official blogs of top AI agent tools (voice SDR platforms, outbound 
tools, social agents, accounting AI) that announce new features and case studies.

For each source: name/author, URL, what it covers, update frequency, why high signal.
Prioritise UK and European sources. Exclude generic AI news (TechCrunch, VentureBeat).
```

---

*Founder Engine — Claude Code Brief v2 | March 2026 | Confidential*
*Store canonical copy: Google Drive > Founder Engine > Source of Truth*
