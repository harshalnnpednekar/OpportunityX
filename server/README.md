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
| `POST` | `/api/opportunities/:id/roadmap` | Protected | Generate structured preparation roadmap for opportunity |
| `POST` | `/api/roadmaps/generate` | Protected | Generate 8-stage preparation roadmap with explicit requirement milestones |
| `GET` | `/api/roadmaps` | Protected | List all roadmaps owned by current user |
| `GET` | `/api/roadmaps/:id` | Protected | Retrieve specific roadmap with all milestone tasks |
| `PATCH` | `/api/roadmaps/:id/tasks/:taskId` | Protected | Toggle task completion and recalculate readiness % |
| `DELETE` | `/api/roadmaps/:id` | Protected | Delete roadmap owned by user |

**Roadmap Preparation Stages**:
Generated roadmaps consist of 8 tailored sequential milestones:
1. Eligibility Verification & Requirement Review (inspects explicit criteria before committing effort)
2. Team Formation & Scope Definition (matches team constraints and problem statement)
3. Skill Preparation & Toolchain Setup (addresses skill runway and developer environment)
4. Milestone Planning & Solution Architecture (schedules deliverables and architecture)
5. Core Implementation & Prototype Testing (builds MVP and validates functionality)
6. Application Preparation & Documentation (gathers pitch, demo links, and deliverables)
7. Pre-Submission Checklist & Final Polish (verifies rubrics, assets, and licenses)
8. Deadline Buffer & Submission Checkpoint (establishes a 24-hour pre-deadline safety buffer)

---

#### 5. Notifications & In-App Deadline Reminders
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Protected | List notifications and auto-evaluate approaching deadlines |
| `POST` | `/api/notifications/refresh-reminders` | Protected | Explicitly trigger deadline evaluation for saved listings |
| `PATCH` | `/api/notifications/:id/read` | Protected | Mark notification as read (ownership enforced) |

**In-App Deadline Reminder Behavior**:
- **Evaluation Window**: Opportunities tracked in the student's saved list with application deadlines occurring within 7 days are identified.
- **Deduplication**: Reminders are generated with a 24-hour deduplication threshold to prevent notification noise.
- **Evaluation Triggers**: Reminders are refreshed during notification retrieval (`GET /api/notifications`) and on demand via `POST /api/notifications/refresh-reminders`.
- **Delivery Scope**: All deadline reminders and change notices are delivered exclusively via the in-app notification center and student dashboard. OpportunityX does not claim external email, SMS, or browser push delivery.

---

#### 6. Peer Matching & Privacy Protections
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/peers/matches?opportunityId=` | Protected | Discover consented peers interested in opportunity |
| `GET` | `/api/peers/requests` | Protected | List incoming and outgoing collaboration invites |
| `POST` | `/api/peers/requests` | Protected | Send collaboration invite to another consented peer |
| `PATCH` | `/api/peers/requests/:id` | Protected | Accept or decline invite (recipient ownership enforced) |
| `POST` | `/api/peers/consent` | Protected | Update peer collaboration consent setting |
| `DELETE` | `/api/peers/consent` | Protected | Withdraw consent, hide profile, and auto-decline pending invites |

**Privacy Guarantees**:
- **Strict Opt-In**: Students appear in peer candidate queries only after explicitly granting collaboration consent (`peerMatchingConsent: true` or `isPublicForMatching: true`).
- **Contact Redaction**: Candidate discovery responses redact user email addresses and personal contact details at the database query level.
- **Mutual Disclosure**: Contact details are shared only after an invite is explicitly accepted by the recipient.
- **Consent Withdrawal**: Withdrawing consent immediately hides the user from candidate pools and marks unresolved collaboration invites as declined.

---

#### 7. Admin
Restricted strictly to users with `role: "admin"`. Non-admin accounts receive `403 Forbidden`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/admin/feeds/import` | Admin | Ingest local feed using validated identifier |
| `GET` | `/api/admin/imports` | Admin | Paginated feed ingestion history & metrics |

#### 8. Data Import Pipeline Architecture
- **Three Sample Local Fixtures**:
  - `sample-hackathons.json` (JSON Feed A): standard collegiate items schema.
  - `sample-workshops.json` (JSON Feed B): distinct workshop registry schema demonstrating alternative keys, nested tuition objects, and delivery modes.
  - `sample-competitions.xml` (XML Feed C): academic XML tree structure parsed safely with entity expansion (XXE) disabled.
- **Normalization Engine**: Normalizes whitespace, title/organizer capitalization, dates, formats (`virtual`, `in-person`, `hybrid`), locations, and cost structures.
- **Conservative Merging & Review Queue**: Exact matches on normalized fingerprint (title, organizer, event date) or source record ID are updated or linked. Uncertain matches with high title similarity are routed to the flagged review queue rather than destructively merged.
- **Idempotency & Change Notices**: Repeated ingestion runs do not create duplicates (`recordsUpdated` increments, `recordsCreated` remains 0). Meaningful changes to deadlines, costs, formats, or links generate `OpportunityUpdate` audit records and notify students who saved the listing.
- **Streams, Buffers & EventEmitter**: Fixture reading utilizes safe Node.js streams and buffers confined to allowed directories. An EventEmitter broadcasts `import:started`, `import:completed`, and `import:error` events.
- **DEMO/SAMPLE Labeling**: All fixtures are explicitly labeled as demonstration datasets. No external scraping or unauthorized access is performed.

---

#### 9. Deterministic Recommendation Engine & Dynamic Weight Normalization
The recommendation engine operates completely deterministically without requiring an LLM or paid AI API. It ranks opportunities using a transparent multi-factor scoring model.

**Configurable Baseline Weights**:
- Skill Overlap: 30% (`0.30`)
- Interest / Category Overlap: 25% (`0.25`)
- Format, Location, and Availability Fit: 15% (`0.15`)
- Budget Fit: 15% (`0.15`)
- Experience Level or Beginner Suitability: 10% (`0.10`)
- Sustainability Preference: 5% (`0.05`)

**Dynamic Weight Re-Normalization**:
When a student profile omits preferences (such as budget, preferred format, preferred location, or sustainability interest), missing profile attributes are excluded from the denominator rather than penalizing the student with a score of zero.
- Active Weight Sum: The engine sums the weights of all criteria where the student has provided profile data.
- Normalized Weight Calculation: Each active criterion weight is divided by the active weight sum (`normalizedWeight = baseWeight / activeWeightSum`).
- Resulting Score: The sum of `normalizedWeight * criterionScore` guarantees a fair, calibrated 0 to 100 percentage match regardless of profile completeness.
- Missing Data Disclosure: Every recommendation payload details `missingProfileInformation` and explains the mathematical effect on scoring (`missingDataEffect`), guiding students on which profile fields to complete to enhance matching fidelity.

**Tie-Breaking Priority**:
When two opportunities have identical match scores, ties are resolved deterministically using:
1. Approaching application deadline (sooner deadlines take precedence).
2. Higher trust/quality signal score.
3. Creation recency.
4. Alphabetical title collation.

---

#### 10. Independent Eligibility Engine
Eligibility is evaluated completely independently from recommendation relevance so that relevance is never artificially depressed by administrative criteria.

**Five Discrete Eligibility Statuses**:
- `eligible`: All explicit opportunity criteria (budget, location, format, education, and required prerequisites) are demonstrably satisfied by the student's profile.
- `likely_eligible`: Major criteria align and no explicit disqualifiers exist, though minor non-blocking checks remain unverified.
- `needs_review`: An explicit opportunity requirement exists that cannot be confirmed from the student's profile (for example, specific age brackets, citizenship requirements, or institutional affiliations).
- `not_eligible`: A definitive contradiction exists between the student profile and the opportunity's explicit criteria (for example, the opportunity cost exceeds the student's strict maximum budget, or strict in-person attendance is required in a non-matching location).
- `unknown`: Neither explicit requirements nor profile attributes are sufficiently established to evaluate eligibility.

**Zero-Inference Guarantee**:
The engine strictly inspects only explicit opportunity requirements and verified profile data. It never infers age from graduation year, never assumes citizenship from location, and never deduces educational level without direct confirmation. Missing data always produces `needs_review` or `unknown` alongside a descriptive explanation.

**Skill Gaps as Preparation Runway**:
Skill gaps are treated as learning recommendations and preparation actions rather than automatic disqualifiers, unless the listing explicitly marks a skill as a strict mandatory gate.

---

#### 11. Trust & Data Quality Signal Engine
Each opportunity carries an automated, auditable trust score (0 to 100) based on objective data health dimensions:
- Source Provenance & Attribution: Verified origin domain, official application URL, and recognized institutional organizers.
- Freshness: Verification recency and active timeline status.
- Metadata Completeness: Availability of complete descriptions, category tagging, dates, cost disclosure, and contact points.
- Expiration Status: Flagged automatically when event dates or deadlines have passed.
- Contradiction Audits: Automated detection of date anomalies, conflicting delivery formats, or inconsistent fee structures.

**Mandatory Internal Quality Disclaimer**:
"INTERNAL DATA-QUALITY INDICATOR: This score reflects internal metadata completeness, automated consistency audits, and freshness. It is not an external guarantee or warranty that an opportunity is legitimate."

---

## 🧪 Testing

The test suite runs against the test database using Jest and Supertest:

```bash
# Run all server test suites
npm test

# Run a specific test suite
npx jest tests/feedIngestion.test.js
```

### Active Test Suites (6)
1. `tests/feedIngestion.test.js` — XML/JSON parsing, safe parser settings, normalization, fingerprint deduplication.
2. `tests/recommendation.test.js` — Recommendation scoring, normalized weights, missing profile preferences, explainability.
3. `tests/eligibility.test.js` — Discrete eligibility rule evaluation, zero-inference guarantee.
4. `tests/edgeCasesAndSecurity.test.js` — Malformed inputs, token expiry, ownership boundaries, rate limiting, XXE resilience.
5. `tests/studentWorkflowsE2E.test.js` — End-to-end student journeys (explore, save, reminders, roadmaps, peer collaboration).
6. `tests/restApi.test.js` — Comprehensive REST API route and controller verification.

Current test status: **6 test suites passed, 127 total tests passed (0 failures)**.

