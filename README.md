# OpportunityX — Intelligent Discovery of Practical Learning Opportunities

> An editorial-style, production-ready platform that consolidates permitted collegiate hackathons, competitions, workshops, and research opportunities into one searchable catalog with deterministic match scoring, eligibility verification, preparation roadmaps, and consent-based peer collaboration.

---

## ✨ Features at a Glance

- **Intelligent Catalog**: Real-time multi-filter search (remote, beginner-friendly, low-cost, sustainability, format) with pagination and sorting.
- **Deterministic Match Scoring**: Profile-based match breakdown with transparent reasons and skill alignment.
- **Eligibility Verification**: Automated checking of academic standing, location, and requirements.
- **Preparation Roadmaps**: Dynamic 4-phase milestone generation with real-time readiness progress tracking.
- **Consent-Based Peer Matching**: Opt-in collaboration matching connecting students with shared and complementary skillsets.
- **Application Pipeline Tracker**: Saved opportunity tracker with pipeline stages and deadline urgency grouping.
- **Data Quality & Ingestion Hub**: Automated multi-format feed ingestion (JSON + XML) with fingerprint deduplication and contradiction flagging.

---

## 📁 Repository Structure

OpportunityX is organized as a clean full-stack workspace:

```
OpportunityX/
├── client/          # Frontend SPA (React 18, Vite, Custom Editorial CSS)
│   └── README.md    # 📖 Frontend guide, design system & UI architecture
├── server/          # Backend REST API (Node.js, Express, Sequelize, PostgreSQL)
│   └── README.md    # 📖 Backend guide, database schema & REST API specifications
├── package.json     # Root scripts & concurrent execution
├── render.yaml      # Render blueprint configuration (backend & database)
├── vercel.json      # Vercel deployment configuration (frontend)
└── README.md        # Main repository overview & quick start
```

For detailed subproject documentation, refer to:
- **[Frontend Guide (`client/README.md`)](file:///c:/Users/harsh/OpportunityX/client/README.md)**: React components, Vite proxying, CSS design system, and UI state.
- **[Backend Guide (`server/README.md`)](file:///c:/Users/harsh/OpportunityX/server/README.md)**: PostgreSQL schema, Sequelize models, complete REST API endpoint reference, and testing.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v26)
- **npm** v9+ (tested on npm v11)
- **PostgreSQL** v14+ (local instance on port `5432` or remote database)

### 2. Environment Setup
Copy the example environment files for server and client:

```bash
# Backend environment setup
cp server/.env.example server/.env

# Frontend environment setup
cp client/.env.example client/.env
```

Ensure `DATABASE_URL` in `server/.env` points to your PostgreSQL instance:
```ini
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx
TEST_DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx_test
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 3. Initialize Database & Seed Demo Data
Run the database setup scripts from the root directory:

```bash
# Create database instance
npm run db:create

# Run schema migrations
npm run db:migrate

# Seed demo opportunities, users, roadmaps, and peer requests
npm run db:seed
```

### 4. Run Development Servers
Launch both the Express backend and the Vite frontend with a single command:

```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Credentials

The database seeder pre-populates the platform with demo accounts and ~30 curated listings:

| Role | Email | Password | Description |
|---|---|---|---|
| **Demo Student** | `alex.chen@university.edu` | `StudentPass123!` | Undergraduate student (CS, Berkeley) with skills, saved tracker, and active roadmaps |
| **Curator Admin** | `admin@opportunityx.edu` | `AdminPass123!` | Administrator with access to Data Health Hub and Feed Ingestion |

---

## 📜 Key npm Scripts

Run these commands from the project root:

| Command | Description |
|---|---|
| `npm run dev` | Launch both backend (`:5000`) and frontend (`:5173`) concurrently |
| `npm run build` | Build the optimized production frontend bundle |
| `npm start` | Run the Express production server |
| `npm test` | Execute the automated test suite across backend services (73 tests) |
| `npm run lint` | Validate syntax and verify clean compilation across client and server |
| `npm run db:migrate` | Execute Sequelize PostgreSQL migrations |
| `npm run db:seed` | Seed demo opportunities and accounts |

---

## 🛡 Ethics, Compliance & Simulation Notice

- **Simulation Environment**: All 30 seed opportunities are explicitly tagged `[DEMO LISTING]` with a disclaimer banner. Seeded examples are never presented as live-verified events.
- **Zero Scraping Policy**: Data is ingested exclusively via permitted, standardized feeds (JSON and XML). OpportunityX never scrapes private user data, bypasses authentication gates, or retains third-party portal passwords.
- **Explicit Consent for Peer Matching**: Student profiles are strictly private by default. A student is only discoverable by peers if they actively opt in via the explicit consent setting in their profile. Consent can be revoked at any time.

---

## 🚢 Deployment

- **Frontend on Vercel**: Pre-configured with [vercel.json](file:///c:/Users/harsh/OpportunityX/vercel.json) for client-side SPA routing rewrites.
- **Backend on Render**: Pre-configured with [render.yaml](file:///c:/Users/harsh/OpportunityX/render.yaml) blueprint for deploying the Express service with managed PostgreSQL.