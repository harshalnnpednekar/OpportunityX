# OpportunityX — Intelligent Discovery of Practical Learning Opportunities

> An editorial-style, production-minded platform that consolidates permitted collegiate hackathons, competitions, fellowships, workshops, and research opportunities into one searchable catalog with deterministic match scoring, strict eligibility verification, preparation roadmaps, and consent-based peer collaboration.

---

## 🌟 The Core Problem

Students must search across fragmented platforms (Devpost, unlisted university mailing lists, LinkedIn, disparate portal feeds) to discover high-value learning opportunities. **OpportunityX** solves this by:
1. Standardizing heterogeneous **JSON feeds** and an **XML feed parser** into a unified internal schema.
2. Isolating data quality defects: fuzzy **deduplication fingerprinting**, **expired record detection**, **missing critical fields**, and **contradictory dates**.
3. Separating **strict eligibility verification** (academic standing, region, age) from **relevance scoring**.
4. Generating **deterministic, explainable match scores (0–100%)** with clear point allocations (no opaque black-box AI).
5. Structuring **4-phase preparation roadmaps** with interactive milestone checklists.
6. Facilitating **consent-based peer collaboration matching** with explicit privacy protection.
7. Providing a **curator admin hub** for data health auditing and live feed ingestion.

---

## 🛠 Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, Custom CSS Design System (Warm off-white `#FBF9F5`, deep ink `#111827`, restrained violet `#4F46E5`, subtle teal `#0D9488`).
- **Backend**: Node.js, Express, Sequelize ORM.
- **Database**: PostgreSQL 18 with connection pooling and SSL support.
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing.
- **Feed Adapters**: JSON feeds and `fast-xml-parser` for XML feeds.
- **Testing**: Jest, Supertest.
- **Deployment**: `vercel.json` (Vercel SPA routing) and `render.yaml` (Render Node.js + managed PostgreSQL).

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v26)
- **npm** v9+ (tested on npm v11)
- **PostgreSQL** v14+ (local instance on port `5432` or cloud instance)

### 2. Clone and Setup Environment Variables

```bash
# Clone the repository
git clone https://github.com/harshalnnpednekar/OpportunityX.git
cd OpportunityX

# Backend setup
cd backend
cp .env.example .env

# Frontend setup
cd ../frontend
cp .env.example .env
```

Ensure `backend/.env` has your PostgreSQL connection string:
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx
TEST_DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx_test
JWT_SECRET=your_jwt_secret_key_change_in_production
CLIENT_URL=http://localhost:5173
```

Ensure `frontend/.env` has:
```ini
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Initialize Database & Seed Feeds

OpportunityX includes ~30 realistic, clearly labeled demonstration opportunities across three sample feeds:
- `backend/src/feeds/sample-hackathons.json`
- `backend/src/feeds/sample-competitions.xml`
- `backend/src/feeds/sample-workshops.json`

Run the seeder from `backend/`:
```bash
cd backend
npm install
npm run db:seed
```

#### Demo Credentials:
| Role | Email | Password | Description |
|---|---|---|---|
| **Demo Student** | `alex.chen@university.edu` | `StudentPass123!` | Undergraduate student (CS, Berkeley) with skills, saved opportunities & active roadmap |
| **Curator Admin** | `admin@opportunityx.edu` | `AdminPass123!` | Platform administrator with access to `/admin` Data Health Hub |

---

### 4. Running the Development Servers

#### Terminal 1 (Backend API):
```bash
cd backend
npm run dev
# Running on http://localhost:5000 (API at http://localhost:5000/api)
```

#### Terminal 2 (Frontend Client):
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Automated Testing

OpportunityX includes automated unit and integration tests across:
- **Authentication**: Registration, login, JWT validation, protected routes.
- **Opportunities API**: Search, multi-filtering, pagination, details, view counts.
- **Recommendation Engine**: Deterministic point breakdown, skill overlap detection, format/interest alignment.
- **Eligibility Engine**: Strict academic standing, geographical constraints, age limits.
- **Feed Normalizer & XML Parser**: XML parsing, JSON normalization, deduplication fingerprinting, expired & contradictory date flags.
- **Roadmaps**: 4-phase milestone generation, chronological scheduling, completion progress recalculation.

To run the test suite:
```bash
cd backend
npm test
```

---

## 📡 REST API Specifications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health check |
| `POST` | `/api/auth/register` | Public | Register new student profile |
| `POST` | `/api/auth/login` | Public | Sign in with email and password |
| `GET` | `/api/auth/me` | Protected | Get authenticated user & profile |
| `GET` | `/api/profile` | Protected | Fetch current student profile |
| `PUT` | `/api/profile` | Protected | Update profile, skills, interests & peer consent |
| `GET` | `/api/opportunities` | Optional Auth | Search, multi-filter, sort & paginate catalog |
| `GET` | `/api/opportunities/:id` | Optional Auth | Detailed opportunity overview & diagnostics |
| `GET` | `/api/saved` | Protected | Get tracked opportunities by pipeline status |
| `POST` | `/api/saved` | Protected | Save/track an opportunity |
| `PUT` | `/api/saved/:id` | Protected | Update pipeline status or personal notes |
| `DELETE` | `/api/saved/:id` | Protected | Remove from tracking pipeline |
| `GET` | `/api/saved/timeline` | Protected | Get deadline timeline grouped by urgency |
| `POST` | `/api/roadmaps/generate` | Protected | Generate 4-phase preparation roadmap |
| `GET` | `/api/roadmaps` | Protected | Get all active user roadmaps |
| `GET` | `/api/roadmaps/:id` | Protected | Get single roadmap with milestone checklist |
| `PATCH` | `/api/roadmaps/:rId/tasks/:tId/toggle` | Protected | Toggle milestone completion & recalculate readiness % |
| `GET` | `/api/peer-match/opportunity/:oppId` | Protected | Discover consented peers for an opportunity |
| `POST` | `/api/peer-match/request` | Protected | Send collaboration invite to a peer |
| `GET` | `/api/peer-match/my-matches` | Protected | Get incoming and outgoing collaboration invites |
| `PATCH` | `/api/peer-match/request/:matchId/respond` | Protected | Accept or decline collaboration invite |
| `GET` | `/api/admin/health` | Admin | Catalog health metrics & flagged quarantine items |
| `POST` | `/api/admin/ingest` | Admin | Trigger live feed ingestion (default or custom payload) |
| `GET` | `/api/admin/logs` | Admin | Ingestion run audit history |

---

## 🛡 Ethics, Compliance & Simulation Notice

- **Simulation Environment**: All 30 seed opportunities are explicitly tagged `[DEMO LISTING]` with a disclaimer banner. Seeded examples are never presented as live-verified events.
- **Zero Scraping Policy**: Data is ingested solely via permitted standardized feeds. OpportunityX never scrapes private LinkedIn data, bypasses authentication gates, or retains third-party portal passwords.
- **Explicit Consent for Peer Matching**: A student's profile is strictly private by default. It is only discoverable by peers if the student actively opts in via the explicit consent checkbox in their profile. Consent can be revoked at any time.

---

## 🚢 Deployment Guide

### Deploying Frontend to Vercel
1. Set the project root to `frontend` or use root configuration.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
5. SPA routing rewrites are already configured in `vercel.json`.

### Deploying Backend to Render
1. Use the pre-configured `render.yaml` Blueprint or create a Node Web Service.
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Connect a Render managed PostgreSQL database and attach the `DATABASE_URL` environment variable.