# Fix Auth, Session Persistence & JS Errors — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Founder Engine PWA work properly — session persistence across refreshes, returning user login, fix all silent errors and dead code.

**Architecture:** Single-file PWA (index.html). All changes are in-file edits. localStorage stores company_id + email for session persistence. New "Welcome back" login-by-email flow added alongside existing onboarding. Edge function calls fixed for missing headers and non-existent endpoints.

**Tech Stack:** Vanilla JS, Supabase edge functions (called via fetch), localStorage

---

### Task 1: Session Persistence — Save company_id to localStorage

**Files:**
- Modify: `index.html:1451` (inline onboarding handler — after company_id is set)
- Modify: `index.html:2159` (main script onboardCompany — after company_id is set)
- Modify: `index.html:2101-2112` (resetApp — clear localStorage)

**Step 1: In the inline onboarding handler (line 1451), after setting appState.company_id, save to localStorage**

Find this block at line 1451:
```js
if (window.appState) { window.appState.company_id = company_id; window.appState.company_data = result; }
```

Replace with:
```js
if (window.appState) { window.appState.company_id = company_id; window.appState.company_data = result; }
// Persist session
try {
    localStorage.setItem('fe_company_id', company_id);
    var femail = document.getElementById('onboard-founder-email').value.trim();
    if (femail) localStorage.setItem('fe_email', femail);
    var cname = document.getElementById('onboard-company-name').value.trim();
    if (cname) localStorage.setItem('fe_company_name', cname);
} catch(e) { console.warn('localStorage save failed:', e); }
```

**Step 2: In the main script onboardCompany (line 2159), add same persistence**

After `appState.company_id = result.company?.id || result.company_id;` add:
```js
try {
    localStorage.setItem('fe_company_id', appState.company_id);
} catch(e) {}
```

**Step 3: In resetApp (line 2101), clear localStorage**

After setting appState back to null values, add:
```js
localStorage.removeItem('fe_company_id');
localStorage.removeItem('fe_email');
localStorage.removeItem('fe_company_name');
```

**Step 4: Commit**
```bash
git add index.html && git commit -m "feat: persist company_id to localStorage for session survival"
```

---

### Task 2: Restore Session on Page Load

**Files:**
- Modify: `index.html:3354-3383` (init function)

**Step 1: At the top of init(), check localStorage and restore session**

Replace the init function (lines 3354-3383) with:
```js
async function init() {
    window.companyKnowledge = '';
    window.smartQuestions = [];

    // Restore session from localStorage
    const savedCompanyId = localStorage.getItem('fe_company_id');
    if (savedCompanyId) {
        appState.company_id = savedCompanyId;
        // Switch to dashboard immediately
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-dashboard').classList.add('active');
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems[0]) navItems[0].classList.add('active');
        // Load dashboard data
        await loadDashboard();
    }
    // else: stay on welcome screen (default)

    // Set up nav click handlers
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Sync any pending transcripts
    syncPendingTranscripts().catch(e => console.warn('Sync failed:', e));

    // Set up voice session screen listener
    document.addEventListener('screenChange', (e) => {
        if (e.detail && e.detail.screen === 'voice') {
            initializeTranscriptSaving();
        } else if (transcriptState.isActive) {
            saveTranscriptProgress(true);
            endTranscriptSession();
        }
    });
}
```

**Step 2: Commit**
```bash
git add index.html && git commit -m "feat: restore session from localStorage on page load"
```

---

### Task 3: Add Returning User Login Flow

**Files:**
- Modify: `index.html` — add login UI to the welcome screen (after the onboarding form card, around line 1576)
- Modify: `index.html` — add `loginByEmail()` function to the inline script block (around line 1407)

**Step 1: Add login-by-email function to the inline script block**

After the closing `};` of `window.handleOnboardSubmit` (line 1488), add:
```js
window.loginByEmail = async function() {
    var FBASE = 'https://qzlicsovnldozbnmahsa.supabase.co/functions/v1';
    var AKEY = '...same key as line 1409...';
    var emailInput = document.getElementById('login-email');
    var errorDiv = document.getElementById('login-error');
    var btn = document.getElementById('login-submit');
    errorDiv.style.display = 'none';

    var email = emailInput.value.trim();
    if (!email || email.indexOf('@') === -1) {
        errorDiv.textContent = 'Please enter a valid email address';
        errorDiv.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Looking up...';

    try {
        var resp = await fetch(FBASE + '/get-company-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': AKEY, 'Authorization': 'Bearer ' + AKEY },
            body: JSON.stringify({ founder_email: email })
        });

        if (!resp.ok) throw new Error('Could not find an account with that email');
        var result = await resp.json();
        var company = result.company;
        if (!company || !company.id) throw new Error('No company found for that email');

        // Restore session
        if (window.appState) {
            window.appState.company_id = company.id;
            window.appState.company_data = result;
        }
        localStorage.setItem('fe_company_id', company.id);
        localStorage.setItem('fe_email', email);
        localStorage.setItem('fe_company_name', company.name || '');

        // Switch to dashboard
        if (window.switchScreen) window.switchScreen('dashboard');
    } catch(err) {
        errorDiv.textContent = err.message || 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
};
```

**IMPORTANT:** This requires the `get-company-profile` edge function to support lookup by `founder_email` (not just `company_id`). If it doesn't, we need to update the edge function. Check by testing the endpoint.

**Step 2: Add login UI HTML after the onboarding form card (around line 1576)**

Before the closing `</div>` of `ocean-welcome-content`, add:
```html
<div class="ocean-form-card" style="max-width: 500px; margin: 20px auto 0;">
    <h3 style="margin-bottom: var(--gap); text-align: center; color: var(--text-dim); font-weight: 400;">Already have an account?</h3>
    <div style="display: flex; gap: 8px;">
        <input type="email" id="login-email" placeholder="Your email address" style="flex: 1;">
        <button type="button" class="btn btn-secondary" id="login-submit" onclick="loginByEmail()" style="white-space: nowrap;">Sign In</button>
    </div>
    <div id="login-error" style="display: none; background: rgba(255,107,107,0.1); border: 1px solid var(--red); border-radius: var(--radius); padding: 0.75rem; margin-top: var(--gap-2); color: var(--red); font-size: 0.9rem;"></div>
</div>
```

**Step 3: Commit**
```bash
git add index.html && git commit -m "feat: add returning user login by email"
```

---

### Task 4: Update get-company-profile Edge Function for Email Lookup

**Files:**
- Supabase edge function: `get-company-profile` (deployed via Supabase dashboard or MCP)

**Step 1: Test if email lookup already works**

```bash
curl -s "https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/get-company-profile" \
  -H "apikey: INDEX_KEY" -H "Authorization: Bearer INDEX_KEY" \
  -H "Content-Type: application/json" \
  -d '{"founder_email":"rfairbairns@gmail.com"}' --ssl-no-revoke
```

If it returns a company, no changes needed. If not, update the edge function to accept `founder_email` as an alternative lookup parameter.

**Step 2: If needed, update the edge function to support email lookup**

Add this logic near the start of the function:
```ts
let company_id = body.company_id;
if (!company_id && body.founder_email) {
    const { data } = await supabase.from('companies').select('id').eq('founder_email', body.founder_email).limit(1).single();
    if (data) company_id = data.id;
    else return new Response(JSON.stringify({ error: 'No company found' }), { status: 404 });
}
```

**Step 3: Deploy and test**

---

### Task 5: Fix CLAUDE.md Anon Key

**Files:**
- Modify: `CLAUDE.md:49`

**Step 1: Update the anon key in CLAUDE.md to match the working key in index.html**

The working key (returns 200) is:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bGljc292bmxkb3pibm1haHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQwNjEsImV4cCI6MjA4ODIzMDA2MX0.vNIFau61Y5abqOi6m4KitFZNTym7f4Pj2X4emq4SWkM
```

**Step 2: Commit**
```bash
git add CLAUDE.md && git commit -m "fix: update anon key in CLAUDE.md to match working key"
```

---

### Task 6: Fix save-transcript — Route to process-transcript

**Files:**
- Modify: `index.html:2996` (saveTranscriptProgress function)
- Modify: `index.html:3104` (syncPendingTranscripts function)

**Step 1: In saveTranscriptProgress, change the URL and add apikey header**

Find the fetch call at ~line 2996:
```js
const response = await fetch(`${FUNCTIONS_BASE}/save-transcript`, {
```
Change to:
```js
const response = await fetch(`${FUNCTIONS_BASE}/process-transcript`, {
```

And fix the headers to include `apikey`:
```js
headers: {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`
},
```

**Step 2: Same fix in syncPendingTranscripts (~line 3104)**

Change `save-transcript` to `process-transcript` and add `apikey` header.

**Step 3: Commit**
```bash
git add index.html && git commit -m "fix: route transcript saves to process-transcript and add apikey header"
```

---

### Task 7: Dispatch screenChange Event in switchScreen

**Files:**
- Modify: `index.html:2021` (switchScreen function)

**Step 1: At the end of switchScreen, dispatch the event**

Add before the closing `}` of switchScreen:
```js
// Dispatch screenChange event for listeners
document.dispatchEvent(new CustomEvent('screenChange', { detail: { screen: screenName } }));
```

**Step 2: Commit**
```bash
git add index.html && git commit -m "fix: dispatch screenChange event so voice transcript listeners initialize"
```

---

### Task 8: Fix Silent Failures — Show Errors to User

**Files:**
- Modify: `index.html:2200-2213` (getCompanyProfile)
- Modify: `index.html:3372` (syncPendingTranscripts call)

**Step 1: In getCompanyProfile, show error instead of returning null silently**

Replace the catch block:
```js
} catch (err) {
    console.error('Failed to load company profile:', err);
    showToast('Failed to load your data. Please check your connection.', 'error');
    return null;
}
```

**Step 2: Add .catch to syncPendingTranscripts** (already done in Task 2)

**Step 3: Commit**
```bash
git add index.html && git commit -m "fix: show visible errors instead of silent failures"
```

---

### Task 9: Final — Push and Test

**Step 1: Push all commits**
```bash
git push origin main
```

**Step 2: Wait for Vercel deploy (~1 min)**

**Step 3: Test returning user flow**
- Open https://founder-engine-seven.vercel.app in incognito
- Fill out onboarding form (or sign in with existing email)
- Verify dashboard loads
- Refresh the page — should still see dashboard (session persisted)
- Click "Reset & Start Over" in settings — should return to welcome screen
