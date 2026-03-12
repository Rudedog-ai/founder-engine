# Agent B Brief — Sprint 5: Smart Questions & Multi-Mode Answers

**Date:** 7 March 2026
**Priority:** Build after Sprint 4 (Corrections) is complete
**Rule:** Commit after every logical unit. Do NOT push — Ruari will review and push.

---

## 1. WHAT YOU ARE BUILDING

Sprint 5 replaces the static default questions with AI-generated questions that target knowledge gaps. Questions are generated when intelligence score hits 25%, one per identified gap. Founders can answer via four modes: written text, voice conversation with Angus, live transcription, or email reply.

Key principle: **Meet the founder where they are.** Time-poor founders need multiple ways to answer. The platform remembers their preference.

---

## 2. PROJECT CONTEXT

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite (deployed to Vercel)
- **Backend:** Supabase PostgreSQL + Supabase Deno edge functions
- **Auth:** Supabase Auth (email+password, Google OAuth)
- **Styling:** Custom CSS — `ocean.css`, `onboarding.css`, `intelligence.css`, `corrections.css`
- **Supabase client:** Import from `src/supabase.ts`
- **Voice:** ElevenLabs Conversational AI (agent ID: `agent_1901kjxbr6xte40bw8dyeyhjwgze`)
- **Model:** `claude-sonnet-4-5-20250929` for AI generation

### Supabase Details
- **Project URL:** `https://qzlicsovnldozbnmahsa.supabase.co`
- **Secrets available:** `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `ELEVENLABS_API_KEY`

### Database Tables You'll Use

**onboarding_questions** — Already exists:
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
  status TEXT DEFAULT 'pending',    -- 'pending', 'answered', 'skipped'
  answer_text TEXT,
  answer_mode TEXT,                 -- 'written', 'voice', 'transcribe', 'email'
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);
```

**companies** — Key columns for this sprint:
- `intelligence_score` (float)
- `preferred_answer_mode` (text, nullable)
- `domain_scores` (jsonb)

**knowledge_base** — Where extracted answers get stored as new knowledge entries

**gap_analysis** — Completeness scores per topic, drives question generation

### Existing Question Components (Sprint 1, in onboarding flow)
- `src/screens/onboarding/QuestionsStage.tsx` — Stage 4 of onboarding, loads questions, text answers
- `src/screens/onboarding/QuestionCard.tsx` — Individual question with text input
- `src/screens/onboarding/defaultQuestions.ts` — 5 hardcoded defaults as seed

**These are for onboarding only.** Sprint 5 builds the **post-onboarding question system** that lives on the dashboard and uses AI-generated questions.

### Current Dashboard Layout
DashboardScreen.tsx shows (in order):
1. ResearchBanner
2. Score Card
3. Topic Grid (7 areas)
4. Intelligence Builder (6 sliders)
5. Document Checklist
6. Source of Truth
7. Activity Feed

---

## 3. YOUR FILE OWNERSHIP

### Files You CREATE (yours exclusively):

| File | Purpose |
|------|---------|
| `src/components/questions/QuestionBatch.tsx` | Container showing current batch of AI questions |
| `src/components/questions/QuestionItem.tsx` | Single question with mode selector + answer area |
| `src/components/questions/WrittenAnswerMode.tsx` | Text input answer mode |
| `src/components/questions/VoiceAnswerMode.tsx` | Launch Angus voice call focused on specific question |
| `src/components/questions/TranscribeAnswerMode.tsx` | Live speech-to-text using browser SpeechRecognition |
| `src/components/questions/EmailAnswerMode.tsx` | Shows email address to send answer to |
| `src/components/questions/ModeSelector.tsx` | Toggle between 4 answer modes |
| `src/styles/questions.css` | All styling for question components |

### Edge Functions You CREATE:

| Function | Purpose |
|----------|---------|
| `generate-onboarding-questions` | AI generates questions targeting knowledge gaps |
| `process-question-answer` | Processes any answer mode, extracts knowledge, updates scores |

### Files You MUST NOT EDIT:
- `src/App.tsx`, `src/api.ts`, `src/types.ts`, `src/styles/ocean.css` — SHARED
- `src/screens/DashboardScreen.tsx` — SHARED
- `src/screens/onboarding/*` — Sprint 1 territory
- `src/components/intelligence/*` — Sprint 3 territory
- `src/components/corrections/*` — Sprint 4 territory

---

## 4. TASK BREAKDOWN

### Task 1: generate-onboarding-questions Edge Function

**Endpoint:** POST `/functions/v1/generate-onboarding-questions`
**Input:** `{ company_id: string }`

**Logic:**
```
1. Fetch company: name, domain_scores, intelligence_score
2. Fetch gap_analysis: topics with missing_items
3. Fetch existing onboarding_questions (pending) to avoid duplicates
4. Call Claude with prompt:
   "You are generating smart interview questions for {company_name}.
    Here are the knowledge gaps per domain:
    {gaps_by_domain}

    Current domain scores: {domain_scores}

    Generate 5-8 questions, one per major gap. Prioritize domains with
    lowest scores. Each question should be specific and impossible to
    answer from public information alone.

    Return JSON:
    { "questions": [
      { "question": "...", "domain": "financials|sales|marketing|operations|team|strategy",
        "why_asking": "...", "priority": 1-3 }
    ]}"
5. INSERT questions into onboarding_questions (skip duplicates)
6. Return the generated questions
```

**When to trigger:**
- When intelligence_score crosses 25% (called by calculate-domain-scores)
- Manual "Generate More Questions" button on dashboard
- After processing answers (to generate follow-ups)

### Task 2: process-question-answer Edge Function

**Endpoint:** POST `/functions/v1/process-question-answer`
**Input:**
```json
{
  "company_id": "uuid",
  "question_id": "uuid",
  "answer_text": "The founder's answer text",
  "answer_mode": "written|voice|transcribe|email"
}
```

**Logic:**
```
1. UPDATE onboarding_questions SET answer_text, answer_mode, status='answered', answered_at=NOW()
2. Call Claude to extract knowledge points from the answer:
   "Extract factual business data from this Q&A:
    Question: {question}
    Answer: {answer_text}
    Domain: {domain}

    Return JSON: { data_points: [{ topic, key, value, confidence }] }"
3. INSERT extracted data_points into knowledge_base
4. Call calculate-domain-scores to recalculate
5. Return { success, data_points_extracted }
```

### Task 3: questions.css

Design language matching ocean theme:
- Question cards: subtle card with domain badge
- Mode selector: 4 icon buttons in a row, active state with glow
- Written mode: textarea with char count
- Voice mode: pulsing mic icon
- Transcribe mode: waveform animation placeholder
- Email mode: email address display with copy button
- Priority indicator: colored left border (P1=glow, P2=wave, P3=dim)

### Task 4: ModeSelector.tsx

**Props:**
```typescript
interface ModeSelectorProps {
  selectedMode: 'written' | 'voice' | 'transcribe' | 'email'
  onSelectMode: (mode: string) => void
  preferredMode?: string  // remembered from companies.preferred_answer_mode
}
```

**4 modes with icons:**
- Written (pencil icon) — type your answer
- Voice (mic icon) — talk to Angus about this question
- Transcribe (waveform icon) — speak and we'll transcribe
- Email (mail icon) — we'll email you, reply when ready

### Task 5: WrittenAnswerMode.tsx

**Props:**
```typescript
interface WrittenAnswerModeProps {
  questionId: string
  companyId: string
  question: string
  onAnswered: () => void
}
```

**Behaviour:**
- Textarea (min 3 rows, auto-expand)
- Character count (suggest 50+ chars for useful extraction)
- Submit button → calls process-question-answer edge function
- Loading state while processing
- Success: shows "X data points extracted" briefly, then calls onAnswered

### Task 6: VoiceAnswerMode.tsx

**Props:**
```typescript
interface VoiceAnswerModeProps {
  questionId: string
  companyId: string
  question: string
  onAnswered: () => void
}
```

**Behaviour:**
- Shows the question prominently
- "Start Voice Call" button → loads ElevenLabs widget
- The widget should receive the specific question as context via dynamic variable
- After call ends, process-transcript edge function handles extraction (existing flow)
- Mark question as answered after call

**Note:** The ElevenLabs widget is already in VoiceScreen.tsx. For this component, either:
- Reuse the same pattern (load script, render `<elevenlabs-convai>` element)
- Or show a link to VoiceScreen with the question pre-loaded

Simpler option for MVP: Show the question text and a "Go to Voice Session" button that navigates to the Voice tab. The voice session context will include the question.

### Task 7: TranscribeAnswerMode.tsx

**Props:** Same as WrittenAnswerMode

**Behaviour:**
- Uses browser `SpeechRecognition` API (already used in the project)
- Start/stop button with visual feedback
- Shows transcribed text in real-time
- "Submit Transcription" button when done → calls process-question-answer
- Fallback: if SpeechRecognition not available, show text input with note

```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
```

### Task 8: EmailAnswerMode.tsx

**Props:** Same as WrittenAnswerMode

**Behaviour:**
- Shows an email address: `answers+{company_id_short}@founderengine.ai` (placeholder for now)
- "Copy Email" button
- Explains: "We'll email you this question. Reply when you're ready."
- For MVP: just show the UI. Email pipeline (Resend/Postmark) is a follow-up.
- Mark question as "emailed" status (new status between pending and answered)

### Task 9: QuestionItem.tsx

**Props:**
```typescript
interface QuestionItemProps {
  question: {
    id: string
    question: string
    domain: string
    why_asking?: string
    priority: number
    status: string
  }
  companyId: string
  preferredMode?: string
  onAnswered: () => void
}
```

**Behaviour:**
- Shows question text, domain badge, "why asking" tooltip/text
- Priority border (left edge color)
- If pending: shows ModeSelector + active answer mode component
- If answered: shows collapsed with green checkmark + answer preview
- If skipped: shows dimmed with "skipped" label

### Task 10: QuestionBatch.tsx

**Props:**
```typescript
interface QuestionBatchProps {
  companyId: string
}
```

**Behaviour:**
- Fetches pending + recent answered questions from `onboarding_questions`
- Groups: "To Answer" (pending) and "Completed" (answered, last 10)
- "Generate More Questions" button → calls generate-onboarding-questions
- Shows count: "X questions remaining"
- Remembers selected answer mode → updates companies.preferred_answer_mode

### Task 11: Integration Document

Create `docs/SPRINT-5-DASHBOARD-INTEGRATION.md` with:

1. Import for `questions.css` in main.tsx
2. API functions to add to `api.ts`:
```typescript
export async function generateQuestions(company_id: string) {
  return callEdgeFunction('generate-onboarding-questions', { company_id })
}

export async function processQuestionAnswer(
  company_id: string,
  question_id: string,
  answer_text: string,
  answer_mode: string
) {
  return callEdgeFunction('process-question-answer', {
    company_id, question_id, answer_text, answer_mode,
  })
}
```

3. Where QuestionBatch plugs into DashboardScreen (after Source of Truth, before Activity Feed)
4. Deploy commands for edge functions

---

## 5. TESTING

1. **Build:** `npm run build` — zero TypeScript errors
2. **Generate questions:**
```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/generate-onboarding-questions \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"company_id": "7caf6a8e-0165-410d-b4ce-56f0fe05be4e"}'
```
3. **Process answer:**
```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/process-question-answer \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"company_id": "7caf6a8e-0165-410d-b4ce-56f0fe05be4e", "question_id": "<id>", "answer_text": "Our revenue is £5M ARR with 70% gross margin", "answer_mode": "written"}'
```
4. **Visual:** `npm run dev` → test all 4 answer modes render

---

## 6. COMMIT RULES

Same as previous sprints. Commit after each task, don't push.

---

## 7. DEFINITION OF DONE

- [ ] `generate-onboarding-questions` creates AI questions targeting knowledge gaps
- [ ] `process-question-answer` extracts knowledge and recalculates scores
- [ ] QuestionBatch shows pending questions on dashboard
- [ ] WrittenAnswerMode accepts text, processes, extracts data
- [ ] VoiceAnswerMode links to voice session with question context
- [ ] TranscribeAnswerMode uses browser SpeechRecognition
- [ ] EmailAnswerMode shows placeholder email flow
- [ ] ModeSelector toggles between 4 modes
- [ ] `npm run build` passes
- [ ] Integration doc created
- [ ] All committed (not pushed)
