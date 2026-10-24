# OpportunityX — Frontend Client

The OpportunityX frontend is a high-performance single-page application built with React 18, Vite, and a custom editorial design system. It provides an intuitive discovery experience for students seeking hackathons, competitions, workshops, and research opportunities.

---

## 📁 Frontend Directory Structure

```
client/
├── public/                 # Static assets & favicon
├── src/
│   ├── main.jsx            # React root application bootstrap
│   ├── App.jsx             # Top-level routing, layout & notifications
│   ├── components/         # Reusable UI components & badges
│   │   ├── MatchBadge.jsx
│   │   ├── Navbar.jsx
│   │   ├── OpportunityCard.jsx
│   │   ├── ToastAlert.jsx
│   │   └── ...
│   ├── context/            # React context providers
│   │   ├── AuthContext.jsx # Authentication state & profile caching
│   │   └── ToastContext.jsx# Ephemeral toast notifications
│   ├── pages/              # Primary view pages
│   │   ├── AdminHealth.jsx # Ingestion logs & quarantine duplicate audit
│   │   ├── Catalog.jsx     # Search, multi-filtering & sorting grid
│   │   ├── Detail.jsx      # Opportunity detail & match breakdown
│   │   ├── Login.jsx       # Student & Admin sign-in
│   │   ├── PeerMatch.jsx   # Consent-based peer discovery & invites
│   │   ├── Profile.jsx     # Skills, interests, format & consent settings
│   │   ├── Register.jsx    # New student registration
│   │   ├── Roadmaps.jsx    # 4-phase preparation milestones & progress %
│   │   └── Saved.jsx       # Application tracker & pipeline stages
│   ├── services/
│   │   └── api.js          # API client configured for /api proxy
│   └── styles/             # Curated warm editorial CSS design system
│       ├── index.css       # Core typography, color tokens & layout primitives
│       ├── catalog.css     # Filter controls, search bar & card layouts
│       ├── detail.css      # Diagnostics breakdown & action banners
│       └── roadmaps.css    # Interactive milestone checklist styles
├── index.html              # HTML entry point
├── package.json            # Client dependencies & scripts
├── vite.config.js          # Vite configuration & /api development proxy
└── .env.example            # Sample client environment configuration
```

---

## 🎨 Design System & Aesthetics

OpportunityX avoids generic templates in favor of a warm, editorial aesthetic designed to feel like an academic publication:

- **Color Palette**:
  - Background: Warm off-white (`#FBF9F5`)
  - Primary Dark: Deep ink (`#111827`)
  - Accent Violet: Restrained indigo (`#4F46E5`)
  - Accent Teal: Subtle sea green (`#0D9488`)
  - Surface Cards: Pure white with soft warm borders (`#E5E7EB`)
- **Typography**: Clean, readable sans-serif typography with high contrast hierarchy and generous line spacing.
- **Micro-interactions**: Subtle hover state elevations, smooth progress bars, and high-visibility status badges (`Verified`, `Demo Listing`, `Eligible`, `High Match`).

---

## 🛠 Local Setup & Development

### 1. Configure `.env`
Copy the example environment file:
```bash
cp .env.example .env
```

Contents of `client/.env`:
```ini
# Base URL for API requests. Defaults to '/api' to use Vite development proxy
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:5000
```

### 2. Vite API Proxying
During local development, `vite.config.js` automatically proxies all requests starting with `/api` to the backend Express server running on port `5000`:

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

This prevents CORS friction during local development and simulates production same-origin routing.

---

## 📜 Available npm Scripts

Run these commands from `client/` (or from the project root using `--prefix client`):

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Launch Vite development server on `http://localhost:5173` |
| `npm run build` | `vite build` | Compile optimized production bundle to `client/dist/` |
| `npm run preview` | `vite preview` | Preview production build locally |
| `npm run lint` | `vite build --mode development` | Check module resolution, JSX syntax, and assets |

---

## 🚀 Key Client Features & Views

1. **Intelligent Discovery Catalog (`/`)**:
   - Live search across title, description, and organizer
   - Filter by format (`virtual`, `in_person`, `hybrid`), beginner-friendly, remote, low-cost, sustainability theme
   - Sort by deadline, newest, title, and recommendation match score
   - Pagination controls with responsive layout

2. **Opportunity Detail View (`/opportunity/:id`)**:
   - Comprehensive guidelines, eligibility checklist, and requirements
   - Deterministic match score breakdown with personalized match reasons
   - Direct links to official application portals
   - One-click preparation roadmap generation & saving to tracker

3. **Preparation Roadmaps (`/roadmaps`)**:
   - 4-phase milestone checklists tailored to each opportunity
   - Interactive task completion toggles
   - Real-time progress bar recalculation

4. **Consent-Based Peer Matching (`/peer-match`)**:
   - Discover students interested in the same event
   - Explicit consent opt-in required to participate
   - View shared skills and complementary toolkits
   - Send and accept collaboration invites

5. **Application Pipeline Tracker (`/saved`)**:
   - Visual tracking stages (`Saved`, `Planning`, `In Progress`, `Submitted`, `Accepted`)
   - Personal notes and deadline urgency grouping

6. **Admin Data Health Hub (`/admin`)**:
   - Quarantine duplicate audit reports
   - Feed ingestion metrics and status monitoring
