# OpportunityX — Intelligent Student Opportunity Discovery Platform

> A production-ready, full-stack educational platform that consolidates permitted collegiate hackathons, competitions, workshops, and research opportunities into an intelligent catalog featuring deterministic match scoring, independent eligibility evaluation, editable milestone roadmaps, in-app deadline reminders, and privacy-preserving peer collaboration.

---

## 1. Project Overview & Problem Statement

University students frequently miss out on high-impact extracurricular opportunities—such as hackathons, research fellowships, academic competitions, and hands-on technical workshops—due to fragmented announcement boards, confusing eligibility requirements, hidden fee structures, and last-minute application deadlines.

Existing search portals often rely on unexplainable "black-box" AI recommendations or aggressive web scraping without organizer attribution. **OpportunityX** solves this by providing:
1. **Explainable Deterministic Matching**: Transparent scoring based on student skills, interests, budget, and availability without requiring paid LLM or external AI API keys.
2. **Zero-Inference Eligibility Engine**: Strict checks against explicit criteria; never assumes or fabricates requirements.
3. **8-Stage Preparation Roadmaps**: Structured, editable runway milestones from eligibility auditing to 24-hour deadline buffers.
4. **Consent-Based Peer Collaboration**: An opt-in networking system where student contact information remains locked and private until mutual acceptance.
5. **Multi-Source Ingestion & Data Quality Audits**: Automated normalization of JSON and XML fixtures with fingerprint deduplication, contradiction auditing, and change tracking.

---

## 2. Main Features & User Journeys

### Student Journeys
- **Registration & Profile Setup**: Create an account, manage technical skills, interests, maximum budget, availability, preferred format (virtual, in-person, hybrid), and explicit collaboration consent.
- **Catalogue Search & Multi-Filter**: Search by keyword or apply multi-factor filters: category, format, remote-only, beginner-friendly, low-cost ($\le \$25$), sustainability-focused, location, status (active/expired), sort order (deadline, newest, title, relevance), and server-side pagination.
- **Detailed Opportunity Overview & Match Diagnostics**: Inspect full event specifications, source provenance, transparent scoring breakdown with mathematical formulas, missing profile data impact, and independent admission eligibility checks.
- **Application Pipeline Tracker**: Save opportunities into personalized tracking buckets (`saved`, `planning`, `applied`, `accepted`) with private notes and duplicate prevention.
- **Automated Milestone Roadmaps**: Generate an 8-phase milestone checklist tailored to the opportunity type (hackathon, competition, workshop, research). Check off tasks to dynamically recalculate readiness progress.
- **In-App Deadline Reminders & Change Notices**: Receive automated in-app alerts for listings closing within 7 days, as well as notices when an organizer extends a deadline, updates fees, or alters format.
- **Privacy-Preserving Peer Collaboration**: Browse fellow students who saved the same listing and opted into discovery. Inspect skill compatibility explanations, send collaboration requests, and unlock direct contact details only after mutual acceptance.

### Administrator Journeys
- **Data Health & Ingestion Hub**: Monitor database freshness, catalog completeness, expired listings, and contradiction flags.
- **Feed Ingestion Pipeline**: Ingest whitelisted local sample feeds (JSON and XML) on demand, inspect real-time logs, verify fingerprint deduplication, and audit update detection.

---

## 3. Architecture & Directory Structure

OpportunityX is architected with a decoupled frontend single-page application (SPA), a stateless REST API, and a relational PostgreSQL database.

```
OpportunityX/
├── client/                     # Frontend Application (React 18, Vite, Custom Editorial CSS)
│   ├── public/                 # Static public assets & favicon
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, FilterBar, OpportunityCard, Badges)
│   │   ├── context/            # Global React state (AuthContext, ToastContext)
│   │   ├── pages/              # Primary route views
│   │   │   ├── LandingPage.jsx         # Hero showcase, value proposition & stats
│   │   │   ├── CataloguePage.jsx       # Multi-filter search grid & pagination
│   │   │   ├── OpportunityDetailPage.jsx# Complete specs, match breakdown & eligibility
│   │   │   ├── DashboardPage.jsx       # Real-time metrics, pipeline, deadlines & unread notices
│   │   │   ├── ProfilePage.jsx         # Profile editing, skill chips & consent toggles
│   │   │   ├── SavedPage.jsx           # Pipeline stages (saved, planning, applied, accepted)
│   │   │   ├── RoadmapsPage.jsx        # 8-phase milestone checklists & readiness tracking
│   │   │   ├── PeerMatchingPage.jsx    # Consent-based candidate discovery & invite workflows
│   │   │   ├── AdminPage.jsx           # Ingestion controls, data audits & execution history
│   │   │   ├── LoginPage.jsx           # Secure authentication
│   │   │   ├── RegisterPage.jsx        # Account creation & profile initialization
│   │   │   └── NotFoundPage.jsx        # 404 handler
│   │   ├── services/
│   │   │   └── api.js          # Centralized fetch client with JWT token & cookie handling
│   │   ├── styles/             # Curated warm editorial CSS design system (tokens, layouts)
│   │   ├── App.jsx             # Route definitions & layout shell
│   │   └── main.jsx            # React root bootstrap
│   ├── .env.example            # Client environment configuration template
│   ├── index.html              # HTML entry point with Inter & Google Fonts
│   ├── package.json            # Client dependencies & scripts
│   └── vite.config.js          # Vite config with /api development proxy
│
├── server/                     # Backend REST API (Node.js, Express, Sequelize, PostgreSQL)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # Sequelize instance & PostgreSQL pooling
│   │   ├── controllers/        # Express route controllers
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── notificationController.js
│   │   │   ├── opportunityController.js
│   │   │   ├── peerMatchController.js
│   │   │   ├── profileController.js
│   │   │   ├── roadmapController.js
│   │   │   └── savedOpportunityController.js
│   │   ├── feeds/              # Local demonstration fixtures (JSON & XML)
│   │   │   ├── sample-hackathons.json   # JSON Feed A (hackathon registry schema)
│   │   │   ├── sample-workshops.json    # JSON Feed B (workshop registry schema)
│   │   │   └── sample-competitions.xml  # XML Feed C (academic competition tree)
│   │   ├── middleware/         # Security, validation, logging & rate limiting
│   │   │   ├── admin.js        # Admin authorization guard (403 Forbidden for non-admins)
│   │   │   ├── auth.js         # JWT verification (supports Bearer headers and httpOnly cookies)
│   │   │   ├── errorHandler.js # Centralized JSON error response handler
│   │   │   ├── rateLimiter.js  # Sliding-window rate limiter for auth routes
│   │   │   ├── requestLogger.js# Redacted HTTP request & audit logger
│   │   │   └── validators.js   # express-validator schemas for params, queries, and bodies
│   │   ├── migrations/         # 10 sequential Sequelize migrations (001 - 010)
│   │   ├── models/             # 10 relational Sequelize data models
│   │   ├── routes/             # Express API route modules
│   │   ├── scripts/            # CLI database automation (createDb, migrate, resetDb)
│   │   ├── seeders/
│   │   │   └── seed.js         # Database seeder (demo users, ~30 listings, roadmaps, matches)
│   │   ├── services/           # Deterministic business logic engines
│   │   │   ├── dataHealthAuditor.js     # Quality auditing & contradiction detection
│   │   │   ├── eligibilityEngine.js     # Independent 5-state admission eligibility evaluator
│   │   │   ├── feedImporter.js          # Feed ingestion, change detection & audit logging
│   │   │   ├── feedNormalizer.js        # Safe XML & JSON multi-schema normalizer
│   │   │   ├── recommendationEngine.js  # Multi-factor score calculator with weight re-normalization
│   │   │   ├── roadmapGenerator.js      # 8-phase preparation plan builder
│   │   │   └── trustSignalEngine.js     # Objective data-health & freshness scoring
│   │   ├── utils/
│   │   │   └── fixtureReader.js         # Safe Node.js stream & buffer reader
│   │   ├── app.js              # Express app setup, CORS, cookies & middleware pipeline
│   │   └── server.js           # Server lifecycle entry point
│   ├── tests/                  # 8 automated Jest & Supertest test suites (153 tests)
│   ├── .env.example            # Server environment configuration template
│   └── package.json            # Server dependencies, Jest config & scripts
│
├── .gitignore                  # Git exclusion rules (.env, node_modules, dist, logs)
├── package.json                # Root orchestration scripts
├── render.yaml                 # Render cloud deployment blueprint (Express API + Managed DB)
├── vercel.json                 # Vercel cloud deployment config (Vite SPA rewrites)
└── README.md                   # Main documentation & verification guide
```

---

## 4. Technology Stack & Technical Rationale

| Layer | Technology | Technical Purpose & Rationale |
|---|---|---|
| **Frontend Framework** | React 18 | Declarative component hierarchy, custom hooks, and concurrent DOM rendering. |
| **Build Tool & Dev Server**| Vite 6 | Sub-second HMR during development and optimized Rollup production bundling. |
| **Routing** | React Router DOM v6 | Single-page application client-side routing, query parameter synchronization, and protected route guards. |
| **Icons & UI Primitives** | Lucide React | Lightweight, accessible SVG icons with zero runtime framework overhead. |
| **Styling** | Vanilla CSS Tokens | Custom editorial design system with consistent design tokens for typography, spacing, elevations, and responsive breakpoints. |
| **Backend Runtime** | Node.js (v18+) | Non-blocking, event-driven JavaScript runtime with native streams and buffers. |
| **Web Server Framework** | Express 4 | Lightweight, extensible HTTP server pipeline with modular routers and middleware. |
| **Database & ORM** | PostgreSQL & Sequelize 6 | Robust relational persistence with ACID transactions, foreign keys, cascade constraints, and migrations. |
| **Authentication & Crypto** | JSON Web Tokens & bcryptjs | Stateless JWT bearer tokens with work-factored bcrypt password hashing. |
| **Validation & Sanitization** | express-validator | Request body, query string, and UUID parameter verification rejecting malformed inputs. |
| **XML Parser** | fast-xml-parser | Secure XML parsing with entity expansion (XXE) and script execution disabled. |
| **Automated Testing** | Jest & Supertest | Comprehensive unit and integration test runner executing in-band against isolated PostgreSQL instances. |

---

## 5. Prerequisites

Before installing OpportunityX, ensure your environment has the following installed:
- **Node.js**: `v18.0.0` or higher (tested on Node `v20` and `v26`).
- **npm**: `v9.0.0` or higher.
- **PostgreSQL**: `v14.0` or higher running locally on port `5432` or accessible via a hosted connection URI.

Verify your local tools:
```bash
node -v
npm -v
psql --version
```

---

## 6. Installation Guide

Clone the repository and install all dependencies for the root, server, and client:

```bash
# 1. Clone repository
git clone https://github.com/harshalnnpednekar/OpportunityX.git
cd OpportunityX

# 2. Install all dependencies across root, server, and client
npm run install:all
```

Alternatively, install manually in each folder:
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

---

## 7. Environment Variable Configuration

### Backend Environment (`server/.env`)
Create `server/.env` by copying the example file:
```bash
cp server/.env.example server/.env
```

Configure `server/.env`:
```ini
# Node Environment
NODE_ENV=development

# Server Port
PORT=5000

# PostgreSQL Connection Strings
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/opportunityx
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/opportunityx_test

# JWT Secret (Use a strong 256-bit random string in production)
JWT_SECRET=opportunityx_super_secret_jwt_key_2026_production_grade

# Allowed Frontend Origins (comma-separated list for CORS)
CLIENT_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173
```

### Frontend Environment (`client/.env`)
Create `client/.env` by copying the example file:
```bash
cp client/.env.example client/.env
```

Configure `client/.env`:
```ini
# Primary API Base URL
# Option 1: Use Vite development proxy (recommended locally)
VITE_API_BASE_URL=/api

# Option 2: Target backend directly or deployed URL
# VITE_API_BASE_URL=https://opportunityx-api.onrender.com/api

# Vite dev server proxy target
VITE_PROXY_TARGET=http://localhost:5000
```

---

## 8. Database Setup, Migrations & Seeding

Ensure your PostgreSQL service is running, then execute the database automation scripts from the project root:

```bash
# 1. Create the database instances (development and test databases)
npm run db:create

# 2. Run all 10 sequential migrations (001 - 010)
npm run db:migrate

# 3. Seed demo users, ~30 opportunities across 3 feeds, roadmaps & peer requests
npm run db:seed
```

### Clean Database Reset (Optional)
To drop all tables and re-run migrations and seeds from scratch:
```bash
npm run db:reset
```

### Demo Accounts Seeded

| Role | Email | Password | Pre-populated Data |
|---|---|---|---|
| **Demo Student** | `alex.chen@university.edu` | `StudentPass123!` | Berkeley CS student with verified skills, 2 active roadmaps, saved tracker, and incoming peer requests |
| **Admin Curator** | `admin@opportunityx.edu` | `AdminPass123!` | System administrator with full access to Data Health Hub and Feed Ingestion |
| **Peer Student 1** | `marcus.vance@university.edu`| `StudentPass123!` | Consented peer matching Python/AI/Climate opportunities |
| **Peer Student 2** | `elena.rostova@university.edu`| `StudentPass123!` | Consented peer matching React/TypeScript/UI opportunities |
| **Private Student**| `charlie.private@university.edu`| `StudentPass123!`| Non-consented student (strictly hidden from candidate discovery) |

---

## 9. Starting the Application

### Option A: Run Both Concurrently (Recommended)
Launch both the Express backend (`http://localhost:5000`) and the Vite frontend (`http://localhost:5173`) with a single command from the root directory:

```bash
npm run dev
```

### Option B: Run Individually in Separate Terminals
```bash
# Terminal 1: Express Backend
npm run dev:server
# or: cd server && npm run dev

# Terminal 2: Vite Frontend Client
npm run dev:client
# or: cd client && npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 10. Running Tests, Linting & Production Builds

### 1. Run Automated Test Suite
OpportunityX includes 12 automated test suites covering unit logic, integration workflows, security bounds, and edge cases:

```bash
# Run all tests from root
npm test

# Or run directly in server
cd server && npm test
```

Current test status: **12 test suites passed, 167 total tests passed (0 failures)**.

### 2. Run Syntax & Build Linting
Validates JavaScript syntax on server entry points and verifies client JSX compilation:

```bash
npm run lint
```

### 3. Build Production Bundle
Generates the optimized production frontend build in `client/dist/`:

```bash
npm run build
```

---

## 11. REST API Endpoint Reference

All endpoints return JSON responses. Protected endpoints accept authentication via an `Authorization: Bearer <token>` header or an `httpOnly` session cookie.

### System & Health
- `GET /api/health` — Public health check returning service status, environment, and timestamp.

### Authentication & Student Profile
- `POST /api/auth/register` — Register a new student account and create an initial profile.
- `POST /api/auth/login` — Authenticate credentials and receive a JWT token and secure cookie.
- `POST /api/auth/logout` — Clear session cookies and invalidate active session.
- `GET /api/auth/me` — Retrieve the currently authenticated user and profile (`requireAuth`).
- `PATCH /api/profile` — Update technical skills, interests, budget, availability, and consent settings (`requireAuth`).

### Opportunity Catalog & Detail
- `GET /api/opportunities` — Query catalog listings with filtering, sorting, and pagination.
  - Query parameters: `q`, `category`, `format`, `remote`, `beginnerFriendly`, `lowCost`, `sustainabilityFocused`, `location`, `status`, `sort`, `page`, `limit`.
- `GET /api/opportunities/:id` — Retrieve full opportunity specifications, formulaic match scores, and eligibility diagnostics.
- `GET /api/opportunities/:id/eligibility` — Independent admission eligibility check (`requireAuth`).
- `POST /api/opportunities/:id/save` — Save or update tracking status in the student's pipeline (`requireAuth`).
- `DELETE /api/opportunities/:id/save` — Remove opportunity from saved pipeline (`requireAuth`).

### Recommendations & Roadmaps
- `GET /api/recommendations` — Deterministic recommendations ranked by match relevance with weight re-normalization (`requireAuth`).
- `POST /api/roadmaps/generate` — Generate an 8-phase preparation plan for a selected opportunity (`requireAuth`).
- `GET /api/roadmaps` — List all preparation roadmaps owned by the authenticated student (`requireAuth`).
- `GET /api/roadmaps/:id` — Retrieve a specific roadmap with all milestone tasks (`requireAuth`).
- `PATCH /api/roadmaps/:id/tasks/:taskId` — Toggle milestone task completion and recalculate progress percentage (`requireAuth`).
- `DELETE /api/roadmaps/:id` — Delete a preparation roadmap (`requireAuth`).

### In-App Notifications & Reminders
- `GET /api/notifications` — Retrieve student notifications and auto-evaluate approaching deadlines (`requireAuth`).
- `POST /api/notifications/refresh-reminders` — Manually trigger in-app deadline evaluation for saved listings (`requireAuth`).
- `PATCH /api/notifications/:id/read` — Mark an owned notification as read (`requireAuth`).

### Peer Collaboration & Privacy
- `GET /api/peers/matches?opportunityId=` — Discover consented peers interested in the opportunity with redacted emails (`requireAuth`).
- `GET /api/peers/requests` — List incoming and outgoing collaboration invites (`requireAuth`).
- `POST /api/peers/requests` — Send a collaboration invite to a consented peer (`requireAuth`).
- `PATCH /api/peers/requests/:id` — Accept or decline an invite; unmasks contact details upon acceptance (`requireAuth`).
- `POST /api/peers/consent` — Enable collaboration discovery consent (`requireAuth`).
- `DELETE /api/peers/consent` — Withdraw collaboration consent, hide profile, and auto-decline pending invites (`requireAuth`).

### Admin Tools & Data Health (Restricted to `role: "admin"`)
- `GET /api/admin/health` — Ingestion metrics, listing freshness, and contradiction audit summaries.
- `POST /api/admin/feeds/import` — Ingest a whitelisted local sample feed (`sample-json-a`, `sample-json-b`, `sample-xml-a`, or `all`).
- `GET /api/admin/imports` — Paginated feed ingestion history and record counts.

---

## 12. Testing API Endpoints Using curl

### 1. Check Server Health
```bash
curl -X GET http://localhost:5000/api/health
```

### 2. Authenticate as Demo Student
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex.chen@university.edu","password":"StudentPass123!"}'
```

Copy the `token` string from the JSON response to use in the subsequent calls:
```bash
export TOKEN="<paste_jwt_token_here>"
```

### 3. Retrieve Authenticated User Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Search Filtered Opportunities
```bash
curl -X GET "http://localhost:5000/api/opportunities?q=AI&remote=true&beginnerFriendly=true&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Refresh In-App Deadline Reminders
```bash
curl -X POST http://localhost:5000/api/notifications/refresh-reminders \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Query Peer Matches (Consent Required)
```bash
# Substitute with a valid opportunity UUID from step 4
curl -X GET "http://localhost:5000/api/peers/matches?opportunityId=<OPPORTUNITY_UUID>" \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Trigger Admin Feed Ingest (Admin Account Required)
```bash
# 1. Login as Admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opportunityx.edu","password":"AdminPass123!"}' | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

# 2. Trigger Ingestion
curl -X POST http://localhost:5000/api/admin/feeds/import \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feedId":"sample-json-a"}'
```

---

## 13. Troubleshooting Common Issues

### Database Connection Failure
- **Symptom**: `SequelizeConnectionRefusedError: connect ECONNREFUSED 127.0.0.1:5432`.
- **Resolution**: Verify that your PostgreSQL service is running (`pg_isready` or check Windows Services). Ensure the credentials in `server/.env` (`DATABASE_URL`) match your local PostgreSQL username and password.

### Port Already in Use (`EADDRINUSE: 5000` or `5173`)
- **Symptom**: `Error: listen EADDRINUSE: address already in use :::5000`.
- **Resolution**: A previous server instance is still bound to the port. On Windows PowerShell, find and terminate the process:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
  ```
  Or change `PORT=5001` in `server/.env`.

### CORS Blocked Errors
- **Symptom**: `CORS blocked for origin: http://localhost:5173`.
- **Resolution**: Ensure `CORS_ORIGIN` and `CLIENT_URL` in `server/.env` match the frontend URL (`http://localhost:5173`). In production, configure the exact deployed domain (e.g. `https://opportunityx.vercel.app`). Wildcards (`*`) are disallowed when `credentials: true` is active.

### Missing Test Database
- **Symptom**: Jest tests error with `database "opportunityx_test" does not exist`.
- **Resolution**: Run `npm run db:create` from the project root. This creates both the primary `opportunityx` database and the `opportunityx_test` database automatically.

---

## 14. Cloud Deployment Steps

### Frontend Deployment (Vercel)
The client includes [vercel.json](file:///c:/Users/harsh/OpportunityX/vercel.json) to handle single-page application client-side routing.
1. Connect your GitHub repository to Vercel.
2. Set the **Root Directory** to `client`.
3. Set the **Build Command** to `npm run build`.
4. Set the **Output Directory** to `dist`.
5. Set the Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com/api`
6. Deploy.

### Backend & Database Deployment (Render)
The repository includes a ready-to-deploy [render.yaml](file:///c:/Users/harsh/OpportunityX/render.yaml) blueprint:
1. Create a new **Blueprint** project on Render connected to this repository.
2. Render provisions:
   - A managed PostgreSQL instance (`opportunityx-db`).
   - A web service running the Express API (`opportunityx-api`).
3. The build and migration sequence runs automatically:
   - Build Command: `cd server && npm install`
   - Release Command: `npm run db:migrate --prefix server && npm run db:seed --prefix server`
   - Start Command: `npm start --prefix server`
4. Set Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A generated 256-bit secure secret.
   - `CORS_ORIGIN`: Your deployed Vercel URL (e.g. `https://opportunityx.vercel.app`).
   - `DATABASE_URL`: Linked automatically to the managed database.