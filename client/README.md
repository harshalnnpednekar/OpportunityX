# OpportunityX — Frontend Client

The OpportunityX frontend is a high-performance single-page application built with React 18, Vite, and a custom editorial design system. It provides an intuitive discovery experience for students seeking hackathons, competitions, workshops, and research opportunities.

---

## 📁 Frontend Directory Structure

```
client/
├── public/                     # Static assets, SVG icons & favicon
├── src/
│   ├── main.jsx                # React root application bootstrap
│   ├── App.jsx                 # Top-level routing, drawer state & layout
│   ├── components/             # Reusable UI components & badges
│   │   ├── DemoBanner.jsx      # Top demo status & context bar
│   │   ├── EligibilityBadge.jsx# Visual eligibility indicator & tooltips
│   │   ├── EmptyState.jsx      # Empty state cards with action buttons
│   │   ├── ErrorBoundary.jsx   # React crash boundary with recovery
│   │   ├── FilterBar.jsx       # Multi-category, format & cost filter bar
│   │   ├── Footer.jsx          # Academic editorial footer & links
│   │   ├── LoadingSkeleton.jsx # Pulse skeleton loading placeholders
│   │   ├── MatchScoreBadge.jsx # Transparent match % score badge
│   │   ├── Navbar.jsx          # Responsive header with notification badge
│   │   ├── NotificationDrawer.jsx # Slide-over notifications drawer
│   │   ├── OpportunityCard.jsx # Editorial listing card with metadata
│   │   ├── OrbitIllustration.jsx # Custom SVG orbital path artwork
│   │   └── ProtectedRoute.jsx  # Route guard for authenticated views
│   ├── context/                # React context providers
│   │   ├── AuthContext.jsx     # Authentication state, login & session persistence
│   │   └── ToastContext.jsx    # Ephemeral toast alert dispatcher
│   ├── pages/                  # Route-level view pages
│   │   ├── LandingPage.jsx     # Hero showcase, value proposition & stats
│   │   ├── CataloguePage.jsx   # Multi-filter search grid & pagination (/explore)
│   │   ├── OpportunityDetailPage.jsx # Opportunity specifications & match breakdown
│   │   ├── DashboardPage.jsx   # Student metrics, approaching deadlines & notices
│   │   ├── ProfilePage.jsx     # Skills, interests, format & consent settings
│   │   ├── SavedPage.jsx       # Saved opportunities & pipeline stages
│   │   ├── RoadmapsPage.jsx    # 8-phase preparation milestone checklists
│   │   ├── PeerMatchingPage.jsx# Consent-based peer discovery & invites (/peers)
│   │   ├── AdminPage.jsx       # Feed ingestion & data quality audit hub
│   │   ├── LoginPage.jsx       # Student & Admin sign-in
│   │   ├── RegisterPage.jsx    # New student registration
│   │   └── NotFoundPage.jsx    # 404 handler
│   ├── services/
│   │   └── api.js              # Centralized API client (fetch, cookies, error parsing)
│   └── styles/                 # Custom editorial CSS design system
│       ├── index.css           # Design tokens, variables & typography primitives
│       ├── components.css      # Reusable UI component styling
│       └── pages.css           # Page layout & responsive grid styles
├── index.html                  # HTML entry point
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration & development proxy
└── .env.example                # Sample client environment configuration
```

---

## 🎨 Art Direction & Design Aesthetics

OpportunityX avoids generic dashboard templates in favor of a warm, editorial aesthetic designed to feel like an academic journal for ambitious students:

- **Color Palette**:
  - Background: Warm off-white (`#FBF9F5` / `var(--bg-warm)`)
  - Typography: Deep ink / navy (`#111827` / `var(--ink-primary)`)
  - Accent Violet: Restrained indigo (`#4F46E5` / `var(--accent-violet)`)
  - Accent Teal: Subtle sea green (`#0D9488` / `var(--accent-teal)`)
  - Cards: Crisp white with subtle borders (`#E5E7EB` / `var(--border-subtle)`)
- **Typography**: Clean, readable sans-serif typography with strong contrast hierarchy and generous line spacing.
- **Illustration**: Custom geometric SVG illustration (`OrbitIllustration.jsx`) inspired by opportunity paths, connected nodes, and orbital navigation.
- **Micro-interactions**: Hover state elevations, smooth progress bars, and high-visibility status badges (`Verified`, `Demo Listing`, `Likely Eligible`, `High Match`).

---

## 🗺 Application Routes

| Path | Component | Access | Description |
|---|---|---|---|
| `/` | `LandingPage` | Public | Hero showcase, key features, and live catalogue preview |
| `/explore` | `CataloguePage` | Public | Searchable opportunity catalogue with multi-filter controls |
| `/opportunities/:id` | `OpportunityDetailPage` | Public | Full opportunity details, eligibility evaluation, and match breakdown |
| `/dashboard` | `DashboardPage` | Protected | Personalized dashboard with active roadmaps, approaching deadlines, and notices |
| `/profile` | `ProfilePage` | Protected | Manage skills, interests, maximum budget, format, and peer consent |
| `/saved` | `SavedPage` | Protected | Saved opportunity pipeline tracker (`saved`, `planning`, `applied`, `accepted`) |
| `/roadmaps` | `RoadmapsPage` | Protected | 8-phase preparation milestone checklists with progress calculation |
| `/peers` | `PeerMatchingPage` | Protected | Consent-based peer discovery, skill overlap analysis, and invites |
| `/admin` | `AdminPage` | Admin-only | Feed ingestion management and data quality audit hub |
| `/login` | `LoginPage` | Public | Student and administrator authentication |
| `/register` | `RegisterPage` | Public | Account creation with profile initialization |

---

## 🛠 Local Setup & Configuration

### 1. Configure Environment (`.env`)
Copy the example environment configuration:
```bash
cp .env.example .env
```

Contents of `client/.env`:
```ini
# Base URL for API requests. Defaults to '/api' to use the Vite development proxy
VITE_API_URL=/api
VITE_API_BASE_URL=/api
VITE_PROXY_TARGET=http://localhost:5000
```

### 2. Development API Proxy
During development, `vite.config.js` automatically proxies all requests starting with `/api` to the backend Express server running on port `5000`:
```javascript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```
This enables seamless local development without cross-origin configuration friction.

---

## 📜 Available npm Scripts

Run these commands from `client/` (or from the project root using `--prefix client`):

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Launch Vite development server on `http://localhost:5173` |
| `npm run build` | `vite build` | Compile optimized production bundle to `client/dist/` |
| `npm run preview` | `vite preview` | Preview production build locally |
| `npm run lint` | `vite build --mode development` | Check module resolution, JSX syntax, and asset integrity |
