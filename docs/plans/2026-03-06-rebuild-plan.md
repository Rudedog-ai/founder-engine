# Founder Engine Rebuild — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Founder Engine PWA from a single 3500-line HTML monolith into a React + Vite + Supabase Auth application with modular components and the same ocean theme.

**Architecture:** React + Vite frontend deployed to Vercel. Supabase Auth for user management (email+password, Google OAuth). Supabase JS client for all API calls — auto-attaches JWT, no manual header management. All existing edge functions kept with minor auth verification additions.

**Tech Stack:** React 18, TypeScript, Vite, Supabase JS v2, ElevenLabs Conversational AI widget

---

### Task 1: Scaffold React + Vite Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `.env.local`
- Create: `public/manifest.json`
- Modify: `vercel.json`
- Delete: `index.html` (the old monolith)
- Create: `index.html` (tiny Vite entry point)

**Step 1: Delete old monolith and create package.json**

Back up the old index.html first (we'll extract CSS from it):
```bash
cp index.html old-index.html
rm index.html
```

Create `package.json`:
```json
{
  "name": "founder-engine",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

**Step 2: Create Vite config**

Create `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**Step 3: Create tsconfig files**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 4: Create Vite entry point index.html**

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#020b18" />
    <meta name="description" content="Founder Engine - AI-powered company intelligence platform" />
    <title>Founder Engine</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230a2240' width='192' height='192' rx='44'/><text x='50%25' y='50%25' font-size='100' fill='%2300f0ff' text-anchor='middle' dy='.3em' font-weight='bold'>F</text></svg>" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**Step 5: Create env file and React entry**

Create `.env.local`:
```
VITE_SUPABASE_URL=https://qzlicsovnldozbnmahsa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bGljc292bmxkb3pibm1haHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQwNjEsImV4cCI6MjA4ODIzMDA2MX0.vNIFau61Y5abqOi6m4KitFZNTym7f4Pj2X4emq4SWkM
```

Create `src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

Create `src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/ocean.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

Create `src/App.tsx` (placeholder):
```tsx
export default function App() {
  return <div>Founder Engine loading...</div>
}
```

**Step 6: Create PWA manifest**

Create `public/manifest.json`:
```json
{
  "name": "Founder Engine",
  "short_name": "Founder",
  "description": "AI-powered company intelligence platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#020b18",
  "theme_color": "#00f0ff"
}
```

**Step 7: Update vercel.json**

```json
{
  "version": 2,
  "name": "founder-engine",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Step 8: Add .gitignore entries**

Append to `.gitignore` (create if needed):
```
node_modules
dist
.env.local
```

**Step 9: Install dependencies and verify**

```bash
npm install
npm run dev
```

Expected: Vite dev server starts, shows "Founder Engine loading..." at localhost:5173

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold React + Vite project, remove monolith"
```

---

### Task 2: Extract Ocean Theme CSS

**Files:**
- Create: `src/styles/ocean.css`
- Reference: `old-index.html` (lines 18-1383)

**Step 1: Extract all CSS from old-index.html into ocean.css**

Copy lines 19-1383 from `old-index.html` (everything between `<style>` and `</style>`) into `src/styles/ocean.css`. This includes:

- CSS reset and root variables (ocean palette)
- Typography (h1-h3, p)
- Layout (.container, .content, .screen)
- Cards (.card, .card.interactive)
- Buttons (.btn, .btn-primary, .btn-secondary, etc.)
- Forms (input, textarea, select, .form-group)
- Bottom nav (.bottom-nav, .nav-item)
- Dashboard styles (.score-card, .topic-grid, .topic-card, etc.)
- Activity feed (.activity-feed, .activity-item)
- Spinners, toasts, modals, badges
- Drag & drop (.drop-zone)
- Knowledge screen styles
- Call history styles (.filter-tabs, .session-card)
- Ocean welcome screen (.ocean-welcome, .ocean-bg, .wave, .particles, .light-rays)
- Animations (fadeIn, spin, pulse-glow, wave-drift, float-up, ray-shimmer, slideIn, slideUp, pulse-mic)
- Responsive media queries

Remove `.screen { display: none; }` and `.screen.active { display: block; }` — React handles visibility.

Add at the top of ocean.css:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

**Step 2: Verify CSS loads**

```bash
npm run dev
```

Page should have dark ocean background and Inter font.

**Step 3: Commit**

```bash
git add src/styles/ocean.css
git commit -m "feat: extract ocean theme CSS from monolith"
```

---

### Task 3: Supabase Client + TypeScript Types

**Files:**
- Create: `src/supabase.ts`
- Create: `src/types.ts`

**Step 1: Create Supabase client**

Create `src/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 2: Create types**

Create `src/types.ts`:
```ts
export interface Company {
  id: string
  name: string
  founder_name: string
  founder_email: string
  industry?: string
  website?: string
  email_inbox_address?: string
  onboarding_link?: string
  intelligence_score: number
  intelligence_tier: string
  onboarding_status: string
  user_id?: string
  created_at: string
}

export interface KnowledgeEntry {
  id: string
  company_id: string
  topic: string
  key: string
  value: string
  confidence: string
  source_session_id?: string
}

export interface Session {
  id: string
  company_id: string
  session_number: number
  session_type: string
  participant_name: string
  participant_role: string
  raw_transcript?: string
  summary?: string
  extracted_data?: Record<string, unknown>
  duration_seconds?: number
  data_points_captured: number
  topics_covered: string[]
  created_at: string
}

export interface GapAnalysis {
  id: string
  company_id: string
  topic: string
  completeness_score: number
  total_data_points: number
  captured_data_points: number
  missing_items: string[]
  suggested_assignee_name?: string
}

export interface TeamMember {
  id: string
  company_id: string
  name: string
  email?: string
  role: string
  session_completed: boolean
  invite_status: string
}

export interface Recommendation {
  id: string
  company_id: string
  constraint_type: string
  priority: number
  title: string
  description: string
  reasoning?: string
  status: string
}

export interface CompanyProfile {
  company: Company
  knowledge: Record<string, KnowledgeEntry[]>
  knowledge_raw: KnowledgeEntry[]
  gaps: GapAnalysis[]
  sessions: Session[]
  team: TeamMember[]
  recommendations: Recommendation[]
  documents: unknown[]
  recent_activity: Array<{
    action: string
    created_at: string
  }>
}
```

**Step 3: Commit**

```bash
git add src/supabase.ts src/types.ts
git commit -m "feat: add Supabase client and TypeScript types"
```

---

### Task 4: API Layer

**Files:**
- Create: `src/api.ts`

**Step 1: Create API module**

Create `src/api.ts`:
```ts
import { supabase } from './supabase'
import type { CompanyProfile } from './types'

async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  })

  if (error) {
    throw new Error(error.message || `${functionName} failed`)
  }

  return data as T
}

export async function onboardCompany(
  name: string,
  founder_name: string,
  founder_email: string,
  website?: string,
  industry?: string
) {
  return callEdgeFunction<{ company: { id: string }; company_id: string }>(
    'onboard-company',
    { name, founder_name, founder_email, website, industry }
  )
}

export async function getCompanyProfile(
  company_id: string
): Promise<CompanyProfile> {
  return callEdgeFunction<CompanyProfile>('get-company-profile', { company_id })
}

export async function getCompanyByEmail(
  founder_email: string
): Promise<CompanyProfile> {
  return callEdgeFunction<CompanyProfile>('get-company-profile', {
    founder_email,
  })
}

export async function scrapeBusiness(
  company_id: string,
  website_url: string,
  company_name: string,
  founder_name: string
) {
  return callEdgeFunction('scrape-business', {
    company_id,
    website_url,
    company_name,
    founder_name,
  })
}

export async function processTranscript(
  company_id: string,
  transcript: string,
  session_type?: string
) {
  return callEdgeFunction('process-transcript', {
    company_id,
    transcript,
    session_type,
    speaker_role: 'founder',
  })
}

export async function uploadDocument(company_id: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('company_id', company_id)
  formData.append('uploaded_by', 'founder')

  // For file uploads, use fetch directly since supabase.functions.invoke
  // doesn't handle FormData well
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`,
    {
      method: 'POST',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('Failed to upload document')
  }

  return response.json()
}

export async function inviteTeamMember(
  company_id: string,
  name: string,
  role: string,
  email?: string
) {
  return callEdgeFunction('invite-team-member', {
    company_id,
    name,
    role,
    email,
  })
}

export async function generateRecommendations(company_id: string) {
  return callEdgeFunction('generate-recommendations', { company_id })
}

export async function updateRecommendationStatus(
  company_id: string,
  id: string,
  status: string
) {
  return callEdgeFunction('generate-recommendations', {
    company_id,
    update_status: { id, status },
  })
}
```

**Step 2: Commit**

```bash
git add src/api.ts
git commit -m "feat: add API layer for all edge function calls"
```

---

### Task 5: Auth Context

**Files:**
- Create: `src/contexts/AuthContext.tsx`

**Step 1: Create AuthContext**

Create `src/contexts/AuthContext.tsx`:
```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  companyId: string | null
  setCompanyId: (id: string | null) => void
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyIdState] = useState<string | null>(
    localStorage.getItem('fe_company_id')
  )

  function setCompanyId(id: string | null) {
    setCompanyIdState(id)
    if (id) {
      localStorage.setItem('fe_company_id', id)
    } else {
      localStorage.removeItem('fe_company_id')
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error ? new Error(error.message) : null }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setCompanyId(null)
    localStorage.removeItem('fe_email')
    localStorage.removeItem('fe_company_name')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        companyId,
        setCompanyId,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Step 2: Wire AuthProvider into main.tsx**

Update `src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './styles/ocean.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

**Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx src/main.tsx
git commit -m "feat: add Supabase Auth context with email, password, and Google OAuth"
```

---

### Task 6: Toast Component

**Files:**
- Create: `src/components/Toast.tsx`

**Step 1: Create Toast component and context**

Create `src/components/Toast.tsx`:
```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.type === 'success' ? '\u2713' : '\u2715'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
```

**Step 2: Wire ToastProvider into main.tsx**

Update `src/main.tsx` to wrap App with ToastProvider (inside AuthProvider).

**Step 3: Commit**

```bash
git add src/components/Toast.tsx src/main.tsx
git commit -m "feat: add Toast notification component"
```

---

### Task 7: Bottom Nav Component

**Files:**
- Create: `src/components/BottomNav.tsx`

**Step 1: Create BottomNav**

Create `src/components/BottomNav.tsx`:
```tsx
interface BottomNavProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: 'calls',
    label: 'Calls',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: 'more',
    label: 'More',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
  },
]

export default function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: add BottomNav component with SVG icons"
```

---

### Task 8: App Shell — Auth Gate + Screen Routing

**Files:**
- Modify: `src/App.tsx`

**Step 1: Build the App shell**

Update `src/App.tsx`:
```tsx
import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import BottomNav from './components/BottomNav'
import WelcomeScreen from './screens/WelcomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import VoiceScreen from './screens/VoiceScreen'
import KnowledgeScreen from './screens/KnowledgeScreen'
import CallsScreen from './screens/CallsScreen'
import MoreScreen from './screens/MoreScreen'

export default function App() {
  const { user, loading, companyId } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')

  if (loading) {
    return (
      <div className="container">
        <div className="content">
          <div className="loading" style={{ minHeight: '100vh' }}>
            <div className="spinner" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in or no company — show welcome/auth screen
  if (!user || !companyId) {
    return <WelcomeScreen />
  }

  // Logged in with company — show app
  const screens: Record<string, JSX.Element> = {
    dashboard: <DashboardScreen />,
    voice: <VoiceScreen />,
    knowledge: <KnowledgeScreen />,
    calls: <CallsScreen />,
    more: <MoreScreen />,
  }

  return (
    <div className="container">
      <div className="content">
        {screens[activeScreen] || <DashboardScreen />}
      </div>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  )
}
```

**Step 2: Create placeholder screens**

Create each screen as a simple placeholder so the app compiles:

`src/screens/WelcomeScreen.tsx`:
```tsx
export default function WelcomeScreen() {
  return <div className="screen-content"><h1>Welcome</h1></div>
}
```

`src/screens/DashboardScreen.tsx`:
```tsx
export default function DashboardScreen() {
  return <div className="screen-content"><h1>Dashboard</h1></div>
}
```

`src/screens/VoiceScreen.tsx`:
```tsx
export default function VoiceScreen() {
  return <div className="screen-content"><h1>Voice</h1></div>
}
```

`src/screens/KnowledgeScreen.tsx`:
```tsx
export default function KnowledgeScreen() {
  return <div className="screen-content"><h1>Knowledge</h1></div>
}
```

`src/screens/CallsScreen.tsx`:
```tsx
export default function CallsScreen() {
  return <div className="screen-content"><h1>Calls</h1></div>
}
```

`src/screens/MoreScreen.tsx`:
```tsx
export default function MoreScreen() {
  return <div className="screen-content"><h1>More</h1></div>
}
```

**Step 3: Verify everything compiles and runs**

```bash
npm run dev
```

Expected: App shows WelcomeScreen (since no user is logged in). No console errors.

**Step 4: Commit**

```bash
git add src/App.tsx src/screens/
git commit -m "feat: add app shell with auth gate and screen routing"
```

---

### Task 9: WelcomeScreen — Auth + Onboarding

**Files:**
- Modify: `src/screens/WelcomeScreen.tsx`

**Step 1: Build the full WelcomeScreen**

This is the biggest single screen. It contains:
- Ocean background with waves, particles, light rays (same CSS classes as before)
- Sign Up / Sign In tabs
- Email + password forms
- Google OAuth button
- Onboarding form (company name, founder name, website — shown after signup)

Create the full `src/screens/WelcomeScreen.tsx`:
```tsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { onboardCompany, scrapeBusiness, getCompanyByEmail } from '../api'

type Mode = 'signup' | 'signin'
type Step = 'auth' | 'onboarding' | 'scraping' | 'done'

export default function WelcomeScreen() {
  const { signUp, signIn, signInWithGoogle, setCompanyId, user } = useAuth()
  const { showToast } = useToast()
  const [mode, setMode] = useState<Mode>('signup')
  const [step, setStep] = useState<Step>(user ? 'onboarding' : 'auth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Onboarding fields
  const [companyName, setCompanyName] = useState('')
  const [founderName, setFounderName] = useState('')
  const [website, setWebsite] = useState('')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setStep('onboarding')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error

        // Try to find existing company for this email
        try {
          const profile = await getCompanyByEmail(email)
          if (profile?.company?.id) {
            setCompanyId(profile.company.id)
            localStorage.setItem('fe_email', email)
            localStorage.setItem('fe_company_name', profile.company.name || '')
            return // App.tsx will re-render to dashboard
          }
        } catch {
          // No company found — show onboarding
        }
        setStep('onboarding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
    // OAuth redirects — no further handling needed here
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!companyName.trim() || !founderName.trim()) {
      setError('Company name and your name are required')
      return
    }

    setLoading(true)
    setStep('scraping')

    try {
      const result = await onboardCompany(
        companyName.trim(),
        founderName.trim(),
        email,
        website.trim() || undefined
      )

      const companyId = result.company?.id || result.company_id
      setCompanyId(companyId)
      localStorage.setItem('fe_email', email)
      localStorage.setItem('fe_company_name', companyName.trim())

      // Kick off background research (don't await — it's slow)
      if (website.trim()) {
        scrapeBusiness(companyId, website.trim(), companyName.trim(), founderName.trim()).catch(
          err => console.warn('Background scrape failed:', err)
        )
      }

      showToast('Account created! Welcome to Founder Engine.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
      setStep('onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ocean-welcome">
      <div className="ocean-bg" />
      <div className="light-rays">
        <div className="ray" /><div className="ray" /><div className="ray" /><div className="ray" />
      </div>
      <div className="particles">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>
      <div className="wave wave-1" />
      <div className="wave wave-2" />
      <div className="wave wave-3" />

      <div className="ocean-welcome-content">
        <div className="ocean-logo">FOUNDER ENGINE</div>
        <h1 className="ocean-title">
          Turn chaos into <strong>clarity</strong>
        </h1>
        <p className="ocean-sub">
          AI-powered company intelligence. Voice-first onboarding that actually understands your business.
        </p>

        {step === 'auth' && (
          <div className="ocean-form-card">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                className={`btn ${mode === 'signup' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                onClick={() => { setMode('signup'); setError('') }}
                style={{ flex: 1 }}
              >
                Sign Up
              </button>
              <button
                className={`btn ${mode === 'signin' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                onClick={() => { setMode('signin'); setError('') }}
                style={{ flex: 1 }}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleAuth}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid var(--red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  marginBottom: 'var(--gap)',
                  color: 'var(--red)',
                  fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}

              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Working...</> : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>or</div>

            <button className="btn btn-secondary btn-block" onClick={handleGoogle} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        )}

        {step === 'onboarding' && (
          <div className="ocean-form-card">
            <h3 style={{ marginBottom: 'var(--gap)', color: 'var(--text)' }}>Tell us about your company</h3>
            <form onSubmit={handleOnboard}>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  placeholder="Acme Inc"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  placeholder="Jane Smith"
                  value={founderName}
                  onChange={e => setFounderName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Website (optional)</label>
                <input
                  type="url"
                  placeholder="https://acme.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid var(--red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  marginBottom: 'var(--gap)',
                  color: 'var(--red)',
                  fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}

              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Creating...</> : 'Get Started'}
              </button>
            </form>
          </div>
        )}

        {step === 'scraping' && (
          <div className="ocean-form-card" style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: 'var(--gap)' }} />
            <h3 style={{ color: 'var(--text)' }}>Researching your business...</h3>
            <p>Angus is reviewing your website and public information.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify auth flow works**

```bash
npm run dev
```

Expected: Ocean welcome screen with Sign Up / Sign In tabs, email+password fields, Google button. Attempting signup should call Supabase Auth.

**Step 3: Commit**

```bash
git add src/screens/WelcomeScreen.tsx
git commit -m "feat: build WelcomeScreen with auth + onboarding flow"
```

---

### Task 10: DashboardScreen

**Files:**
- Modify: `src/screens/DashboardScreen.tsx`

**Step 1: Build DashboardScreen**

```tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCompanyProfile } from '../api'
import { useToast } from '../components/Toast'
import type { CompanyProfile, GapAnalysis } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

const topicOrder = [
  'business_fundamentals',
  'revenue_financials',
  'customers',
  'team_operations',
  'marketing_sales',
  'technology_systems',
  'founder_headspace',
]

const topicIcons: Record<string, string> = {
  business_fundamentals: 'M2 3h20v14H2zM8 21h8M12 17v4',
  revenue_financials: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  team_operations: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z',
  marketing_sales: 'M22 12l-4 0-3 9-6-18-3 9-4 0',
  technology_systems: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
  founder_headspace: 'M9.663 17h4.673M12 3v1M18.364 5.636l-.707.707M21 12h-1M4 12H3M6.343 5.636l-.707-.707',
}

function formatTime(timestamp: string) {
  if (!timestamp) return 'just now'
  const diff = Date.now() - new Date(timestamp).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function DashboardScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    getCompanyProfile(companyId)
      .then(setProfile)
      .catch(err => {
        console.error('Dashboard load failed:', err)
        showToast('Failed to load dashboard data', 'error')
      })
      .finally(() => setLoading(false))
  }, [companyId])

  if (loading) {
    return (
      <div className="screen-content">
        <div className="loading"><div className="spinner" /><span>Loading dashboard...</span></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="screen-content">
        <p>Could not load dashboard. Please check your connection.</p>
      </div>
    )
  }

  const company = profile.company
  const gaps = profile.gaps || []
  const gapMap: Record<string, GapAnalysis> = {}
  gaps.forEach(g => { gapMap[g.topic] = g })

  const score = company.intelligence_score || (gaps.length > 0
    ? Math.round(gaps.reduce((sum, g) => sum + (g.completeness_score || 0), 0) / gaps.length)
    : 0)

  const tierMap: Record<string, string> = {
    getting_started: 'Getting Started',
    good: 'Good',
    great: 'Great',
    amazing: 'Amazing',
    expert: 'Expert',
  }
  const tier = tierMap[company.intelligence_tier] || 'Getting Started'
  const totalPoints = gaps.reduce((sum, g) => sum + (g.captured_data_points || 0), 0)
  const initials = company.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FE'
  const recentActivity = (profile.recent_activity || []).slice(0, 5)

  return (
    <div className="screen-content">
      {/* Score Card */}
      <div className="score-card">
        <div className="score-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--wave), var(--foam))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.85rem', color: 'var(--deep)',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{company.name || 'Your Company'}</div>
              <div className="score-label">Intelligence Score</div>
            </div>
          </div>
          <div className="score-tier">{tier}</div>
        </div>
        <div className="score-value">{score}<span>%</span></div>
        <div className="score-subtitle">{totalPoints} data points across {gaps.length} topics</div>
        <div className="score-bar-container">
          <div className="score-bar" style={{ width: `${score}%` }} />
        </div>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--wave)" />
              <stop offset="50%" stopColor="var(--foam)" />
              <stop offset="100%" stopColor="var(--glow)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Topics */}
      <div className="section-title">Knowledge Areas</div>
      <div className="topic-grid">
        {topicOrder.map(topicKey => {
          const gap = gapMap[topicKey] || {} as GapAnalysis
          const completeness = Math.round(gap.completeness_score || 0)
          return (
            <div key={topicKey} className="topic-card">
              <div className="topic-icon" style={{ background: 'rgba(0, 240, 255, 0.08)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow)" strokeWidth="2">
                  <path d={topicIcons[topicKey] || ''} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="topic-name">{topicLabels[topicKey] || topicKey}</div>
                <div className="completeness-bar">
                  <div className="completeness-fill" style={{ width: `${completeness}%` }} />
                </div>
              </div>
              <div className="completeness-percent">{completeness}%</div>
            </div>
          )
        })}
      </div>

      {/* Activity Feed */}
      <div className="section-title">Recent Activity</div>
      <div className="activity-feed">
        {recentActivity.length > 0 ? (
          recentActivity.map((log, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" />
              <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-dim)' }}>{log.action}</div>
              <div className="activity-time">{formatTime(log.created_at)}</div>
            </div>
          ))
        ) : (
          <p>No activity yet. Get started by scheduling a voice session.</p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify**

```bash
npm run dev
```

Sign up, onboard a test company, should see dashboard with score card, topics, activity.

**Step 3: Commit**

```bash
git add src/screens/DashboardScreen.tsx
git commit -m "feat: build DashboardScreen with score card, topics, activity feed"
```

---

### Task 11: VoiceScreen

**Files:**
- Modify: `src/screens/VoiceScreen.tsx`

**Step 1: Build VoiceScreen with ElevenLabs integration**

```tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getCompanyProfile, processTranscript } from '../api'

export default function VoiceScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [step, setStep] = useState<'precall' | 'active' | 'processing'>('precall')
  const [companyName, setCompanyName] = useState('Your Company')
  const [transcript, setTranscript] = useState('')
  const [sessionType, setSessionType] = useState('voice_founder')
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null)
  const [processing, setProcessing] = useState(false)
  const widgetLoaded = useRef(false)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId).then(profile => {
      setCompanyName(profile?.company?.name || 'Your Company')
    }).catch(() => {})
  }, [companyId])

  const loadElevenLabs = useCallback(() => {
    if (widgetLoaded.current) return
    widgetLoaded.current = true
    const s = document.createElement('script')
    s.src = 'https://elevenlabs.io/convai-widget/index.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  function startCall() {
    loadElevenLabs()
    setStep('active')
  }

  async function handleProcessTranscript() {
    if (!transcript.trim() || !companyId) {
      showToast('Please enter a transcript', 'error')
      return
    }

    setProcessing(true)
    try {
      const result = await processTranscript(companyId, transcript.trim(), sessionType)
      setExtractedData(result.extracted_data || null)
      showToast('Transcript processed successfully!')
    } catch {
      showToast('Failed to process transcript', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="screen-content">
      <div className="header-bar">
        <h1>Voice Session</h1>
      </div>

      {step === 'precall' && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--glow)" strokeWidth="1.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <h2>{companyName}</h2>
          <p style={{ marginBottom: '2rem' }}>
            Angus has reviewed your website and is ready to chat
          </p>
          <button className="btn btn-primary" onClick={startCall}>
            Start Call with Angus
          </button>
        </div>
      )}

      {step === 'active' && (
        <div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <elevenlabs-convai agent-id="agent_1901kjxbr6xte40bw8dyeyhjwgze" />
            <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>
              Call in progress... Speak naturally with Angus.
            </p>
          </div>
        </div>
      )}

      {/* Manual transcript processing */}
      <div className="water-divider" />
      <h3 style={{ marginBottom: 'var(--gap)' }}>Process a Transcript</h3>
      <div className="form-group">
        <label>Session Type</label>
        <select value={sessionType} onChange={e => setSessionType(e.target.value)}>
          <option value="voice_founder">Founder Call</option>
          <option value="voice_team">Team Call</option>
        </select>
      </div>
      <div className="form-group">
        <label>Transcript</label>
        <textarea
          rows={6}
          placeholder="Paste a call transcript here..."
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleProcessTranscript}
        disabled={processing}
      >
        {processing ? <><span className="spinner" /> Processing...</> : 'Process Transcript'}
      </button>

      {extractedData && (
        <div style={{ marginTop: 'var(--gap)' }}>
          <h3>Extracted Data</h3>
          {Object.entries(extractedData).map(([key, value]) => (
            <div key={key} style={{
              padding: '8px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '8px',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{key}</div>
              <div style={{ fontWeight: 500 }}>{String(value)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Add custom element type declaration**

Add to `src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & { 'agent-id'?: string },
      HTMLElement
    >
  }
}
```

**Step 3: Commit**

```bash
git add src/screens/VoiceScreen.tsx src/vite-env.d.ts
git commit -m "feat: build VoiceScreen with ElevenLabs widget and transcript processing"
```

---

### Task 12: KnowledgeScreen

**Files:**
- Modify: `src/screens/KnowledgeScreen.tsx`

**Step 1: Build KnowledgeScreen**

```tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getCompanyProfile } from '../api'
import type { KnowledgeEntry } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function KnowledgeScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [knowledge, setKnowledge] = useState<Record<string, KnowledgeEntry[]>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(profile => setKnowledge(profile?.knowledge || {}))
      .catch(() => showToast('Failed to load knowledge', 'error'))
      .finally(() => setLoading(false))
  }, [companyId])

  function toggleTopic(topic: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  if (loading) {
    return <div className="screen-content"><div className="loading"><div className="spinner" /></div></div>
  }

  const totalEntries = Object.values(knowledge).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="screen-content">
      <div className="header-bar">
        <h1>Knowledge Base</h1>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{totalEntries} entries</span>
      </div>

      {Object.entries(knowledge).map(([topic, entries]) => {
        if (entries.length === 0) return null
        const isExpanded = expanded.has(topic)
        return (
          <div key={topic} className={`knowledge-topic ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleTopic(topic)}>
            <div className="knowledge-topic-header">
              <span>{topicLabels[topic] || topic}</span>
              <span className="knowledge-topic-count">{entries.length}</span>
              <span className="knowledge-chevron">{'\u25B8'}</span>
            </div>
            <div className="knowledge-topic-body">
              {entries.map(e => (
                <div key={e.id} className="knowledge-entry" onClick={ev => ev.stopPropagation()}>
                  <div className="knowledge-key">{formatKey(e.key)}</div>
                  <div className="knowledge-value">{e.value}</div>
                  <span className={`confidence-badge confidence-${e.confidence || 'medium'}`}>
                    {e.confidence || 'medium'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {totalEntries === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No knowledge captured yet. Start a voice session to begin building intelligence.</p>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/screens/KnowledgeScreen.tsx
git commit -m "feat: build KnowledgeScreen with collapsible topic accordions"
```

---

### Task 13: CallsScreen

**Files:**
- Modify: `src/screens/CallsScreen.tsx`

**Step 1: Build CallsScreen**

```tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getCompanyProfile } from '../api'
import type { Session } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}m`
}

type Filter = 'all' | 'founder' | 'team'

export default function CallsScreen() {
  const { companyId } = useAuth()
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(profile => setSessions(profile?.sessions || []))
      .catch(() => showToast('Failed to load calls', 'error'))
      .finally(() => setLoading(false))
  }, [companyId])

  const filtered = sessions.filter(s => {
    if (filter === 'founder') return s.participant_role === 'founder' || !s.participant_role
    if (filter === 'team') return s.participant_role && s.participant_role !== 'founder'
    return true
  })

  if (loading) {
    return <div className="screen-content"><div className="loading"><div className="spinner" /></div></div>
  }

  return (
    <div className="screen-content">
      <div className="header-bar">
        <h1>Call History</h1>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{sessions.length} sessions</span>
      </div>

      <div className="filter-tabs">
        {(['all', 'founder', 'team'] as Filter[]).map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No sessions match this filter.</p>
        </div>
      ) : (
        filtered.map(s => {
          const isExpanded = expandedId === s.id
          const date = new Date(s.created_at)
          const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

          return (
            <div
              key={s.id}
              className={`session-card card interactive ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
            >
              <div className="session-card-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong>{s.participant_name || 'Unknown'}</strong>
                    {s.participant_role && <span className="badge badge-accent">{s.participant_role}</span>}
                    {s.session_type && <span className="badge badge-green">{s.session_type}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    <span>{dateStr} {timeStr}</span>
                    <span>{s.duration_seconds ? formatDuration(s.duration_seconds) : 'N/A'}</span>
                    <span>{s.data_points_captured || 0} data points</span>
                  </div>
                </div>
                <span className="session-chevron">{'\u25B8'}</span>
              </div>
              <div className="session-card-body">
                {s.summary ? <p style={{ color: 'var(--text)' }}>{s.summary}</p> : <p>No summary available.</p>}
                {(s.topics_covered || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {s.topics_covered.map(t => (
                      <span key={t} className="topic-tag">{topicLabels[t] || t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/screens/CallsScreen.tsx
git commit -m "feat: build CallsScreen with filters and expandable session cards"
```

---

### Task 14: MoreScreen

**Files:**
- Modify: `src/screens/MoreScreen.tsx`

**Step 1: Build MoreScreen with all sub-sections**

```tsx
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import {
  getCompanyProfile,
  uploadDocument,
  inviteTeamMember,
  generateRecommendations,
  updateRecommendationStatus,
} from '../api'
import type { CompanyProfile } from '../types'

const topicLabels: Record<string, string> = {
  business_fundamentals: 'Business Basics',
  revenue_financials: 'Revenue & Financials',
  customers: 'Customers & Market',
  team_operations: 'Team & Operations',
  marketing_sales: 'Marketing & Sales',
  technology_systems: 'Tech & Systems',
  founder_headspace: 'Founder Vision',
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default function MoreScreen() {
  const { companyId, signOut } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingRecs, setGeneratingRecs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Invite form state
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    if (!companyId) return
    getCompanyProfile(companyId)
      .then(setProfile)
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }, [companyId])

  async function handleFiles(files: FileList) {
    if (!companyId) return
    for (const file of Array.from(files)) {
      try {
        await uploadDocument(companyId, file)
        showToast(`${file.name} uploaded successfully`)
      } catch {
        showToast(`Failed to upload ${file.name}`, 'error')
      }
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId || !inviteName.trim() || !inviteRole.trim()) return
    try {
      await inviteTeamMember(companyId, inviteName.trim(), inviteRole.trim(), inviteEmail.trim() || undefined)
      showToast('Team member invited!')
      setInviteName('')
      setInviteRole('')
      setInviteEmail('')
      setShowInviteForm(false)
      // Reload profile
      const updated = await getCompanyProfile(companyId)
      setProfile(updated)
    } catch {
      showToast('Failed to invite team member', 'error')
    }
  }

  async function handleGenerateRecs() {
    if (!companyId) return
    setGeneratingRecs(true)
    try {
      await generateRecommendations(companyId)
      showToast('Recommendations generated!')
      const updated = await getCompanyProfile(companyId)
      setProfile(updated)
    } catch {
      showToast('Failed to generate recommendations', 'error')
    } finally {
      setGeneratingRecs(false)
    }
  }

  if (loading) {
    return <div className="screen-content"><div className="loading"><div className="spinner" /></div></div>
  }

  const company = profile?.company
  const recommendations = profile?.recommendations || []
  const gaps = profile?.gaps || []
  const team = profile?.team || []

  return (
    <div className="screen-content">
      <div className="header-bar"><h1>More</h1></div>

      {/* Upload Documents */}
      <div className="section-title">Upload Documents</div>
      <div
        className="drop-zone"
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('active') }}
        onDragLeave={e => e.currentTarget.classList.remove('active')}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('active'); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
      >
        <p style={{ color: 'var(--text-dim)' }}>Drop files here or click to browse</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      {/* Team Management */}
      <div className="section-title">Team</div>
      {team.map(member => (
        <div key={member.id} className="team-member">
          <div className="team-member-info">
            <h3>{member.name}</h3>
            <div className="team-member-role">{member.role}</div>
            <div className="team-member-invite">
              <span className={`status-dot ${member.invite_status === 'complete' ? 'completed' : member.invite_status === 'in_progress' ? 'in-progress' : 'pending'}`} />
              {member.invite_status}
            </div>
          </div>
        </div>
      ))}
      {!showInviteForm ? (
        <button className="btn btn-secondary btn-small" onClick={() => setShowInviteForm(true)}>
          + Invite Team Member
        </button>
      ) : (
        <div className="card">
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <label>Name</label>
              <input value={inviteName} onChange={e => setInviteName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input value={inviteRole} onChange={e => setInviteRole(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email (optional)</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-small" type="submit">Send Invite</button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setShowInviteForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Recommendations */}
      <div className="section-title">Recommendations</div>
      <button
        className="btn btn-secondary btn-small"
        onClick={handleGenerateRecs}
        disabled={generatingRecs}
        style={{ marginBottom: 'var(--gap)' }}
      >
        {generatingRecs ? <><span className="spinner" /> Generating...</> : 'Generate Recommendations'}
      </button>
      {recommendations.length === 0 ? (
        <p>No recommendations yet. Generate recommendations to get started.</p>
      ) : (
        recommendations.map(rec => (
          <div key={rec.id} className="recommendation-card">
            <div className="recommendation-header">
              <div style={{ flex: 1 }}>
                <div className="recommendation-badges">
                  {rec.priority && <span className={`badge ${rec.priority <= 3 ? 'badge-orange' : 'badge-accent'}`}>#{rec.priority}</span>}
                  {rec.constraint_type && <span className="badge badge-green">{rec.constraint_type}</span>}
                </div>
                <div className="recommendation-title">{rec.title}</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>{rec.description}</p>
              </div>
            </div>
            <div className="recommendation-status">
              <select
                style={{ flex: 1 }}
                value={rec.status}
                onChange={e => {
                  if (companyId) updateRecommendationStatus(companyId, rec.id, e.target.value)
                    .then(() => showToast('Status updated'))
                    .catch(() => showToast('Failed to update', 'error'))
                }}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        ))
      )}

      {/* Gap Analysis */}
      <div className="section-title">Gap Analysis</div>
      {gaps.map(topic => {
        const completeness = Math.round(topic.completeness_score || 0)
        const missingAreas = (topic.missing_items || []).slice(0, 3)
        return (
          <div key={topic.id} className="card" style={{ background: 'var(--surface)' }}>
            <div style={{ fontWeight: 600 }}>{topicLabels[topic.topic] || topic.topic}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>{completeness}% complete</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${completeness}%` }} />
            </div>
            {missingAreas.length > 0 && (
              <ul style={{ paddingLeft: '20px', color: 'var(--text-dim)', fontSize: '0.9rem', margin: '8px 0 0' }}>
                {missingAreas.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            )}
          </div>
        )
      })}

      {/* Settings */}
      <div className="section-title">Settings</div>
      <div className="card">
        <div className="list-item">
          <span style={{ color: 'var(--text-dim)' }}>Email Inbox</span>
          <span style={{ fontSize: '0.85rem' }}>{company?.email_inbox_address || 'Not set'}</span>
        </div>
        <div className="list-item">
          <span style={{ color: 'var(--text-dim)' }}>Onboarding Link</span>
          <span style={{ fontSize: '0.85rem' }}>{company?.onboarding_link || 'Not set'}</span>
        </div>
      </div>
      <button className="btn btn-secondary btn-block" onClick={signOut} style={{ marginTop: 'var(--gap)' }}>
        Sign Out
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/screens/MoreScreen.tsx
git commit -m "feat: build MoreScreen with upload, team, recommendations, gaps, settings"
```

---

### Task 15: Database Migration — Add user_id to companies

**Step 1: Run SQL migration via Supabase MCP or dashboard**

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
```

**Step 2: Update onboard-company edge function**

Add user_id to the INSERT when creating a company. The edge function receives the JWT — extract user from it:

```ts
// Near the top of the function, after getting the request body:
const authHeader = req.headers.get('Authorization')
let userId = null
if (authHeader) {
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (user) userId = user.id
}

// In the INSERT statement, add user_id:
const { data: company, error } = await supabase
  .from('companies')
  .insert({ ...companyData, user_id: userId })
  .select()
  .single()
```

**Step 3: Commit any local changes**

```bash
git add -A
git commit -m "feat: add user_id column to companies table, update edge function"
```

---

### Task 16: Final Integration — Build, Test, Deploy

**Step 1: Run build to check for TypeScript errors**

```bash
npm run build
```

Fix any errors.

**Step 2: Test locally**

```bash
npm run dev
```

Test the full flow:
1. Open localhost:5173
2. Sign up with email + password
3. Fill onboarding form (company name, founder name, website)
4. Verify dashboard loads with score card, topics, activity
5. Click each nav tab — Voice, Knowledge, Calls, More
6. Sign out
7. Sign back in — should go straight to dashboard
8. Refresh page — should stay on dashboard (session persisted)

**Step 3: Push to deploy**

```bash
git push origin main
```

Vercel auto-deploys. Wait ~1 minute.

**Step 4: Verify live**

Open https://founder-engine-seven.vercel.app and run the same test flow.

**Step 5: Clean up old files**

```bash
rm old-index.html design-preview.html
git add -A
git commit -m "chore: remove old monolith backup and design preview"
git push origin main
```

---

### Task 17: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md to reflect new architecture**

Key updates:
- Architecture section: React + Vite + Supabase Auth
- File structure: list all new src/ files
- Remove references to "single HTML file"
- Add development commands (npm run dev, npm run build)
- Update deployment notes (Vite build, dist output)
- Add auth section documenting the flow
- Update tech debt section (remove fixed issues, note any new ones)

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for React + Vite architecture"
git push origin main
```
