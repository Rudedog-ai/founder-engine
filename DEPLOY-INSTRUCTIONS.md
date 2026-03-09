# Deploy & Test Instructions - Two-Pass Ingestion

## Step 1: Deploy Database Migration

**Option A: Supabase Dashboard (Easiest)**
1. Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/editor
2. Click "SQL Editor" tab
3. Click "New Query"
4. Copy/paste entire contents of: `supabase/migrations/20260309164500_two_pass_ingest.sql`
5. Click "Run" (bottom right)
6. Should see: "Success. No rows returned"

**Option B: Supabase CLI**
```bash
cd ~/.openclaw/workspace/founder-engine
supabase db push
```

**What this creates:**
- `knowledge_elements` table (structured facts)
- `ingestion_progress` table (real-time tracking)
- `domain_scores` table (aggregate knowledge per domain)

---

## Step 2: Deploy Edge Function

**Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/functions
2. Click "Deploy a new function"
3. Name: `two-pass-ingest`
4. Copy/paste: `supabase/functions/two-pass-ingest/index.ts`
5. Click "Deploy function"

**Environment variables needed:**
- `ANTHROPIC_API_KEY` (already in Supabase Vault)
- `SUPABASE_URL` (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

---

## Step 3: Add Knowledge Base Viewer to Dashboard

Need to import and render KnowledgeBaseViewer component in main dashboard.

**File to edit:** `src/screens/DashboardScreen.tsx`

Add after IngestDashboard:
```tsx
import KnowledgeBaseViewer from '../components/knowledge/KnowledgeBaseViewer'

// In render:
<KnowledgeBaseViewer />
```

---

## Step 4: Test Ingestion

### Manual Test (Simple)

**Via browser console:**
```javascript
// Get your company ID first
const { data: companies } = await supabase
  .from('companies')
  .select('id')
  .eq('user_id', '<your-user-id>')

// Trigger ingestion
const { data, error } = await supabase.functions.invoke('two-pass-ingest', {
  body: { 
    company_id: companies[0].id,
    source: 'google_drive',
    date_filter: {
      months: 24,
      use_modified: true
    }
  }
})

console.log('Result:', data)
```

### Via "Activate Agent" Button

**Easier way:**
1. Open Founder Engine dashboard
2. Scroll to "INGEST Pipeline"
3. Click "Activate Agent" on any domain (Finance, Sales, etc.)
4. Watch real-time progress:
   ```
   Processing google_drive...
   Date filter: 1,234 → 456 files (63% skipped, last 24 months)
   Scanned: 45/456 files
   Relevant: 9 (20%)
   Facts: 28
   Cost: $0.82
   ```

### Via cURL (Manual)

```bash
# Get OYNB company ID
COMPANY_ID="4e0cce04-ed81-4e60-aa32-15aae72c6bf5"

# Trigger ingestion
curl -X POST "https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/two-pass-ingest" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bGljc292bmxkb3pibm1haHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQwNjEsImV4cCI6MjA4ODIzMDA2MX0.vNIFau61Y5abqOi6m4KitFZNTym7f4Pj2X4emq4SWkM" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "'$COMPANY_ID'",
    "source": "google_drive",
    "date_filter": {
      "months": 24,
      "use_modified": true
    }
  }'
```

---

## Step 5: Verify Facts Were Extracted

### Check Database
```sql
-- Total facts extracted
SELECT domain, COUNT(*) as fact_count
FROM knowledge_elements
WHERE company_id = '4e0cce04-ed81-4e60-aa32-15aae72c6bf5'
GROUP BY domain
ORDER BY fact_count DESC;

-- Sample facts from Finance domain
SELECT 
  fact_type,
  text,
  confidence,
  source_name
FROM knowledge_elements
WHERE company_id = '4e0cce04-ed81-4e60-aa32-15aae72c6bf5'
  AND domain = 'finance'
ORDER BY confidence DESC
LIMIT 10;
```

### Via Knowledge Base Viewer
1. Go to dashboard
2. Click "Finance" tab in Knowledge Base section
3. Should see list of extracted facts:
   ```
   Revenue (3 facts)
   ├─ ARR: £180K (Q4 Board Deck, 95% confidence)
   ├─ MRR: £15K (Xero Nov 2023, 92% confidence)
   └─ Growth: 8% MoM (calculated, 85% confidence)
   ```

---

## Expected Test Results

### For OYNB (1,500 Drive files, 10 years old)

**With 24-month date filter:**
```
Phase 0 (Date filter): 1,500 → 450 files (70% skipped)
Phase 1 (Scan): 450 files listed
Phase 2 (Haiku filter): 450 → 90 relevant (20%)
Phase 3 (Opus extract): 90 files → ~135 facts

Total cost: ~$1.50
Time: ~5 minutes
Facts extracted: ~135 across all domains
```

**Breakdown by domain:**
- Finance: ~25 facts (revenue, expenses, runway)
- Sales: ~20 facts (deals, pipeline, churn)
- Marketing: ~18 facts (traffic, campaigns, CAC)
- Operations: ~15 facts (tools, processes)
- Strategy: ~30 facts (goals, market, vision)
- People: ~12 facts (headcount, hiring)
- Product: ~8 facts (features, roadmap)
- Legal: ~7 facts (contracts, compliance)

---

## Troubleshooting

### "No auth code found in URL"
→ OAuth not completing properly
→ Check redirect URLs in Supabase dashboard

### "No data sources connected"
→ Need to connect Gmail/Drive/etc first
→ Go to "Connect Tools" section

### "Failed to fetch files"
→ Composio connection might be expired
→ Try reconnecting the integration

### "Extract returned no facts"
→ Files might be empty/corrupted
→ Check logs in Supabase edge function dashboard

### Facts not showing in Knowledge Base
→ Check `knowledge_elements` table directly in Supabase SQL editor
→ Verify company_id matches

---

## Quick Test Command (Copy-Paste)

```bash
# Test with OYNB
curl -X POST "https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/two-pass-ingest" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bGljc292bmxkb3pibm1haHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQwNjEsImV4cCI6MjA4ODIzMDA2MX0.vNIFau61Y5abqOi6m4KitFZNTym7f4Pj2X4emq4SWkM" \
  -H "Content-Type: application/json" \
  -d '{"company_id": "4e0cce04-ed81-4e60-aa32-15aae72c6bf5", "source": "google_drive", "date_filter": {"months": 24}}'
```

**Should return:**
```json
{
  "status": "complete",
  "total_files_before_date": 1500,
  "total_files_after_date": 450,
  "date_filter_reduction": "70%",
  "relevant_files": 90,
  "relevance_rate": "20%",
  "facts_extracted": 135,
  "total_cost": "$1.50"
}
```

---

## Next Steps After Successful Test

1. ✅ Verify facts in Knowledge Base viewer
2. ✅ Click through domains to see what was extracted
3. ✅ Mark facts as correct/incorrect (👍/👎)
4. ✅ Add more sources (Gmail, Slack, Analytics)
5. ✅ Run ingestion for each domain

**Then:** Richard (Chocolate & Love) pilot with same system.
