# INGEST Dashboard Integration Guide

## Component Created
`src/components/dashboard/IngestDashboard.tsx`

## What It Does

**Click-to-activate agent cards with real-time progress:**
- 8 domain agents (Finance, Sales, Marketing, Operations, People, Product, Legal, Strategy)
- Each card shows:
  - Icon + name + description
  - Layer 1 progress bar (Platform Access: 0-15)
  - Layer 2 progress bar (Historical Context: 0-15)
  - Total score (0-30) with % complete
  - "Activate Agent" button
  - Gaps list (what's missing for Layer 2)
  - Processing spinner when active
- Overall progress bar at top
- Real-time updates via Supabase Realtime
- Processing queue indicator at bottom

**UX Flow:**
1. User clicks "Activate Agent" on Finance card
2. Card border turns blue, spinner appears
3. Function calls: classify-document → process-finance-data → calculate-domain-scores
4. Progress bars update in real-time as scores change
5. Gaps list shows what's missing
6. When complete (score ≥ 25), card border turns green, button says "Re-process"

---

## How to Integrate

### Option 1: Add to Main Dashboard

Edit `src/components/Dashboard.tsx` (or wherever your main dashboard is):

```tsx
import IngestDashboard from './dashboard/IngestDashboard';

// Add a tab or section for INGEST
<IngestDashboard />
```

### Option 2: Add as Separate Route

Edit your router (e.g., `src/App.tsx`):

```tsx
import IngestDashboard from './components/dashboard/IngestDashboard';

// Add route
<Route path="/ingest" element={<IngestDashboard />} />
```

Then add navigation link:
```tsx
<Link to="/ingest">INGEST Pipeline</Link>
```

### Option 3: Show During Onboarding

After company creation, redirect to INGEST dashboard:

```tsx
// In onboarding flow after company is created
navigate('/ingest');
```

---

## Dependencies Check

The component uses:
- `supabase` from `../../lib/supabase`
- `useAuth` hook from `../../hooks/useAuth`

**If these don't exist yet, create them:**

### 1. `src/lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 2. `src/hooks/useAuth.ts`
```ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user };
}
```

---

## Realtime Subscriptions

The component subscribes to:
- `domain_scores` table changes → updates progress bars in real-time
- `ingest_log` table changes → shows processing status

**Ensure Realtime is enabled in Supabase:**
1. Go to Database → Replication
2. Enable replication for `domain_scores` and `ingest_log` tables

---

## Styling

The component uses Tailwind CSS. Ensure it's configured in your project.

**Colors used:**
- Blue: primary action (activate button, processing border)
- Green: complete state
- Yellow: gaps/warnings
- Gray: idle/disabled

---

## Testing

### 1. Without Data
Component should show 8 cards with 0% progress and "Activate Agent" buttons.

### 2. After Activating Finance
1. Click "Activate Agent" on Finance card
2. Card border should turn blue
3. Spinner appears in top-right
4. After ~5-10 seconds, progress bars should update
5. Score should increase
6. Gaps should appear if data is incomplete

### 3. With Existing Data
If domain_scores already exist for the company, cards should load with current progress on mount.

---

## Next Steps

1. ✅ Component created
2. ⏳ Add to app routing
3. ⏳ Test with OYNB company
4. ⏳ Build remaining domain processors (sales, marketing, etc.)
5. ⏳ Add detailed processing log modal (click on card to see full log)
6. ⏳ Add "Upload Documents" button to trigger sync-google-drive

---

## File Location

`src/components/dashboard/IngestDashboard.tsx`

Committed and pushed to GitHub: commit `1144117`
