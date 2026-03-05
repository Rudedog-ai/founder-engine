# Founder Onboarding Intelligence Engine
### Last Updated: 6 March 2026

---

# 1. WHAT THIS IS

A voice-first AI system that interviews business founders, extracts structured intelligence, and builds a comprehensive knowledge base. The AI agent ("Angus") comes PREPARED to every call — it researches the company beforehand using Perplexity Deep Research, so it never asks lazy questions like "tell me about your business."

The system is built for a product called **Founder Engine** — an AI-powered company intelligence platform.

---

# 2. ARCHITECTURE

```
PWA (single HTML file on Vercel)
  |
Supabase (database + edge functions + auth)
  |
ElevenLabs Conversational AI (voice agent "Angus")
  |
Perplexity API (deep company research)
  |
Claude API (intelligence extraction from transcripts + research)
```

## Core Flow

1. Founder opens PWA -> enters company name, their name, email, website URL
2. System calls `scrape-business` edge function -> Perplexity sonar-pro researches the company deeply (Companies House, news, social, competitors, financials)
3. Perplexity output -> Claude extracts structured data points -> stored in `knowledge_base` table
4. Smart questions generated that CANNOT be answered from public info
5. Pre-call screen shows what Angus already knows
6. ElevenLabs widget launches with `{{company_knowledge}}` and `{{smart_questions}}` as dynamic variables
7. Voice call happens — agent asks smart, prepared questions
8. Post-call webhook hits `process-transcript` -> Claude extracts more data points
9. Progressive transcript saving (localStorage backup + Supabase sync every 15s)
10. Dashboard updates with new intelligence score, knowledge, gap analysis

---

# 3. KEY CREDENTIALS & IDs

## Supabase

- **Project ID**: qzlicsovnldozbnmahsa
- **Project URL**: https://qzlicsovnldozbnmahsa.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bGljc292bmxkb3pibm1haHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTYzNTEsImV4cCI6MjA4ODIzMjM1MX0.kpPbOFMmixDMw3i1cZPBsAVINt3NR9_xTs6mIBtXfF0

## Supabase Edge Function Secrets (set via dashboard Settings -> Edge Functions)

- `ANTHROPIC_API_KEY` — Claude API key (starts with sk-ant-api03-)
- `PERPLEXITY_API_KEY` — (stored in Supabase edge function secrets — MUST be added if not already done)
- `ELEVENLABS_WEBHOOK_SECRET` — (stored in Supabase edge function secrets)

## ElevenLabs

- **Agent ID**: agent_1901kjxbr6xte40bw8dyeyhjwgze
- **Agent name**: Angus
- **Webhook**: configured in Security tab, points to `https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/process-transcript`
- **Dynamic variables**: `company_knowledge` and `smart_questions` — passed when widget initiates call
- **Voice**: "Ruari Quick Voice" (user's custom voice)
- **LLM**: Currently Qwen3-30B-A3B (user changed from Gemini 2.5 Flash — recommend switching back to Gemini 2.5 Flash or Claude for better quality)
- **Expressive mode**: Should be OFF (was making voice too emotional)

## Vercel

- **Team**: team_2RdwDjC6QzaZ3OzoVsHaLlPn (Ruari's projects)
- **Existing projects**: brokeragentapp, minimoguls
- **Founder Engine**: DEPLOYED at https://founder-engine-seven.vercel.app — auto-deploys from GitHub `main` branch (Rudedog-ai/founder-engine)

## Claude API

- **Model**: claude-sonnet-4-5-20250929 (Sonnet 4.6 string claude-sonnet-4-6-20250514 returns 404 — not available on API yet)

## Test Company

- **Company**: Chocolate and Love
- **Company ID**: 03c5d5f0-7174-4495-8b72-1aa2b5adb5ea
- **Knowledge base**: 85 entries loaded (from voice calls + Perplexity research manual import)
- **Intelligence score**: 50% ("Great" tier)

---

# 4. DATABASE SCHEMA (Supabase PostgreSQL)

## Tables

### companies — One row per onboarded company

- `id` (uuid PK), `name`, `founder_name`, `founder_email`, `industry`, `website`
- `email_inbox_address`, `onboarding_link`
- `intelligence_score` (0-100), `intelligence_tier` (getting_started/good/great/amazing/expert)
- `onboarding_status` (pending/session_1_complete/docs_uploaded/session_2_complete/team_sessions/analysis_ready)

### knowledge_base — Every piece of extracted intelligence (85 rows for test company)

- `id`, `company_id` -> companies
- `topic` (business_fundamentals/revenue_financials/customers/team_operations/marketing_sales/technology_systems/founder_headspace)
- `key` (snake_case identifier), `value` (the intelligence), `confidence` (0-1)
- `source_session_id` -> sessions, `source_document_id`

### sessions — Voice call sessions (8 for test company)

- `id`, `company_id` -> companies
- `session_number`, `session_type` (voice_founder/voice_team/telegram/file_upload)
- `participant_name`, `participant_role`
- `raw_transcript`, `summary`, `extracted_data` (jsonb)
- `duration_seconds`, `data_points_captured`, `topics_covered` (text[])

### gap_analysis — 7 topic areas with completeness scores

- `id`, `company_id` -> companies
- `topic`, `completeness_score` (0-100), `total_data_points`, `captured_data_points`
- `missing_items` (text[]), `suggested_assignee_name`

### team_members — People invited to do their own voice sessions

- `id`, `company_id`, `name`, `email`, `role`
- `tools_used`, `typical_week_summary`, `friction_points`, `ai_opportunities`
- `session_completed`, `invite_status` (pending/invited/in_progress/complete)

### documents — Uploaded files

- `id`, `company_id`, `file_name`, `file_path`, `file_type`, `file_hash`, `file_size_bytes`
- `extracted_text`, `extracted_data`, `processed`, `source` (upload/email/url)

### recommendations — AI-generated business recommendations

- `id`, `company_id`, `constraint_type` (demand/conversion/fulfilment/cash/team/founder_bandwidth/systems)
- `priority`, `title`, `description`, `reasoning`, `status`

### workflow_map — Business process maps

- `id`, `company_id`, `process_name`, `owner_team_member_id`
- `steps`, `tools_involved`, `handoff_points`, `friction_points`, `automation_potential`

### email_ingestion — Email intake tracking

- `id`, `company_id`, `sender_email`, `subject`, `body_text`

### audit_log — Activity tracking

- `id`, `company_id`, `user_role`, `action`, `resource_type`, `resource_id`, `details`

All tables have RLS enabled.

---

# 5. EDGE FUNCTIONS (Supabase Deno)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `scrape-business` | v5 | false | Perplexity sonar-pro research -> Claude extraction -> knowledge_base storage. Main research pipeline. |
| `process-transcript` | v15 | false | ElevenLabs post-call webhook AND direct API calls. Detects ElevenLabs payload format. HMAC verification is lenient (logs but doesn't block). |
| `get-company-profile` | v10 | true | Returns full company profile: company, knowledge (grouped by topic), knowledge_raw, gaps, sessions, team, recommendations, documents, recent_activity |
| `onboard-company` | v10 | true | Creates company + gap_analysis rows for all 7 topics |
| `upload-document` | v12 | true | File upload -> text extraction -> Claude analysis |
| `process-email` | v12 | false | Email ingestion pipeline |
| `generate-recommendations` | v12 | true | Claude generates prioritised business recommendations |
| `invite-team-member` | v10 | true | Creates team member record |
| `test-api-key` | v6 | false | Debug tool — tests Claude API key against multiple model strings |

---

# 6. PWA (index.html)

Single HTML file (~2500+ lines) with embedded CSS + JS. Dark theme. No build step — pure vanilla HTML/CSS/JS.

## Screens

- **Welcome/Onboarding** — Company name, founder name, email, website URL -> scrape -> pre-call
- **Dashboard** — Intelligence ring (score + tier), topic progress bars, activity feed
- **Voice** — Pre-call screen showing what Angus knows -> ElevenLabs widget embed -> progressive transcript saving
- **Knowledge** — All knowledge_base entries organized by topic (collapsible accordions), confidence badges
- **Calls** — Full call history across all participants, filter tabs (All/Founder/Team), expandable session cards
- **More** — Upload Documents, Team Management, Recommendations, Gap Analysis, Settings

## Bottom Nav (5 items)

Dashboard | Voice | Knowledge | Calls | More

## Key Technical Details

- Supabase JS client loaded from CDN
- ElevenLabs widget loaded from CDN
- Progressive transcript saving: localStorage backup + Supabase sync every 15 seconds
- Dynamic variables `company_knowledge` and `smart_questions` passed to ElevenLabs widget at call initiation

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

# 8. FILES

| File | Purpose |
|------|---------|
| `index.html` | The full PWA (~117KB), ready for Vercel deployment |
| `design-preview.html` | Design preview — ocean theme, proposed UI components, live at `/design-preview.html` |
| `vercel.json` | Vercel config with SPA rewrites (serves static files first, then falls back to index.html) |

---

# 9. IMMEDIATE TODO

1. **Complete design redesign** — Apply ocean theme from `design-preview.html` to `index.html`
2. **Voice agent LLM** — Currently Qwen3-30B-A3B (too weak). Switch back to Gemini 2.5 Flash or Claude in ElevenLabs agent settings.
3. **Custom domain** — check founderengine.ai or similar
4. **Test with a real founder** (not test data)

---

# 10. DEVELOPMENT ROADMAP

## Phase 1 — Design Redesign & Launch (in progress)
- **DEPLOYED**: Live at https://founder-engine-seven.vercel.app (auto-deploys from GitHub main branch)
- **Onboarding flow**: Working — company name, founder name, email, website URL → Perplexity research → knowledge extraction
- **Perplexity research**: Broadened to search company name + founder name across all public sources (not just website URL)
- **Design redesign** (in progress):
  - Ocean/sea theme — stormy-to-calm metaphor (chaos to clarity)
  - Color palette: deep ocean blues, teals, seafoam, cyan glow (`--deep: #020b18` through `--glow: #00f0ff`)
  - Front page = signup/onboarding screen with ocean video background
  - Dashboard = separate screen, no ocean hero, compact layout
  - CSS animated ocean preview at `/design-preview.html` (waves, light rays, bioluminescent particles)
  - Font: Inter, frosted glass effects, thin-stroke icons
  - Mobile-first, fintech-level polish
  - Free ocean videos sourced from Mixkit CDN (royalty-free, e.g. `https://assets.mixkit.co/videos/4059/4059-720.mp4`)
- Custom domain — check founderengine.ai or similar
- Fix voice quality — ElevenLabs voice settings, speed, emotion level

## Phase 2 — Authentication & Multi-tenancy
- Supabase Auth — login/signup (email magic link or Google OAuth)
- Row Level Security — lock down so each company sees only their own data
- User roles — founder vs team member vs advisor
- Session management — proper JWT handling in PWA

## Phase 3 — Document Intelligence
- Document upload flow — drag-and-drop, process PDFs/DOCX/spreadsheets
- Email forwarding — unique email address per company
- Document analysis — Claude extracts intelligence from business documents
- Smart document requests — system identifies gaps and suggests documents to upload

## Phase 4 — Team Sessions
- Team invite flow — founder invites team members
- Personalised team calls — role-specific questions
- Cross-reference intelligence — compare founder vs team answers
- Workflow mapping — who does what, with what tools, where friction is

## Phase 5 — Recommendations Engine
- Constraint-based analysis — identify #1 bottleneck
- Prioritised action plan
- AI tool recommendations based on workflow gaps
- ROI estimates
- Theory of Constraints integration

## Phase 6 — Ongoing Intelligence
- Recurring calls — monthly/quarterly check-ins
- Intelligence decay — flag stale data points
- News monitoring via Perplexity
- Competitive tracking
- Benchmark data against similar companies

## Phase 7 — Platform & Scale
- Multi-company dashboard for advisors/consultants
- White-labelling
- API access
- Zapier/Make integrations
- Mobile app (React Native or Capacitor)
- Billing (Stripe, tiered pricing)

## Phase 8 — Advanced AI Features
- Real-time coaching during calls
- Sentiment analysis from voice patterns
- Predictive insights
- Auto-generated reports
- Board-ready summaries

---

# 11. TECHNICAL DEBT / KNOWN ISSUES

- HMAC webhook verification is lenient — logs but doesn't block. Should be strict in production
- No authentication — PWA uses company_id stored in JS variable, no real auth
- Duplicate knowledge entries — running research multiple times creates duplicates. Need upsert logic on company_id + key
- Edge function timeouts — Supabase free tier has limits. Heavy functions (scrape-business) may need Railway
- No error boundaries — basic try/catch but no user-facing error recovery
- Voice agent LLM — currently Qwen3-30B-A3B, too weak for nuanced business conversation
- No tests — zero automated tests for edge functions or PWA
- Hardcoded credentials — anon key in HTML file, fine for now but needs proper env handling

---

# 12. INFRASTRUCTURE

| Service | Purpose |
|---------|---------|
| Supabase | Database, edge functions, auth, storage |
| Vercel | PWA hosting |
| Railway | Option for longer-running processes |
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
