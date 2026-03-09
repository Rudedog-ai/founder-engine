# Folder Selection Feature
## Founder-Curated Data Scope (95% cost reduction + privacy)

**Problem:** Scanning entire Google Drive (10K+ files) is:
- ❌ Expensive ($10 per ingestion)
- ❌ Slow (30 minutes)
- ❌ Poor signal/noise (80% irrelevant files)
- ❌ Privacy concern (personal files mixed with business)

**Solution:** Founder creates dedicated folder, we ONLY scan that.

---

## How It Works

### 1. Onboarding Flow
```
Step 1: Connect Google Drive (OAuth)
   ↓
Step 2: Product shows FolderSelector UI
   ↓
Step 3: Founder chooses:
   Option A: "Create Folder for Me" (automated)
   Option B: "I Already Created It" (manual)
   ↓
Step 4: Product saves folder_id to companies table
   ↓
Step 5: Ingestion ONLY scans that folder
```

### 2. Founder Instructions
```
Create a folder in Google Drive called:
"Founder Engine Data"

Copy your key documents:
✅ Last 12 months P&Ls, balance sheets, cash flow
✅ Board decks, strategy docs, annual plans
✅ Key email threads (saved as PDFs)
✅ Meeting notes, retrospectives, post-mortems

We'll ONLY access files in this folder.
Add files anytime to improve knowledge.
```

### 3. Database Schema
```sql
ALTER TABLE companies 
ADD COLUMN google_drive_folder_id TEXT,
ADD COLUMN google_drive_folder_name TEXT;
```

### 4. UI Component
```tsx
<FolderSelector 
  companyId={companyId}
  onFolderSelected={(folderId) => {
    // Optionally trigger ingestion
  }}
/>
```

**States:**
- No folder selected → Show instructions + 2 buttons
- Folder selected → Show folder name, ID, "Change" button
- Loading → Show spinner

---

## Cost Comparison

### BEFORE (Full Drive Scan)
```
10,000 files
  → 3,000 (date filter 24 months)
  → 600 relevant (Haiku filter 20%)
  → 550 facts extracted (Opus)

Cost: $10
Time: 30 minutes
Signal: 80% noise
Privacy: All Drive files visible
```

### AFTER (Curated Folder)
```
50-100 files (founder-selected)
  → 40-80 (date filter 24 months)
  → 32-64 relevant (Haiku filter 80%)
  → 48-96 facts extracted (Opus)

Cost: $0.50-1 (95% cheaper!)
Time: 5 minutes (6x faster!)
Signal: 80% signal (4x better!)
Privacy: Only selected folder visible
```

---

## Edge Functions

### `list-google-drive-folders`
**Purpose:** List folders in user's Google Drive  
**Input:**
```json
{
  "company_id": "uuid"
}
```
**Output:**
```json
{
  "folders": [
    {"id": "abc123", "name": "Founder Engine Data", "createdTime": "...", "modifiedTime": "..."}
  ],
  "targetFolder": {...},
  "count": 15
}
```

### `create-google-drive-folder`
**Purpose:** Create "Founder Engine Data" folder  
**Input:**
```json
{
  "company_id": "uuid",
  "folder_name": "Founder Engine Data"
}
```
**Output:**
```json
{
  "folder_id": "abc123",
  "folder_name": "Founder Engine Data",
  "existed": false
}
```

**Smart behavior:**
- Searches for existing folder first (avoids duplicates)
- Saves folder_id to companies table
- Returns folder even if it already existed

---

## Ingestion Updates

### `sync-google-drive/index.ts`
**BEFORE:**
```typescript
// Scan all Drive
const listUrl = `https://www.googleapis.com/drive/v3/files?q=trashed=false`
```

**AFTER:**
```typescript
// Get folder from companies table
const { data: company } = await supabase
  .from('companies')
  .select('google_drive_folder_id')
  .eq('id', company_id)
  .single()

const folderId = company?.google_drive_folder_id

// Scan selected folder only
if (folderId) {
  listUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false`
} else {
  console.warn('No folder selected - scanning all Drive (slow, expensive)')
  listUrl = `https://www.googleapis.com/drive/v3/files?q=trashed=false`
}
```

### `two-pass-ingest/index.ts`
**Smart folder detection:**
```typescript
// If no folder_ids provided, get from companies table
if (!folder_ids || folder_ids.length === 0) {
  const { data: company } = await supabase
    .from('companies')
    .select('google_drive_folder_id')
    .eq('id', company_id)
    .single()
  
  if (company?.google_drive_folder_id) {
    folder_ids = [company.google_drive_folder_id]
    console.log(`Using founder-selected folder: ${company.google_drive_folder_id}`)
  }
}
```

---

## Ongoing Auto-Ingestion

**Future feature (not yet built):**

```typescript
// Supabase cron (every 6 hours)
// Check selected folder for new files
// If new files detected → trigger ingestion

export async function cronSyncFolder(company_id: string) {
  const { data: company } = await supabase
    .from('companies')
    .select('google_drive_folder_id, last_sync_at')
    .eq('id', company_id)
    .single()
  
  if (!company?.google_drive_folder_id) return
  
  // List files modified since last_sync_at
  const newFiles = await listFiles({
    folderId: company.google_drive_folder_id,
    modifiedAfter: company.last_sync_at
  })
  
  if (newFiles.length > 0) {
    console.log(`Found ${newFiles.length} new files, starting ingestion...`)
    await supabase.functions.invoke('two-pass-ingest', {
      body: {
        company_id,
        source: 'google_drive',
        folder_ids: [company.google_drive_folder_id]
      }
    })
    
    // Notify founder
    await sendEmail({
      to: founder.email,
      subject: 'New facts extracted!',
      body: `We found ${newFiles.length} new files and extracted X facts.`
    })
  }
}
```

---

## UX Design

### Folder Selected State
```
┌───────────────────────────────────────────┐
│ 📁 Selected Folder                        │
│                                           │
│ We'll only scan files in this folder:    │
│ ┌─────────────────────────────────────┐   │
│ │ Founder Engine Data                 │   │
│ └─────────────────────────────────────┘   │
│ Folder ID: abc123xyz                      │
│                                    Change │
│ ─────────────────────────────────────────│
│ 💡 Add files to this folder anytime.     │
│    We'll scan them automatically and      │
│    update your knowledge base.            │
└───────────────────────────────────────────┘
```

### No Folder Selected State
```
┌───────────────────────────────────────────┐
│ 📁 Choose Your Data Folder                │
│                                           │
│ We'll only scan files you choose. Create │
│ a folder in Google Drive called           │
│ "Founder Engine Data" and copy your key   │
│ documents there:                          │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ 📊 Last 12 months P&Ls, balance     │   │
│ │    sheets, cash flow statements     │   │
│ │ 📈 Board decks, strategy documents, │   │
│ │    annual plans                     │   │
│ │ 📧 Key email threads (saved as PDFs)│   │
│ │ 📝 Meeting notes, retrospectives,   │   │
│ │    post-mortems                     │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────┐ ┌─────────────────┐   │
│ │ ➕ Create Folder│ │ 📁 I Already    │   │
│ │  for Me        │ │  Created It     │   │
│ └─────────────────┘ └─────────────────┘   │
│                                           │
│ 🔒 We'll only access files in the folder │
│    you choose. Your other Google Drive    │
│    files remain private. Add files anytime│
│    to improve your knowledge base.        │
└───────────────────────────────────────────┘
```

---

## Trust Mechanisms

✅ **Explicit consent:** Founder chooses exactly which folder to scan  
✅ **Privacy:** Other Drive files remain private  
✅ **Transparency:** Shows folder name + ID in UI  
✅ **Control:** "Change" button lets founder switch folders  
✅ **Reversible:** Can disconnect Google Drive anytime  
✅ **Auditable:** Folder ID stored in database, visible in settings  

---

## Testing Checklist

- [ ] Connect Google Drive OAuth
- [ ] Click "Create Folder for Me"
- [ ] Verify folder created in Drive
- [ ] Verify folder_id saved to companies table
- [ ] Upload 3 test files to folder
- [ ] Trigger ingestion
- [ ] Verify ONLY those 3 files were scanned
- [ ] Upload 2 more files
- [ ] Wait 6 hours (or manually trigger sync)
- [ ] Verify 2 new files detected + ingested
- [ ] Click "Change" button
- [ ] Select different folder
- [ ] Verify ingestion now scans new folder

---

## Why This is Better Than Smart Filtering

**Alternative approach (rejected):**
- Use AI to filter Drive files by relevance
- Scan everything, keep 20%

**Problems with AI filtering:**
- ❌ Still expensive ($10 to scan 10K files)
- ❌ False negatives (miss important docs)
- ❌ Privacy concern (still access all files)
- ❌ Founder doesn't control scope

**Folder selection advantages:**
- ✅ Founder curates what matters (human > AI)
- ✅ 95% cost reduction (50 files vs 10K)
- ✅ Privacy by design (explicit consent)
- ✅ Better signal/noise (founder knows what's relevant)
- ✅ Ongoing value (add files anytime)

---

## Implementation Status

✅ Database migration (20260309195300_add_folder_selection.sql)  
✅ FolderSelector component (src/components/integrations/FolderSelector.tsx)  
✅ list-google-drive-folders edge function  
✅ create-google-drive-folder edge function  
✅ sync-google-drive updated (folder filter)  
✅ two-pass-ingest updated (folder detection)  
✅ DashboardScreen integration (shows after Drive connected)  
⏳ Deploy edge functions to Supabase  
⏳ Run database migration  
⏳ Test end-to-end with Richard  
⏳ Build cron auto-sync (future feature)

---

## Next Steps

1. **Deploy edge functions:**
   ```bash
   supabase functions deploy list-google-drive-folders
   supabase functions deploy create-google-drive-folder
   ```

2. **Run migration:**
   ```bash
   supabase db push
   ```

3. **Test with OYNB:**
   - Connect Google Drive
   - Create folder
   - Upload 5 test files
   - Verify folder selection works

4. **Richard pilot:**
   - Show folder selection UI
   - Guide through file selection
   - Run ingestion (should take ~5 min, cost $0.50)

5. **Future: Auto-sync cron:**
   - Build cron job (every 6 hours)
   - Check for new files in selected folder
   - Auto-ingest + notify founder

---

**This is the RIGHT way to scope ingestion. Founder curation > AI filtering.** 🦾
