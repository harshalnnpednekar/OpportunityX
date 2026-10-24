# OpportunityX — Backend API & Database Service

The OpportunityX backend is a production-grade REST API built with Node.js, Express, Sequelize ORM, and PostgreSQL. It powers deterministic opportunity matching, eligibility verification, milestone roadmap generation, peer collaboration, and feed ingestion with data quality audits.

---

## 📁 Backend Directory Structure

```
server/
├── src/
│   ├── app.js               # Express application setup & middleware pipeline
│   ├── server.js            # Server entry point & connection lifecycle
│   ├── config/
│   │   └── database.js      # Sequelize instance & PostgreSQL connection pooling
│   ├── controllers/         # Request handling & orchestration
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── notificationController.js
│   │   ├── opportunityController.js
│   │   ├── peerMatchController.js
│   │   ├── profileController.js
│   │   ├── roadmapController.js
│   │   └── savedOpportunityController.js
│   ├── feeds/               # Local sample feed datasets (JSON & XML)
│   ├── middleware/          # Security, validation, rate limiting & error handling
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── requestLogger.js
│   │   └── validators.js
│   ├── migrations/          # 10 sequential Sequelize migrations (001 - 010)
│   ├── models/              # 10 Sequelize data models & relational associations
│   ├── routes/              # Express route modules
│   ├── scripts/             # Database automation CLI scripts (create, migrate, reset)
│   ├── seeders/
│   │   └── seed.js          # Database seeder (demo users & ~30 listings)
│   └── services/            # Pure business logic engines
│       ├── dataHealthAuditor.js
│       ├── eligibilityEngine.js
│       ├── feedImporter.js
│       ├── feedNormalizer.js
│       ├── recommendationEngine.js
│       └── roadmapGenerator.js
├── tests/                   # Automated Jest & Supertest integration test suites
├── .env.example             # Safe placeholder environment configuration
└── package.json             # Backend dependencies & npm scripts
```

---

## 🛠 Setup & Environment Configuration

### 1. Configure `.env`
Create `.env` in the `server/` directory:
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx
TEST_DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/opportunityx_test
JWT_SECRET=your_jwt_secret_key_change_in_production
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### 2. Database Management Scripts
Run these commands from `server/` or root:

```bash
# Create database instance
npm run db:create

# Execute all sequential migrations (001 - 010)
npm run db:migrate

# Seed demo users, ~30 varied opportunities, roadmaps & peer requests
npm run db:seed

# Optional: Clean reset (drops tables and re-migrates cleanly)
npm run db:reset
```

---

## 🗄 Database Models & Schema (Sequelize)

The PostgreSQL database layer defines 10 core relational models with cascade behaviors:

1. **`User`**: `id`, `name`, `email` (unique), `passwordHash`, `role` (`student` / `admin`).
2. **`StudentProfile`**: `userId`, `skills`, `interests`, `budgetMax`, `availability`, `preferredFormat`, `preferredLocation`, `experienceLevel`, `peerMatchingConsent`.
3. **`Opportunity`**: `title`, `organizer`, `description`, `category`, `eventType`, `theme`, `startDate`, `endDate`, `deadline`, `format`, `location`, `costAmount`, `currency`, `teamMin`, `teamMax`, `eligibilityText`, `requiredSkills`, `beginnerFriendly`, `sustainabilityFocused`, `sourceName`, `sourceUrl`, `applicationUrl`, `sourceRecordId`, `lastVerifiedAt`, `status`, `missingFields`, `contradictionFlags`, `normalizedFingerprint`, `trustScore`.
4. **`SavedOpportunity`**: `userId`, `opportunityId`, `reminderEnabled`, `status`, `notes`, `savedAt`. Unique composite key on `[userId, opportunityId]`.
5. **`OpportunityUpdate`**: `opportunityId`, `updateType`, `changeSummary`, `previousValues`, `newValues`, `recordedAt`.
6. **`Notification`**: `userId`, `opportunityId`, `type`, `message`, `readAt`.
7. **`Roadmap`**: `userId`, `opportunityId`, `title`, `targetDeadline`, `progressPercentage`, `status`.
8. **`RoadmapTask`**: `roadmapId`, `phase`, `title`, `description`, `dueDate`, `isCompleted`, `completedAt`, `sortOrder`.
9. **`MatchRequest`**: `opportunityId`, `requesterId`, `recipientId`, `status` (`pending`, `accepted`, `declined`), `message`, `contactPreference`, `contactDetail`.
10. **`FeedImport`**: `sourceName`, `sourceType`, `startedAt`, `finishedAt`, `recordsSeen`, `recordsCreated`, `recordsUpdated`, `duplicatesFound`, `errors`, `status`.

---

## 📡 REST API Specifications

### HTTP Status Code Conventions
- `200 OK`: Successful query, update, or action.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failed, malformed payload, or untrusted path.
- `401 Unauthorized`: Missing, invalid, or expired JWT token.
- `403 Forbidden`: Administrative privileges required or peer consent missing.
- `404 Not Found`: Resource does not exist or user does not own it.
- `409 Conflict`: Unique constraint violation or duplicate pending invite.
- `429 Too Many Requests`: Rate limit exceeded on authentication endpoints.
- `500 Internal Server Error`: Unhandled server exception.

### Security & Middlewares
- **Request Tracking**: Every request and response carries an `X-Request-Id` UUID header.
- **Privacy-Safe Logger**: Redacts `password`, `token`, `secret`, `cookie`, `authorization`, and credentials from console output.
- **Sliding-Window Rate Limiter**: Limits authentication routes (`/api/auth/*`) to 30 requests per 15 minutes per IP.
- **Input Validation**: Uses `express-validator` to validate params, UUIDs, and whitelists.
- **Strict Ownership Checks**: Enforced at the database level (`where: { userId: req.user.id }`).

---

### Endpoint Reference

#### 1. System
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health status and timestamp |

---

#### 2. Authentication and Profile
Rate-limited to 30 requests per 15-minute sliding window per IP.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new account and profile |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password and obtain JWT |
| `POST` | `/api/auth/logout` | Public | Invalidate current session |
| `GET` | `/api/auth/me` | Protected | Get authenticated user & profile |
| `PATCH` | `/api/profile` | Protected | Update profile fields (skills, interests, consent) |

---

#### 3. Opportunities
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/opportunities` | Optional Auth | List opportunities with filtering & pagination |
| `GET` | `/api/opportunities/:id` | Optional Auth | Detailed opportunity overview & match diagnostics |
| `GET` | `/api/opportunities/:id/eligibility` | Optional Auth | Evaluate current profile eligibility against requirements |
| `POST` | `/api/opportunities/:id/save` | Protected | Save opportunity to user tracker |
| `DELETE` | `/api/opportunities/:id/save` | Protected | Remove opportunity from user tracker |
| `GET` | `/api/saved` | Protected | Get all saved opportunities with pipeline notes |

**Query Parameters for `GET /api/opportunities`:**
- `q`: Search keyword across `title`, `description`, `organizer`, `theme`
- `category`: Category / event type filter (`hackathon`, `competition`, `workshop`, `research`)
- `format`: Format filter (`virtual`, `in_person`, `hybrid`)
- `remote`: Boolean (`true` / `false`) filtering remote/virtual opportunities
- `beginnerFriendly`: Boolean (`true` / `false`) filtering beginner-accessible opportunities
- `lowCost`: Boolean (`true` / `false`) filtering free or <= $25 opportunities
- `sustainabilityFocused`: Boolean (`true` / `false`) filtering green/climate themes
- `location`: Location substring filter
- `status`: Opportunity status (`active`, `expired`, `all`; default: `active`)
- `sort`: Sort criterion (`deadline`, `newest`, `title`, `match`)
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `12`, max: `100`)

---

#### 4. Recommendations and Roadmaps
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/recommendations` | Optional Auth | Top matched opportunities tailored to student |
| `POST` | `/api/opportunities/:id/roadmap` | Protected | Generate 4-phase preparation roadmap for opportunity |
| `GET` | `/api/roadmaps` | Protected | List all roadmaps owned by current user |
| `PATCH` | `/api/roadmaps/:id/tasks/:taskId` | Protected | Update task completion & recalculate readiness % |

---

#### 5. Notifications
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Protected | List notifications for authenticated user |
| `PATCH` | `/api/notifications/:id/read` | Protected | Mark notification as read (ownership enforced) |

---

#### 6. Peer Matching
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/peers/matches?opportunityId=` | Protected | Discover consented peers interested in opportunity |
| `POST` | `/api/peers/requests` | Protected | Send collaboration invite to another consented peer |
| `PATCH` | `/api/peers/requests/:id` | Protected | Accept or decline invite (recipient ownership enforced) |

---

#### 7. Admin
Restricted strictly to users with `role: "admin"`. Non-admin accounts receive `403 Forbidden`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/admin/feeds/import` | Admin | Ingest local feed using validated identifier |
| `GET` | `/api/admin/imports` | Admin | Paginated feed ingestion history & metrics |

> **Security Whitelist**: `POST /api/admin/feeds/import` strictly validates against registered local feed identifiers (`sample-json-a`, `sample-xml-a`, `sample-json-b`, `hackathons`, `competitions`, `workshops`). Raw filesystem paths, path traversal sequences (`../`), or untrusted strings are rejected with `400 Bad Request`.

---

## 🧪 Testing

The test suite runs against the test database using Jest and Supertest:

```bash
# Run all server test suites
npm test

# Run a specific test suite
npx jest tests/restApi.test.js
```

Current test status: **9 test suites passed, 73 total tests passed**.
