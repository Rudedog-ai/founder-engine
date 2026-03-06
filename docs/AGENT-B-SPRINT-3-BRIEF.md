# Agent B Brief — Sprint 3: Intelligence & Source of Truth

**Date:** 7 March 2026
**Priority:** Build in parallel with Sprint 2 (Google Drive OAuth)
**Rule:** Commit after every logical unit. Do NOT push — Ruari will review and push.

---

## 1. WHAT YOU ARE BUILDING

Sprint 3 adds the Intelligence Builder to the dashboard — visual domain score sliders, a document checklist, knowledge cards, and a Source of Truth generator that fires when the intelligence score hits 25%.

The founder sees how much Angus knows, broken down by 6 business domains, and gets a living summary document once enough data exists.

---

## 2. PROJECT CONTEXT

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite (deployed to Vercel)
- **Backend:** Supabase PostgreSQL + Supabase Deno edge functions
- **Auth:** Supabase Auth (email+password, Google OAuth)
- **Styling:** Custom CSS in `src/styles/ocean.css` and `src/styles/onboarding.css`
- **State:** No Redux/Zustand — local component state + Supabase client queries
- **Supabase client:** Imported from `src/supabase.ts` — use `supabase.from('table')` for queries

### Supabase Details
- **Project URL:** `https://qzlicsovnldozbnmahsa.supabase.co`
- **Edge functions deployed via:** Supabase MCP or CLI (`supabase functions deploy <name>`)
- **Edge function secrets already set:** `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`
- **Model for Claude calls:** `claude-sonnet-4-5-20250929`

### Key Files You Need to Know About (DO NOT EDIT THESE)

| File | What It Does |
|------|-------------|
| `src/App.tsx` | Auth gate + screen routing. SHARED — do not edit |
| `src/api.ts` | All edge function calls. SHARED — do not edit |
| `src/types.ts` | TypeScript interfaces. SHARED — do not edit |
| `src/styles/ocean.css` | Main theme. SHARED — do not edit |
| `src/supabase.ts` | Supabase client singleton |
| `CLAUDE.md` | Project instructions |

### Current Database Tables You'll Query

**companies** — One row per company. Key columns:
- `id` (uuid PK)
- `intelligence_score` (integer 0-100) — you will UPDATE this
- `intelligence_tier` (text: getting_started/good/great/amazing/expert) — you will UPDATE this
- `domain_scores` (jsonb) — already exists with this default:
  ```json
  {"financials": 0, "sales": 0, "marketing": 0, "operations": 0, "team": 0, "strategy": 0}
  ```
- `source_of_truth_doc_id` (text, nullable) — you will SET this

**knowledge_base** — Existing flat table. One row per extracted fact:
- `id`, `company_id`, `topic` (text), `key` (text), `value` (text), `confidence` (text: high/medium/low)
- Topics in use: `business_fundamentals`, `revenue_financials`, `customers`, `team_operations`, `marketing_sales`, `technology_systems`, `founder_headspace`

**gap_analysis** — One row per topic per company:
- `id`, `company_id`, `topic`, `completeness_score` (0-100), `total_data_points`, `captured_data_points`, `missing_items` (text[])

**documents** — One row per uploaded file:
- `id`, `company_id`, `file_name`, `file_type`, `processed` (boolean), `extracted_data` (jsonb with `primary_topic`)

### Current Dashboard (DashboardScreen.tsx)
The dashboard already shows:
- Intelligence Score (0-100) with progress bar
- 7 topic cards with completeness bars (from gap_analysis)
- Recent activity feed

You are ADDING new components to this screen — not replacing what's there.

---

## 3. YOUR FILE OWNERSHIP

### Files You CREATE (yours exclusively):

| File | Purpose |
|------|---------|
| `src/components/intelligence/IntelligenceBuilder.tsx` | Container for the intelligence section |
| `src/components/intelligence/IntelligenceSlider.tsx` | Single domain score slider (animated) |
| `src/components/intelligence/DocumentChecklist.tsx` | Documents received per domain with auto-tick |
| `src/components/intelligence/SourceOfTruth.tsx` | Source of truth summary card |
| `src/components/intelligence/KnowledgeCard.tsx` | Individual knowledge fact card |
| `src/styles/intelligence.css` | All styling for intelligence components |

### Edge Functions You CREATE:

| Function | Purpose |
|----------|---------|
| `calculate-domain-scores` | Calculates 6 domain scores from knowledge_base + documents |
| `generate-source-of-truth` | Generates structured summary when score hits 25% |

### Files You MUST NOT EDIT:
- `src/App.tsx` — SHARED
- `src/api.ts` — SHARED (describe what API functions you need added, don't edit)
- `src/types.ts` — SHARED (describe what types you need added, don't edit)
- `src/styles/ocean.css` — SHARED
- `src/screens/DashboardScreen.tsx` — SHARED (describe where your components plug in)
- Anything in `src/screens/onboarding/` — Sprint 1 territory, don't touch
- `src/components/ResearchBanner.tsx` — don't touch
- `src/components/SideNav.tsx` — don't touch
- `src/components/BottomNav.tsx` — don't touch

---

## 4. TASK BREAKDOWN

### Task 1: Create intelligence.css

Create `src/styles/intelligence.css` with styles for all intelligence components.

Design language (match ocean.css):
- Background surfaces: `var(--surface)` (#0a1628) and `var(--surface-2)` (#0f2035)
- Border: `1px solid var(--border)` (rgba(255,255,255,0.06))
- Glow color: `var(--glow)` (#00f0ff)
- Text: `var(--text)` for primary, `var(--text-dim)` for secondary
- Border radius: `var(--radius)` (12px), `var(--radius-sm)` (8px)
- Cards: `.card` class already exists in ocean.css — use it or extend with your own classes
- Font: system font stack, no imports needed
- Slider bars: thin horizontal bars (4-6px height) with gradient fill from grey to glow

### Task 2: Domain Score Mapping

The knowledge_base table uses 7 topics. Map them to 6 domains for scoring:

| knowledge_base topic | Domain | Weight |
|---------------------|--------|--------|
| revenue_financials | financials | 20% |
| marketing_sales | sales | 20% |
| marketing_sales | marketing | 15% |
| team_operations | operations | 15% |
| team_operations | team | 15% |
| business_fundamentals + founder_headspace + customers | strategy | 15% |

Note: `marketing_sales` feeds both `sales` and `marketing` domains. `team_operations` feeds both `team` and `operations`. The edge function should handle this overlap.

### Task 3: calculate-domain-scores Edge Function

**Endpoint:** POST `/functions/v1/calculate-domain-scores`
**Input:** `{ company_id: string }`
**Logic:**

```
1. Fetch all knowledge_base rows for company_id
2. Fetch all documents for company_id (processed = true)
3. Fetch gap_analysis rows for company_id
4. For each domain:
   a. Count knowledge entries mapped to that domain (see mapping above)
   b. Count processed documents with matching primary_topic
   c. Factor in gap_analysis completeness_score
   d. Calculate domain score (0-100):
      - Base: (knowledge_entries_count / expected_entries) * 60
      - Documents: (relevant_docs_count / expected_docs) * 20
      - Gap completeness: gap_score * 0.20
      - Cap at 100
5. Calculate overall intelligence_score = weighted average of 6 domains
6. Determine tier:
   - 0-15: getting_started
   - 16-35: good
   - 36-55: great
   - 56-80: amazing
   - 81-100: expert
7. UPDATE companies SET domain_scores = {...}, intelligence_score = X, intelligence_tier = Y
8. If intelligence_score >= 25 AND source_of_truth_doc_id IS NULL:
   - Call generate-source-of-truth (or return a flag saying it should be called)
9. Return { domain_scores, intelligence_score, intelligence_tier }
```

**Expected entries per domain** (rough targets for scoring):
- financials: 15 entries
- sales: 12 entries
- marketing: 10 entries
- operations: 10 entries
- team: 8 entries
- strategy: 10 entries

**Edge function template:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ... your logic here ...

    return new Response(JSON.stringify({ success: true, domain_scores, intelligence_score }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Task 4: generate-source-of-truth Edge Function

**Endpoint:** POST `/functions/v1/generate-source-of-truth`
**Input:** `{ company_id: string }`
**Logic:**

```
1. Fetch ALL knowledge_base entries for company_id
2. Fetch company name, founder_name from companies
3. Call Claude API (claude-sonnet-4-5-20250929) with prompt:
   "You are creating a structured Source of Truth document for {company_name}.
    Based on the following knowledge base entries, create a comprehensive
    summary organised by domain. Flag any contradictions or gaps.

    Format as JSON:
    {
      "company_name": "...",
      "generated_at": "...",
      "domains": {
        "financials": { "summary": "...", "key_facts": [...], "gaps": [...], "confidence": "high/medium/low" },
        "sales": { ... },
        "marketing": { ... },
        "operations": { ... },
        "team": { ... },
        "strategy": { ... }
      },
      "overall_summary": "2-3 paragraph executive summary",
      "contradictions": [...],
      "critical_gaps": [...]
    }"
4. Store result: INSERT into a new `source_of_truth` table OR store as JSONB in companies table
5. UPDATE companies SET source_of_truth_doc_id = <id>
6. Return the generated document
```

**For the Claude API call:**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  }),
})
```

### Task 5: IntelligenceSlider.tsx

A single animated horizontal slider showing one domain's score.

**Props:**
```typescript
interface IntelligenceSliderProps {
  domain: string          // e.g. "financials"
  label: string           // e.g. "Revenue & Financials"
  score: number           // 0-100
  icon?: string           // SVG path data
}
```

**Behaviour:**
- Thin horizontal bar (4-6px height)
- Fill animates from 0 to `score` on mount (CSS transition, 1s ease-out)
- Score percentage shown on right
- Label on left
- Colour: grey background, gradient fill (var(--wave) to var(--glow))
- Below the bar: small text showing "X data points" if available

### Task 6: IntelligenceBuilder.tsx

Container that renders 6 IntelligenceSlider components.

**Props:**
```typescript
interface IntelligenceBuilderProps {
  companyId: string
  domainScores: DomainScores  // from types.ts: { financials, sales, marketing, operations, team, strategy }
}
```

**Behaviour:**
- Section title: "Intelligence Builder"
- Renders 6 sliders in order: Financials, Sales, Marketing, Operations, Team, Strategy
- Each slider gets the score from domainScores
- Optional: "Refresh Scores" button that calls calculate-domain-scores

**Domain label mapping:**
```typescript
const DOMAIN_LABELS: Record<string, string> = {
  financials: 'Revenue & Financials',
  sales: 'Sales & Pipeline',
  marketing: 'Marketing & Growth',
  operations: 'Operations & Processes',
  team: 'Team & People',
  strategy: 'Strategy & Vision',
}
```

### Task 7: DocumentChecklist.tsx

Shows which document types have been uploaded/processed per domain.

**Props:**
```typescript
interface DocumentChecklistProps {
  companyId: string
  documents: Document[]  // from types.ts
}
```

**Expected documents per domain:**
```typescript
const EXPECTED_DOCS: Record<string, string[]> = {
  financials: ['P&L Statement', 'Cash Flow Forecast', 'Management Accounts'],
  sales: ['Sales Pipeline/CRM Export', 'Sales Deck', 'Pricing Document'],
  marketing: ['Marketing Plan', 'Brand Guidelines', 'Content Strategy'],
  operations: ['Process/SOP Document', 'Org Chart', 'Key Contracts'],
  team: ['Org Chart', 'Team Directory', 'Hiring Plan'],
  strategy: ['Business Plan', 'Pitch Deck', 'Investor Update'],
}
```

**Behaviour:**
- Group by domain
- Each item shows: checkbox (auto-ticked if a matching document exists), document name
- Match logic: check if any document's `file_name` or `extracted_data.primary_topic` loosely matches the expected type
- Unticked items show in dimmed text
- Count at top: "X of Y documents received"

### Task 8: KnowledgeCard.tsx

Displays a single knowledge fact.

**Props:**
```typescript
interface KnowledgeCardProps {
  entry: KnowledgeEntry  // from types.ts: { topic, key, value, confidence }
}
```

**Behaviour:**
- Compact card with key as label, value as body
- Confidence indicator: green dot (high), amber dot (medium), grey dot (low)
- Topic badge in corner

### Task 9: SourceOfTruth.tsx

Displays the generated source of truth summary.

**Props:**
```typescript
interface SourceOfTruthProps {
  companyId: string
}
```

**Behaviour:**
- Fetches source of truth data from Supabase (companies.source_of_truth_doc_id or separate table)
- If no source of truth exists yet: shows "Source of Truth will generate at 25% intelligence score" with current score
- If exists: renders the executive summary, domain summaries, and critical gaps
- Collapsible sections per domain

### Task 10: Wire Into Dashboard

**You cannot edit DashboardScreen.tsx directly.** Instead, create a file describing exactly what needs to be added:

Create `docs/SPRINT-3-DASHBOARD-INTEGRATION.md` with:
1. The exact import statements to add
2. Where in the JSX the components should go (after the topic grid, before the activity feed)
3. What props to pass
4. The import for intelligence.css in main.tsx

Example:
```tsx
// Add to DashboardScreen.tsx imports:
import IntelligenceBuilder from '../components/intelligence/IntelligenceBuilder'
import DocumentChecklist from '../components/intelligence/DocumentChecklist'
import SourceOfTruth from '../components/intelligence/SourceOfTruth'

// Add after the topic-grid div, before the activity feed:
<div className="water-divider" />
<IntelligenceBuilder companyId={companyId!} domainScores={company.domain_scores} />
<div className="water-divider" />
<DocumentChecklist companyId={companyId!} documents={profile.documents} />
<div className="water-divider" />
<SourceOfTruth companyId={companyId!} />
```

Also describe what needs adding to `src/api.ts`:
```typescript
export async function calculateDomainScores(company_id: string) {
  return callEdgeFunction('calculate-domain-scores', { company_id })
}

export async function generateSourceOfTruth(company_id: string) {
  return callEdgeFunction('generate-source-of-truth', { company_id })
}
```

And what types need adding to `src/types.ts`:
```typescript
export interface SourceOfTruthDomain {
  summary: string
  key_facts: string[]
  gaps: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface SourceOfTruth {
  company_name: string
  generated_at: string
  domains: Record<string, SourceOfTruthDomain>
  overall_summary: string
  contradictions: string[]
  critical_gaps: string[]
}
```

---

## 5. TESTING

After building each component:

1. **Components:** `npm run build` must pass with zero TypeScript errors
2. **Edge functions:** Test locally with curl:
   ```bash
   curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/calculate-domain-scores \
     -H "Content-Type: application/json" \
     -H "apikey: <anon-key>" \
     -d '{"company_id": "03c5d5f0-7174-4495-8b72-1aa2b5adb5ea"}'
   ```
   Use Chocolate and Love company (ID above) — it has 85 knowledge entries.

3. **Visual:** `npm run dev` → check localhost:5173 → components render without errors

---

## 6. COMMIT RULES

1. `git pull origin main` before starting
2. `git status` must be clean before starting
3. Commit after every task completion
4. Commit message format: `feat(sprint3): add <component name>`
5. **DO NOT PUSH** — commit locally only, Ruari will review and push
6. If you hit a merge conflict: STOP and report it

---

## 7. DEFINITION OF DONE

Sprint 3 is done when:
- [ ] `calculate-domain-scores` edge function works and updates companies table
- [ ] `generate-source-of-truth` edge function produces a structured summary
- [ ] IntelligenceBuilder shows 6 animated domain sliders
- [ ] DocumentChecklist shows expected vs received documents
- [ ] KnowledgeCard renders individual facts with confidence indicators
- [ ] SourceOfTruth shows generated summary or "not yet" state
- [ ] `npm run build` passes with zero errors
- [ ] Integration instructions documented in `docs/SPRINT-3-DASHBOARD-INTEGRATION.md`
- [ ] All files committed (not pushed)
