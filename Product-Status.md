# Founder Engine — Product Status
**Last updated: 7 March 2026**
*Update this file after every sprint. It is the single source of build truth.*

---

## Current Sprint: Sprint 2 — Google Drive Integration

| Task | Status | Notes |
|------|--------|-------|
| Google Cloud Console OAuth setup | DONE | Ruari set up in console |
| google-drive-oauth edge function | SHIPPED | v1 — get_auth_url + callback + folder creation + webhook setup |
| refresh-google-tokens edge function | SHIPPED | v1 — auto-refresh, clears tokens if revoked |
| google-drive-webhook edge function | SHIPPED | v1 — receives Drive push notifications, triggers processing |
| process-drive-document edge function | SHIPPED | v1 — extract text, chunk, classify domain (Claude Haiku), store in knowledge_chunks + knowledge_base |
| ConnectToolsScreen wired to real OAuth | SHIPPED | Live Google Drive button, detects callback, checks existing connection |
| Supabase secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | TO DO | Ruari must set in Supabase dashboard |
| Google Console: add redirect URI | TO DO | Add `https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/google-drive-oauth` |
| End-to-end test with real Google account | TO DO | After secrets + redirect URI set |

**Sprint 2 Done When:** Founder connects Google Drive, folder created in their Drive, docs dropped in folder are auto-processed and appear in knowledge base.

---

## Completed: Sprint 1 — Foundation

| Task | Status | Notes |
|------|--------|-------|
| DB migrations — onboarding_stage, welcome_complete, scrape_status, domain_scores, google_* columns | SHIPPED | All columns live in production |
| OnboardingFlow.tsx — thin container, routing only | SHIPPED | 75 lines, owns stage state, advanceTo() pattern |
| Stage 1: Welcome (typewriter Angus monologue) | SHIPPED | WelcomeStage.tsx, 5 lines with 1.8s delay |
| Stage 2: Connect Tools screen | SHIPPED | ConnectToolsStage.tsx — now wired to real OAuth (Sprint 2) |
| Stage 3: Feed Angus (upload + paste) | SHIPPED | FeedAngusStage.tsx — upload docs + paste transcript |
| Stage 4: Questions (DB-loaded, text answers) | SHIPPED | QuestionsStage.tsx — seeds 5 defaults if empty |
| Stage 5: Onboarding Complete | SHIPPED | OnboardingComplete.tsx — advances to stage 6 |
| Progress indicator Step X of 5 | SHIPPED | ProgressIndicator.tsx |
| ResearchBanner (Perplexity progress) | SHIPPED | Polls scrape_status, auto-refreshes dashboard |
| Sign-out button | SHIPPED | Desktop SideNav, bottom-left |
| MoreScreen refactor | SHIPPED | 733→287 lines, extracted 3 components |
| Angus ElevenLabs system prompt | TO DO | Prompt written in docs/ANGUS-ELEVENLABS-PROMPT.md, needs paste into ElevenLabs dashboard |

**Sprint 1 Rule:** No Google Drive or Xero OAuth yet (moved to Sprint 2). UI skeleton with disabled states.
**Sprint 1 Done When:** New user sees welcome once, sees connect screen, existing users unaffected. DONE.

---

## Sprint 3 — Intelligence & Source of Truth (in progress — Agent B)

| Task | Status | Notes |
|------|--------|-------|
| calculate-domain-scores edge function | TO BUILD | Agent B — brief in docs/AGENT-B-SPRINT-3-BRIEF.md |
| Intelligence sliders UI | TO BUILD | IntelligenceBuilder.tsx + IntelligenceSlider.tsx |
| Document checklist with auto-tick | TO BUILD | DocumentChecklist.tsx |
| generate-source-of-truth edge function | TO BUILD | Fires at 25% Intelligence Score |
| Knowledge cards on dashboard | TO BUILD | KnowledgeCard.tsx |

---

## Sprint 4 — Corrections (queued)

| Task | Status | Notes |
|------|--------|-------|
| knowledge_corrections table wired to Angus | TO BUILD | Correction priority layer |
| apply-correction edge function | TO BUILD | |
| Dashboard inline edit | TO BUILD | CorrectionPanel, KnowledgeCard components |
| Stale doc alerts | TO BUILD | Age-flagged UI on old documents |
| Angus correction-aware behaviour | TO BUILD | Always cites corrections over source |

---

## Sprint 5 — Question Modes (queued)

| Task | Status | Notes |
|------|--------|-------|
| generate-onboarding-questions edge function | TO BUILD | Fires at 25%, question per gap |
| Written answer mode | TO BUILD | Simplest — build first |
| Voice answer mode | TO BUILD | Extend existing ElevenLabs |
| Transcribe mode | TO BUILD | Deepgram integration |
| Email outbound + inbound pipeline | TO BUILD | Resend or Postmark inbound |

---

## Sprint 6 — Payments & Polish (queued)

| Task | Status | Notes |
|------|--------|-------|
| Stripe integration | TO BUILD | Required before first paying client |
| Bidirectional Google Doc sync | TO BUILD | Edit in Drive → dashboard cards update |
| Edge cases + error states | TO BUILD | |
| Mobile polish | TO BUILD | |

---

## Shipped — What's Live in Production

| Feature | Notes |
|---------|-------|
| Auth (Supabase) | Email + password, Google OAuth, RLS active |
| Company profile creation | Auto-scrape via Perplexity |
| Document upload (Supabase Storage) | Keep running until Drive pipeline stable |
| Angus voice agent (ElevenLabs) | Live — prompt update written, awaiting paste |
| Xero OAuth | Live but buried in settings |
| Intelligence Score (0–100) | Exists in data model |
| Company brain (7 domains) | Flat knowledge_base table — pgvector knowledge_chunks also live |
| React dashboard | founder-engine-seven.vercel.app |
| 5-stage onboarding flow | Welcome → Connect → Feed → Questions → Complete |
| ResearchBanner | Live progress indicator during Perplexity scrape |
| Google Drive OAuth pipeline | 4 edge functions deployed, frontend wired, awaiting secrets |

---

## Architecture Decisions Made

See Decisions-Log.md for full log.

Key decisions affecting build:
- Google Drive replaces Supabase Storage (but coexist during transition)
- knowledge_chunks table (pgvector) runs alongside existing knowledge_base during migration
- Corrections layer sits between raw data and Angus context window — separate table, always wins
- drive.file scope only — not full Drive access
