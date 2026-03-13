# Onboarding Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current 2-step onboarding (welcome animation + setup dump) with a focused 3-step flow: Connect Tools, Connect Google Drive, Questions. Company info is collected pre-onboarding on WelcomeScreen. Angus greets in Scottish, not Australian. Dashboard shows active research on first load.

**Architecture:** WelcomeScreen already collects company info and kicks off scrape — keep that. Replace OnboardingFlow internals (WelcomeStage + SetupStage) with three new stages (ConnectToolsStage, GoogleDriveStage, QuestionsStage). ProgressIndicator updated for 3 steps. ResearchBanner already shows on dashboard — just ensure scrape is running when user lands there.

**Tech Stack:** React + TypeScript, Supabase client, existing ConnectTools component (modified), existing QuestionBatch component, Composio v3 for OAuth, google-drive-oauth edge function.

---

## Pre-flight: What exists and what changes

### Files to MODIFY:
- `src/screens/WelcomeScreen.tsx` — Add industry field, fix greeting, remove scraping spinner (let user proceed immediately)
- `src/screens/onboarding/OnboardingFlow.tsx` — 3 stages instead of 2
- `src/screens/onboarding/ProgressIndicator.tsx` — 3 stage labels
- `src/components/integrations/ConnectTools.tsx` — Grid layout, real logos, top-5 focus, connection counter

### Files to CREATE:
- `src/screens/onboarding/ConnectToolsStage.tsx` — Step 1
- `src/screens/onboarding/GoogleDriveStage.tsx` — Step 2
- `src/screens/onboarding/QuestionsStage.tsx` — Step 3

### Files to DELETE:
- `src/screens/onboarding/WelcomeStage.tsx` — Replaced entirely
- `src/screens/onboarding/SetupStage.tsx` — Replaced entirely

---

## Task 1: Add industry field to WelcomeScreen

**Files:**
- Modify: `src/screens/WelcomeScreen.tsx`

**What:** Add an industry dropdown to the company info form. The `onboardCompany` API call already accepts `industry` as a parameter but WelcomeScreen doesn't collect it.

**Changes:**
1. Add state: `const [industry, setIndustry] = useState('')`
2. Add sessionStorage persistence like the other fields
3. Add a select dropdown after the Website field with common industries:
   - Technology, E-commerce, Professional Services, Healthcare, Finance, Manufacturing, Food & Beverage, Education, Other
4. Pass `industry` to `onboardCompany()` call (line 111-116)
5. Remove the `scraping` state and spinner card (lines 334-340) — the user should proceed straight to onboarding, not wait. The scrape runs in background and ResearchBanner shows progress on dashboard.

**Commit:** `feat: add industry field to company setup, remove blocking scrape spinner`

---

## Task 2: Update ProgressIndicator for 3 steps

**Files:**
- Modify: `src/screens/onboarding/ProgressIndicator.tsx`

**Changes:**
1. Update `STAGE_LABELS` from `['Welcome', 'Setup']` to `['Connect Tools', 'Google Drive', 'Questions']`

**Commit:** `feat: update progress indicator for 3-step onboarding`

---

## Task 3: Redesign ConnectTools component

**Files:**
- Modify: `src/components/integrations/ConnectTools.tsx`

**What:** Grid layout, brand logo URLs, top-5 priority apps, connection counter.

**Changes:**

1. Replace single-letter placeholders with real brand logo URLs for each app. Use official CDN logos (e.g., `https://logo.clearbit.com/xero.com`, `https://logo.clearbit.com/hubspot.com`, etc.).

2. Reorder APPS array — top 5 first: Xero, HubSpot, Slack, Google Drive, Notion. Rest after.

3. Add Google Drive to the APPS list:
   ```typescript
   { key: 'google_drive', name: 'Google Drive', logo: 'https://logo.clearbit.com/google.com', description: 'Documents & files' }
   ```

4. Change the grid from `minmax(140px, 1fr)` to `repeat(auto-fill, minmax(150px, 1fr))` for better card sizing.

5. Add a connection counter above the grid:
   ```tsx
   const connectedCount = displayApps.filter(a => integrations[a.key]?.status === 'connected' || integrations[a.key]?.status === 'active').length
   // Render: "{connectedCount} of {displayApps.length} connected"
   ```

6. When `compact` is true (onboarding), show only top 5 apps. When false (dashboard), show all.

**Commit:** `feat: redesign ConnectTools with logos, grid, counter`

---

## Task 4: Create ConnectToolsStage (Step 1)

**Files:**
- Create: `src/screens/onboarding/ConnectToolsStage.tsx`

**What:** First onboarding step. Shows the compact ConnectTools grid with a clear heading, skip button always visible, and continue CTA.

```typescript
// ConnectToolsStage v1 — Step 1: Connect your business tools
import { useAuth } from '../../contexts/AuthContext'
import ProgressIndicator from './ProgressIndicator'
import ConnectTools from '../../components/integrations/ConnectTools'

interface Props {
  onAdvance: () => Promise<void>
}

export default function ConnectToolsStage({ onAdvance }: Props) {
  const { companyId } = useAuth()

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={1} />
      <div className="ocean-form-card" style={{ maxWidth: 580, margin: '0 auto' }}>
        <h3>Connect your tools</h3>
        <p className="onboarding-subtitle">
          The more Angus can see, the sharper his advice. Connect what you use — you can add more later.
        </p>
        <ConnectTools companyId={companyId!} compact />
        <div className="onboarding-actions">
          <button className="btn btn-primary btn-block" onClick={onAdvance}>
            Continue
          </button>
          <button className="btn btn-link" onClick={onAdvance}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
```

Key design points:
- CTA and Skip always visible (card should not overflow viewport)
- `compact` prop limits ConnectTools to top 5
- No forced waiting, no animation delays

**Commit:** `feat: create ConnectToolsStage for onboarding step 1`

---

## Task 5: Create GoogleDriveStage (Step 2)

**Files:**
- Create: `src/screens/onboarding/GoogleDriveStage.tsx`

**What:** Dedicated Google Drive step. Two options: connect whole drive OR specific folder. Explains what we look for and why.

```typescript
// GoogleDriveStage v1 — Step 2: Connect Google Drive
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import { useToast } from '../../components/Toast'
import ProgressIndicator from './ProgressIndicator'

interface Props {
  onAdvance: () => Promise<void>
}

export default function GoogleDriveStage({ onAdvance }: Props) {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [connecting, setConnecting] = useState(false)

  async function handleConnect() {
    if (!companyId || connecting) return
    setConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          company_id: companyId,
          toolkit: 'google_drive',
          redirect_uri: window.location.origin + '/integrations/callback?integration_connected=true',
        },
      })
      if (error || !data?.redirect_url) {
        showToast(data?.error || 'Could not connect Google Drive', 'error')
        setConnecting(false)
        return
      }
      window.open(data.redirect_url, '_blank')
      setConnecting(false)
    } catch {
      showToast('Connection failed', 'error')
      setConnecting(false)
    }
  }

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={2} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h3>Connect Google Drive</h3>
        <p className="onboarding-subtitle">
          This is the most powerful thing you can do for Angus. He'll find your
          recent, relevant documents automatically — pitch decks, financials,
          strategy docs, team plans.
        </p>

        <div className="drive-what-we-look-for">
          <h4>What Angus looks for:</h4>
          <ul>
            <li>Recent documents (last 12 months)</li>
            <li>Spreadsheets with financial data</li>
            <li>Strategy and planning documents</li>
            <li>Team and org information</li>
          </ul>
          <p className="drive-privacy-note">
            Angus reads but never writes. Your data stays yours.
          </p>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting
            ? <><span className="spinner" /> Connecting...</>
            : 'Connect Google Drive'}
        </button>

        <div className="onboarding-actions">
          <button className="btn btn-link" onClick={onAdvance}>
            Skip for now — I'll connect later
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Commit:** `feat: create GoogleDriveStage for onboarding step 2`

---

## Task 6: Create QuestionsStage (Step 3)

**Files:**
- Create: `src/screens/onboarding/QuestionsStage.tsx`

**What:** Wraps the existing QuestionBatch component. Auto-generates questions on mount. Shows a "Finish" CTA to complete onboarding.

```typescript
// QuestionsStage v1 — Step 3: Answer questions to fill gaps
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import ProgressIndicator from './ProgressIndicator'
import QuestionBatch from '../../components/questions/QuestionBatch'

interface Props {
  onAdvance: () => Promise<void>
}

export default function QuestionsStage({ onAdvance }: Props) {
  const { companyId } = useAuth()
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    if (!companyId || generated) return
    supabase.functions.invoke('generate-onboarding-questions', {
      body: { company_id: companyId },
    }).then(() => setGenerated(true)).catch(() => setGenerated(true))
  }, [companyId, generated])

  return (
    <div className="onboarding-stage fade-in">
      <ProgressIndicator currentStage={3} />
      <div className="ocean-form-card" style={{ maxWidth: 580, margin: '0 auto' }}>
        <h3>Quick questions</h3>
        <p className="onboarding-subtitle">
          Answer what you can — voice, text, or skip. Every answer sharpens Angus's understanding.
        </p>
        <QuestionBatch companyId={companyId!} />
        <div className="onboarding-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary btn-block" onClick={onAdvance}>
            Finish setup
          </button>
          <button className="btn btn-link" onClick={onAdvance}>
            I'll answer later
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Commit:** `feat: create QuestionsStage for onboarding step 3`

---

## Task 7: Rewire OnboardingFlow for 3 stages

**Files:**
- Modify: `src/screens/onboarding/OnboardingFlow.tsx`

**Changes:**
1. Remove imports of WelcomeStage and SetupStage
2. Import ConnectToolsStage, GoogleDriveStage, QuestionsStage
3. Change stage switch to:
   - case 1: ConnectToolsStage
   - case 2: GoogleDriveStage
   - case 3: QuestionsStage
4. `advanceTo(4)` triggers `onComplete()`
5. Add brief Angus greeting at the top of stage 1 (not a separate screen):
   - "Right then, {founderName}. Let's get you set up." — rendered as a small banner inside ConnectToolsStage or as a one-line greeting in OnboardingFlow before the stage component. No animation delay. Instant.

**Commit:** `feat: rewire onboarding flow to 3-step sequence`

---

## Task 8: Delete old stages

**Files:**
- Delete: `src/screens/onboarding/WelcomeStage.tsx`
- Delete: `src/screens/onboarding/SetupStage.tsx`

**Commit:** `refactor: remove old WelcomeStage and SetupStage`

---

## Task 9: Fix Angus greeting text

**Files:**
- Modify: `src/screens/onboarding/ConnectToolsStage.tsx` (or wherever greeting lands)

**Change:** The greeting line should be Scottish:
- "Right then. Let's get your tools connected." (not "G'day")

**Also check:** `src/screens/onboarding/WelcomeStage.tsx` is deleted (Task 8), so the "G'day" is gone.

**Commit:** (included in Task 7 or 4)

---

## Task 10: Verify build + type check

**Run:** `npx tsc --noEmit`
**Expected:** Zero errors.

**Run:** `npm run build` (or `npx vite build`)
**Expected:** Clean build.

**Commit:** `chore: verify clean build after onboarding redesign`

---

## Task 11: Deploy and verify in browser

1. `git push origin main` — triggers Vercel deploy
2. Deploy any modified edge functions via `npx supabase functions deploy`
3. Navigate to app in browser
4. Create fresh account or reset existing
5. Walk through all 3 onboarding steps
6. Verify dashboard shows ResearchBanner with active scrape

---

## Summary of UX changes

| Before | After |
|--------|-------|
| 9-second forced animation | No animation, instant start |
| "G'day" (Australian) | "Right then" (Scottish) |
| No company name on welcome | Company name collected pre-onboarding (already exists) |
| No industry collected | Industry dropdown added |
| 10 tools in vertical stack | Top 5 in grid with real logos |
| No connection counter | "2 of 5 connected" visible |
| Google Drive missing | Dedicated step 2 |
| Questions buried in dashboard | Step 3 of onboarding |
| 0% empty dashboard on exit | ResearchBanner shows active scrape |
| CTA below fold | CTA + Skip always visible |
| Single-letter icons | Brand logos via Clearbit |
