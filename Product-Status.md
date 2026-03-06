# Founder Engine — Product Status
**Last updated: 7 March 2026**
*Update this file after every sprint. It is the single source of build truth.*

---

## Current Sprint: Sprint 6 — Payments & Polish

| Task | Status | Notes |
|------|--------|-------|
| Stripe integration | TO BUILD | Required before first paying client |
| Bidirectional Google Doc sync | TO BUILD | Edit in Drive -> dashboard cards update |
| Edge cases + error states | TO BUILD | |
| Mobile polish | TO BUILD | |

---

## Completed: Sprint 5 — Smart Questions & Multi-Mode Answers

| Task | Status | Notes |
|------|--------|-------|
| generate-onboarding-questions edge function | SHIPPED | v1 — Claude generates 5-8 questions targeting knowledge gaps |
| process-question-answer edge function | SHIPPED | v1 — extracts knowledge from answers, recalculates scores |
| QuestionBatch + QuestionItem components | SHIPPED | Fetches pending/answered, groups by status |
| ModeSelector (4 modes) | SHIPPED | Write, Voice, Dictate, Email |
| WrittenAnswerMode | SHIPPED | Text input with char count, submits to edge function |
| VoiceAnswerMode | SHIPPED | Links to voice session with question context |
| TranscribeAnswerMode | SHIPPED | Browser SpeechRecognition, real-time transcription |
| EmailAnswerMode | SHIPPED | Placeholder email flow (pipeline TBD) |
| questions.css | SHIPPED | Ocean theme styling for all question components |

---

## Completed: Sprint 4 — Corrections Layer

| Task | Status | Notes |
|------|--------|-------|
| apply-correction edge function | SHIPPED | v1 — stores corrections, updates knowledge_elements + knowledge_base |
| CorrectionPanel.tsx | SHIPPED | Slide-out panel for editing knowledge facts |
| CorrectionHistory.tsx | SHIPPED | Timeline of past corrections for an element |
| StaleDocAlert.tsx | SHIPPED | Age-based warning badges (amber/red/critical) |
| KnowledgeCard edit buttons | SHIPPED | Hover edit pencil opens CorrectionPanel |
| SourceOfTruth edit buttons | SHIPPED | Edit buttons on key facts in expanded domain sections |
| corrections.css | SHIPPED | All correction layer styling |

---

## Completed: Sprint 3 — Intelligence & Source of Truth

| Task | Status | Notes |
|------|--------|-------|
| calculate-domain-scores edge function | SHIPPED | v3 — source-weighted (auto 10%, docs 45%, voice 35%, tools 25%) |
| generate-source-of-truth edge function | SHIPPED | v1 — Claude generates structured JSON summary |
| IntelligenceBuilder.tsx | SHIPPED | 6 domain sliders container |
| IntelligenceSlider.tsx | SHIPPED | Animated bar with CSS transitions |
| DocumentChecklist.tsx | SHIPPED | Expected vs received documents |
| KnowledgeCard.tsx | SHIPPED | Knowledge fact with confidence dot + edit button |
| SourceOfTruth.tsx | SHIPPED | Collapsible domain sections with edit buttons |
| intelligence.css | SHIPPED | Full ocean theme styling |

---

## Completed: Sprint 2 — Google Drive Integration

| Task | Status | Notes |
|------|--------|-------|
| google-drive-oauth edge function | SHIPPED | v1 — get_auth_url + callback + folder creation + webhook |
| refresh-google-tokens edge function | SHIPPED | v1 — auto-refresh, clears on revocation |
| google-drive-webhook edge function | SHIPPED | v1 — receives Drive push notifications |
| process-drive-document edge function | SHIPPED | v1 — extract, chunk, classify domain via Claude Haiku |
| ConnectToolsStage wired to real OAuth | SHIPPED | Live Google Drive button, detects callback |
| Supabase secrets | TO DO | Ruari must set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET |
| End-to-end test | TO DO | After secrets set + redirect URI verified |

---

## Completed: Sprint 1 — Foundation

| Task | Status | Notes |
|------|--------|-------|
| 5-stage onboarding flow | SHIPPED | Welcome -> Connect -> Feed -> Questions -> Complete |
| DB migrations | SHIPPED | All columns live |
| ResearchBanner | SHIPPED | Polls scrape_status, auto-refreshes dashboard |
| MoreScreen refactor | SHIPPED | Extracted 3 components |
| Angus ElevenLabs prompt | SHIPPED | Pasted into ElevenLabs dashboard |

---

## Shipped — What's Live in Production

| Feature | Notes |
|---------|-------|
| Auth (Supabase) | Email + password, Google OAuth, RLS active |
| Company profile creation | Auto-scrape via Perplexity |
| Document upload (Supabase Storage) | Keep running until Drive pipeline stable |
| Angus voice agent (ElevenLabs) | Live with updated prompt |
| Intelligence Score (0-100) | Source-weighted, capped scoring |
| Company brain (7 domains) | knowledge_base + knowledge_chunks |
| React dashboard | founder-engine-seven.vercel.app |
| Intelligence Builder | 6 domain sliders |
| Source of Truth | Collapsible domain sections with edit buttons |
| Corrections layer | Slide-out panel, correction history, stale alerts |
| Smart Questions | 4 answer modes (write, voice, dictate, email) |
| Google Drive OAuth pipeline | 4 edge functions deployed, awaiting secrets |
