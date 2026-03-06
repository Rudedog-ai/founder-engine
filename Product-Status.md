# Founder Engine — Product Status
**Last updated: 7 March 2026**
*Update this file after every sprint. It is the single source of build truth.*

---

## ALL SPRINTS COMPLETE

Every sprint from the original 6-sprint plan has been built and shipped. Code is committed locally (2 commits ahead of origin). Push to deploy.

---

## Completed: Sprint 6 — Payments & Polish

| Task | Status | Notes |
|------|--------|-------|
| create-checkout edge function | SHIPPED | v1 — creates Stripe customer + checkout session |
| stripe-webhook edge function | SHIPPED | v1 — handles checkout.completed, subscription updates, payment failures |
| Billing section in MoreScreen | SHIPPED | Shows plan, upgrade button, Stripe checkout redirect |
| ErrorBoundary on all screens | SHIPPED | Each screen wrapped — one crash doesn't take down the app |
| Google Drive button on Settings | SHIPPED | Was "Coming Soon", now real OAuth connect button |
| DB: Stripe columns | SHIPPED | stripe_customer_id, stripe_subscription_id, subscription_status, subscription_plan |
| Stripe secrets | TO DO | Ruari must set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Supabase |
| Stripe product/price | TO DO | Create product in Stripe dashboard, replace price_placeholder |

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
| Google Drive on Settings page | SHIPPED | Real connect button (was "Coming Soon") |
| Supabase secrets | TO DO | Ruari must set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET |
| Google Console redirect URI | TO DO | Add edge function URL as authorized redirect |
| End-to-end test | TO DO | After secrets set + redirect URI verified |

---

## Completed: Sprint 1 — Foundation

| Task | Status | Notes |
|------|--------|-------|
| 5-stage onboarding flow | SHIPPED | Welcome -> Connect -> Feed -> Questions -> Complete |
| DB migrations (all columns) | SHIPPED | All columns live in production |
| ResearchBanner | SHIPPED | Polls scrape_status, auto-refreshes dashboard |
| MoreScreen refactor | SHIPPED | Extracted 3 sub-components |
| Angus ElevenLabs prompt | SHIPPED | Written + pasted into ElevenLabs dashboard |

---

## What's Live in Production

| Feature | Notes |
|---------|-------|
| Auth (Supabase) | Email + password, Google OAuth |
| Company profile creation | Auto-scrape via Perplexity sonar-pro |
| Document upload (Supabase Storage) | 50MB/file, 500MB/company quota, magic-byte validation |
| Angus voice agent (ElevenLabs) | Live with updated system prompt |
| Intelligence Score (0-100) | Source-weighted, auto-research capped at 10% |
| Company brain (7 domains) | knowledge_base + knowledge_chunks (pgvector) |
| React dashboard | founder-engine-seven.vercel.app |
| 5-stage onboarding flow | Welcome -> Connect -> Feed -> Questions -> Complete |
| Intelligence Builder | 6 domain sliders with animated bars |
| Document Checklist | Expected vs received documents per domain |
| Source of Truth | Collapsible domain sections, generates at 25% score |
| Corrections layer | Slide-out panel, correction history, stale document alerts |
| Smart Questions | AI-generated, 4 answer modes (write, voice, dictate, email) |
| Google Drive OAuth pipeline | 4 edge functions, awaiting secrets |
| Stripe billing | Checkout + webhook edge functions, awaiting Stripe setup |
| Error boundaries | Every screen wrapped |
| 21 edge functions | All deployed to Supabase |

---

## Total Edge Functions Deployed: 21

Pre-existing: scrape-business, process-transcript, get-company-profile, whatsapp-call-handler, onboard-company, upload-document, process-email, generate-recommendations, invite-team-member, test-api-key

Sprint 2: google-drive-oauth, refresh-google-tokens, google-drive-webhook, process-drive-document

Sprint 3: calculate-domain-scores, generate-source-of-truth

Sprint 4: apply-correction

Sprint 5: generate-onboarding-questions, process-question-answer

Sprint 6: create-checkout, stripe-webhook

---

## Before First Client — Manual Steps

1. Set Google Drive secrets in Supabase (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. Add redirect URI to Google Cloud Console
3. Set Stripe secrets in Supabase (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
4. Create Stripe product + price, update price_placeholder
5. Set Stripe webhook URL in Stripe dashboard
6. Switch ElevenLabs LLM from Qwen to Gemini 2.5 Flash or Claude
7. `git push origin main` to deploy everything to Vercel
8. Test with real Google account (Drive OAuth end-to-end)
9. Test with real Stripe checkout
