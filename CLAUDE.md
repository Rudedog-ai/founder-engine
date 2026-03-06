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
Supabase (database + edge functions)
  |
ElevenLabs Conversational AI (voice agent "Angus")
  |
Perplexity API (deep company research)
  |
Claude API (intelligence extraction from transcripts + research)
```

## Core Flow

1. Founder visits app -> signs up (email+password or Google) -> onboarding form (company name, founder name, website)
2. System calls `onboard-company` edge function -> creates company + gap_analysis rows
3. System calls `scrape-business` edge function -> Perplexity sonar-pro researches the company deeply
4. Perplexity output -> Claude extracts structured data points -> stored in `knowledge_base` table
5. Smart questions generated that CANNOT be answered from public info
6. Pre-call screen shows what Angus already knows
7. ElevenLabs widget launches with `{{company_knowledge}}` and `{{smart_questions}}` as dynamic variables
8. Voice call happens — agent asks smart, prepared questions
9. Post-call webhook hits `process-transcript` -> Claude extracts more data points
10. Dashboard updates with new intelligence score, knowledge, gap analysis

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (builds to static files)
- **Auth**: Supabase Auth (email+password, Google OAuth)
- **Database**: Supabase PostgreSQL
- **Edge Functions**: Supabase Deno (8 functions)
- **Voice**: ElevenLabs Conversational AI
- **Research**: Perplexity API (sonar-pro)
- **Intelligence**: Claude API
- **Hosting**: Vercel (auto-deploys from GitHub `main`)

---

# 3. KEY CREDENTIALS & IDs

## Supabase

- **Project ID**: qzlicsovnldozbnmahsa
- **Project URL**: https://qzlicsovnldozbnmahsa.supabase.co
- **Anon Key**: stored in `.env.local` as `VITE_SUPABASE_ANON_KEY`

## Supabase Edge Function Secrets (set via dashboard Settings -> Edge Functions)

- `ANTHROPIC_API_KEY` — Claude API key (starts with sk-ant-api03-)
- `PERPLEXITY_API_KEY` — (stored in Supabase edge function secrets)
- `ELEVENLABS_WEBHOOK_SECRET` — (stored in Supabase edge function secrets)
- `ELEVENLABS_API_KEY` — ElevenLabs API key (for Register Call API, used by whatsapp-call-handler)
- `TWILIO_ACCOUNT_SID` — Twilio account SID (NOT YET SET — needed before WhatsApp goes live)
- `TWILIO_AUTH_TOKEN` — Twilio auth token (NOT YET SET — needed before WhatsApp goes live)
- `TWILIO_WHATSAPP_NUMBER` — WhatsApp-enabled Twilio number (NOT YET SET)

## ElevenLabs

- **Agent ID**: agent_1901kjxbr6xte40bw8dyeyhjwgze
- **Agent name**: Angus
- **Webhook**: configured in Security tab, points to `https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/process-transcript`
- **Dynamic variables**: `company_knowledge` and `smart_questions` — passed when widget initiates call
- **Voice**: "Ruari Quick Voice" (user's custom voice)
- **LLM**: Currently Qwen3-30B-A3B (recommend switching to Gemini 2.5 Flash or Claude)

## Vercel

- **Team**: team_2RdwDjC6QzaZ3OzoVsHaLlPn (Ruari's projects)
- **Founder Engine**: DEPLOYED at https://founder-engine-seven.vercel.app — auto-deploys from GitHub `main` branch (Rudedog-ai/founder-engine)

## Claude API

- **Model**: claude-sonnet-4-5-20250929

## Test Companies

- **Chocolate and Love**: ID `03c5d5f0-7174-4495-8b72-1aa2b5adb5ea`, 85 knowledge entries, 50% score
- **OYNB**: email `ruari@oneyearnobeer.com`, 73 knowledge entries

---

# 4. DATABASE SCHEMA (Supabase PostgreSQL)

## Tables

### companies — One row per onboarded company

- `id` (uuid PK), `name`, `founder_name`, `founder_email`, `industry`, `website`
- `email_inbox_address`, `onboarding_link`, `founder_phone` (text, indexed)
- `intelligence_score` (0-100), `intelligence_tier` (getting_started/good/great/amazing/expert)
- `onboarding_status` (pending/session_1_complete/docs_uploaded/session_2_complete/team_sessions/analysis_ready)
- `user_id` (uuid, references auth.users) — links company to authenticated user

### sessions — One row per voice call or transcript submission

- `id` (uuid PK), `company_id`, `session_number`, `session_type`, `participant_name`, `participant_role`
- `raw_transcript`, `summary`, `extracted_data` (jsonb), `duration_seconds`, `data_points_captured`, `topics_covered` (text[])
- `call_sid` (text) — Twilio call SID for WhatsApp calls
- `channel` (text, default 'web') — 'web' or 'whatsapp'
- `status` (text, default 'completed') — 'in_progress', 'completed', 'failed'
- `transcript_chunks` (jsonb, default '[]') — for future progressive saving
- `created_at`

### knowledge_base, gap_analysis, team_members, documents, recommendations, workflow_map, email_ingestion, audit_log

(See previous schema — unchanged)

All tables have RLS enabled.

---

# 5. EDGE FUNCTIONS (Supabase Deno)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `scrape-business` | v6 | false | Perplexity sonar-pro research -> Claude extraction -> knowledge_base storage |
| `process-transcript` | v16 | false | ElevenLabs post-call webhook AND direct API calls. Matches call_sid for WhatsApp sessions |
| `get-company-profile` | v13 | false | Returns full company profile with session channel/status. Supports `company_id` or `founder_email` lookup |
| `whatsapp-call-handler` | v1 | false | Twilio webhook: phone→company lookup→ElevenLabs Register Call API→TwiML |
| `onboard-company` | v12 | false | Creates company + gap_analysis rows for all 7 topics |
| `upload-document` | v14 | false | File upload with magic-byte MIME validation, 500MB quota, Claude analysis |
| `process-email` | v12 | false | Email ingestion pipeline |
| `generate-recommendations` | v13 | false | Claude generates prioritised business recommendations |
| `invite-team-member` | v11 | false | Creates team member record |
| `test-api-key` | v6 | false | Debug tool |

**Note:** All functions use `verify_jwt: false` because they use `SUPABASE_SERVICE_ROLE_KEY` internally. JWT validation was causing 401 gateway rejections.

---

# 6. FRONTEND (React + Vite + TypeScript)

## Project Structure

```
founder-engine/
├── index.html              # Vite entry point
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .env.local              # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── public/
│   └── manifest.json
├── src/
│   ├── main.tsx            # React entry, wraps in AuthProvider + ToastProvider
│   ├── App.tsx             # Auth gate + screen routing
│   ├── supabase.ts         # Supabase client (single instance)
│   ├── api.ts              # All edge function calls
│   ├── types.ts            # TypeScript interfaces
│   ├── vite-env.d.ts       # Vite + ElevenLabs type declarations
│   ├── contexts/
│   │   └── AuthContext.tsx  # Supabase Auth (email+password, Google OAuth)
│   ├── components/
│   │   ├── BottomNav.tsx   # 5-tab navigation with SVG icons
│   │   └── Toast.tsx       # Toast notifications
│   ├── screens/
│   │   ├── WelcomeScreen.tsx    # Auth + onboarding (ocean theme landing)
│   │   ├── DashboardScreen.tsx  # Score card, topics, activity feed
│   │   ├── VoiceScreen.tsx      # ElevenLabs widget + transcript processing
│   │   ├── KnowledgeScreen.tsx  # Knowledge entries by topic
│   │   ├── CallsScreen.tsx      # Call history with filters
│   │   └── MoreScreen.tsx       # Upload, team, recommendations, gaps, settings
│   └── styles/
│       └── ocean.css       # Full ocean theme
└── docs/plans/             # Design docs and implementation plans
```

## Development Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Key Technical Details

- Supabase JS client (`supabase.functions.invoke()`) auto-attaches JWT — no manual header management
- AuthContext manages user session, company ID (persisted to localStorage)
- Each screen is its own component — if one crashes, others still work
- ElevenLabs widget lazy-loaded only when voice call starts
- Ocean theme: deep blues, teals, seafoam, cyan glow (CSS variables)

---

# 7. ELEVENLABS SYSTEM PROMPT

The voice agent's prompt follows the "come prepared" philosophy:

- Agent has `{{company_knowledge}}` variable with everything known about the company
- Agent has `{{smart_questions}}` variable with researched questions
- Never asks questions answerable from a website
- 10-15 minute first call maximum
- Direct, no-bullshit conversational style
- First message should reference having reviewed their website/business

---

# 8. IMMEDIATE TODO

1. **Enable Supabase Auth providers** — Enable Email+Password and Google OAuth in Supabase dashboard (Authentication -> Providers)
2. **Google OAuth setup** — Create Google Cloud Console OAuth client ID, add to Supabase
3. **Voice agent LLM** — Switch from Qwen3-30B-A3B to Gemini 2.5 Flash or Claude
4. **RLS policies** — Add row-level security policies that use auth.uid() to restrict data access
5. **Custom domain** — check founderengine.ai or similar
6. **Test with a real founder** (not test data)
7. **WhatsApp go-live** — Buy Twilio number, enable WhatsApp Business Calling, set env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, ELEVENLABS_API_KEY), configure webhook URL to `whatsapp-call-handler`
8. **Update MoreScreen WhatsApp display** — Replace "Number coming soon" with actual Twilio WhatsApp number once purchased

---

# 9. DEVELOPMENT ROADMAP

## Phase 1 — React Rebuild & Auth (COMPLETED)
- Rebuilt from single HTML monolith to React + Vite + TypeScript
- Supabase Auth integrated (email+password, Google OAuth)
- All screens rebuilt as modular components
- Ocean theme preserved
- `user_id` column added to companies table
- DEPLOYED at https://founder-engine-seven.vercel.app

## Phase 2 — Polish & Security
- Row Level Security policies using auth.uid()
- User roles — founder vs team member vs advisor
- Error boundaries for each screen
- Automated tests

## Phase 3-8
(See previous roadmap — unchanged)

---

# 10. SECURITY

## Row Level Security (RLS)

### `documents` table (4 policies)
- `users_read_own_docs` (SELECT), `users_insert_own_docs` (INSERT), `users_update_own_docs` (UPDATE), `users_delete_own_docs` (DELETE)
- All check: `company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())`

### `storage.objects` — bucket `company-documents` (3 policies)
- `users_read_own_files` (SELECT), `users_insert_own_files` (INSERT), `users_delete_own_files` (DELETE)
- All check: `bucket_id = 'company-documents' AND folder = user's company ID`

### Storage bucket `company-documents`
- **Public**: No (private bucket)
- **Encryption at rest**: Yes (Supabase default — all storage objects encrypted at rest)
- **File size limit**: 50MB per file (bucket + edge function)
- **Company quota**: 500MB total per company (enforced in `upload-document` v14)
- **Allowed MIME types**: PDF, DOCX, XLSX, PPTX, CSV, TXT, PNG, JPEG, WebP
- **Server-side validation**: Magic-byte detection in edge function, blocked extensions list

### Edge function security (`upload-document` v14)
- Magic-byte MIME detection (PDF, PNG, JPEG, WebP, ZIP-based Office files)
- Text file detection for CSV/TXT
- Blocked extensions: exe, bat, sh, js, py, html, svg, dll, jar + 20 more
- Company storage quota enforcement (500MB)
- Audit logging with both declared and detected MIME types

### Future: Virus scanning
- `documents.scan_status` column exists (default: 'pending')
- Ready for ClamAV or similar integration

---

# 11. TECHNICAL DEBT / KNOWN ISSUES

(Section renumbered — was #10)

- HMAC webhook verification is lenient — logs but doesn't block
- Duplicate knowledge entries — need upsert logic on company_id + key
- Edge function timeouts — Supabase free tier has limits
- Voice agent LLM — currently Qwen3-30B-A3B, too weak
- No tests — zero automated tests
- RLS policies need updating for auth.uid() based access control
- Google OAuth not yet configured in Supabase dashboard

---

# 12. INFRASTRUCTURE

| Service | Purpose |
|---------|---------|
| Supabase | Database, edge functions, auth, storage |
| Vercel | React app hosting (Vite build) |
| ElevenLabs | Voice AI agent |
| Perplexity API | Deep company research (sonar-pro model) |
| Claude API | Intelligence extraction from all sources |

---

# 13. OWNER

**Ruari Fairbairns** — rfairbairns@gmail.com
- NOT a developer — needs exact commands
- Values working code over perfect code

---

*This document IS the project context. Every Claude Code session reads this first. Update when making significant changes.*
