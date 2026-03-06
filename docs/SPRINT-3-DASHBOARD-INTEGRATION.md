# Sprint 3 — Dashboard Integration Instructions

## 1. Add CSS import to `src/main.tsx`

```tsx
import './styles/intelligence.css'
```

Add after the existing `import './styles/onboarding.css'` line.

---

## 2. Add API functions to `src/api.ts`

```typescript
export async function calculateDomainScores(company_id: string) {
  return callEdgeFunction('calculate-domain-scores', { company_id })
}

export async function generateSourceOfTruth(company_id: string) {
  return callEdgeFunction('generate-source-of-truth', { company_id })
}
```

---

## 3. Types already exist

`DomainScores` is already in `src/types.ts`. No additions needed for the components.

If you want typed Source of Truth responses later, add:

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

## 4. Add components to `src/screens/DashboardScreen.tsx`

### Imports to add at top:

```tsx
import IntelligenceBuilder from '../components/intelligence/IntelligenceBuilder'
import DocumentChecklist from '../components/intelligence/DocumentChecklist'
import SourceOfTruth from '../components/intelligence/SourceOfTruth'
```

### JSX placement — after the topic-grid closing `</div>` (line ~174), before the Activity Feed section:

```tsx
      </div>  {/* end topic-grid */}

      <div className="water-divider" />
      <IntelligenceBuilder companyId={companyId!} domainScores={company.domain_scores} />
      <div className="water-divider" />
      <DocumentChecklist companyId={companyId!} documents={profile.documents} />
      <div className="water-divider" />
      <SourceOfTruth companyId={companyId!} />

      {/* Activity Feed */}
```

---

## 5. Deploy Edge Functions

```bash
supabase functions deploy calculate-domain-scores
supabase functions deploy generate-source-of-truth
```

Or deploy via Supabase MCP if available.

---

## 6. Test with Chocolate and Love

```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/calculate-domain-scores \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"company_id": "03c5d5f0-7174-4495-8b72-1aa2b5adb5ea"}'
```

Expected: returns domain_scores, intelligence_score, intelligence_tier. Company has 85 knowledge entries so scores should be meaningful.
