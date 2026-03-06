# Founder Onboarding Intelligence Engine
### Last Updated: 7 March 2026

---

# 0. MULTI-AGENT RULES (READ FIRST)

Multiple Claude Code agents may work on this codebase in parallel.
Before touching any file:

**SHARED FILES (coordinator only — never edit without explicit instruction):**
- `src/App.tsx`
- `src/styles/ocean.css`
- `src/types.ts`
- `src/api.ts`
- `CLAUDE.md`

**RULES:**
1. `git pull origin main` before every task
2. `git status` must be clean before starting
3. Commit after every logical unit of work
4. If your task needs a SHARED file change, stop and describe what's needed — don't edit it
5. Never leave uncommitted changes and start something new
6. Merge conflict = stop immediately, report it

**START OF EVERY SESSION:**
```bash
git status          # must be clean
git log --oneline -3
git pull origin main
```

---

# 1. WHAT THIS IS

A voice-first AI system that interviews business founders, extracts structured intelligence, and builds a comprehensive knowledge base. The AI agent ("Angus") comes PREPARED to every call — it researches the company beforehand using Perplexity Deep Research, so it never asks lazy questions like "tell me about your business."

The system is built for a product called **Founder Engine** — an AI-powered company intelligence platform.

---

# 2. ARCHITECTURE

```
React + Vite PWA (Vercel, auto-deploys from GitHub main)
  |
Supabase Auth (email+password, Google OAuth)
  |
Supabase (database + 19 edge functions)
  |
ElevenLabs Conversational AI (voice agent "Angus")
  |
Perplexity API (deep company research)
  |
Claude API (intelligence extraction from transcripts + research)
  |
Stripe (subscription billing — checkout + webhooks)
```

## Core Flow

1. Founder visits app -> signs up (email+password or Google) -> onboarding form (company name, founder name, website)
2. System calls `onboard-company` edge function -> creates company + gap_analysis rows
3. System calls `scrape-business` edge function -> Perplexity sonar-pro researches the company deeply
4. Perplexity output -> Claude extracts structured data points -> stored in `knowledge_base` table
5. `calculate-domain-scores` runs -> source-weighted intelligence score (auto-research capped at 10%)
6. Smart questions generated at 25% score targeting knowledge gaps
7. Founder answers via 4 modes: write, voice, dictate (SpeechRecognition), email
8. Answers processed -> knowledge extracted -> scores recalculated
9. Source of Truth generates at 25% -> structured summary per domain
10. Corrections layer lets founders fix any fact -> corrections always override source data
11. Google Drive folder created on connect -> docs auto-processed via webhooks
12. ElevenLabs voice calls with `{{company_knowledge}}` and `{{smart_questions}}` dynamic variables
13. Post-call webhook -> `process-transcript` -> Claude extracts more data points
14. Dashboard updates: intelligence score, domain sliders, knowledge areas, activity feed

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (builds to static files)
- **Auth**: Supabase Auth (email+password, Google OAuth)
- **Database**: Supabase PostgreSQL + pgvector
- **Edge Functions**: Supabase Deno (19 functions deployed)
- **Voice**: ElevenLabs Conversational AI
- **Research**: Perplexity API (sonar-pro)
- **Intelligence**: Claude API (claude-sonnet-4-5-20250929)
- **Payments**: Stripe (checkout + webhook)
- **Hosting**: Vercel (auto-deploys from GitHub `main`)

---

# 3. KEY CREDENTIALS & IDs

## Supabase

- **Project ID**: qzlicsovnldozbnmahsa
- **Project URL**: https://qzlicsovnldozbnmahsa.supabase.co
- **Anon Key**: stored in `.env.local` as `VITE_SUPABASE_ANON_KEY`

## Supabase Edge Function Secrets (set via dashboard Settings -> Edge Functions)

- `ANTHROPIC_API_KEY` — Claude API key
- `PERPLEXITY_API_KEY` — Perplexity API key
- `ELEVENLABS_WEBHOOK_SECRET` — ElevenLabs webhook verification
- `ELEVENLABS_API_KEY` — ElevenLabs API key (Register Call API, WhatsApp)
- `TWILIO_ACCOUNT_SID` — Twilio account SID
- `TWILIO_AUTH_TOKEN` — Twilio auth token
- `TWILIO_WHATSAPP_NUMBER` — WhatsApp sandbox: +14155238886
- `GOOGLE_CLIENT_ID` — Google Cloud Console OAuth (TO SET)
- `GOOGLE_CLIENT_SECRET` — Google Cloud Console OAuth (TO SET)
- `STRIPE_SECRET_KEY` — Stripe API key (TO SET)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (TO SET)

## ElevenLabs

- **Agent ID**: agent_1901kjxbr6xte40bw8dyeyhjwgze
- **Agent name**: Angus
- **Webhook**: `https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/process-transcript`
- **Dynamic variables**: `company_knowledge` and `smart_questions`
- **Voice**: "Ruari Quick Voice" (custom)
- **LLM**: Currently Qwen3-30B-A3B (recommend switching to Gemini 2.5 Flash or Claude)
- **System prompt**: docs/ANGUS-ELEVENLABS-PROMPT.md (already pasted into ElevenLabs)

## Vercel

- **Team**: team_2RdwDjC6QzaZ3OzoVsHaLlPn
- **URL**: https://founder-engine-seven.vercel.app
- **Repo**: Rudedog-ai/founder-engine (auto-deploys from `main`)

## Claude API

- **Model**: claude-sonnet-4-5-20250929

## Test Company

- **OYNB**: ID `7caf6a8e-0165-410d-b4ce-56f0fe05be4e`, email `ruari@oneyearnobeer.com`, 14% score "Getting Started"

---

# 4. DATABASE SCHEMA (Supabase PostgreSQL)

## Tables

### companies — One row per onboarded company

- `id` (uuid PK), `name`, `founder_name`, `founder_email`, `industry`, `website`
- `email_inbox_address`, `onboarding_link`, `founder_phone` (text, indexed)
- `intelligence_score` (0-100), `intelligence_tier` (getting_started/good/great/amazing/expert)
- `onboarding_status`, `onboarding_stage` (int, 1-6), `welcome_complete` (bool)
- `user_id` (uuid, references auth.users)
- `domain_scores` (jsonb: financials, sales, marketing, operations, team, strategy)
- `preferred_answer_mode` (text: written/voice/transcribe/email)
- `source_of_truth_doc_id` (text — stores JSON of generated SoT)
- `google_folder_id`, `google_access_token`, `google_refresh_token`, `google_connected_at`
- `google_webhook_channel_id`, `google_webhook_expiry`
- `stripe_customer_id`, `stripe_subscription_id`, `subscription_status` (default 'free'), `subscription_plan`

### sessions — One row per voice call or transcript submission

- `id` (uuid PK), `company_id`, `session_number`, `session_type`, `participant_name`, `participant_role`
- `raw_transcript`, `summary`, `extracted_data` (jsonb), `duration_seconds`, `data_points_captured`, `topics_covered` (text[])
- `call_sid` (text), `channel` (text, default 'web'), `status` (text, default 'completed')

### knowledge_base — Flat extracted facts

- `id`, `company_id`, `topic`, `key`, `value`, `confidence`, `source_session_id`

### knowledge_chunks — Semantic chunks with pgvector embeddings

- `id`, `company_id`, `source`, `source_id`, `source_name`, `domain`, `chunk_text`, `embedding` (vector 1536)
- `confidence_score`, `document_date`, `is_stale`

### knowledge_elements — Structured knowledge per domain

- `id`, `company_id`, `element_key`, `element_label`, `domain`, `current_value`
- `has_correction`, `correction_id`, `document_age_months`, `is_stale`

### knowledge_corrections — Founder corrections (always win)

- `id`, `company_id`, `element_key`, `element_label`, `domain`
- `original_value`, `corrected_value`, `correction_context`, `source`
- `active` (bool), `superseded_by` (uuid), `applied_at`

### onboarding_questions — AI-generated smart questions

- `id`, `company_id`, `question`, `domain`, `why_asking`, `priority` (1-3)
- `status` (pending/answered/skipped/emailed), `answer_text`, `answer_mode`

### Other tables
- `gap_analysis` — completeness scores per topic (7 rows per company)
- `team_members` — invited team members
- `documents` — uploaded files metadata
- `recommendations` — Claude-generated business recommendations
- `audit_log` — all system actions

All tables have RLS enabled.

---

# 5. EDGE FUNCTIONS (Supabase Deno)

All functions use `verify_jwt: false` and `SUPABASE_SERVICE_ROLE_KEY` internally.

### Pre-existing (before sprints)
| Function | Version | Purpose |
|----------|---------|---------|
| `scrape-business` | v6 | Perplexity sonar-pro research -> Claude extraction -> knowledge_base |
| `process-transcript` | v16 | ElevenLabs post-call webhook + direct API. Matches call_sid for WhatsApp |
| `get-company-profile` | v13 | Full company profile. Supports company_id or founder_email lookup |
| `whatsapp-call-handler` | v1 | Twilio webhook: phone -> company -> ElevenLabs Register Call API |
| `onboard-company` | v12 | Creates company + gap_analysis rows for all 7 topics |
| `upload-document` | v14 | File upload with magic-byte MIME validation, 500MB quota |
| `process-email` | v12 | Email ingestion pipeline |
| `generate-recommendations` | v13 | Claude generates prioritised business recommendations |
| `invite-team-member` | v11 | Creates team member record |
| `test-api-key` | v6 | Debug tool |

### Sprint 2 — Google Drive
| Function | Version | Purpose |
|----------|---------|---------|
| `google-drive-oauth` | v1 | OAuth get_auth_url + callback + folder creation + webhook setup |
| `refresh-google-tokens` | v1 | Auto-refresh tokens, clears on revocation |
| `google-drive-webhook` | v1 | Receives Drive push notifications, triggers processing |
| `process-drive-document` | v1 | Extract text from Drive files, chunk, classify domain via Claude Haiku |

### Sprint 3 — Intelligence Scoring
| Function | Version | Purpose |
|----------|---------|---------|
| `calculate-domain-scores` | v3 | Source-weighted scoring (auto 10%, docs 45%, voice 35%, tools 25%) |
| `generate-source-of-truth` | v1 | Claude generates structured JSON summary from knowledge_base |

### Sprint 4 — Corrections
| Function | Version | Purpose |
|----------|---------|---------|
| `apply-correction` | v1 | Stores correction, updates knowledge_elements + knowledge_base, audit log |

### Sprint 5 — Smart Questions
| Function | Version | Purpose |
|----------|---------|---------|
| `generate-onboarding-questions` | v1 | Claude generates 5-8 questions targeting knowledge gaps |
| `process-question-answer` | v1 | Processes any answer mode, extracts knowledge, recalculates scores |

### Sprint 6 — Payments
| Function | Version | Purpose |
|----------|---------|---------|
| `create-checkout` | v1 | Creates Stripe customer + checkout session for subscription |
| `stripe-webhook` | v1 | Handles checkout.session.completed, subscription updates, payment failures |

---

# 6. FRONTEND (React + Vite + TypeScript)

## Project Structure

```
founder-engine/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .env.local                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── public/manifest.json
├── src/
│   ├── main.tsx                  # Entry: AuthProvider + ToastProvider + CSS imports
│   ├── App.tsx                   # Auth gate + screen routing + ErrorBoundary wraps
│   ├── supabase.ts               # Supabase client singleton
│   ├── api.ts                    # All edge function API calls
│   ├── types.ts                  # TypeScript interfaces
│   ├── vite-env.d.ts
│   ├── contexts/
│   │   └── AuthContext.tsx        # Supabase Auth (email+password, Google OAuth)
│   ├── components/
│   │   ├── BottomNav.tsx          # 5-tab mobile navigation
│   │   ├── SideNav.tsx            # Desktop sidebar navigation
│   │   ├── ErrorBoundary.tsx      # Screen-level error boundary (Sprint 6)
│   │   ├── ResearchBanner.tsx     # Perplexity scrape progress indicator
│   │   ├── Toast.tsx              # Toast notifications
│   │   ├── intelligence/          # Sprint 3
│   │   │   ├── IntelligenceBuilder.tsx   # 6 domain sliders container
│   │   │   ├── IntelligenceSlider.tsx    # Single animated domain bar
│   │   │   ├── DocumentChecklist.tsx     # Expected vs received documents
│   │   │   ├── KnowledgeCard.tsx         # Knowledge fact + confidence dot + edit button
│   │   │   └── SourceOfTruth.tsx         # Collapsible domain sections + edit buttons
│   │   ├── corrections/           # Sprint 4
│   │   │   ├── CorrectionPanel.tsx       # Slide-out editor for knowledge facts
│   │   │   ├── CorrectionHistory.tsx     # Timeline of past corrections
│   │   │   └── StaleDocAlert.tsx         # Age-based warning badges
│   │   ├── questions/             # Sprint 5
│   │   │   ├── QuestionBatch.tsx         # Container: pending + completed questions
│   │   │   ├── QuestionItem.tsx          # Single question + mode selector + answer
│   │   │   ├── ModeSelector.tsx          # 4-mode toggle (write/voice/dictate/email)
│   │   │   ├── WrittenAnswerMode.tsx     # Text input answer
│   │   │   ├── VoiceAnswerMode.tsx       # Link to voice session
│   │   │   ├── TranscribeAnswerMode.tsx  # Browser SpeechRecognition
│   │   │   └── EmailAnswerMode.tsx       # Placeholder email flow
│   │   └── more/                  # Extracted MoreScreen sections
│   │       ├── WhatsAppSection.tsx
│   │       ├── DocumentsSection.tsx
│   │       └── RecommendationsSection.tsx
│   ├── screens/
│   │   ├── WelcomeScreen.tsx      # Auth + sign-up/sign-in
│   │   ├── DashboardScreen.tsx    # Score card, topics, intelligence builder, SoT, questions, activity
│   │   ├── VoiceScreen.tsx        # ElevenLabs widget + transcript processing
│   │   ├── KnowledgeScreen.tsx    # Knowledge entries by topic
│   │   ├── CallsScreen.tsx        # Call history with filters
│   │   ├── MoreScreen.tsx         # Upload, Drive connect, team, billing, recommendations, settings
│   │   └── onboarding/
│   │       ├── OnboardingFlow.tsx      # 5-stage container
│   │       ├── WelcomeStage.tsx        # Typewriter Angus monologue
│   │       ├── ConnectToolsStage.tsx   # Google Drive OAuth + Xero placeholder
│   │       ├── FeedAngusStage.tsx      # Upload docs + paste transcript
│   │       ├── QuestionsStage.tsx      # Seed default questions
│   │       ├── OnboardingComplete.tsx  # Advance to dashboard
│   │       ├── ProgressIndicator.tsx   # Step X of 5
│   │       ├── ConnectCard.tsx         # Tool connection card
│   │       ├── QuestionCard.tsx        # Onboarding question card
│   │       └── defaultQuestions.ts     # 5 hardcoded seed questions
│   └── styles/
│       ├── ocean.css              # Main ocean theme (CSS variables, layouts)
│       ├── onboarding.css         # Onboarding flow styles
│       ├── intelligence.css       # Intelligence builder, SoT, knowledge cards
│       ├── corrections.css        # Correction panel, history, stale alerts
│       └── questions.css          # Smart questions, mode selector, answer modes
├── docs/
│   ├── ANGUS-ELEVENLABS-PROMPT.md
│   ├── AGENT-B-SPRINT-3-BRIEF.md
│   ├── AGENT-B-SPRINT-4-BRIEF.md
│   ├── AGENT-B-SPRINT-5-BRIEF.md
│   ├── SPRINT-3-DASHBOARD-INTEGRATION.md
│   └── SPRINT-4-5-INTEGRATION.md
├── Architecture.md
├── Decisions-Log.md
├── Product-Status.md
└── Brief-Onboarding-v2.md
```

## Dashboard Layout (DashboardScreen.tsx)

Top to bottom:
1. ResearchBanner (auto-scrape progress)
2. Score Card (intelligence score, tier, data points)
3. Knowledge Areas (7 topic cards with completeness bars)
4. Intelligence Builder (6 domain sliders)
5. Document Checklist (expected vs received)
6. Source of Truth (collapsible domains with edit buttons)
7. Smart Questions (pending + completed, 4 answer modes)
8. Activity Feed (recent actions)

## Development Commands

```bash
npm run dev      # Vite dev server (localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Key Technical Details

- Supabase JS client auto-attaches JWT — no manual header management
- AuthContext manages user session, company ID (persisted to localStorage)
- ErrorBoundary wraps every screen — one crash doesn't take down the app
- ElevenLabs widget lazy-loaded only when voice call starts
- Ocean theme: deep blues, teals, seafoam, cyan glow (CSS variables)
- Intelligence scoring: source-weighted, auto-research capped at 10%, docs 45%, voice 35%, tools 25%

---

# 7. ELEVENLABS SYSTEM PROMPT

Full prompt: `docs/ANGUS-ELEVENLABS-PROMPT.md` (already pasted into ElevenLabs dashboard)

Key points:
- `{{company_knowledge}}` and `{{smart_questions}}` dynamic variables
- Never asks questions answerable from a website
- 10-15 minute first call maximum
- Direct, Scottish-inflected conversational style
- Synthesises, never originates — every fact from a source

---

# 8. INTELLIGENCE SCORE SYSTEM

Source-weighted scoring prevents inflation from auto-research alone.

| Source | Max Contribution | Expected Entries Per Domain |
|--------|-----------------|---------------------------|
| Auto-research (Perplexity) | 10% | N/A |
| Uploaded documents | 45% | 20 per domain |
| Voice sessions | 35% | 20 per domain |
| Connected tools (Xero etc) | 25% | N/A |

**Key rule:** A company with zero documents and no connected tools should show 10-15% maximum.

Tiers: Getting Started (0-24%), Good (25-49%), Great (50-74%), Amazing (75-89%), Expert (90-100%)

---

# 9. REMAINING TODO (for launch)

### Must Set (Ruari — manual steps)
1. **Google Drive secrets**: Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in Supabase dashboard
2. **Google Console redirect URI**: Add `https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/google-drive-oauth`
3. **Stripe setup**: Create Stripe account, set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Supabase secrets
4. **Stripe price ID**: Create product + price in Stripe dashboard, update `price_placeholder` in MoreScreen
5. **Stripe webhook URL**: Set `https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/stripe-webhook` in Stripe dashboard
6. **Voice agent LLM**: Switch ElevenLabs from Qwen3-30B-A3B to Gemini 2.5 Flash or Claude
7. **Push to deploy**: `git push origin main` — Vercel auto-deploys

### Nice to Have
- RLS policies updated for auth.uid() based access control
- Custom domain (founderengine.ai)
- Bidirectional Google Doc sync (edit in Drive -> dashboard updates)
- Email question pipeline (Resend/Postmark inbound)
- Automated tests
- Mobile CSS polish
- WhatsApp go-live (buy Twilio number)

---

# 10. SECURITY

## Row Level Security (RLS)

### `documents` table (4 policies)
- All check: `company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())`

### `storage.objects` — bucket `company-documents` (3 policies)
- All check: `bucket_id = 'company-documents' AND folder = user's company ID`

### Storage bucket `company-documents`
- Private bucket, encrypted at rest
- 50MB per file, 500MB company quota
- Magic-byte MIME detection, blocked extensions list

---

# 11. TECHNICAL DEBT / KNOWN ISSUES

- HMAC webhook verification is lenient — logs but doesn't block
- Duplicate knowledge entries — need upsert logic on company_id + key
- Edge function timeouts — Supabase free tier has limits
- Voice agent LLM — currently Qwen3-30B-A3B, too weak
- No automated tests
- Email question pipeline is placeholder only (shows address, no actual email)
- Stripe price_id is placeholder — needs real Stripe product setup
- Google Drive OAuth needs secrets before it works end-to-end

---

# 12. INFRASTRUCTURE

| Service | Purpose |
|---------|---------|
| Supabase | Database, edge functions, auth, storage |
| Vercel | React app hosting (Vite build) |
| ElevenLabs | Voice AI agent (Angus) |
| Perplexity API | Deep company research (sonar-pro) |
| Claude API | Intelligence extraction from all sources |
| Stripe | Subscription billing (checkout + webhooks) |
| Google Drive API | Document ingestion (drive.file scope) |

---

# 13. OWNER

**Ruari Fairbairns** — rfairbairns@gmail.com
- NOT a developer — needs exact commands
- Values working code over perfect code

---

*This document IS the project context. Every Claude Code session reads this first. Update when making significant changes.*
