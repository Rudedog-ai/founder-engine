# Founder Engine Rebuild — Design Document

**Date:** 6 March 2026
**Status:** Approved

---

## Goal

Rebuild the Founder Engine PWA from a fragile 3500-line single HTML file into a properly structured React + Vite application with Supabase Auth, modular components, and the same ocean theme design.

## Architecture

```
React App (Vite, deployed to Vercel)
  ├── Supabase Auth (email+password, Google OAuth)
  ├── Supabase Edge Functions (existing 8 functions, minor auth changes)
  ├── ElevenLabs Widget (voice, lazy-loaded)
  └── Supabase DB (existing schema, +user_id on companies)
```

Frontend talks directly to Supabase. No backend server. Supabase JS client handles auth tokens automatically — every edge function call gets the JWT attached.

## Project Structure

```
founder-engine/
├── index.html              # Vite entry point (mounts React)
├── vite.config.ts
├── package.json
├── tsconfig.json
├── vercel.json
├── CLAUDE.md
├── .env.local              # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── public/
│   └── manifest.json
├── src/
│   ├── main.tsx            # React entry, wraps App in AuthProvider
│   ├── App.tsx             # Auth gate + screen switching
│   ├── supabase.ts         # Supabase client init (single instance)
│   ├── api.ts              # All edge function calls
│   ├── types.ts            # TypeScript types
│   ├── contexts/
│   │   └── AuthContext.tsx  # Supabase Auth provider
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── Toast.tsx
│   │   └── ProtectedRoute.tsx
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── VoiceScreen.tsx
│   │   ├── KnowledgeScreen.tsx
│   │   ├── CallsScreen.tsx
│   │   └── MoreScreen.tsx
│   └── styles/
│       └── ocean.css
└── docs/
    └── plans/
```

## Authentication

Supabase Auth with two providers:
- Email + password (default)
- Google OAuth (requires Google Cloud Console setup)

### Flow

1. User visits app → WelcomeScreen (ocean landing page)
2. Sign Up: email+password or Google → Supabase creates auth user
3. AuthContext picks up session → checks if user has a company
4. No company → onboarding form (company name, founder name, website)
5. Has company → straight to Dashboard
6. Returning user: Sign In → AuthContext restores session → Dashboard

### Implementation

- `AuthContext.tsx` wraps app, exposes: `user`, `session`, `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `loading`
- `ProtectedRoute` redirects to WelcomeScreen if no session
- `api.ts` uses `supabase.functions.invoke()` which attaches JWT automatically
- `companies` table gets `user_id` column linking to `auth.users.id`
- On login, query `companies.user_id = auth.user.id` to find their company

## API Layer

`supabase.ts` creates a single Supabase client instance.

`api.ts` exports typed functions that call edge functions via `supabase.functions.invoke()`:

- `onboardCompany(name, founderName, email, website)`
- `getCompanyProfile(companyId)`
- `scrapeBusiness(companyId, websiteUrl, companyName, founderName)`
- `processTranscript(companyId, transcript, sessionType)`
- `uploadDocument(companyId, file)`
- `inviteTeamMember(companyId, name, role, email)`
- `generateRecommendations(companyId)`

No manual header management. Supabase JS client handles auth tokens.

## Screens

### WelcomeScreen
Ocean-themed landing page. Two tabs: Sign Up / Sign In. After signup, shows onboarding form (company name, founder name, website URL). Calls `onboardCompany`, triggers `scrapeBusiness`.

### DashboardScreen
Calls `getCompanyProfile` on mount. Renders: intelligence score ring + tier, 7 topic progress bars with icons, activity feed.

### VoiceScreen
Pre-call view (what Angus knows). "Start Call" lazy-loads ElevenLabs widget. Transcript auto-save every 15s. All transcript state local to component via `useState`.

### KnowledgeScreen
Knowledge entries from `getCompanyProfile`, grouped by topic. Collapsible accordions, confidence badges.

### CallsScreen
Session history with filter tabs (All/Founder/Team). Expandable session cards with summary, topics, duration.

### MoreScreen
Sub-sections: Upload Documents (drag-drop), Team Management (invite form + list), Recommendations (generate + status), Gap Analysis (completeness per topic), Settings (inbox, link, sign out, reset).

### BottomNav
5 tabs: Dashboard, Voice, Knowledge, Calls, More. SVG icons, glow indicator on active tab.

## Edge Function Changes

### Auth verification (5 functions)
`get-company-profile`, `onboard-company`, `upload-document`, `generate-recommendations`, `invite-team-member` — verify JWT:

```ts
const authHeader = req.headers.get('Authorization')
const { data: { user } } = await supabase.auth.getUser(
  authHeader.replace('Bearer ', '')
)
if (!user) return new Response('Unauthorized', { status: 401 })
```

### Stay open (2 functions)
`process-transcript` (ElevenLabs webhook), `scrape-business` (long-running, called after onboarding) — no auth change.

### `onboard-company` update
Store `user_id` from authenticated user when creating company row.

## Database Changes

One change: add `user_id` column to `companies` table.

```sql
ALTER TABLE companies ADD COLUMN user_id uuid REFERENCES auth.users(id);
```

Everything else stays as-is.

## What Gets Deleted vs Kept

### Deleted
- `index.html` (3500-line monolith)
- `design-preview.html` (CSS already applied)

### Kept
- `CLAUDE.md` (updated with new architecture)
- `vercel.json` (updated for Vite SPA)
- `docs/` folder
- All 8 Supabase edge functions
- Full database schema

### Extracted from index.html
- Ocean CSS → `src/styles/ocean.css`
- HTML → React component JSX
- JS functions → `api.ts` + screen components

## Key Principles

- One file, one job
- If a screen crashes, others still work
- Auth handled once (AuthContext), never manually
- API calls in one place (api.ts), never scattered
- No top-level code that can crash and kill function definitions
- TypeScript for type safety
- Same lessons as BrokerAgent
