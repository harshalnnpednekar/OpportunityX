# OpportunityX — Intelligent Discovery of Practical Learning Opportunities

> An editorial-style, production-minded platform that consolidates permitted collegiate hackathons, competitions, fellowships, workshops, and research opportunities into one searchable catalog with deterministic match scoring, strict eligibility verification, preparation roadmaps, and consent-based peer collaboration.

---

## 📁 Repository Structure

```
OpportunityX/
├── client/                     # Frontend client (React 18 + Vite + Custom CSS)
│   ├── .env.example            # Sample frontend environment file
│   ├── index.html              # HTML entry point
│   ├── package.json            # Client dependencies & scripts
│   ├── vite.config.js          # Vite config with /api development proxy
│   └── src/
│       ├── main.jsx            # React root mount point
│       ├── App.jsx             # Top-level routing & layout
│       ├── components/         # Reusable UI widgets & badges
│       ├── context/            # Authentication & toast alert providers
│       ├── pages/              # Catalog, detail, roadmap, matching pages
│       ├── services/api.js     # API client configured for Vite proxy
│       └── styles/             # Curated warm editorial design system
│
├── server/                     # Backend API server (Node.js + Express + Sequelize ORM)
│   ├── .env.example            # Sample backend environment file
│   ├── package.json            # Server dependencies & scripts
│   ├── src/
│   │   ├── app.js              # Express app configuration & middleware
│   │   ├── server.js           # Server entry point & database sync
│   │   ├── config/database.js  # PostgreSQL Sequelize connection pooling
│   │   ├── controllers/        # Route controllers
│   │   ├── feeds/              # Permitted demo seed datasets (JSON & XML)
│   │   ├── middleware/         # Auth, Admin, ErrorHandler, RequestLogger
│   │   ├── models/             # Sequelize data models
│   │   ├── routes/             # REST API routers & /api/health
│   │   ├── seeders/seed.js     # Seeder for demo opportunities & users
│   │   └── services/           # Recommendation, eligibility, ingestion engines
│   └── tests/                  # Jest & Supertest automated test suites
│
├── package.json                # Root workspace configuration with concurrent runners
├── render.yaml                 # Render Blueprint deployment configuration
├── vercel.json                 # Vercel SPA routing deployment configuration
└── README.md                   # Complete setup and development guide
```

---

## 🛠 Technology Stack

- **Client (`client/`)**: React 18, Vite, React Router v6, Lucide Icons, Custom Editorial CSS Design System (Warm off-white `#FBF9F5`, deep ink `#111827`, restrained violet `#4F46E5`, subtle teal `#0D9488`).
- **Server (`server/`)**: Node.js, Express, Sequelize ORM.
- **Database**: PostgreSQL 14+ with connection pooling and SSL support.
- **Security & Privacy**:
  - Environment-driven dynamic CORS.
  - Safe request logger redacting passwords, tokens, cookies, and sensitive fields.
  - Centralized error handler with consistent JSON error envelopes.
  - JWT (JSON Web Tokens) with `bcryptjs` password hashing.
- **Feed Adapters**: Standardized JSON feeds and `fast-xml-parser` for XML feeds.
- **Testing**: Jest, Supertest.
- **Deployment**: `vercel.json` (Vercel SPA routing) and `render.yaml` (Render Node.js + managed PostgreSQL).

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v26)
- **npm** v9+ (tested on npm v11)
- **PostgreSQL** v14+ (local instance on port `5432` or cloud instance)

### 2. Environment Variables Setup

Copy the example environment files for both client and server:

```bash
# Server environment setup
cp server/.env.example server/.env

# Client environment setup
cp client/.env.example client/.env
```

#### `server/.env` Configuration:
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx
TEST_DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx_test
JWT_SECRET=your_jwt_secret_key_change_in_production
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

#### `client/.env` Configuration:
```ini
# Defaults to '/api' to use Vite development proxy to Express backend
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:5000
```

---

### 3. Install Dependencies

You can install all dependencies from the root repository:

```bash
# Install root, server, and client dependencies
npm run install:all
```

Or install them individually:

```bash
# Root tooling
npm install

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

---

### 4. Initialize Database & Seed Demo Data

OpportunityX includes ~30 realistic, clearly labeled demonstration opportunities across three sample feeds:
- `server/src/feeds/sample-hackathons.json`
- `server/src/feeds/sample-competitions.xml`
- `server/src/feeds/sample-workshops.json`

Run the seeder from `server/`:
```bash
npm run db:seed --prefix server
# Or: cd server && npm run db:seed
```

#### Demo Credentials:
| Role | Email | Password | Description |
|---|---|---|---|
| **Demo Student** | `alex.chen@university.edu` | `StudentPass123!` | Undergraduate student (CS, Berkeley) with skills, saved opportunities & active roadmap |
| **Curator Admin** | `admin@opportunityx.edu` | `AdminPass123!` | Platform administrator with access to `/admin` Data Health Hub |

---

### 5. Running the Application

#### Option A: Unified Root Command (Launches Server & Client Concurrently)
```bash
npm run dev
```
- Server starts on: **http://localhost:5000**
- Client starts on: **http://localhost:5173** (with `/api` proxied to port 5000)

#### Option B: Independent Terminals

##### Terminal 1 (Backend API Server):
```bash
npm run dev:server
# Or: cd server && npm run dev
```
Health Check: `http://localhost:5000/api/health`

##### Terminal 2 (Frontend Client):
```bash
npm run dev:client
# Or: cd client && npm run dev
```
Client Application: `http://localhost:5173`

---

## 📜 Complete npm Scripts Reference

### Root Directory Scripts:
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `concurrently ...` | Launch both server and client dev servers concurrently |
| `npm run dev:server` | `npm run dev --prefix server` | Start Express server in watch mode |
| `npm run dev:client` | `npm run dev --prefix client` | Start Vite dev server with `/api` proxy |
| `npm run build` | `npm run build --prefix client` | Build production client bundle |
| `npm start` | `npm start --prefix server` | Run production Express server |
| `npm test` | `npm run test --prefix server` | Run server test suite with Jest |
| `npm run lint` | Server check & client build check | Lint & validate syntax across workspace |
| `npm run install:all` | Installs root, server, and client packages | Convenience multi-package install |

### Server Directory Scripts (`server/`):
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `node --watch src/server.js` | Express dev server with native node watch |
| `npm start` | `node src/server.js` | Express production server |
| `npm test` | `jest --runInBand ...` | Run test suite |
| `npm run lint` | `node --check ...` | Syntax and import sanity check |
| `npm run db:seed` | `node src/seeders/seed.js` | Ingest seed feeds and create demo accounts |

### Client Directory Scripts (`client/`):
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Start Vite dev server on port 5173 |
| `npm run build` | `vite build` | Compile optimized production bundle to `dist/` |
| `npm run preview` | `vite preview` | Preview production build locally |
| `npm run lint` | `vite build --mode development` | Check module resolution and JSX syntax |

---

## 🔒 Express Server Architecture & Features

The Express backend (`server/src/app.js`) implements production-ready middleware:

1. **Request Body Parsing**:
   - `express.json({ limit: '5mb' })`
   - `express.urlencoded({ extended: true })`
2. **CORS Configuration**:
   - Environment-driven via `CLIENT_URL` / `CORS_ORIGIN` (supports comma-separated origins).
   - Allows CLI tools, curl, and testing agents while permitting local development ports.
3. **Privacy-Safe Request Logger** (`server/src/middleware/requestLogger.js`):
   - Logs HTTP method, path, response status, and duration (ms).
   - Recursively sanitizes request payloads to strip sensitive keys (`password`, `token`, `secret`, `authorization`, `creditcard`, `ssn`, `cookie`, etc.).
   - Replaces all sensitive values with `[REDACTED]`.
4. **Centralized Error Handling** (`server/src/middleware/errorHandler.js`):
   - Intercepts Sequelize validation errors, unique constraint errors, JSON syntax parsing errors, and CORS blocks.
   - Outputs standardized JSON envelopes: `{ error: string, details?: string[] }`.
   - Suppresses stack traces in production.
5. **Not-Found API Handler**:
   - Catches unhandled routes and returns 404 with structured JSON: `{ error: "Endpoint not found: METHOD /path" }`.
6. **Health Check Endpoint** (`GET /api/health`):
   - Returns:
     ```json
     {
       "name": "OpportunityX Platform API",
       "status": "ok",
       "service": "OpportunityX REST API",
       "timestamp": "2026-10-24T08:25:00.000Z"
     }
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

To run the test suites:
```bash
# Run tests from root
npm test

# Run a specific unit test
cd server && npm test -- tests/eligibility.test.js
```

---

## 📡 REST API Specifications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health check with name, status & timestamp |
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

### Deploying Client to Vercel
1. Set the project root to `client` or use root configuration.
2. Build command: `npm run build` (or root `vercel.json`).
3. Output directory: `dist`
4. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
5. SPA routing rewrites are configured in `vercel.json`.

### Deploying Server to Render
1. Use the pre-configured `render.yaml` Blueprint or create a Node Web Service.
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Connect a Render managed PostgreSQL database and attach the `DATABASE_URL` environment variable.