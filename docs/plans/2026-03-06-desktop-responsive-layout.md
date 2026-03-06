# Desktop Responsive Layout — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a proper desktop layout (768px+) with sidebar navigation and two-column welcome screen, while keeping mobile layout identical.

**Architecture:** CSS-only media queries in ocean.css for layout changes. One new SideNav component rendered alongside BottomNav — CSS controls which is visible. No logic changes to any screen component.

**Tech Stack:** React, TypeScript, CSS media queries (no libraries)

---

### Task 1: Create SideNav Component

**Files:**
- Create: `src/components/SideNav.tsx`

**Step 1: Create the SideNav component**

```tsx
import { useAuth } from '../contexts/AuthContext'

interface SideNavProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: 'voice',
    label: 'Voice Session',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: 'calls',
    label: 'Call History',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: 'more',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function SideNav({ activeScreen, onNavigate }: SideNavProps) {
  const { user } = useAuth()

  return (
    <nav className="side-nav">
      <div className="side-nav-logo">FOUNDER ENGINE</div>
      <div className="side-nav-items">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`side-nav-item ${activeScreen === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="side-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {user?.email && (
        <div className="side-nav-footer">
          <div className="side-nav-email">{user.email}</div>
        </div>
      )}
    </nav>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/SideNav.tsx
git commit -m "feat: add SideNav component for desktop layout"
```

---

### Task 2: Add SideNav to App.tsx

**Files:**
- Modify: `src/App.tsx:4` (add import)
- Modify: `src/App.tsx:62-69` (add SideNav to render)

**Step 1: Add SideNav import after BottomNav import**

Add at line 4 (after the BottomNav import):
```tsx
import SideNav from './components/SideNav'
```

**Step 2: Update the return JSX to include SideNav**

Replace the return block (lines 62-69) with:
```tsx
  return (
    <div className="container">
      <SideNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className="content">
        {screens[activeScreen] || <DashboardScreen />}
      </div>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  )
```

**Step 3: Run build to check TypeScript**

Run: `npm run build`
Expected: PASS (SideNav is hidden by CSS, which we add next)

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: render SideNav in app shell"
```

---

### Task 3: Add Desktop CSS — SideNav Styles + Layout Switch

**Files:**
- Modify: `src/styles/ocean.css` (append desktop media query block at end of file)

**Step 1: Add SideNav base styles and desktop media query block**

Append to the END of ocean.css:

```css
/* ============================================
   SIDE NAV (desktop only — hidden on mobile)
   ============================================ */
.side-nav {
    display: none;
}

/* ============================================
   DESKTOP LAYOUT (768px+)
   ============================================ */
@media (min-width: 768px) {
    /* Show side nav, hide bottom nav */
    .side-nav {
        display: flex;
        flex-direction: column;
        width: 240px;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background: rgba(2, 11, 24, 0.95);
        border-right: 1px solid var(--sea);
        z-index: 100;
        padding: 0;
    }

    .bottom-nav {
        display: none;
    }

    /* Side nav internals */
    .side-nav-logo {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 4px;
        color: var(--glow);
        font-weight: 500;
        padding: 28px 24px 24px;
        opacity: 0.8;
    }

    .side-nav-items {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 0 12px;
    }

    .side-nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border: none;
        background: none;
        color: var(--text-muted);
        font-size: 0.9rem;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all 0.2s;
        text-align: left;
        width: 100%;
        position: relative;
    }

    .side-nav-item:hover {
        color: var(--text-dim);
        background: rgba(0, 240, 255, 0.03);
    }

    .side-nav-item.active {
        color: var(--glow);
        background: rgba(0, 240, 255, 0.06);
    }

    .side-nav-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: var(--glow);
        border-radius: 0 2px 2px 0;
        box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
    }

    .side-nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .side-nav-footer {
        padding: 16px 24px;
        border-top: 1px solid var(--sea);
    }

    .side-nav-email {
        font-size: 0.75rem;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* App layout: shift content right for sidebar */
    .container {
        flex-direction: row;
    }

    .content {
        margin-left: 240px;
        width: calc(100% - 240px);
        padding-bottom: 0; /* no bottom nav on desktop */
    }

    /* Screen content max width on desktop */
    .screen-content {
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem;
    }

    /* ---- WELCOME SCREEN: Two-column layout ---- */
    .ocean-welcome {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 40px;
    }

    .ocean-welcome-content {
        display: flex;
        align-items: center;
        gap: 60px;
        max-width: 1100px;
        width: 100%;
    }

    /* Left column: brand messaging */
    .ocean-welcome-content > .ocean-logo,
    .ocean-welcome-content > .ocean-title,
    .ocean-welcome-content > .ocean-sub {
        /* These are direct children, we need a wrapper.
           Instead, use CSS to make the content flex and
           let the form card take fixed width */
    }

    .ocean-welcome-content {
        flex-wrap: wrap;
    }

    /* Brand elements take up left side */
    .ocean-logo {
        width: 100%;
        flex-basis: 100%;
        text-align: left;
    }

    /* Actually, since the brand elements and form are siblings,
       we use a different approach: the welcome-content becomes
       a CSS grid on desktop */
    .ocean-welcome-content {
        display: grid;
        grid-template-columns: 1fr 420px;
        grid-template-rows: auto auto auto;
        gap: 0 60px;
        align-items: center;
        flex-wrap: nowrap;
    }

    .ocean-logo {
        grid-column: 1;
        grid-row: 1;
        width: auto;
        flex-basis: auto;
    }

    .ocean-title {
        grid-column: 1;
        grid-row: 2;
        font-size: 2.8rem;
    }

    .ocean-sub {
        grid-column: 1;
        grid-row: 3;
        max-width: 440px;
        font-size: 1.1rem;
    }

    .ocean-form-card {
        grid-column: 2;
        grid-row: 1 / 4;
        align-self: center;
        margin-top: 0;
    }

    /* ---- DASHBOARD: Stats row + 2-col topics ---- */
    .score-card {
        /* Already looks good, just let it breathe */
        padding: 32px;
    }

    .topic-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    /* ---- VOICE SCREEN: More breathing room ---- */
    .card[style*="text-align: center"] {
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }
}

/* Large desktop (1200px+) — 3-column topics */
@media (min-width: 1200px) {
    .topic-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .screen-content {
        padding: 2.5rem;
    }
}
```

**Step 2: Commit**

```bash
git add src/styles/ocean.css
git commit -m "feat: add desktop layout CSS — sidebar, two-column welcome, responsive grids"
```

---

### Task 4: Build, Verify, and Deploy

**Step 1: Run build**

Run: `npm run build`
Expected: PASS with zero errors

**Step 2: Verify mobile is unchanged**

Run local dev server (`npm run dev`), open browser at 375px width.
Confirm:
- Bottom nav visible
- No sidebar visible
- Welcome screen is single-column
- All screens render as before

**Step 3: Verify desktop layout**

Same dev server, resize to 1280px.
Confirm:
- Sidebar visible on the left (240px wide)
- Bottom nav hidden
- Welcome screen is two-column (brand left, form right)
- Dashboard topics in 2-column grid
- Screen content centred with max-width 960px

**Step 4: Commit and push**

```bash
git push origin main
```

Wait ~1 min for Vercel deploy, then verify at https://founder-engine-seven.vercel.app
