# Deployment Checklist - Folder Selection Feature
## Ready to deploy to Supabase + test with Richard

---

## ✅ What's Built (Committed to GitHub)

### Database
- [x] Migration: `20260309195300_add_folder_selection.sql`
  - Adds `google_drive_folder_id` to companies
  - Adds `google_drive_folder_name` for display
  - Creates index for lookups

### Frontend
- [x] Component: `FolderSelector.tsx` (9.9 KB)
  - Two states: no folder / folder selected
  - Create folder button + "I Already Created It" button
  - Ocean-themed UI
  - Privacy messaging

- [x] Integration: `DashboardScreen.tsx`
  - Shows FolderSelector after Google Drive connected
  - Conditional rendering
  - Toast notifications

### Backend
- [x] Edge Function: `list-google-drive-folders/index.ts` (3.2 KB)
  - Lists folders via Composio API
  - Filters by mimeType='folder'
  - Returns sorted folders

- [x] Edge Function: `create-google-drive-folder/index.ts` (4.8 KB)
  - Creates "Founder Engine Data" folder
  - Checks for existing folder first
  - Saves folder_id to companies table

- [x] Update: `sync-google-drive/index.ts`
  - Reads `google_drive_folder_id` from companies
  - Filters API query to selected folder
  - Fallback to full scan with warning

- [x] Update: `two-pass-ingest/index.ts`
  - Auto-detects folder from companies table
  - Uses folder_ids if provided
  - Logs folder selection

### Documentation
- [x] Guide: `docs/FOLDER-SELECTION.md` (10.1 KB)
  - Complete how-it-works guide
  - Cost comparison
  - Trust mechanisms
  - Testing checklist

---

## 🚀 Deployment Steps

### 1. Deploy Edge Functions
```bash
cd ~/.openclaw/workspace/founder-engine

# Deploy new functions
supabase functions deploy list-google-drive-folders
supabase functions deploy create-google-drive-folder

# Verify deployment
supabase functions list
```

**Expected output:**
```
NAME                          STATUS    CREATED_AT
list-google-drive-folders     deployed  2026-03-09T19:XX:XX
create-google-drive-folder    deployed  2026-03-09T19:XX:XX
sync-google-drive             deployed  [earlier date]
two-pass-ingest               deployed  [earlier date]
```

### 2. Run Database Migration
```bash
supabase db push

# Or apply specific migration
supabase migration up
```

**Verify:**
```sql
SELECT 
  google_drive_folder_id,
  google_drive_folder_name
FROM companies
LIMIT 5;
```

Should show new columns (values will be NULL initially).

### 3. Set Environment Variables
Edge functions need `COMPOSIO_API_KEY`:

```bash
# Check if already set
supabase secrets list

# If not set, add it
supabase secrets set COMPOSIO_API_KEY="your_key_here"
```

### 4. Deploy Frontend (Vercel)
Frontend changes are in `src/` - Vercel auto-deploys on git push.

**Verify at:** https://founder-engine-seven.vercel.app

Expected: FolderSelector appears after connecting Google Drive.

---

## 🧪 Testing Checklist

### Phase 1: OYNB Test (Internal)
- [ ] **Connect Google Drive**
  - Login as OYNB test account
  - Navigate to Connect Tools
  - Click "Connect" on Google Drive
  - Complete OAuth flow
  - Verify status shows "Connected"

- [ ] **FolderSelector appears**
  - Scroll to "Select Your Data Folder" section
  - Should show two buttons: "Create Folder for Me" / "I Already Created It"

- [ ] **Create folder (automated)**
  - Click "Create Folder for Me"
  - Wait for loading spinner
  - Should show success toast: "Folder created successfully!"
  - FolderSelector should update to show folder name + ID

- [ ] **Verify in Google Drive**
  - Open Google Drive in browser
  - Should see new folder: "Founder Engine Data"
  - Folder should be empty

- [ ] **Upload test files**
  - Copy 5 test documents to folder:
    - Q4_2023_Financials.pdf
    - Board_Deck_Jan_2024.pptx
    - Team_Meeting_Notes.docx
    - Marketing_Strategy.pdf
    - Random_Vacation_Photo.jpg (noise test)

- [ ] **Trigger ingestion**
  - Option A: Click "Start Ingestion" button (if exists)
  - Option B: Call edge function manually:
    ```bash
    curl -X POST https://[PROJECT].supabase.co/functions/v1/two-pass-ingest \
      -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
      -H "Content-Type: application/json" \
      -d '{"company_id":"[OYNB_ID]","source":"google_drive"}'
    ```

- [ ] **Verify folder filtering**
  - Check Supabase logs (Edge Functions → two-pass-ingest → Logs)
  - Should see: "Using founder-selected folder: [folder_id]"
  - Should NOT see: "scanning all Drive (slow, expensive)"

- [ ] **Verify facts extracted**
  - Check `knowledge_elements` table:
    ```sql
    SELECT domain, fact_type, text, confidence
    FROM knowledge_elements
    WHERE company_id = '[OYNB_ID]'
    ORDER BY created_at DESC
    LIMIT 10;
    ```
  - Should see 10-20 facts from the 5 files
  - Random vacation photo should be filtered out (not relevant)

- [ ] **Verify cost**
  - Check ingestion_progress table:
    ```sql
    SELECT estimated_cost, total_files, relevant_files, facts_extracted
    FROM ingestion_progress
    WHERE company_id = '[OYNB_ID]'
    ORDER BY started_at DESC
    LIMIT 1;
    ```
  - Should show: total_files=5, relevant_files=4, estimated_cost<$1

### Phase 2: Richard Pilot (Real Founder)
- [ ] **Onboarding email**
  - Send Richard email with instructions:
    ```
    Hi Richard,

    Ready to get started with Founder Engine!

    Step 1: Connect your Google Drive
    https://founder-engine-seven.vercel.app/dashboard

    Step 2: Create a folder called "Founder Engine Data"
    We'll walk you through it in the app.

    Step 3: Copy your key business documents:
    - Last 12 months P&Ls
    - Board decks / strategy docs
    - Key email threads (save as PDFs)

    This will take about 10 minutes. Once your files are uploaded,
    we'll scan them (takes ~5 minutes) and show you what we learned.

    Let me know if you hit any snags!

    Ruari
    ```

- [ ] **Watch Richard onboard**
  - Screen share or watch live
  - Note any confusion points
  - Record time taken (should be <15 min)

- [ ] **Review extracted facts**
  - Login to Supabase dashboard
  - Check Richard's knowledge_elements
  - Verify facts are accurate
  - Flag any hallucinations

- [ ] **Show Richard the Knowledge Base**
  - Navigate to Knowledge Base viewer
  - Show Finance facts (if he uploaded P&Ls)
  - Ask: "Is this useful? Is anything wrong?"
  - Record feedback

- [ ] **Measure success criteria**
  - Time to complete: [X] minutes (target: <15 min)
  - Files uploaded: [X] (target: 20-50)
  - Facts extracted: [X] (target: 50-100)
  - Cost: $[X] (target: <$1)
  - Richard reaction: [excited / cautiously optimistic / skeptical / confused]

---

## 🐛 Known Issues / Edge Cases

### Issue 1: Composio API Key Not Set
**Symptom:** Edge functions fail with "COMPOSIO_API_KEY not configured"  
**Fix:**
```bash
supabase secrets set COMPOSIO_API_KEY="your_key_here"
supabase functions deploy list-google-drive-folders --no-verify-jwt
supabase functions deploy create-google-drive-folder --no-verify-jwt
```

### Issue 2: Folder Already Exists
**Symptom:** Click "Create Folder" but folder already exists  
**Fix:** `create-google-drive-folder` function checks for existing folder and returns it (no error)

### Issue 3: Google Drive Not Connected
**Symptom:** FolderSelector doesn't appear  
**Root cause:** `googleDriveConnected` state is false  
**Debug:**
```sql
SELECT toolkit, status FROM integrations 
WHERE company_id = '[COMPANY_ID]' AND toolkit = 'google_drive';
```
**Fix:** Ensure OAuth flow completed and status = 'connected'

### Issue 4: Folder ID Not Saved
**Symptom:** Ingestion still scans all Drive  
**Debug:**
```sql
SELECT google_drive_folder_id FROM companies WHERE id = '[COMPANY_ID]';
```
**Fix:** Edge function should save folder_id. Check function logs.

### Issue 5: Folder Empty (No Files)
**Symptom:** Ingestion runs but extracts 0 facts  
**Expected:** Normal if founder hasn't uploaded files yet  
**Fix:** Show helpful message: "Upload files to your folder to start building knowledge"

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Migration applied without errors
- ✅ Edge functions deployed and responding
- ✅ Folder creation works (verified in Google Drive)
- ✅ Folder ID saved to companies table
- ✅ Ingestion filters to selected folder only
- ✅ Cost: <$1 for 50 files (vs $10 for full scan)
- ✅ Time: <5 minutes (vs 30 minutes)

### User Metrics (Richard Pilot)
- ✅ Richard completes onboarding in <15 minutes
- ✅ Richard uploads 20-50 files
- ✅ Richard says folder selection is "clear" / "easy"
- ✅ Richard trusts privacy (only selected folder scanned)
- ✅ Richard sees value in extracted facts
- ✅ Richard asks "Can I add more files later?" (ongoing value)

### Business Metrics
- ✅ 95% cost reduction (from $10 to $0.50)
- ✅ 6x faster ingestion (from 30 min to 5 min)
- ✅ 4x better signal/noise (from 20% to 80%)
- ✅ Privacy by design (explicit consent)
- ✅ Ongoing value (add files anytime)

---

## 🚨 Rollback Plan

If something breaks:

### 1. Revert Frontend (Vercel)
```bash
# Revert to previous commit
git revert 7fe5972
git push origin main

# Or rollback in Vercel dashboard
# Deployments → Select previous deployment → "Promote to Production"
```

### 2. Revert Database Migration
```sql
-- Remove columns
ALTER TABLE companies 
DROP COLUMN IF EXISTS google_drive_folder_id,
DROP COLUMN IF EXISTS google_drive_folder_name;
```

### 3. Revert Edge Functions
```bash
# Redeploy previous versions
git checkout HEAD~1 supabase/functions/sync-google-drive
git checkout HEAD~1 supabase/functions/two-pass-ingest
supabase functions deploy sync-google-drive
supabase functions deploy two-pass-ingest

# Delete new functions (optional)
# Note: Supabase doesn't have direct CLI delete, use dashboard
```

### 4. Notify Users
If Richard already connected:
```
Hi Richard,

We hit a technical issue and had to roll back the folder selection feature.
Your Google Drive connection is still working, but we're back to scanning
your full Drive temporarily.

We'll have the fix deployed within 24 hours and let you know.

Apologies for the inconvenience!

Ruari
```

---

## 📝 Post-Deployment Notes

**After successful deployment, update:**

1. **PM-PRODUCT-AUDIT.md**
   - Change: ❌ P1 blocker: "No folder selection"
   - To: ✅ FIXED: Folder selection deployed (95% cost reduction)

2. **BUILD-PLAN.md**
   - Move folder selection from "TODO" to "DONE"
   - Update cost estimates ($0.50 vs $10)

3. **MEMORY.md**
   - Record deployment date
   - Record Richard pilot results
   - Record cost savings achieved

4. **README.md** (if exists)
   - Add "Folder Selection" to features list
   - Update cost claims ("95% cost reduction")

---

## 🎉 Celebration Criteria

**We can celebrate when:**
- ✅ Edge functions deployed without errors
- ✅ Migration applied successfully
- ✅ OYNB internal test passes (5 files → facts extracted)
- ✅ Richard completes pilot (<15 min onboarding)
- ✅ Richard uploads files and sees facts
- ✅ Richard says "This is useful"
- ✅ Cost confirmed <$1 (vs $10 before)

**Then:**
- Update PM-PRODUCT-AUDIT.md (P1 blocker → FIXED)
- Tweet about 95% cost reduction (if Ruari approves)
- Document Richard feedback in MEMORY.md
- Plan next pilot (Founder #2)

---

**Status:** Code complete, ready to deploy. Estimated deployment time: 30 minutes. 🚀
