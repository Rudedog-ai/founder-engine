# Agent B Brief: Stage 3 — "Feed Angus" UI

> **For:** A separate Claude Code agent working in parallel with Agent A.
> **Rule:** You own ONLY the files listed below. Do NOT touch any other files.

## Context

This is Founder Engine — an AI-powered company intelligence platform. Read `CLAUDE.md` for full context.

Sprint 1 just shipped. The onboarding flow lives in `src/screens/onboarding/`. There are 5 stages. Stage 1 (Welcome) and Stage 2 (Connect Tools) are built. You are building **Stage 3: Feed Angus**.

The routing is handled by `src/screens/onboarding/OnboardingFlow.tsx`. You will NOT edit that file — Agent A will add your stage to the router after you're done.

## What Stage 3 Does

After connecting tools (or skipping), the founder lands on "Feed Angus" — a screen where they can give Angus more context about their business through two methods:

1. **Upload documents** — pitch decks, financials, business plans, etc.
2. **Talk to Angus** — launch a voice call (ElevenLabs widget) or paste a transcript

This stage reuses existing upload and voice infrastructure. You're building the UI wrapper only.

## Your Files (CREATE these — they don't exist yet)

| File | Max Lines | Purpose |
|------|-----------|---------|
| `src/screens/onboarding/FeedAngusStage.tsx` | 90 | Main stage component — two sections |
| `src/screens/onboarding/FeedMethodCard.tsx` | 50 | Reusable card for each feed method |

## Architecture

### FeedAngusStage.tsx

```
<div className="onboarding-stage">
  <ProgressIndicator currentStage={3} />
  <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
    <h3>Feed Angus</h3>
    <p>The more context you give, the smarter the analysis.</p>

    <FeedMethodCard
      title="Upload Documents"
      description="Pitch decks, financials, business plans, contracts"
      icon={/* document SVG */}
      actionLabel="Upload Files"
      onClick={() => setShowUpload(true)}
    />

    <FeedMethodCard
      title="Talk to Angus"
      description="Have a 10-minute voice conversation about your business"
      icon={/* microphone SVG */}
      actionLabel="Start Call"
      onClick={() => setShowVoice(true)}
    />

    {/* Upload modal — simple file input, calls existing uploadDocument from api.ts */}
    {showUpload && <UploadSection />}

    {/* Voice section — placeholder text for now, real ElevenLabs widget is Sprint 3+ */}
    {showVoice && <VoiceSection />}

    <button className="btn btn-secondary btn-block" onClick={handleContinue}>
      Continue to Questions →
    </button>
    <p className="hint">You can always add more later from the dashboard.</p>
  </div>
</div>
```

### FeedMethodCard.tsx

Reusable card component similar to `ConnectCard.tsx`:
- Props: `title`, `description`, `icon` (ReactNode), `actionLabel`, `onClick`, optional `badge` (e.g. "3 uploaded")
- Layout: icon left, text center, button right
- Use existing CSS classes from `onboarding.css` (`.connect-card` pattern works)

### Upload Section (inline in FeedAngusStage)

- Simple file `<input type="file" multiple>` with drag-drop zone
- On file select, call `uploadDocument(companyId, file)` from `src/api.ts`
- Show upload progress and success count
- DO NOT modify `api.ts` — use the existing `uploadDocument` function as-is

### Voice Section (inline in FeedAngusStage)

- For now, just show a message: "Voice calls will be available here soon. For now, you can paste a transcript below."
- Include a `<textarea>` for pasting transcript text
- On submit, call `processTranscript(companyId, transcript)` from `src/api.ts`
- DO NOT modify `api.ts` — use the existing `processTranscript` function as-is

### Continue Button

When clicked:
```typescript
await supabase
  .from('companies')
  .update({ onboarding_stage: 4 })
  .eq('id', companyId)
window.location.reload()
```

## Imports You Can Use

```typescript
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import { uploadDocument, processTranscript } from '../../api'
import ProgressIndicator from './ProgressIndicator'
```

## CSS

Add any new styles to `src/styles/onboarding.css` ONLY. Keep additions under 40 lines. Reuse existing classes where possible (`.connect-card`, `.onboarding-stage`, `.ocean-form-card`).

## DO NOT touch these files

- `src/App.tsx` (Agent A owns)
- `src/screens/onboarding/OnboardingFlow.tsx` (Agent A owns)
- `src/api.ts` (shared file)
- `src/types.ts` (shared file)
- `src/styles/ocean.css` (shared file)
- `CLAUDE.md` (shared file)
- Any existing screen in `src/screens/` (not onboarding/)

## Testing

Run `npm run build` to verify TypeScript passes. That's it.

## Commit

When done, commit with message:
```
feat: Stage 3 Feed Angus — upload docs + paste transcript UI
```

Do NOT push. Agent A will integrate and push.

## Definition of Done

- [ ] `FeedAngusStage.tsx` created, under 90 lines
- [ ] `FeedMethodCard.tsx` created, under 50 lines
- [ ] Upload section works with existing `uploadDocument` API
- [ ] Transcript paste works with existing `processTranscript` API
- [ ] Continue button updates `onboarding_stage` to 4
- [ ] `npm run build` passes
- [ ] Committed (not pushed)
