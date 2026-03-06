# Founder Engine — Product Status
**Last updated: March 2026 — Post Happy Sprint Session**
*Update this file after every sprint.*

---

## STATUS: ALL 6 SPRINTS COMPLETE — READY TO PUSH TO PROD

```
git push origin main
Then set 5 secrets in Supabase (Google Drive + Stripe). That's it.
```

---

## Before First Client Checklist

- [ ] `git push origin main`
- [ ] Set GOOGLE_CLIENT_ID in Supabase secrets
- [ ] Set GOOGLE_CLIENT_SECRET in Supabase secrets
- [ ] Set GOOGLE_REDIRECT_URI in Supabase secrets
- [ ] Set STRIPE_SECRET_KEY in Supabase secrets
- [ ] Set STRIPE_WEBHOOK_SECRET in Supabase secrets
- [ ] Verify Google OAuth consent screen is published (not test mode)
- [ ] Verify Stripe webhook endpoint is live and receiving
- [ ] Run first onboarding with Chocolate and Love (client zero)
- [ ] Confirm Angus welcome prompt fires once only on first login

---

## Sprint 1 — Foundation ✅ COMPLETE

| Task | Status |
|------|--------|
| DB migrations — all new tables and columns | ✅ SHIPPED |
| onboarding_stage + welcome_complete on companies | ✅ SHIPPED |
| OnboardingFlow.tsx — thin container, routing only | ✅ SHIPPED |
| Stage 1: Angus welcome prompt (fires once, sets welcome_complete) | ✅ SHIPPED |
| Stage 2 UI: Connect Tools screen (cards, connected states, skip) | ✅ SHIPPED |
| Progress indicator Step X of 5 | ✅ SHIPPED |
| ResearchBanner component | ✅ SHIPPED |
| MoreScreen refactor | ✅ SHIPPED |

---

## Sprint 2 — Google Drive ✅ COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| google-drive-oauth edge function | ✅ SHIPPED | |
| refresh-google-tokens edge function | ✅ SHIPPED | Cron renewal |
| google-drive-webhook edge function | ✅ SHIPPED | |
| process-drive-document edge function | ✅ SHIPPED | |
| Folder creation on OAuth success | ✅ SHIPPED | Creates "Founder Engine" folder in client Drive |
| ConnectToolsScreen wired to real OAuth | ✅ SHIPPED | |
| Age detection on ingested docs | ✅ SHIPPED | google_modified_time from Drive metadata |

**Needs before going live:** GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in Supabase secrets.

---

## Sprint 3 — Intelligence & Source of Truth ✅ COMPLETE

| Task | Status |
|------|--------|
| calculate-domain-scores edge function (v3) | ✅ SHIPPED |
| generate-source-of-truth edge function | ✅ SHIPPED |
| IntelligenceBuilder component | ✅ SHIPPED |
| IntelligenceSlider component | ✅ SHIPPED |
| DocumentChecklist component | ✅ SHIPPED |
| KnowledgeCard component | ✅ SHIPPED |
| SourceOfTruth component | ✅ SHIPPED |

---

## Sprint 4 — Corrections ✅ COMPLETE

| Task | Status |
|------|--------|
| apply-correction edge function | ✅ SHIPPED |
| CorrectionPanel component | ✅ SHIPPED |
| CorrectionHistory component | ✅ SHIPPED |
| StaleDocAlert component | ✅ SHIPPED |
| Edit buttons on KnowledgeCard and SourceOfTruth | ✅ SHIPPED |

---

## Sprint 5 — Smart Questions ✅ COMPLETE

| Task | Status |
|------|--------|
| generate-onboarding-questions edge function | ✅ SHIPPED |
| process-question-answer edge function | ✅ SHIPPED |
| QuestionBatch component | ✅ SHIPPED |
| QuestionItem component | ✅ SHIPPED |
| ModeSelector component | ✅ SHIPPED |
| WrittenAnswerMode component | ✅ SHIPPED |
| VoiceAnswerMode component | ✅ SHIPPED |
| TranscribeAnswerMode component | ✅ SHIPPED |
| EmailAnswerMode component | ✅ SHIPPED |

---

## Sprint 6 — Payments & Polish ✅ COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| create-checkout edge function | ✅ SHIPPED | Stripe |
| stripe-webhook edge function | ✅ SHIPPED | |
| ErrorBoundary component | ✅ SHIPPED | |
| Billing section | ✅ SHIPPED | |
| Drive connect on Settings | ✅ SHIPPED | |

**Needs before going live:** STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET in Supabase secrets.

---

## Full Edge Function Registry — 21 Deployed

| Function | Sprint | Status |
|----------|--------|--------|
| google-drive-oauth | 2 | ✅ SHIPPED |
| refresh-google-tokens | 2 | ✅ SHIPPED |
| google-drive-webhook | 2 | ✅ SHIPPED |
| process-drive-document | 2 | ✅ SHIPPED |
| calculate-domain-scores (v3) | 3 | ✅ SHIPPED |
| generate-source-of-truth | 3 | ✅ SHIPPED |
| apply-correction | 4 | ✅ SHIPPED |
| generate-onboarding-questions | 5 | ✅ SHIPPED |
| process-question-answer | 5 | ✅ SHIPPED |
| create-checkout | 6 | ✅ SHIPPED |
| stripe-webhook | 6 | ✅ SHIPPED |
| + 10 pre-existing functions | — | ✅ LIVE |

---

## Shipped — Full Feature List

| Feature | Status |
|---------|--------|
| Auth (Supabase, RLS) | ✅ LIVE |
| Company profile creation + Perplexity research | ✅ LIVE |
| Angus voice agent (ElevenLabs) | ✅ LIVE |
| Xero OAuth (surfaced in onboarding) | ✅ LIVE |
| 5-stage onboarding flow | ✅ SHIPPED |
| Google Drive OAuth + folder creation | ✅ SHIPPED (needs secrets) |
| Document ingestion + age detection | ✅ SHIPPED |
| Intelligence Score + domain sliders | ✅ SHIPPED |
| Source of truth document generation | ✅ SHIPPED |
| Correction system (voice, dashboard, email) | ✅ SHIPPED |
| Stale document alerts | ✅ SHIPPED |
| Smart question generation (at 25%) | ✅ SHIPPED |
| Written answer mode | ✅ SHIPPED |
| Voice answer mode | ✅ SHIPPED |
| Transcribe answer mode | ✅ SHIPPED |
| Email answer mode | ✅ SHIPPED |
| Stripe payments | ✅ SHIPPED (needs secrets) |
| Error boundaries | ✅ SHIPPED |

---

## Next Phase — Post Chocolate and Love

These are queued after the first client engagement produces real data:

| Task | Priority | Trigger |
|------|----------|---------|
| Market Intelligence RAG crawl pipeline | P1 | Build after C&L session 1 |
| Email inbound pipeline (answers@founderengine.ai) | P1 | Build Sprint 5 follow-up |
| Bidirectional Google Doc sync | P1 | Sprint 6 follow-up |
| HubSpot OAuth connector | P2 | Month 1 |
| Weekly intelligence digest email | P2 | Month 1 |
| SEIS Advance Assurance application | P0 | This week — Ruari action |
| Domain acquisition (founderengine.ai or .co) | P0 | This week — Ruari action |
| LinkedIn content engine (3-5 posts/week) | P1 | Start now |
| First 3 paying clients | P0 | Target Month 1 |
| scripts/sync-docs.ts (Drive write-back) | P2 | After first client |

---

*3 commits ahead of origin. Zero build errors. Push when secrets are set.*


---

## Session 8 Update — 06 March 2026

### Shipped Today

| Item | Status |
|------|--------|
| Sprint 1 — Full onboarding flow (5 stages, all components) | ✅ LIVE |
| Sprint 2 — Google Drive OAuth + webhook + document pipeline | ✅ LIVE |
| Sprint 2 — All DB migrations (knowledge_chunks, corrections, elements, questions, Drive columns) | ✅ LIVE |
| Sprint 2 — Intelligence Score fix (Perplexity capped at 15%) | ✅ LIVE |
| Sprint 2 — Intelligence sliders on dashboard | ✅ LIVE |
| Sprint 2 — Supabase Realtime subscription (live slider updates) | ✅ LIVE |
| Sprint 2 — Stale doc age detection in process-drive-document | ✅ LIVE |
| Reset Company — Erase All (two-click, wipes to Stage 1) | ✅ LIVE |
| Export All — single click .txt download of full brain | ✅ LIVE |
| Landing page brief for Lovable | ✅ BRIEF WRITTEN |

### Edge Functions Live (23 total)

onboard-company, process-transcript, get-company-profile, upload-document, process-email, invite-team-member, generate-recommendations, test-api-key, scrape-business, whatsapp-call-handler, google-drive-oauth, refresh-google-tokens, process-drive-document, google-drive-webhook, calculate-domain-scores, generate-source-of-truth, generate-onboarding-questions, process-question-answer, apply-correction, create-checkout, stripe-webhook, reset-company, export-company

### What's NOT Yet Built

| Item | Priority | Notes |
|------|----------|-------|
| Scrape loading indicator (real-time progress screen after signup) | HIGH | Brief written. Tell Happy: show progress steps per API call, poll scrape_status every 3s |
| enrich-company edge function (DataForSEO + NewsAPI + Listen Notes) | HIGH | Needs API keys first. DataForSEO, NewsAPI, Listen Notes accounts needed |
| Stale doc flag in Angus ElevenLabs prompt | MEDIUM | Ruari handled manually |
| VITE_GOOGLE_CLIENT_ID in Vercel env vars | HIGH | Required for Drive OAuth button to work |
| founder-engine.com domain purchase | LOW | $11, do it |
| Lovable landing page build | MEDIUM | Brief ready, hand to Lovable |
| IONOS founder-engine.co.uk → point to Vercel | LOW | After landing page is built |
| SearchAtlas / DataForSEO accounts and API keys | HIGH | Needed before enrich-company can be built |
| Partner channel conversations (SearchAtlas etc.) | LOW | When 3+ paying clients |

### OYNB Test Account Status

Two OYNB companies in DB:
- "OYNB ltd One year no beer" — Stage 1, score 44% (bad data, no domain scores — needs reset or delete)
- "OYNB Ltd" — Stage 1, score 14%, some domain scores — USE THIS ONE

Recommendation: delete the first one to avoid confusion. Use "OYNB Ltd" as the test account.

### Next Immediate Actions for Ruari

1. Add `VITE_GOOGLE_CLIENT_ID` to Vercel environment variables (Drive OAuth won't work without it)
2. Delete duplicate OYNB company from Supabase dashboard
3. Sign up for DataForSEO (pay-per-call, no commitment) and NewsAPI (free tier available)
4. Buy founder-engine.com ($11)
5. Test the full onboarding loop: Erase All → Stage 1 → Connect Drive → upload OYNB docs → watch sliders fill
6. Hand Landing Page Brief to Lovable
