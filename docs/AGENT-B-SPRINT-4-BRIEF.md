# Agent B Brief — Sprint 4: Corrections Layer

**Date:** 7 March 2026
**Priority:** Build in parallel with scoring recalibration
**Rule:** Commit after every logical unit. Do NOT push — Ruari will review and push.

---

## 1. WHAT YOU ARE BUILDING

Sprint 4 adds the Corrections layer — the mechanism that lets founders fix what Angus gets wrong. Corrections always override source data. When a founder says "that revenue figure is wrong, it's actually £X", that correction persists and Angus uses the corrected value from then on.

Key principle from Architecture.md: **Corrections always win.** Priority order:
1. Corrections (highest priority)
2. Voice session transcripts (last 30 days)
3. Source of truth document
4. Connected tool data (Xero = real-time)
5. Knowledge chunks (uploaded docs)
6. Auto-research / Perplexity (lowest priority)

---

## 2. PROJECT CONTEXT

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite (deployed to Vercel)
- **Backend:** Supabase PostgreSQL + Supabase Deno edge functions
- **Auth:** Supabase Auth (email+password, Google OAuth)
- **Styling:** Custom CSS — `ocean.css` (main), `onboarding.css`, `intelligence.css`
- **State:** Local component state + Supabase client queries (no Redux/Zustand)
- **Supabase client:** Import from `src/supabase.ts` — use `supabase.from('table')` for queries

### Supabase Details
- **Project URL:** `https://qzlicsovnldozbnmahsa.supabase.co`
- **Model for Claude calls:** `claude-sonnet-4-5-20250929`
- **Secret available:** `ANTHROPIC_API_KEY`

### Database Tables You'll Use

**knowledge_corrections** — Already exists. Schema:
```sql
CREATE TABLE knowledge_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  element_key TEXT NOT NULL,        -- which fact is being corrected (e.g. "annual_revenue")
  element_label TEXT NOT NULL,      -- human-readable label (e.g. "Annual Revenue")
  domain TEXT NOT NULL,             -- financials, sales, marketing, operations, team, strategy
  original_value TEXT,              -- what we had before
  corrected_value TEXT NOT NULL,    -- what the founder says it should be
  correction_context TEXT,          -- why they corrected it (optional)
  source TEXT NOT NULL,             -- 'dashboard_edit', 'voice_session', 'email'
  source_detail TEXT,               -- additional context about source
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES knowledge_corrections(id)
);
```

**knowledge_base** — Existing flat table with extracted facts:
- `id`, `company_id`, `topic`, `key`, `value`, `confidence`

**knowledge_elements** — Already exists. Schema:
```sql
CREATE TABLE knowledge_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  element_key TEXT NOT NULL,
  element_label TEXT NOT NULL,
  domain TEXT NOT NULL,
  current_value TEXT NOT NULL,
  source_chunk_ids UUID[],
  has_correction BOOLEAN DEFAULT FALSE,
  correction_id UUID REFERENCES knowledge_corrections(id),
  last_verified_at TIMESTAMPTZ,
  document_age_months INTEGER,
  is_stale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**companies** — Key columns:
- `domain_scores` (jsonb): `{financials: 0, sales: 0, marketing: 0, operations: 0, team: 0, strategy: 0}`
- `intelligence_score` (float)

### Current Dashboard Components
The dashboard (`DashboardScreen.tsx`) currently shows:
- Score card (intelligence_score, tier)
- Topic grid (7 knowledge areas with completeness bars)
- Intelligence Builder (6 domain sliders) — Sprint 3
- Document Checklist — Sprint 3
- Source of Truth (collapsible sections) — Sprint 3
- Activity Feed

### Existing Intelligence Components (Sprint 3, yours)
Located in `src/components/intelligence/`:
- `IntelligenceBuilder.tsx` — 6 domain sliders
- `IntelligenceSlider.tsx` — single animated bar
- `DocumentChecklist.tsx` — expected vs received docs
- `KnowledgeCard.tsx` — single knowledge fact with confidence dot
- `SourceOfTruth.tsx` — SoT display with collapsible domain sections

---

## 3. YOUR FILE OWNERSHIP

### Files You CREATE (yours exclusively):

| File | Purpose |
|------|---------|
| `src/components/corrections/CorrectionPanel.tsx` | Slide-out panel for editing a knowledge fact |
| `src/components/corrections/CorrectionHistory.tsx` | Shows correction history for a fact |
| `src/components/corrections/StaleDocAlert.tsx` | Warning badge/banner for old data |
| `src/styles/corrections.css` | All styling for correction components |

### Edge Functions You CREATE:

| Function | Purpose |
|----------|---------|
| `apply-correction` | Stores correction, marks knowledge_elements, updates Angus context |

### Files You MAY MODIFY (carefully):

| File | What You Can Change |
|------|-------------------|
| `src/components/intelligence/KnowledgeCard.tsx` | Add edit button + click handler to open CorrectionPanel |
| `src/components/intelligence/SourceOfTruth.tsx` | Add inline edit buttons on key facts |
| `src/styles/intelligence.css` | Add styles for edit buttons on existing components |

### Files You MUST NOT EDIT:
- `src/App.tsx` — SHARED
- `src/api.ts` — SHARED (describe what API functions you need added)
- `src/types.ts` — SHARED (describe what types you need added)
- `src/styles/ocean.css` — SHARED
- `src/screens/DashboardScreen.tsx` — SHARED (describe where your components plug in)
- Anything in `src/screens/onboarding/` — don't touch
- `src/components/ResearchBanner.tsx` — don't touch
- `src/components/SideNav.tsx` — don't touch

---

## 4. TASK BREAKDOWN

### Task 1: Create corrections.css

Design language (match ocean.css + intelligence.css):
- Surfaces: `var(--surface)`, `var(--surface-2)`, `var(--abyss)`
- Glow: `var(--glow)` (#00f0ff)
- Coral/warning: `var(--coral)` for stale alerts
- Border: `1px solid var(--sea)`
- Correction panel: slide-in from right, overlay with backdrop blur

### Task 2: apply-correction Edge Function

**Endpoint:** POST `/functions/v1/apply-correction`
**Input:**
```json
{
  "company_id": "uuid",
  "element_key": "annual_revenue",
  "element_label": "Annual Revenue",
  "domain": "financials",
  "original_value": "£2.5M estimated",
  "corrected_value": "£1.8M actual",
  "correction_context": "Based on 2024 filed accounts",
  "source": "dashboard_edit"
}
```

**Logic:**
```
1. If there's an existing active correction for this element_key + company_id:
   a. Set active = false on the old one
   b. Set superseded_by = new correction ID on the old one
2. INSERT new correction with active = true
3. UPDATE knowledge_elements SET has_correction = true, correction_id = new_id
   WHERE company_id = X AND element_key = Y
4. If no knowledge_element exists yet, INSERT one with the corrected value
5. UPDATE knowledge_base SET value = corrected_value, confidence = 1.0
   WHERE company_id = X AND key = element_key (if exists)
6. Audit log the correction
7. Return the correction record
```

### Task 3: CorrectionPanel.tsx

A slide-out panel that appears when the user clicks "Edit" on a knowledge fact.

**Props:**
```typescript
interface CorrectionPanelProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  elementKey: string
  elementLabel: string
  domain: string
  currentValue: string
  onCorrected: () => void  // callback to refresh parent
}
```

**Behaviour:**
- Slides in from the right (300-400px wide)
- Shows: label, current value (read-only), text input for corrected value, optional context field
- "Save Correction" button → calls apply-correction edge function
- Success → calls onCorrected, closes panel
- Shows correction history below the edit form (if any previous corrections exist)

### Task 4: CorrectionHistory.tsx

Shows past corrections for a knowledge element.

**Props:**
```typescript
interface CorrectionHistoryProps {
  companyId: string
  elementKey: string
}
```

**Behaviour:**
- Fetches from `knowledge_corrections` WHERE company_id = X AND element_key = Y, ordered by applied_at DESC
- Shows timeline: date, old value → new value, source, who corrected
- Active correction highlighted
- Superseded corrections shown dimmed

### Task 5: StaleDocAlert.tsx

Warning indicator for data that might be outdated.

**Props:**
```typescript
interface StaleDocAlertProps {
  ageMonths: number | null
  compact?: boolean  // true = small badge, false = full banner
}
```

**Behaviour based on age (from Architecture.md):**
- < 3 months: no indicator (fresh)
- 3–12 months: amber dot/text "Data from X months ago"
- > 12 months: red warning "Over 1 year old — verify before using"
- > 24 months: prominent red banner "Over 2 years old"
- `compact` mode: just a colored dot
- Full mode: text explanation

### Task 6: Add Edit Buttons to KnowledgeCard.tsx

Modify your existing `KnowledgeCard.tsx` to add an edit pencil icon.

**Changes:**
- Add optional `onEdit` prop: `onEdit?: (key: string, label: string, value: string) => void`
- Add pencil icon button in the header (visible on hover)
- When clicked, calls `onEdit(entry.key, entry.key, entry.value)`
- If entry has a correction (`has_correction` field), show a small "corrected" badge

### Task 7: Add Edit Buttons to SourceOfTruth.tsx

Modify your existing `SourceOfTruth.tsx` to allow editing key facts.

**Changes:**
- Each key fact in the expanded domain section gets a small edit icon on hover
- Clicking opens the CorrectionPanel with that fact's data
- Facts that have been corrected show a "Corrected" tag

### Task 8: Integration Document

Create `docs/SPRINT-4-DASHBOARD-INTEGRATION.md` with:

1. Import for `corrections.css` in `main.tsx`
2. What needs adding to `api.ts`:
```typescript
export async function applyCorrection(
  company_id: string,
  element_key: string,
  element_label: string,
  domain: string,
  original_value: string,
  corrected_value: string,
  correction_context?: string
) {
  return callEdgeFunction('apply-correction', {
    company_id, element_key, element_label, domain,
    original_value, corrected_value, correction_context,
    source: 'dashboard_edit',
  })
}
```

3. What needs adding to `types.ts`:
```typescript
export interface KnowledgeCorrection {
  id: string
  company_id: string
  element_key: string
  element_label: string
  domain: string
  original_value: string | null
  corrected_value: string
  correction_context: string | null
  source: string
  active: boolean
  applied_at: string
}
```

4. Where components plug into DashboardScreen (if any dashboard-level changes needed)
5. Deploy command for the edge function

---

## 5. TESTING

1. **Build:** `npm run build` must pass with zero TypeScript errors
2. **Edge function test:**
```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/apply-correction \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{
    "company_id": "7caf6a8e-0165-410d-b4ce-56f0fe05be4e",
    "element_key": "annual_revenue",
    "element_label": "Annual Revenue",
    "domain": "financials",
    "original_value": "Unknown",
    "corrected_value": "£5M",
    "source": "dashboard_edit"
  }'
```
3. **Visual:** `npm run dev` → test CorrectionPanel opens/closes, edit works

---

## 6. COMMIT RULES

1. `git pull origin main` before starting
2. `git status` must be clean before starting
3. Commit after every task completion
4. Commit message format: `feat(sprint4): add <component name>`
5. **DO NOT PUSH** — commit locally only
6. Merge conflict = STOP and report

---

## 7. DEFINITION OF DONE

- [ ] `apply-correction` edge function stores corrections and updates knowledge_base
- [ ] CorrectionPanel slides in, accepts edits, calls edge function
- [ ] CorrectionHistory shows past corrections for an element
- [ ] StaleDocAlert shows age-appropriate warnings
- [ ] KnowledgeCard has edit button (hover) that opens CorrectionPanel
- [ ] SourceOfTruth key facts have edit buttons
- [ ] `npm run build` passes with zero errors
- [ ] Integration instructions in `docs/SPRINT-4-DASHBOARD-INTEGRATION.md`
- [ ] All files committed (not pushed)
