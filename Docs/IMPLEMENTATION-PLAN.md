# Smart Build — Implementation Plan

**Document:** `IMPLEMENTATION-PLAN.md`
**Version:** 1.0
**Status:** V1 Implementation Roadmap
**Authority:** Implementation sequencing source of truth
**Derived From:** `PROJECT-CONTEXT.md`, `PRD.md`, `TRD.md`, `WEBSITE-FLOW.md`, `ARCHITECTURE.md`, `DATABASE-DESIGN.md`, `UI-UX.md`, `TESTING-QA.md`

---

## 1. Purpose

This document provides the sequential, dependency-aware, implementation-ready development roadmap for Smart Build V1.

The plan divides the project into logical phases that can be executed progressively from an empty repository to a complete V1 system. Each phase identifies backend, frontend, database, API, security, testing, UI/UX, and documentation requirements.

This plan does not introduce new product requirements, replace locked technical decisions, or override any existing source-of-truth document. Every phase is derived from the eight finalized documents listed above.

---

## 2. Phase Dependency Diagram

```text
Phase 0  — Documentation & Implementation Baseline
   ↓
Phase 1  — Repository & Development Foundation
   ↓
Phase 2  — Backend Infrastructure & Database Foundation
   ↓
Phase 3  — Frontend Foundation & Application Shell
   ↓
Phase 4  — Authentication & Identity
   ↓
Phase 5  — Authorization, Roles & Project Access
   ↓
Phase 6  — Users, Organization & Project Foundation
   ↓
Phase 7  — Project Planning & Progress
   ↓
Phase 8  — Materials, BOM & Inventory
   ↓
Phase 9  — Procurement & Vendors
   ↓
Phase 10 — Workforce & Attendance
   ↓
Phase 11 — Equipment & Asset Management
   ↓
Phase 12 — Budget & Expenses
   ↓
Phase 13 — Daily Site Operations & Issues
   ↓
Phase 14 — Quality Management
   ↓
Phase 15 — Safety Management
   ↓
Phase 16 — Documents & File Management
   ↓
Phase 17 — Notifications, Activity & Real-Time Updates
   ↓
Phase 18 — Reports & Analytics
   ↓
Phase 19 — Client Portal
   ↓
Phase 20 — Security Hardening, Integration & UX Refinement
   ↓
Phase 21 — Comprehensive QA & V1 Release Readiness
```

### Database Dependency Chains

```text
users
  ↓
project_memberships
  ↓
projects → project_types → project_templates
  ↓
phases → tasks → milestones → progress_records

materials → boms → bom_items
  ↓
material_requests → inventory_locations → inventory_balances → inventory_transactions
  ↓
vendors → procurement_requests → purchase_orders → material_receipts

workers → workforce_assignments → attendance

equipment → equipment_assignments → equipment_maintenance → equipment_inspections

budgets → expenses → budget_change_requests

daily_reports → issues

quality_inspections → quality_defects → quality_reinspections

safety_records

documents → document_versions

notifications → activities → audit_logs → security_events → login_history
```

---

## 3. Implementation Conventions

### 3.1 Technology Stack (Locked)

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB |
| Database GUI | MongoDB Compass |
| API Style | REST (`/api/v1/`) |
| Real-Time | WebSockets (where required) |
| Authentication | JWT |
| Authorization | RBAC + Project Access + Additional Permissions |
| File Storage V1 | Controlled Local Filesystem |
| Architecture | Modular Monolith |
| Source Control | Git + GitHub |

### 3.2 Development Rules

- No hardcoded secrets; all secrets via environment variables.
- `.env` excluded from Git; `.env.example` committed.
- Backend is the security boundary; frontend is UX only.
- Business rules live in services, not controllers or components.
- MongoDB is the source of truth; WebSockets distribute authorized updates.
- Every phase includes its own testing requirements.
- UI must handle loading, empty, error, permission-denied, validation, and success states.
- Responsive design is implemented alongside features, not deferred.
- No V1 scope creep (see Section 4).

### 3.3 Explicitly Out of V1 Scope

- AI/LLM/Gemini/Vertex AI
- OCR, IoT, GPS tracking, BIM, Drones
- Dedicated mobile application
- Offline-first architecture
- Payment gateways, SMS, mandatory email integrations
- Docker, Kubernetes, mandatory cloud infrastructure
- Microservices, Kafka, event-driven distributed architecture
- Separate reporting database/data warehouse
- Full ERP/accounting/payroll/HR
- Equipment telematics
- Google OAuth, Enterprise SSO

---

## Phase 0 — Documentation & Implementation Baseline

### Objective

Confirm all eight source-of-truth documents are internally consistent. Establish implementation conventions, coding standards, and the definition of done that will apply across all subsequent phases.

### Dependencies

None. This is the starting phase.

### Scope

- Cross-document consistency review.
- Identify and document any ambiguities or conflicts between the eight documents.
- Establish coding conventions (naming, file structure, commit message format).
- Establish the branch strategy per `PROJECT-CONTEXT.md` Section 7.
- Confirm Node.js version to pin.
- Confirm testing library selection direction (per `TRD.md` Section 30 — libraries are intentionally not locked yet).
- Confirm server-state/data-fetching library direction for frontend (per `TRD.md` Section 9).

### Backend Implementation

- N/A (no code changes).

### Database Implementation

- N/A.

### API Implementation

- N/A.

### Frontend Implementation

- N/A.

### Security Requirements

- Confirm secrets management strategy (environment variables, `.env.example`).
- Confirm `.gitignore` will exclude `.env`, `node_modules`, build artifacts, uploaded files.

### Testing Requirements

- Finalize testing library selection for unit, integration, API, and E2E tests.
- Confirm test data strategy approach per `TESTING-QA.md` Section 6.
- Confirm separate test environment configuration approach per `TESTING-QA.md` Section 5.

### UI/UX Requirements

- N/A (no implementation).

### Documentation Impact

- All eight documents reviewed for consistency.
- Any discovered conflicts documented in this plan under "Documentation Conflicts / Clarifications."

### Deliverables

- Confirmed implementation conventions document or README section.
- Confirmed branch strategy.
- Pinned Node.js version.
- Testing library selection.
- Server-state library selection.
- Documentation conflict report (if any).

### Definition of Done

- All eight documents reviewed.
- Implementation conventions agreed.
- No unresolved blocking conflicts between documents.
- Ready to create repository structure.

---

## Phase 1 — Repository & Development Foundation

### Objective

Create the monorepo structure, initialize frontend and backend applications, configure development tooling, environment handling, Git hygiene, and development scripts.

### Dependencies

- Phase 0 completed.

### Scope

- Create the repository directory structure per `ARCHITECTURE.md` Section 4.
- Initialize frontend (React + TypeScript + Vite + Tailwind CSS + React Router).
- Initialize backend (Node.js + Express + TypeScript).
- Configure TypeScript strict mode for both frontend and backend.
- Configure linting (ESLint) and formatting (Prettier) for both.
- Create `.gitignore` excluding `.env`, `node_modules/`, `dist/`, uploaded files, build artifacts.
- Create `.env.example` with documented placeholder variables per `TRD.md` Section 28.
- Create `README.md` with project overview, setup instructions, and environment configuration.
- Configure development scripts (`dev`, `build`, `lint`, `test`).
- Verify both applications start successfully with placeholder content.

### Backend Implementation

```text
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── validators/
│   ├── websocket/
│   ├── storage/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env.example
```

- Express application entry point (`app.ts`, `server.ts`).
- TypeScript compilation configuration.
- Development server with hot reload (e.g., `tsx` or `ts-node-dev`).

### Database Implementation

- N/A (connection established in Phase 2).

### API Implementation

- N/A (routes created in Phase 2).

### Frontend Implementation

```text
frontend/
├── src/
│   ├── app/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── types/
│   └── utils/
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── index.html
```

- Vite + React + TypeScript scaffold.
- Tailwind CSS configuration with the project's design tokens.
- React Router basic setup with placeholder routes.
- Verify `npm run dev` starts the frontend.

### Security Requirements

- `.env` files excluded from Git.
- `.env.example` contains all required variable names with safe placeholder values.
- No secrets committed.

### Testing Requirements

- Install testing libraries (e.g., Vitest/Jest for unit tests, Supertest for API tests, Playwright/Cypress for E2E).
- Verify `npm test` runs successfully with zero placeholder tests.
- Confirm test configuration files are created.

### UI/UX Requirements

- Verify Tailwind CSS is working.
- No feature UI required yet.

### Documentation Impact

- `README.md` created with setup instructions.
- Environment variable documentation in `.env.example`.

### Deliverables

- Working monorepo with `frontend/` and `backend/` directories.
- Both applications start with `npm run dev`.
- Linting and formatting configured and passing.
- Git repository initialized with proper `.gitignore`.
- `README.md` with setup instructions.
- `.env.example` with all required variables.

### Definition of Done

- `npm run dev` starts both frontend and backend without errors.
- `npm run build` produces successful builds for both.
- `npm run lint` passes with no errors.
- TypeScript compilation succeeds in strict mode.
- `.env.example` is committed; `.env` is not.
- Repository structure matches `ARCHITECTURE.md` Section 4.

---

## Phase 2 — Backend Infrastructure & Database Foundation

### Objective

Establish the Express application foundation with MongoDB connection, configuration validation, logging, centralized error handling, request validation infrastructure, repository patterns, and health-check endpoints.

### Dependencies

- Phase 1 completed.

### Scope

- MongoDB connection using environment-configured URI.
- Configuration module that reads and validates required environment variables (`NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `STORAGE_PATH`).
- Centralized error handling middleware per `TRD.md` Section 15 and `ARCHITECTURE.md` Section 18.
- Structured application logging (timestamp, severity, request context, operation, result) per `TRD.md` Section 31.
- Request validation middleware infrastructure (using a validation library such as Joi or Zod).
- Base repository pattern for MongoDB access per `TRD.md` Section 7.5.
- CORS configuration per `TRD.md` Section 23.
- Secure HTTP headers configuration.
- Health check endpoint (`GET /api/v1/health`).
- API versioning prefix (`/api/v1/`).
- Consistent API response structure per `TRD.md` Section 15 and `ARCHITECTURE.md` Section 10.

### Backend Implementation

- `config/index.ts` — environment variable loading and validation.
- `config/database.ts` — MongoDB connection with connection-error handling.
- `middleware/errorHandler.ts` — centralized error handler that produces safe API responses (no stack traces, database errors, secrets, or internal paths in production).
- `middleware/requestLogger.ts` — structured request logging.
- `middleware/validate.ts` — generic validation middleware using chosen validation library.
- `utils/AppError.ts` — custom error class supporting error codes and HTTP status codes.
- `utils/apiResponse.ts` — consistent success/error response helpers.
- Base repository class or factory for MongoDB CRUD operations.
- API router setup with `/api/v1/` prefix.

### Database Implementation

- MongoDB connection with configurable URI.
- Connection error handling and graceful shutdown.
- Verify connection via health endpoint.

### API Implementation

- `GET /api/v1/health` — returns server status, database connection status.
- Consistent error response format:
  ```json
  {
    "success": false,
    "message": "Human-readable error message.",
    "code": "ERROR_CODE"
  }
  ```
- Consistent success response format:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { ... }
  }
  ```

### Frontend Implementation

- N/A.

### Security Requirements

- Environment variables validated at startup; application fails fast if required variables are missing.
- CORS configured to allow only the configured `CLIENT_URL`.
- Production responses do not expose stack traces, database errors, secrets, or internal file paths.
- No sensitive values in logs (passwords, JWT secrets, full tokens, encryption secrets).
- Secure HTTP headers (e.g., Helmet middleware).

### Testing Requirements

- Unit tests for configuration validation (missing variables, invalid values).
- Unit tests for error handler (various error types produce correct responses).
- Unit tests for API response helpers.
- Integration test for health endpoint (200 response with expected structure).
- Integration test for MongoDB connection.
- Test that invalid routes return 404 with consistent error format.

### UI/UX Requirements

- N/A.

### Documentation Impact

- Environment variables documented in `.env.example` and `README.md`.
- API response format documented (can be start of `API-SPECIFICATION.md`).

### Deliverables

- MongoDB connection working with environment configuration.
- Centralized error handling and logging.
- Request validation infrastructure.
- Health check endpoint returning 200.
- Base repository pattern.
- CORS and security headers configured.

### Definition of Done

- Backend starts and connects to MongoDB using environment configuration.
- `GET /api/v1/health` returns 200 with correct structure.
- Invalid routes return 404 with consistent error format.
- Configuration validation fails fast on missing required variables.
- All Phase 2 tests pass.
- No secrets in logs or responses.

---

## Phase 3 — Frontend Foundation & Application Shell

### Objective

Build the frontend application shell including routing infrastructure, shared layout components, responsive navigation foundations, design system tokens, and UI state components that will be reused across all feature modules.

### Dependencies

- Phase 1 completed (frontend scaffold exists).
- Phase 2 completed (backend health endpoint available for API connectivity verification).

### Scope

- Application shell layout per `WEBSITE-FLOW.md` Section 6 and `UI-UX.md` Section 5.
- React Router configuration with route guards (public vs. protected placeholder).
- Shared layout components (AppShell, Sidebar, Header).
- Responsive navigation behavior per `UI-UX.md` Section 28 (desktop: persistent sidebar; tablet: collapsible sidebar; mobile: drawer navigation).
- Shared UI components per `UI-UX.md` Section 36: Button, Input, Select, Textarea, Modal, ConfirmationDialog, StatusBadge, PageHeader, Breadcrumbs, Tabs, Card, Metric, Toast, EmptyState, LoadingState, ErrorState, PermissionDenied, Pagination, DataTable, FilterBar, ProgressIndicator, FileUploader (shell only).
- API service layer foundation (HTTP client with base URL from environment, interceptors for auth token injection, error handling).
- Design tokens in Tailwind config (colors, typography, spacing) per `UI-UX.md` visual direction — professional, structured, construction-oriented, not AI-generated looking.
- Global state foundation for authenticated user, permissions, and current project context.
- Public route pages: Login (placeholder), Forgot Password (placeholder), Reset Password (placeholder), Activate Account (placeholder).
- 404 Not Found page.
- Smooth, subtle transitions for navigation, sidebar, modals, dropdowns, tabs per `UI-UX.md` Section 30.

### Backend Implementation

- N/A.

### Database Implementation

- N/A.

### API Implementation

- Frontend API client configured with environment-based backend URL.
- API interceptor for attaching JWT token to requests.
- API interceptor for handling 401 responses (redirect to login).

### Frontend Implementation

- `layouts/AppLayout.tsx` — Internal workspace shell with header, sidebar, main content area.
- `layouts/AuthLayout.tsx` — Public authentication pages layout.
- `layouts/ClientLayout.tsx` — Client portal shell (placeholder, implemented in Phase 19).
- `components/` — All shared UI components listed above.
- `routes/` — Route configuration with public/protected separation.
- `services/api.ts` — Axios/fetch wrapper with base URL, token injection, error interceptors.
- `hooks/useAuth.ts` — Authentication state hook (placeholder).
- `styles/` — Tailwind design tokens, global styles.
- Responsive sidebar that collapses on tablet and converts to drawer on mobile.
- Header with logo placeholder, project context placeholder, search placeholder, notification icon placeholder, user menu placeholder.

### Security Requirements

- Protected routes redirect unauthenticated users to `/login`.
- API client automatically handles 401 by clearing session and redirecting to login.
- No sensitive data stored in localStorage (JWT token storage strategy decided: httpOnly cookies preferred, or secure localStorage if required).

### Testing Requirements

- Verify AppLayout renders correctly.
- Verify public routes render without authentication.
- Verify protected route guard redirects to login when unauthenticated.
- Verify responsive sidebar behavior at desktop/tablet/mobile breakpoints.
- Verify shared components render without errors (smoke tests).
- Verify 404 page renders for unknown routes.

### UI/UX Requirements

Per `UI-UX.md`:
- Professional, clean visual direction — no excessive gradients, glassmorphism, or decorative animations.
- Clear visual hierarchy with natural spacing and consistent typography.
- Sidebar navigation shows only permission-relevant modules (placeholder structure for now).
- Subtle transitions for sidebar open/close, modal entry/exit, dropdown appearance.
- Visible focus states for keyboard accessibility.
- Semantic HTML structure.
- Sufficient text/background contrast.

### Documentation Impact

- Component inventory documented.
- Design tokens documented.

### Deliverables

- Working application shell with header, sidebar, and main content area.
- Responsive at desktop, tablet, and mobile breakpoints.
- Shared UI component library (initial set).
- API client with interceptors.
- Route infrastructure with public/protected separation.
- Public page placeholders (Login, Forgot Password, Reset Password, Activate Account).
- 404 page.

### Definition of Done

- Application shell renders at all breakpoints without layout issues.
- Sidebar collapses/expands correctly at responsive breakpoints.
- Public routes accessible without authentication.
- Protected routes redirect to login.
- All shared components render without errors.
- Transitions are smooth and subtle.
- Frontend connects to backend health endpoint successfully.

---

## Phase 4 — Authentication & Identity

### Objective

Implement complete authentication including login, password hashing, JWT token management, logout, password reset, account activation, account status validation, failed-login tracking, login history, authentication middleware, and corresponding frontend authentication states.

### Dependencies

- Phase 2 completed (backend infrastructure, MongoDB connection).
- Phase 3 completed (frontend shell, API client, auth layout).

### Scope

- `users` collection (initial schema for authentication-relevant fields only; full user management in Phase 6).
- `access_requests` collection (public access requests, admin review, role assignment, and activation token generation).
- Password hashing (bcrypt).
- JWT token generation and verification with configurable secret and expiration.
- Public Request Access endpoint (`POST /api/v1/auth/request-access`) with validation for the 6 locked roles.
- Admin Access Request review endpoints (`GET /api/v1/users/access-requests`, `POST /api/v1/users/access-requests/:id/approve`, `POST /api/v1/users/access-requests/:id/reject`).
- Login endpoint with credential validation, account status check, lock check, failed-login tracking, login history recording, and session/token creation.
- Logout endpoint with session/token invalidation.
- Password reset request and execution flow.
- Account activation flow (`POST /api/v1/auth/activate`: user submits activation token, sets secure credentials, account transitions to ACTIVE).
- Password change for authenticated users.
- Authentication middleware that validates JWT on every protected request, checks account status, and attaches user context to the request.
- Session expiration handling.
- Account lock after configurable failed attempts.
- Frontend: Login page, Request Access page, Forgot Password page, Reset Password page, Activate Account page, Admin Access Requests review tab, authentication state management, protected route integration.

### Backend Implementation

- `modules/auth/` — controller, service, repository, routes, validator, types.
- `POST /api/v1/auth/login` — validate credentials, check account status (active/deactivated/locked), track failed attempts, record login history, return JWT + user info.
- `POST /api/v1/auth/logout` — invalidate session/token.
- `POST /api/v1/auth/forgot-password` — generate password reset token (V1 may store token in DB; email delivery out of scope per PRD 5.2).
- `POST /api/v1/auth/reset-password` — validate reset token, update password hash.
- `POST /api/v1/auth/activate-account` — validate activation token, set credentials, activate account.
- `PUT /api/v1/auth/change-password` — authenticated password change.
- `middleware/authenticate.ts` — JWT verification, account status check, user context injection.
- Password hashing utility with secure algorithm (bcrypt with appropriate rounds, or argon2).
- JWT utility for token generation and verification.
- Failed login counter: increment on failure, reset on success, lock account after threshold.
- Login history recording: userId, email attempted, success/failure, failure reason, IP address, user agent, timestamp.

### Database Implementation

**`users` collection** (authentication-relevant fields; full schema in Phase 6):

```text
_id, name, email (unique), passwordHash, primaryRole, status,
accountLockedUntil, passwordChangedAt, lastLoginAt, failedLoginCount,
createdAt, updatedAt, deactivatedAt
```

Indexes: `unique: email`, `status`.

**`login_history` collection**:

```text
_id, userId, emailAttempted, success, failureReason,
ipAddress, userAgent, timestamp
```

Indexes: `userId + timestamp`, `timestamp`, `success`.

### API Implementation

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Authenticate user |
| POST | `/api/v1/auth/logout` | Protected | Invalidate session |
| POST | `/api/v1/auth/forgot-password` | Public | Request password reset |
| POST | `/api/v1/auth/reset-password` | Public | Execute password reset |
| POST | `/api/v1/auth/activate-account` | Public | Activate invited account |
| PUT | `/api/v1/auth/change-password` | Protected | Change own password |
| GET | `/api/v1/auth/me` | Protected | Get current user info |

### Frontend Implementation

- `pages/auth/LoginPage.tsx` — email + password form, submit, error display, redirect to role dashboard on success.
- `pages/auth/ForgotPasswordPage.tsx` — email input, submit, success feedback.
- `pages/auth/ResetPasswordPage.tsx` — new password form with token from URL, submit, success redirect.
- `pages/auth/ActivateAccountPage.tsx` — set credentials form, submit, redirect to login.
- `hooks/useAuth.ts` — authentication state (user, token, permissions, isAuthenticated), login/logout actions.
- `services/authService.ts` — API calls for auth endpoints.
- Protected route wrapper checks `isAuthenticated` and redirects to `/login`.
- On 401 API response: clear auth state, redirect to login with session-expired message.
- Login page handles: invalid credentials error, locked account error, deactivated account error, loading state, validation state.

### Security Requirements

- Passwords never stored in plaintext; bcrypt/argon2 hash only.
- JWT secret from environment variable; never committed.
- Failed login tracking with account lock threshold.
- Session expiration enforced server-side.
- Login history records all attempts (success and failure).
- Password reset tokens are single-use and time-limited.
- Authentication middleware runs before all protected routes.
- Deactivated/locked accounts cannot authenticate.

### Testing Requirements

Per `TESTING-QA.md` Section 7:

**Unit Tests:**
- Password hashing and verification.
- JWT generation and verification.
- Failed login counter logic.
- Account lock threshold logic.
- Password reset token generation and validation.

**Integration/API Tests:**
- Valid login → 200 + JWT + user data.
- Invalid email → 401 + error.
- Invalid password → 401 + error + failed counter incremented.
- Missing fields → 400.
- Deactivated account → 401.
- Locked account → 401 + locked message.
- Failed login counter triggers lock.
- Successful login resets failed counter.
- Login history recorded for success and failure.
- Logout invalidates session → subsequent protected request → 401.
- Password change with valid current password → 200.
- Password change with invalid current password → 400.
- Password reset flow: request → token stored → reset with valid token → 200.
- Reset with invalid/expired token → 400.
- Account activation flow.
- `GET /api/v1/auth/me` returns current user.
- Session expiration → 401.

**E2E Tests:**
- Login → dashboard redirect.
- Login with invalid credentials → error message.
- Logout → redirect to login → protected page inaccessible.

### UI/UX Requirements

- Login page: clean, professional, construction-themed, not generic AI template.
- Loading state during authentication.
- Clear error messages for invalid credentials, locked account, deactivated account.
- Password field visibility toggle.
- Form validation (required fields, email format).
- Success feedback after password reset request/execution.
- Smooth transition from login to dashboard.

### Documentation Impact

- Auth API endpoints documented.
- Authentication flow documented.
- Environment variables for JWT documented.

### Deliverables

- Complete authentication flow (login, logout, password reset, account activation, password change).
- JWT-based authentication middleware.
- Login history tracking.
- Failed login tracking with account lock.
- Frontend login/auth pages with all states.
- Protected route enforcement.

### Definition of Done

- Users can log in with valid credentials and receive a JWT.
- Invalid credentials return appropriate error and increment failed counter.
- Account lock activates after threshold failures.
- Logout invalidates session; protected APIs return 401.
- Password reset flow works end-to-end.
- Account activation flow works.
- Login history is recorded.
- All Phase 4 tests pass.
- No secrets in logs or responses.

---

## Phase 5 — Authorization, Roles & Project Access

### Objective

Implement the six locked roles (Admin, Project Manager, Site Engineer, Store Manager, Contractor, Client), additional permissions system, project membership/assignment, backend authorization middleware, protected routes, project-level isolation, and frontend permission-aware navigation.

### Dependencies

- Phase 4 completed (authentication exists).

### Scope

- Six locked roles: `ADMIN`, `PROJECT_MANAGER`, `SITE_ENGINEER`, `STORE_MANAGER`, `CONTRACTOR`, `CLIENT`.
- Additional permissions system (admin can grant specific permissions to users; admin cannot create new roles).
- `project_memberships` collection for project-level assignment.
- Authorization middleware that verifies: (1) authentication, (2) account/session validity, (3) required permission/role, (4) project access where applicable, (5) resource-level access where applicable.
- Project-scoped route middleware: extracts `projectId` from route params, verifies user has membership.
- Effective permission calculation: `Primary Role + Additional Permissions + Project Assignments = Effective Access`.
- Frontend: permission-aware sidebar navigation (hide inaccessible modules), protected route guards with role/permission checks, permission-denied page.

### Backend Implementation

- `modules/auth/` — extend with authorization logic.
- `middleware/authorize.ts` — role and permission checking middleware. Composable: `authorize('ADMIN')`, `authorize(['ADMIN', 'PROJECT_MANAGER'])`, `authorizePermission('manage_users')`.
- `middleware/projectAccess.ts` — verifies project membership for `/projects/:projectId/*` routes. Returns 403 if user is not assigned to the project.
- Permission constants/types defining all available permissions per role.
- Role-permission mapping: which roles have which base capabilities.
- Additional permissions list that admin can grant.
- Effective permission resolver: given a user's role, additional permissions, and project assignments, compute what they can do.

### Database Implementation

**`project_memberships` collection**:

```text
_id, userId, projectId, assignmentStatus, assignedAt,
removedAt, assignedBy, createdAt, updatedAt
```

Indexes: `unique: { userId, projectId }`, `projectId`, `userId`, `assignmentStatus`.

Extend `users` collection with `additionalPermissions[]` field.

### API Implementation

- Authorization middleware applied to all protected routes.
- Project access middleware applied to all `/projects/:projectId/*` routes.
- Unauthorized requests return `403 Forbidden` with safe error message.
- Unauthenticated requests return `401 Unauthorized`.

### Frontend Implementation

- `hooks/usePermissions.ts` — returns effective permissions for the current user.
- `components/PermissionGate.tsx` — conditionally renders children based on permission/role.
- Sidebar dynamically shows/hides navigation items based on role and permissions per `WEBSITE-FLOW.md` Section 51.
- `pages/shared/PermissionDeniedPage.tsx` — clear non-sensitive message per `UI-UX.md` Section 13.
- Route guards check role/permission before rendering pages.
- Project context state: current active project, project switcher readiness.

### Security Requirements

- Backend authorization is mandatory; frontend checks are UX only.
- Every protected API operation verifies: authentication → account status → required permission → project access → resource access.
- A user must receive `403 Forbidden` when attempting an unauthorized API operation, even if the frontend hides the navigation.
- Project membership verified server-side on every project-scoped request.
- Admin cannot create new roles (only the six locked roles exist).
- Permission-denied responses do not expose sensitive resource details.

### Testing Requirements

Per `TESTING-QA.md` Sections 8–9:

**Unit Tests:**
- Permission resolver for each role.
- Additional permissions addition/removal.
- Project membership check logic.

**Integration/API Tests:**
- For every protected operation, test: unauthenticated → 401; wrong role → 403; correct role without project access → 403; correct role with project access → 200; deactivated user → 401/403.
- Project isolation: user assigned to Project A but not Project B → direct Project B API request → 403.
- Admin granting additional permissions → user gains new capability.

**E2E Tests:**
- Login as different roles → verify sidebar shows correct navigation items.
- Attempt to access unauthorized route → permission denied page.

### UI/UX Requirements

- Sidebar navigation is role-specific per `WEBSITE-FLOW.md` Section 51.
- Permission-denied page is clear and non-threatening.
- No unauthorized navigation items are visible.

### Documentation Impact

- Role-permission matrix documented.
- Authorization middleware usage documented for developers.

### Deliverables

- Six roles fully defined with base permissions.
- Additional permissions system.
- Project membership verification.
- Authorization middleware.
- Frontend permission-aware navigation.
- Permission-denied page.

### Definition of Done

- All six roles have correct base permissions.
- Additional permissions can be granted/revoked by admin.
- Project access is enforced server-side.
- Unauthorized API calls return 403.
- Sidebar shows only accessible modules per role.
- Project isolation verified: no cross-project data leakage.
- All Phase 5 tests pass.

---

## Phase 6 — Users, Organization & Project Foundation

### Objective

Implement user management (creation, invitation, editing, activation, deactivation, role assignment, project assignment), project types, project templates, project CRUD, project lifecycle, project team assignment, and project context.

### Dependencies

- Phase 5 completed (roles and authorization exist).

### Scope

**User Management:**
- Admin creates/invites users with primary role and project assignments.
- Admin edits users (name, role, permissions, project assignments).
- Admin activates/deactivates users.
- User deactivation: invalidate sessions, stop API access, disconnect WebSocket, remove project access, preserve historical records, create audit record.
- User search and filtering with pagination.
- User detail page.

**Project Foundation:**
- `project_types` collection (configurable types: residential, apartment, villa, commercial, road, bridge, industrial, renovation, infrastructure, etc.).
- `project_templates` collection with default phases, tasks, milestones, BOM items, budget categories.
- `projects` collection with full schema.
- Project creation flow: select type → select template → configure details → configure phases → configure BOM → set budget → assign team → create.
- Project lifecycle: Draft → Planning → Active → On Hold ↔ Active → Completed → Archived.
- Project overview page with summary information.
- Project context: when a user enters a project, the project context becomes active in the header; project switcher for users with multiple project assignments.
- Project editing.
- Project list with search, filtering, sorting, pagination.

### Backend Implementation

- `modules/users/` — controller, service, repository, routes, validator, types.
  - `POST /api/v1/users` — create/invite user (admin only).
  - `GET /api/v1/users` — list users with search/filter/pagination (admin only).
  - `GET /api/v1/users/:userId` — user detail.
  - `PUT /api/v1/users/:userId` — edit user.
  - `PUT /api/v1/users/:userId/status` — activate/deactivate.
  - `PUT /api/v1/users/:userId/permissions` — manage additional permissions.
  - `POST /api/v1/users/:userId/projects` — assign project.
  - `DELETE /api/v1/users/:userId/projects/:projectId` — remove project assignment.

- `modules/projects/` — controller, service, repository, routes, validator, types.
  - `POST /api/v1/projects` — create project.
  - `GET /api/v1/projects` — list projects (filtered by user's access).
  - `GET /api/v1/projects/:projectId` — project detail (with membership check).
  - `PUT /api/v1/projects/:projectId` — edit project.
  - `PUT /api/v1/projects/:projectId/status` — lifecycle transition.
  - `GET /api/v1/projects/:projectId/overview` — project overview data.
  - `GET /api/v1/projects/:projectId/team` — project team.

- `modules/project-types/` — CRUD for project types.
- `modules/project-templates/` — CRUD for project templates.

- User deactivation service: invalidate sessions, create audit record, preserve history.
- Project lifecycle validation: only valid state transitions allowed.

### Database Implementation

**`users` collection** (full schema per `DATABASE-DESIGN.md` Section 5.1).

**`project_types` collection** per `DATABASE-DESIGN.md` Section 6.2.

**`project_templates` collection** per `DATABASE-DESIGN.md` Section 6.3.

**`projects` collection** per `DATABASE-DESIGN.md` Section 6.1:

```text
_id, code (unique), name, typeId, clientUserId, location, description,
plannedStartDate, plannedEndDate, actualStartDate, actualEndDate,
projectManagerId, status, health, healthFactors,
createdBy, createdAt, updatedAt, archivedAt
```

Indexes: `unique: code`, `status`, `projectManagerId`, `clientUserId`, `typeId`, `plannedEndDate`, `health`.

**`audit_logs` collection** (initial schema per `DATABASE-DESIGN.md` Section 20.1) — needed for user deactivation audit.

### API Implementation

- All user management endpoints behind Admin authorization.
- All project endpoints enforce project membership.
- Projects list returns only projects the user is assigned to (non-admin) or all projects (admin).
- Pagination, filtering, sorting on list endpoints.
- Project lifecycle transitions validated server-side.

### Frontend Implementation

**Admin pages:**
- `pages/admin/UsersPage.tsx` — user list with search, filter, pagination.
- `pages/admin/CreateUserPage.tsx` — user creation form (basic info, role, project assignments, additional permissions).
- `pages/admin/UserDetailPage.tsx` — user profile, status, role, permissions, projects, activity, login history.
- `pages/admin/EditUserPage.tsx` — edit user details.

**Project pages:**
- `pages/projects/ProjectListPage.tsx` — project list with search, filter, sort, pagination.
- `pages/projects/CreateProjectPage.tsx` — multi-step/sectioned form (project info, type, template, dates, client, team).
- `pages/projects/ProjectOverviewPage.tsx` — summary dashboard.
- `pages/projects/EditProjectPage.tsx` — edit project details.

**Components:**
- `components/ProjectSwitcher.tsx` — header project context selector.
- Project context state management.

### Security Requirements

- Only Admin can create, edit, activate, deactivate users.
- User deactivation immediately invalidates sessions and stops access.
- Project creation only by authorized roles (Admin, Project Manager).
- Project list filtered by user's project assignments.
- Backend validates project lifecycle transitions.
- Audit records created for user and project state changes.

### Testing Requirements

Per `TESTING-QA.md` Sections 10–11:

**Unit Tests:**
- Project lifecycle state machine validation.
- User creation validation (required fields, unique email).

**Integration/API Tests:**
- Create user → 201 → user exists in DB.
- Create user with duplicate email → 409.
- Assign user to project → membership created.
- Deactivate user → sessions invalidated, audit record created.
- Create project → 201 → project exists.
- Create project with duplicate code → 409.
- Invalid lifecycle transition → 400.
- Non-admin creating users → 403.
- Project list returns only assigned projects for non-admin users.

**E2E Tests (E2E-01, E2E-02 from TESTING-QA.md):**
- Admin onboards user: login → create user → assign role → assign project → invitation → activation → user login → role dashboard.
- Project Manager creates project: login → create → type → template → details → phases → team → create → project workspace.

### UI/UX Requirements

Per `UI-UX.md`:
- User list uses DataTable with search, filter, pagination.
- User detail page follows standard detail page pattern (back, title, status, actions, tabs).
- Project list shows project cards/rows with name, type, status, health, progress, dates, PM.
- Project creation uses logical sections or step-based flow, not one overwhelming screen.
- Project overview follows information hierarchy per `UI-UX.md` Section 15.
- Empty states: "No Users Yet" / "No Projects Yet" with create action.
- Loading, error, permission-denied states on all pages.
- Responsive at all breakpoints.
- Project switcher per `UI-UX.md` Section 7.

### Documentation Impact

- User management API documented.
- Project API documented.
- Audit logging pattern documented.

### Deliverables

- Complete user management (CRUD, roles, permissions, project assignment, deactivation).
- Project types and templates.
- Project CRUD with lifecycle management.
- Project overview page.
- Project context/switcher.
- Admin dashboard (initial version).
- Audit logging for user and project changes.

### Definition of Done

- Admin can create, edit, activate, deactivate users.
- Users can be assigned to projects.
- Projects can be created from templates.
- Project lifecycle transitions are validated.
- Project list respects access control.
- Project switcher works for multi-project users.
- Audit records created for important actions.
- All Phase 6 tests pass.

---

## Phase 7 — Project Planning & Progress

### Objective

Implement project phases, tasks (with assignment, priority, status, dependencies), milestones (with client visibility), quantity-based progress tracking, progress history, phase/project progress rollup, and project health calculation.

### Dependencies

- Phase 6 completed (projects exist).

### Scope

- `phases` collection linked to projects.
- `tasks` collection linked to phases and projects, with assignees, quantity tracking, dependencies.
- `milestones` collection linked to projects/phases, with client visibility flag.
- `progress_records` collection for historical progress entries.
- Quantity-based progress: `progress = completedQuantity / plannedQuantity × 100`.
- Phase progress derived from task progress.
- Project progress derived from phase progress.
- Project health calculation using transparent business rules (schedule, budget, progress, material availability, open issues, safety, quality, resource availability).
- Basic Finish-to-Start dependencies for tasks and phases.

### Backend Implementation

- `modules/phases/` — CRUD, status management, progress calculation, dependency validation.
- `modules/tasks/` — CRUD, assignment, status transitions, quantity updates, progress calculation, dependency validation.
- `modules/milestones/` — CRUD, status management, client visibility control.
- `modules/progress/` — progress record creation, task/phase/project progress rollup, progress history queries.
- Project health calculation service — rule-based health assessment returning HEALTHY / AT_RISK / CRITICAL with contributing factors.
- Progress update flow per `WEBSITE-FLOW.md` Section 21: enter completed quantity → validate → calculate task progress → update phase progress → update project progress → recalculate project health → create activity.

### Database Implementation

**`phases`** per `DATABASE-DESIGN.md` Section 7.1.
**`tasks`** per `DATABASE-DESIGN.md` Section 7.2.
**`milestones`** per `DATABASE-DESIGN.md` Section 7.3.
**`progress_records`** per `DATABASE-DESIGN.md` Section 7.4.

### API Implementation

- Phase CRUD: `POST/GET/PUT /api/v1/projects/:projectId/phases`.
- Task CRUD: `POST/GET/PUT /api/v1/projects/:projectId/tasks`.
- Task progress update: `PUT /api/v1/projects/:projectId/tasks/:taskId/progress`.
- Milestone CRUD: `POST/GET/PUT /api/v1/projects/:projectId/milestones`.
- Progress records: `GET /api/v1/projects/:projectId/progress`.
- Project health: `GET /api/v1/projects/:projectId/health`.

### Frontend Implementation

- `pages/projects/PhasesPage.tsx` — phase list with progress, status.
- `pages/projects/PhaseDetailPage.tsx` — tasks, milestones, progress, dependencies, materials, workforce, equipment, documents, activity.
- `pages/projects/TasksPage.tsx` — task list with filters (status, priority, assignee).
- `pages/projects/TaskDetailPage.tsx` — assignment, status, priority, quantity, progress, dates, dependencies, materials, equipment, issues, attachments, activity.
- `pages/projects/MilestonesPage.tsx` — milestone list.
- Progress entry form with quantity validation.
- Progress visualization (planned vs completed, progress percentage).
- Project health indicator on project overview.

### Security Requirements

- Only authorized roles can create/edit phases, tasks, milestones.
- Progress updates validated server-side (completed quantity cannot exceed planned quantity; no negative quantities).
- Project access verified on all endpoints.
- Client visibility for milestones controlled server-side.

### Testing Requirements

Per `TESTING-QA.md` Section 12:

**Unit Tests:**
- Progress calculation: `6500 / 10000 = 65%`.
- Edge cases: zero planned quantity, completed > planned, negative quantity, decimal quantity.
- Phase progress rollup from tasks.
- Project progress rollup from phases.
- Health calculation logic.
- Dependency validation.

**Integration Tests:**
- Phase/task/milestone CRUD.
- Progress update → phase/project recalculation.
- Invalid lifecycle transitions rejected.
- Dependency validation.
- Progress history preserved.

**E2E Tests (E2E-03):**
- Site Engineer enters completed quantity → progress recalculated → dashboard updated.

### UI/UX Requirements

Per `UI-UX.md` Section 16:
- Planned vs completed quantity clearly distinguished.
- Progress indicator (bar/percentage).
- Last updated timestamp.
- Health indicator with multiple cues (label + icon/shape + visual treatment), not color alone.

### Documentation Impact

- Phase/task/milestone APIs documented.
- Progress calculation logic documented.
- Health calculation rules documented.

### Deliverables

- Complete phase, task, milestone CRUD.
- Quantity-based progress tracking with history.
- Phase/project progress rollup.
- Project health calculation.
- Dependencies (Finish-to-Start).
- Corresponding frontend pages.

### Definition of Done

- Phases, tasks, milestones can be created and managed.
- Quantity-based progress calculates correctly.
- Phase and project progress roll up from tasks.
- Project health updates based on business rules.
- Progress history is preserved.
- All Phase 7 tests pass.

---

## Phase 8 — Materials, BOM & Inventory

### Objective

Implement the central material catalog, project BOMs with versioning, material requests with approval workflow, inventory locations (central warehouse and project stores), inventory balances with negative-stock prevention, inventory transactions (receipt, issue, return, transfer, adjustment, consumption), stock alerts, and material issuance workflow.

### Dependencies

- Phase 7 completed (tasks and phases exist for BOM/material request linking).

### Scope

- `materials` collection (central catalog).
- `boms` and `bom_items` collections (project/phase/task-linked material requirements).
- `material_requests` collection with approval workflow (Draft → Submitted → Approved/Rejected → Partially Issued/Issued → Cancelled).
- `inventory_locations` collection (CENTRAL_WAREHOUSE, PROJECT_STORE).
- `inventory_balances` collection with negative-stock prevention.
- `inventory_transactions` collection (RECEIPT, ISSUE, RETURN, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT, CONSUMPTION).
- Material request workflow per `PRD.md` Section 8.12: Site Engineer → Request → PM Approval → Store Manager → Check Inventory → Issue → Inventory Updated → Audit → Notification.
- Material issuance without required approval is prohibited.
- Stock threshold alerts (low stock, reorder level).

### Backend Implementation

- `modules/materials/` — CRUD for material catalog, search, filter, pagination.
- `modules/bom/` — BOM and BOM item CRUD, versioning, approval.
- `modules/inventory/` — inventory location management, balance queries, transaction processing, stock validation, transfer operations.
- `modules/material-requests/` — request CRUD, approval/rejection workflow, issuance, return processing.
- Inventory service: atomic multi-document operations for issue/receipt/transfer using MongoDB transactions where appropriate to prevent partial state.
  - Material Issue: validate request → validate approval → validate stock → create inventory transaction → update stock → update request status → create audit event.
  - Material Receipt: validate purchase/receipt → create receipt → increase inventory → create inventory transaction → create audit event.
- Negative inventory prevention: balance validation before any decreasing transaction.

### Database Implementation

**`materials`** per `DATABASE-DESIGN.md` Section 9.1.
**`boms`** per `DATABASE-DESIGN.md` Section 9.2.
**`bom_items`** per `DATABASE-DESIGN.md` Section 9.3.
**`material_requests`** per `DATABASE-DESIGN.md` Section 10.
**`inventory_locations`** per `DATABASE-DESIGN.md` Section 11.1.
**`inventory_balances`** per `DATABASE-DESIGN.md` Section 11.2.
**`inventory_transactions`** per `DATABASE-DESIGN.md` Section 11.3.

### API Implementation

- Material catalog CRUD: `/api/v1/materials`.
- Project BOM CRUD: `/api/v1/projects/:projectId/bom`.
- Material requests: `/api/v1/projects/:projectId/material-requests`.
- Material request approval: `PUT /api/v1/projects/:projectId/material-requests/:id/approve`.
- Material issuance: `POST /api/v1/projects/:projectId/material-requests/:id/issue`.
- Inventory locations: `/api/v1/inventory/locations`.
- Inventory balances: `/api/v1/inventory/balances`.
- Inventory transactions: `/api/v1/inventory/transactions`.

### Frontend Implementation

- `pages/materials/MaterialCatalogPage.tsx` — material list with search, filter, pagination.
- `pages/materials/MaterialDetailPage.tsx`.
- `pages/projects/BOMPage.tsx` — BOM items with planned/used/remaining quantities.
- `pages/projects/MaterialRequestsPage.tsx` — request list with status filters.
- `pages/projects/MaterialRequestDetailPage.tsx` — request detail with approval/issue actions.
- `pages/inventory/InventoryPage.tsx` — location selection, material search, stock overview.
- `pages/inventory/InventoryDetailPage.tsx` — current stock, thresholds, recent movements.
- Material request form with material selector, quantity input, reason.
- Approval/rejection UI for Project Manager.
- Issue UI for Store Manager with stock validation.
- Low-stock alert indicators.

### Security Requirements

- Material catalog management: Admin, Store Manager.
- Material requests: Site Engineer (create), Project Manager (approve/reject), Store Manager (issue).
- Inventory operations: Store Manager.
- Material issuance blocked without required approval.
- Negative inventory prevented server-side.
- Project access enforced on all project-scoped endpoints.
- Audit records for all material/inventory operations.

### Testing Requirements

Per `TESTING-QA.md` Sections 13–15:

**Unit Tests:**
- BOM variance calculation.
- Inventory balance update logic.
- Negative stock prevention.
- Material request state machine.

**Integration Tests:**
- Material request workflow: request → approve → issue → inventory updated.
- Invalid paths: issue before approval → rejected; issue above stock → rejected; issue above approved quantity → rejected.
- Every transaction type updates balances correctly.
- Multi-document atomicity for inventory operations.
- Audit records created.

**E2E Tests (E2E-04):**
- Site Engineer creates request → PM approves → Store Manager issues → inventory updated → notification.

### UI/UX Requirements

Per `UI-UX.md` Sections 17–18:
- Material lifecycle state clearly visible (Requested → Approved → Issued → Consumed/Returned).
- Inventory views prioritize current stock, thresholds, pending requests, recent movements, low-stock alerts.
- No UI path permits negative inventory.

### Documentation Impact

- Material/inventory APIs documented.
- Material request workflow documented.
- Inventory transaction types documented.

### Deliverables

- Material catalog CRUD.
- BOM with versioning.
- Material request approval workflow.
- Inventory management with all transaction types.
- Negative stock prevention.
- Stock alerts.
- Full frontend for materials/inventory.

### Definition of Done

- Materials can be cataloged and managed.
- BOMs can be configured per project/phase/task.
- Material requests follow the full approval workflow.
- Issuance without approval is blocked.
- Negative inventory is prevented.
- All seven transaction types work correctly.
- Stock alerts function at thresholds.
- All Phase 8 tests pass.

---

## Phase 9 — Procurement & Vendors

### Objective

Implement vendor management, procurement requests, purchase orders with approval workflow, material receiving, and integration with inventory (receiving → inventory update).

### Dependencies

- Phase 8 completed (materials and inventory exist).

### Scope

- `vendors` collection.
- `procurement_requests` collection.
- `purchase_orders` collection with approval workflow.
- `material_receipts` collection.
- Procurement workflow per `PRD.md` Section 8.10: Material Shortage → Procurement Request → Review → Approval → Purchase Order → Vendor → Receiving → Inventory.
- Material receipt creation must update inventory through the inventory service.

### Backend Implementation

- `modules/vendors/` — CRUD, search, filter, pagination, status management, materials supplied, performance summary.
- `modules/procurement/` — procurement request CRUD, approval workflow.
- Purchase order CRUD with approval, PO number generation, status management.
- Material receiving: validate purchase order → record receipt → increment inventory → create inventory transaction → audit.

### Database Implementation

**`vendors`** per `DATABASE-DESIGN.md` Section 12.1.
**`procurement_requests`** per `DATABASE-DESIGN.md` Section 12.2.
**`purchase_orders`** per `DATABASE-DESIGN.md` Section 12.3.
**`material_receipts`** per `DATABASE-DESIGN.md` Section 12.4.

### API Implementation

- Vendor CRUD: `/api/v1/vendors`.
- Procurement requests: `/api/v1/projects/:projectId/procurement-requests`.
- Purchase orders: `/api/v1/projects/:projectId/purchase-orders`.
- Material receiving: `/api/v1/projects/:projectId/receiving`.

### Frontend Implementation

- Vendor list, detail, create/edit pages.
- Procurement request pages.
- Purchase order pages with vendor, materials, quantities, prices, expected delivery, approval status.
- Receiving page with quantity verification.

### Security Requirements

- Vendor management: Admin, Store Manager.
- Procurement: Store Manager, Project Manager.
- Purchase order approval: authorized approvers.
- Receiving: Store Manager.
- Audit records for all procurement operations.

### Testing Requirements

Per `TESTING-QA.md` Section 16:
- Full procurement lifecycle test.
- Receiving updates inventory correctly.
- Rejection and cancellation paths.
- Unauthorized operations rejected.

**E2E Tests (E2E-05):**
- Shortage → procurement request → approval → PO → receiving → inventory updated.

### UI/UX Requirements

Per `UI-UX.md` Section 18: procurement visually communicates Request → Review → Approval → PO → Vendor → Receiving → Inventory.

### Documentation Impact

- Procurement API documented.
- Vendor API documented.

### Deliverables

- Vendor management.
- Procurement request workflow.
- Purchase order management.
- Material receiving with inventory integration.

### Definition of Done

- Vendors can be managed.
- Procurement requests follow approval workflow.
- Purchase orders are created and approved.
- Receiving updates inventory through inventory service.
- All Phase 9 tests pass.

---

## Phase 10 — Workforce & Attendance

### Objective

Implement worker records, worker types/trades, project/phase/task assignments, attendance recording with check-in/check-out, working-hour calculation, overtime reporting, and workforce-related views.

### Dependencies

- Phase 7 completed (tasks and phases exist for assignment linking).

### Scope

- `workers` collection (not full HR/payroll).
- `workforce_assignments` collection.
- `attendance` collection with unique constraint (workerId + projectId + date).
- Working-hour and overtime calculation.
- Workforce assignment to projects, phases, tasks.

### Backend Implementation

- `modules/workforce/` — worker CRUD, assignment management.
- `modules/attendance/` — attendance recording, check-in/check-out, hour calculation, overtime calculation.

### Database Implementation

**`workers`** per `DATABASE-DESIGN.md` Section 8.1.
**`workforce_assignments`** per `DATABASE-DESIGN.md` Section 8.2.
**`attendance`** per `DATABASE-DESIGN.md` Section 8.3.

### API Implementation

- Workers: `/api/v1/workforce`.
- Project workforce: `/api/v1/projects/:projectId/workforce`.
- Attendance: `/api/v1/projects/:projectId/attendance`.

### Frontend Implementation

- Worker list, detail, create/edit pages.
- Project workforce page.
- Attendance recording page (select project, date, workers, status, check-in/out).
- Working hours and overtime display.

### Security Requirements

- Workforce management: Admin, Project Manager.
- Attendance recording: Site Engineer, Project Manager.
- Project access enforced.

### Testing Requirements

Per `TESTING-QA.md` Section 17:
- Worker CRUD, assignment, attendance, hour/overtime calculation.
- Duplicate attendance prevention.
- Assignment history preserved.

### UI/UX Requirements

Per `UI-UX.md` Section 19: worker identity, trade, assignment, attendance, hours, overtime. Not payroll.

### Documentation Impact

- Workforce API documented.

### Deliverables

- Worker management.
- Project/phase/task assignments.
- Attendance with check-in/out.
- Working-hour and overtime calculation.

### Definition of Done

- Workers can be created and assigned.
- Attendance can be recorded.
- Hours and overtime calculate correctly.
- Duplicate attendance prevented.
- All Phase 10 tests pass.

---

## Phase 11 — Equipment & Asset Management

### Objective

Implement equipment master records, status management (Available, Assigned, In Use, Under Maintenance, Breakdown, Inactive, Retired), project assignment with schedule conflict detection, maintenance scheduling, equipment inspections, and rental equipment tracking.

### Dependencies

- Phase 6 completed (projects exist for assignment).

### Scope

- `equipment` collection with all statuses.
- `equipment_assignments` collection with conflict detection.
- `equipment_maintenance` collection.
- `equipment_inspections` collection.
- Assignment must check availability, schedule conflicts, and maintenance status before confirming.
- Conflicting assignments are rejected.
- Breakdown flow: record breakdown → status change → notify affected assignments → maintenance → repair → inspection → available.

### Backend Implementation

- `modules/equipment/` — CRUD, status management, assignment with conflict detection, maintenance, inspections.
- Equipment conflict detection service: check for overlapping date ranges on existing assignments.

### Database Implementation

**`equipment`** per `DATABASE-DESIGN.md` Section 13.
**`equipment_assignments`**, **`equipment_maintenance`**, **`equipment_inspections`** per `DATABASE-DESIGN.md` Section 13.

### API Implementation

- Equipment CRUD: `/api/v1/equipment`.
- Project equipment: `/api/v1/projects/:projectId/equipment`.
- Assignments, maintenance, inspections sub-resources.

### Frontend Implementation

- Equipment list, detail, create/edit pages.
- Equipment assignment page with availability/conflict/maintenance checks.
- Maintenance scheduling and recording.
- Inspection recording.
- Status grouping display per `UI-UX.md` Section 20.

### Security Requirements

- Equipment management: Admin, Project Manager.
- Project access enforced.
- Conflicting assignments rejected server-side.

### Testing Requirements

Per `TESTING-QA.md` Section 18:
- Equipment CRUD, status changes, assignment, scheduling, conflict detection, maintenance, inspections.
- Conflicting assignment → REJECT.
- Unavailable equipment (maintenance/breakdown) → assignment rejected.

**E2E Tests (E2E-06):**
- Equipment assignment with availability/conflict/maintenance checks.

### UI/UX Requirements

Per `UI-UX.md` Section 20: emphasis on availability and operational state. Assignment UI surfaces conflicts and maintenance restrictions before confirmation.

### Documentation Impact

- Equipment API documented.

### Deliverables

- Equipment management with all statuses.
- Assignment with conflict detection.
- Maintenance and inspection tracking.

### Definition of Done

- Equipment can be managed with all status transitions.
- Conflicting assignments are rejected.
- Maintenance and inspections tracked.
- All Phase 11 tests pass.

---

## Phase 12 — Budget & Expenses

### Objective

Implement project budgets with categories (material, workforce, equipment, other), expense tracking, variance calculation, budget change request workflow with approval, and cost reporting.

### Dependencies

- Phase 6 completed (projects exist).
- Phase 8–11 informational (material, workforce, equipment costs can feed into budget).

### Scope

- `budgets` collection with categories and versioning.
- `expenses` collection.
- `budget_change_requests` collection with approval workflow.
- Variance calculation: planned vs actual.
- Budget change request workflow per `PRD.md` Section 9.5: PM → Budget Change Request → Admin Review → Approve/Reject → Budget Updated → Audit → Notification.

### Backend Implementation

- `modules/budget/` — budget CRUD, category management, variance calculation.
- `modules/expenses/` — expense recording, categorization.
- Budget change request workflow with authorization.

### Database Implementation

**`budgets`** per `DATABASE-DESIGN.md` Section 14.1.
**`expenses`** per `DATABASE-DESIGN.md` Section 14.2.
**`budget_change_requests`** per `DATABASE-DESIGN.md` Section 14.3.

### API Implementation

- Budget: `/api/v1/projects/:projectId/budget`.
- Expenses: `/api/v1/projects/:projectId/expenses`.
- Budget change requests: `/api/v1/projects/:projectId/budget-change-requests`.

### Frontend Implementation

- Budget overview page (original, current, actual, committed, remaining, variance, category breakdown).
- Expense list and recording.
- Budget change request pages (current budget, requested change, proposed budget, reason, approval status).

### Security Requirements

- Budget management: Project Manager, Admin.
- Budget change approval: Admin.
- Unauthorized budget changes rejected.
- Audit records for all budget changes.

### Testing Requirements

Per `TESTING-QA.md` Section 19:
- Budget CRUD, categories, planned/actual/variance.
- Budget change request approval/rejection.
- Unauthorized budget changes rejected.
- Audit records created.

### UI/UX Requirements

Per `UI-UX.md` Section 21: Planned/Actual/Variance clearly communicated. Budget change requests show current, requested change, proposed, reason, approval status. Not full accounting.

### Documentation Impact

- Budget API documented.

### Deliverables

- Budget management with categories.
- Expense tracking.
- Budget change request workflow.
- Variance calculation.

### Definition of Done

- Budgets can be created with categories.
- Expenses can be recorded.
- Variance calculates correctly.
- Budget changes require approval.
- All Phase 12 tests pass.

---

## Phase 13 — Daily Site Operations & Issues

### Objective

Implement daily site reports (work performed, quantities, materials, equipment, workforce, issues, photos, notes, submission, PM review) and issue management (create, assign, prioritize, track, update, resolve, close) with cross-module references.

### Dependencies

- Phase 7 completed (tasks/phases for reporting context).
- Phase 8 completed (materials for daily report material usage).
- Phase 10 completed (workforce for daily report workforce summary).
- Phase 11 completed (equipment for daily report equipment usage).

### Scope

- `daily_reports` collection.
- `issues` collection with cross-module category references (project, phase, task, material, equipment, quality, safety, other).
- Daily report workflow per `PRD.md` Section 9.7: Site Engineer creates → enters work/quantities/materials/equipment/workforce/issues/photos → submits → PM reviews.
- Issue lifecycle: create → assign → prioritize → track → update → resolve → close.

### Backend Implementation

- `modules/daily-reports/` — CRUD, submission, review.
- `modules/issues/` — CRUD, assignment, status management, cross-module references.

### Database Implementation

**`daily_reports`** per `DATABASE-DESIGN.md` Section 15.1.
**`issues`** per `DATABASE-DESIGN.md` Section 15.2.

### API Implementation

- Daily reports: `/api/v1/projects/:projectId/daily-reports`.
- Issues: `/api/v1/projects/:projectId/issues`.

### Frontend Implementation

- Daily report creation form (work, quantities, materials, equipment, workforce, issues, photos, notes).
- Daily report list and detail pages.
- Issue list with filters (status, priority, category, assignee, due date).
- Issue detail page with updates and resolution.

### Security Requirements

- Daily reports: Site Engineer (create/submit), Project Manager (review).
- Issues: authorized project members.
- Project access enforced.

### Testing Requirements

Per `TESTING-QA.md` Section 20:
- Daily report CRUD, submission, review.
- Issue lifecycle (create, assign, prioritize, update, resolve, close).
- Cross-module issue references.

### UI/UX Requirements

- Daily report form structured by section (not overwhelming).
- Issue list with domain-specific filters per `UI-UX.md` Section 27.

### Documentation Impact

- Daily reports and issues API documented.

### Deliverables

- Daily site report system.
- Issue management with cross-module references.

### Definition of Done

- Daily reports can be created, submitted, and reviewed.
- Issues can be tracked through their full lifecycle.
- All Phase 13 tests pass.

---

## Phase 14 — Quality Management

### Objective

Implement quality inspections with checklists, pass/fail results, defect creation on failure, corrective action assignment, reinspection workflow, and approval/closure.

### Dependencies

- Phase 7 completed (tasks/phases for inspection context).

### Scope

- `quality_inspections` collection.
- `quality_defects` collection.
- `quality_reinspections` collection.
- Quality workflow per `PRD.md` Section 8.18: Inspection → Checklist → PASS → Complete; or FAIL → Defect → Corrective Action → Reinspection → Approval.

### Backend Implementation

- `modules/quality/` — inspection CRUD, checklist processing, defect creation, corrective action management, reinspection, approval workflow.
- State machine: inspection → pass/fail → (if fail) defect → corrective action → reinspection → approval.

### Database Implementation

**`quality_inspections`** per `DATABASE-DESIGN.md` Section 16.
**`quality_defects`** per `DATABASE-DESIGN.md` Section 16.
**`quality_reinspections`** per `DATABASE-DESIGN.md` Section 16.

### API Implementation

- Quality: `/api/v1/projects/:projectId/quality`.
- Inspections, defects, corrective actions, reinspections sub-resources.

### Frontend Implementation

- Quality dashboard.
- Inspection list and creation form with checklist.
- Defect detail with corrective action assignment.
- Reinspection form.
- Approval/closure UI.

### Security Requirements

- Inspection creation: Site Engineer, Project Manager.
- Approval: Project Manager.
- Project access enforced.

### Testing Requirements

Per `TESTING-QA.md` Section 21:
- Pass path and fail path.
- Defect creation, corrective action, reinspection, approval.
- Invalid transitions rejected.
- Historical quality records preserved.

**E2E Tests (E2E-07):**
- Inspection → fail → defect → corrective action → reinspection → approval.

### UI/UX Requirements

Per `UI-UX.md` Section 22: clearly distinguish inspection status, result, defects, corrective actions, reinspection status.

### Documentation Impact

- Quality API documented.

### Deliverables

- Complete quality management workflow.

### Definition of Done

- Quality inspections with checklists work.
- Failed inspections create defects with corrective actions.
- Reinspection and approval workflow complete.
- All Phase 14 tests pass.

---

## Phase 15 — Safety Management

### Objective

Implement hazard/incident/near-miss recording with severity classification, corrective action assignment, review workflow, and closure.

### Dependencies

- Phase 6 completed (projects exist).

### Scope

- `safety_records` collection with types: HAZARD, INCIDENT, NEAR_MISS.
- Safety workflow per `PRD.md` Section 8.19: Record → Classify Severity → Assign Action → Corrective Action → Review → Close.
- Severity classification.
- Corrective action tracking.

### Backend Implementation

- `modules/safety/` — CRUD, severity classification, corrective action management, review, closure.

### Database Implementation

**`safety_records`** per `DATABASE-DESIGN.md` Section 17.

### API Implementation

- Safety: `/api/v1/projects/:projectId/safety`.

### Frontend Implementation

- Safety dashboard.
- Hazard/incident/near-miss creation forms.
- Safety record list and detail.
- Corrective action tracking.
- Review and closure UI.

### Security Requirements

- Safety reporting: Site Engineer, Project Manager.
- Review: Project Manager.
- Critical/high-severity records handled per required workflow.

### Testing Requirements

Per `TESTING-QA.md` Section 22:
- Hazard, incident, near-miss recording.
- Severity classification.
- Corrective action, review, closure.

**E2E Tests (E2E-08):**
- Record incident → severity → corrective action → review → close.

### UI/UX Requirements

Per `UI-UX.md` Section 23: emphasis on severity, status, corrective actions. Critical/high-severity visually prominent without relying only on color.

### Documentation Impact

- Safety API documented.

### Deliverables

- Complete safety management system.

### Definition of Done

- Hazards, incidents, near misses can be recorded and classified.
- Corrective actions tracked through closure.
- All Phase 15 tests pass.

---

## Phase 16 — Documents & File Management

### Objective

Implement document metadata storage, local filesystem storage abstraction, file uploads with type/size validation, secure generated filenames, document versioning, visibility control (internal/client), download authorization, and audit logging for sensitive file actions.

### Dependencies

- Phase 6 completed (projects exist for document scoping).

### Scope

- `documents` collection.
- `document_versions` collection.
- Storage service interface with local storage adapter per `ARCHITECTURE.md` Section 13.
- File upload: validate type, validate size, generate safe server-side filename, store file, create metadata in MongoDB.
- Document versioning: upload new version → version created → previous version preserved → activity recorded.
- Visibility control: internal-only vs client-visible.
- Download authorization: verify project access and document visibility.

### Backend Implementation

- `modules/documents/` — document CRUD, version management, visibility control.
- `storage/` — storage service interface + local filesystem adapter.
- File upload middleware (Multer or similar): type validation, size validation, safe filename generation.
- Download endpoint with authorization check.
- Audit logging for uploads, downloads, version changes.

### Database Implementation

**`documents`** per `DATABASE-DESIGN.md` Section 18.
**`document_versions`** per `DATABASE-DESIGN.md` Section 18.

### API Implementation

- Documents: `/api/v1/projects/:projectId/documents`.
- Upload: `POST /api/v1/projects/:projectId/documents/:documentId/versions`.
- Download: `GET /api/v1/projects/:projectId/documents/:documentId/download`.

### Frontend Implementation

- Project documents page.
- Document detail with version history.
- Upload form with allowed types/sizes displayed, upload progress.
- Version history display.

### Security Requirements

- File type and size validation server-side.
- No user-controlled filename used as storage filename.
- No arbitrary filesystem path exposure.
- Download authorization enforced.
- Client visibility controlled server-side.
- Audit logging for sensitive file actions.
- Path traversal and unsafe filename input prevention.

### Testing Requirements

Per `TESTING-QA.md` Section 23:
- Upload, type/size validation, secure filename, metadata, versioning.
- Project access and client visibility enforcement.
- Unauthorized download rejected.
- Path traversal attempts blocked.
- Audit logging for file actions.

### UI/UX Requirements

Per `UI-UX.md` Section 24: document name, category, version, visibility, uploader, date, version history. Upload UI communicates allowed types, max size, status, failure reason.

### Documentation Impact

- Document management API documented.
- Storage abstraction documented.

### Deliverables

- Document management with versioning.
- Local filesystem storage behind abstraction.
- File upload with validation.
- Download authorization.
- Audit logging.

### Definition of Done

- Documents can be uploaded, versioned, and downloaded.
- File type and size validation works.
- Secure filenames generated.
- Unauthorized access rejected.
- Storage abstraction in place for future migration.
- All Phase 16 tests pass.

---

## Phase 17 — Notifications, Activity & Real-Time Updates

### Objective

Implement in-website notifications, activity feeds, WebSocket infrastructure for real-time events, authorized subscriptions, and real-time UI updates.

### Dependencies

- Phase 4 completed (authentication for WebSocket connections).
- Phase 5 completed (authorization for subscriptions).
- Phases 6–16 provide business events that generate notifications.

### Scope

- `notifications` collection.
- `activities` collection.
- Notification service: determine recipients, permission check, create notification, persist in DB, emit WebSocket event.
- WebSocket server with authentication on connection, authorization on subscription, project-level access checks.
- WebSocket events for: notifications, approval updates, project progress updates, inventory changes, activity updates, client query updates.
- Activity feed per project.
- Notification panel in header.

### Backend Implementation

- `modules/notifications/` — notification creation, query (read/unread), mark as read.
- `modules/activities/` — activity creation, query by project.
- `websocket/` — WebSocket server setup (Socket.io or ws).
  - Authenticate connection using JWT.
  - Authorize subscriptions per project access.
  - Emit events only to authorized recipients.
  - Disconnect on account deactivation.
- Notification service integration with existing business modules (material requests, budget changes, progress updates, etc.).

### Database Implementation

**`notifications`** per `DATABASE-DESIGN.md` Section 19.1.
**`activities`** per `DATABASE-DESIGN.md` Section 19.2.

### API Implementation

- Notifications: `/api/v1/notifications`.
- Activities: `/api/v1/projects/:projectId/activities`.
- WebSocket connection endpoint.

### Frontend Implementation

- `components/NotificationPanel.tsx` — notification list in header dropdown with read/unread state, timestamps, navigation targets.
- `pages/shared/NotificationsPage.tsx` — full notification list.
- `pages/projects/ActivityPage.tsx` — project activity feed.
- WebSocket client: connect on login, authenticate, subscribe to permitted channels, handle events, update UI.
- Real-time notification badge in header.
- Real-time dashboard updates (progress, approvals, inventory).

### Security Requirements

- WebSocket authentication on connection.
- WebSocket authorization on subscription.
- Project-level access checks for event delivery.
- Unauthorized events not delivered.
- Disconnect on account deactivation.
- Database remains source of truth; WebSocket events are supplementary.

### Testing Requirements

Per `TESTING-QA.md` Sections 25–26:
- Notification creation, recipient, project, read/unread, navigation.
- WebSocket: auth on connect, auth on subscribe, project access, event delivery, unauthorized rejection, disconnect on deactivation, reconnection.

### UI/UX Requirements

Per `UI-UX.md` Section 26: notifications are useful, not noisy. Read/unread state, project, clear action, timestamp, navigation to affected record.

### Documentation Impact

- Notification API documented.
- WebSocket events documented.
- Activity feed documented.

### Deliverables

- In-website notification system.
- Activity feeds.
- WebSocket real-time infrastructure.
- Real-time UI updates.

### Definition of Done

- Notifications created for business events.
- Notifications delivered via WebSocket to authorized recipients.
- Activity feeds display project history.
- WebSocket authentication and authorization enforced.
- All Phase 17 tests pass.

---

## Phase 18 — Reports & Analytics

### Objective

Implement the documented reporting and analytics capabilities using operational data from existing collections. Provide role-specific dashboards with relevant analytics.

### Dependencies

- Phases 6–17 completed (operational data exists across all modules).

### Scope

Per `PRD.md` Section 8.23, reports cover:
- Admin: organization overview, projects, users, security events, activity.
- Project Manager: progress, budget, materials, workforce, equipment, quality, safety, delays, approvals.
- Site Engineer: tasks, progress, materials, daily reports, issues.
- Store Manager: inventory, low stock, requests, purchases, material movements.
- Contractor: assigned work, progress, schedule, issues.
- Client: approved progress, milestones, reports, documents, project health.

Reports generated from operational collections; no separate reporting database for V1.

### Backend Implementation

- `modules/reports/` — report generation services for each domain (project progress, budget/cost, materials/inventory, workforce, equipment, quality, safety, delays, organization overview).
- Aggregation queries on existing collections.
- Report data endpoints with authorization (users see only their authorized data).

### API Implementation

- Reports: `/api/v1/reports`, `/api/v1/projects/:projectId/reports`.
- Report types: progress, budget, material, workforce, equipment, quality, safety.

### Frontend Implementation

- Reports dashboard page.
- Individual report pages with filters (project, date range, category).
- Charts/visualizations where appropriate (progress bars, budget variance, inventory levels).
- Export capability where supported.
- Role-specific dashboard enhancements using analytics data.

### Security Requirements

- Reports filtered by user's authorization and project access.
- Client reports show only approved/client-visible data.

### Testing Requirements

- Report data matches operational data.
- Authorization filtering verified.
- Client-visible reports contain only approved information.

### UI/UX Requirements

- Dashboard analytics prioritize decisions per `UI-UX.md` Section 14.
- Charts are operational, not decorative.

### Documentation Impact

- Report types documented.
- Report API documented.

### Deliverables

- Role-specific dashboards with analytics.
- Report generation for all documented domains.
- Export capability.

### Definition of Done

- All documented report types implemented.
- Reports respect authorization boundaries.
- Role dashboards enhanced with analytics.
- All Phase 18 tests pass.

---

## Phase 19 — Client Portal

### Objective

Implement the client-facing experience per `WEBSITE-FLOW.md` Sections 42–44, with strict client visibility and authorization boundaries. The Client Portal uses a simplified navigation and exposes only approved, client-visible information.

### Dependencies

- Phases 4–5 completed (authentication and authorization for Client role).
- Phase 7 completed (milestones with client visibility flag).
- Phase 16 completed (documents with visibility control).
- Phase 17 completed (notifications for client queries).
- Phase 18 completed (client reports).

### Scope

- Client layout with simplified navigation: Dashboard, Projects, Notifications, Profile.
- Client routes under `/client/` per `WEBSITE-FLOW.md` Section 4.3.
- Client dashboard: approved progress, milestones, reports, documents, project health.
- Client project overview: only approved information.
- Client query system: client submits query → project team notification → response → client notification → query closed.
- Client cannot modify internal operational data.
- Client cannot view: internal notes, unauthorized financial info, internal-only documents, internal activity, internal permission controls.

### Backend Implementation

- Client-specific API endpoints or filters that return only client-visible data.
- Client query module: `POST /api/v1/client/projects/:projectId/queries`, `GET /api/v1/client/projects/:projectId/queries`.
- Authorization: Client role verified on all client endpoints; internal data excluded.
- Milestone, document, report visibility filtering.

### Database Implementation

- Client queries can use the `issues` collection with a specific category or a dedicated `client_queries` sub-collection (implementation decision based on data patterns).

### API Implementation

- Client routes: `/api/v1/client/projects`, `/api/v1/client/projects/:projectId/overview`, `/api/v1/client/projects/:projectId/progress`, `/api/v1/client/projects/:projectId/milestones`, `/api/v1/client/projects/:projectId/reports`, `/api/v1/client/projects/:projectId/documents`, `/api/v1/client/projects/:projectId/photos`, `/api/v1/client/projects/:projectId/queries`.
- Client notifications: `/api/v1/client/notifications`.

### Frontend Implementation

- `layouts/ClientLayout.tsx` — simplified shell with client navigation.
- `pages/client/ClientDashboardPage.tsx`.
- `pages/client/ClientProjectsPage.tsx`.
- `pages/client/ClientProjectOverviewPage.tsx`.
- `pages/client/ClientProgressPage.tsx`.
- `pages/client/ClientMilestonesPage.tsx`.
- `pages/client/ClientReportsPage.tsx`.
- `pages/client/ClientDocumentsPage.tsx`.
- `pages/client/ClientPhotosPage.tsx`.
- `pages/client/ClientQueriesPage.tsx` — query list, create query, view responses.
- `pages/client/ClientNotificationsPage.tsx`.
- `pages/client/ClientProfilePage.tsx`.

### Security Requirements

- Client sees only authorized projects.
- Client sees only client-visible information (approved progress, client-visible milestones, client-visible documents).
- Client cannot access internal workspace APIs.
- Client cannot access another client's projects.
- Backend enforces all visibility boundaries.

### Testing Requirements

Per `TESTING-QA.md` Section 24:
- Client login, authorized projects, approved progress/milestones/reports/documents/photos/health.
- Client cannot: modify internal data, view internal-only documents, view internal notes, view unauthorized financial info, access another client's project, use internal APIs.
- Client query submission and response flow.

**E2E Tests (E2E-09):**
- Client login → assigned project → approved progress → milestones → reports/documents → submit query.

### UI/UX Requirements

Per `UI-UX.md` Section 25: simplified, clean interface. Client should not see internal operational data, notes, unauthorized financial info, internal documents, internal activity, internal permissions.

### Documentation Impact

- Client portal API documented.
- Client visibility rules documented.

### Deliverables

- Complete client portal.
- Client dashboard, project views, query system.
- Client visibility enforcement.

### Definition of Done

- Client portal is fully functional.
- Clients see only authorized, approved information.
- Client queries work end-to-end.
- Internal data is completely hidden from clients.
- All Phase 19 tests pass.

---

## Phase 20 — Security Hardening, Integration & UX Refinement

### Objective

Perform cross-module security hardening, authorization audit, error handling review, responsive behavior refinement, accessibility checks, and integration fixes across all implemented modules.

### Dependencies

- Phases 0–19 completed.

### Scope

**Security Hardening:**
- Comprehensive authorization audit: verify every protected endpoint enforces authentication + authorization + project access.
- Rate limiting for sensitive endpoints (login, password reset) where appropriate.
- Review all API error responses to ensure no internal details are exposed in production.
- Verify no secrets in logs.
- Verify no secrets committed to repository.
- Review file upload security (type validation, size validation, path traversal prevention).
- Verify account deactivation immediately invalidates sessions, stops API access, disconnects WebSocket.
- Verify WebSocket authorization on all event channels.

**Integration:**
- Cross-module workflow testing (material request → approval → issue → inventory → budget impact).
- Verify cross-module navigation per `WEBSITE-FLOW.md` Section 52 (task → related materials, material request → approval → inventory issue, project → budget → expense, quality defect → corrective action → task/issue).
- Verify project context is maintained across module navigation.
- Verify breadcrumbs reflect actual navigation context.
- Verify unsaved changes warning on forms.
- Verify form submission prevents duplicate submissions.

**UX Refinement:**
- Responsive testing at all breakpoints (desktop, tablet, mobile).
- Verify all pages handle loading, empty, error, permission-denied, validation, success states.
- Verify transitions are smooth and subtle.
- Verify consistent design language across all modules.
- Verify accessibility: keyboard navigation, focus states, semantic headings, form labels, contrast, non-color-only status indicators.

### Backend Implementation

- Rate limiting middleware for sensitive endpoints.
- Security review of all middleware chains.
- Cross-module integration fixes.

### Frontend Implementation

- Responsive fixes across all pages.
- Accessibility improvements.
- Transition/animation consistency.
- Cross-module navigation links.
- Breadcrumb implementation.
- Unsaved changes guards on forms.
- Duplicate submission prevention.

### Security Requirements

- All items in `TRD.md` Section 23 and `ARCHITECTURE.md` Section 19 verified.
- No committed secrets.
- No exposed internal details in production responses.

### Testing Requirements

Per `TESTING-QA.md` Sections 30–32:

**Responsive Testing:**
- Representative screens at desktop, tablet, mobile.
- Sidebar, header, tables, forms, dialogs, cards, charts, file upload, notifications, project switcher.

**Accessibility QA:**
- Keyboard navigation, focus visibility, semantic headings, form labels, contrast, status without color alone, touch targets.

**Security QA:**
- Brute-force resistance, session expiration, logout invalidation.
- Role escalation, permission bypass, project ID tampering, direct URL access, API access without UI.
- Malformed IDs, unexpected types, oversized input, injection payloads, unsafe filenames, path traversal.
- Unauthorized project data, internal client-hidden info, sensitive error responses.

### UI/UX Requirements

- Final visual polish per `UI-UX.md`.
- Consistent use of StatusBadge, EmptyState, LoadingState, ErrorState, PermissionDenied across all modules.

### Documentation Impact

- Security audit results documented.
- Any discovered issues and resolutions documented.

### Deliverables

- Security-hardened application.
- Cross-module integration verified.
- Responsive and accessible UI.
- Consistent UX across all modules.

### Definition of Done

- No authorization bypass found.
- No secrets in logs or repository.
- All error responses are safe for production.
- All pages responsive at all breakpoints.
- Core accessibility checks pass.
- Cross-module navigation works correctly.
- All Phase 20 tests pass.

---

## Phase 21 — Comprehensive QA & V1 Release Readiness

### Objective

Run full regression testing, critical E2E flows, security testing, project-isolation testing, database integrity checks, performance checks, accessibility checks, portability verification, and final release gates per `TESTING-QA.md` Section 39.

### Dependencies

- Phase 20 completed.

### Scope

**Regression Testing:**
- Run all unit tests.
- Run all integration/API tests.
- Run all E2E critical flow tests (E2E-01 through E2E-10 per `TESTING-QA.md` Section 36).

**Security Testing:**
- Authentication bypass attempts.
- Authorization bypass attempts across all roles.
- Project isolation verification (Project A user cannot access Project B data, APIs, search results, WebSocket events).
- File access control verification.
- Audit log integrity verification.

**Database Integrity:**
- Inventory balance verification (no negative values).
- Budget calculation verification.
- Historical record preservation verification.
- Unique index verification (email, project code, material code, vendor code, equipment code, PO number).
- Referential consistency verification at service level.

**Performance Checks:**
- Initial page load.
- Dashboard rendering.
- Large table pagination.
- Search/filter response.
- Project switching.
- API response times for common operations.

**Accessibility Checks:**
- Final accessibility audit on representative screens.
- Keyboard navigation verification.
- Screen reader compatibility on critical flows.

**Portability Verification:**

Verify the application on a clean development environment or another laptop.

Confirm:
- No hardcoded ports exist.
- No hardcoded localhost API URLs exist in application logic.
- No absolute machine-specific filesystem paths exist.
- `.env` is ignored by Git.
- `.env.example` contains all required variables.
- Application starts successfully using only documented environment configuration.
- Frontend can communicate with the backend using configured environment values.
- Database connection uses environment configuration.
- Changing the configured backend/frontend ports does not require source-code changes.
- No secrets or credentials are committed to the repository.

**Release Gate Verification:**
- Frontend build passes.
- Backend build passes.
- TypeScript checks pass.
- Lint checks pass.
- No open Critical defects.
- No open High-severity security defects.
- All critical E2E flows pass.
- Documentation synchronized with implementation.

### Backend Implementation

- Fix any issues found during QA.

### Frontend Implementation

- Fix any issues found during QA.

### Testing Requirements

All tests from `TESTING-QA.md` executed and passing. Specifically:

**Critical E2E Scenarios (per TESTING-QA.md Section 36):**

| ID | Scenario |
|---|---|
| E2E-01 | Admin onboards user → assign role → assign project → activation → login → dashboard |
| E2E-02 | PM creates project → type → template → phases → BOM → budget → team → workspace |
| E2E-03 | Site Engineer enters quantity → progress recalculated → dashboard updated |
| E2E-04 | Material request → PM approval → Store Manager issue → inventory updated → notification |
| E2E-05 | Procurement request → approval → PO → receiving → inventory updated |
| E2E-06 | Equipment assignment → availability → conflict → maintenance check → assignment |
| E2E-07 | Inspection → fail → defect → corrective action → reinspection → approval |
| E2E-08 | Safety incident → severity → corrective action → review → close |
| E2E-09 | Client login → project → progress → milestones → reports → documents → query |
| E2E-10 | Admin deactivates user → session invalidated → API denied → WS disconnected → history preserved → audit |

### Documentation Impact

- QA results documented.
- Release notes prepared.
- All eight source-of-truth documents verified for synchronization with implementation.

### Deliverables

- All tests passing.
- Security audit complete.
- Performance benchmarks recorded.
- Accessibility audit complete.
- Portability verified.
- Release gate checklist completed.
- Release notes.

### Definition of Done

- All release gates from `TESTING-QA.md` Section 39 passed.
- No open Critical defects.
- No open High-severity security defects.
- V1 ready for deployment.

---

## 4. V1 Completion Checklist

### Product

- [ ] All documented V1 features implemented per `PRD.md`.
- [ ] All six roles supported (Admin, Project Manager, Site Engineer, Store Manager, Contractor, Client).
- [ ] Internal workspace complete with all modules.
- [ ] Client portal complete with visibility boundaries.
- [ ] Rule-based project health implemented (no external AI).

### Architecture

- [ ] Modular monolith maintained per `ARCHITECTURE.md`.
- [ ] Backend layering maintained (route → middleware → controller → service → repository → MongoDB).
- [ ] API versioning maintained (`/api/v1/`).
- [ ] Storage abstraction in place for future migration.

### Database

- [ ] All required collections implemented per `DATABASE-DESIGN.md`.
- [ ] Indexes implemented for actual query patterns.
- [ ] Data integrity rules enforced (unique codes, no negative inventory, no unauthorized access).
- [ ] Historical records preserved (audit, progress, versions).
- [ ] MongoDB transactions used for multi-document operations where required.

### Security

- [ ] Authentication complete (login, logout, password reset, account activation, JWT, session expiration, failed-login tracking, account lock, login history).
- [ ] Authorization complete (six roles, additional permissions, project membership).
- [ ] Project isolation verified.
- [ ] File security verified (type/size validation, secure filenames, authorized access, no path traversal).
- [ ] Audit logging verified for important actions.
- [ ] No secrets committed to repository.
- [ ] No internal details in production error responses.
- [ ] Rate limiting on sensitive endpoints.

### UI/UX

- [ ] Responsive at desktop, tablet, and mobile breakpoints.
- [ ] Accessible (keyboard navigation, focus states, labels, contrast, non-color-only indicators).
- [ ] Consistent design language across all modules.
- [ ] All major UI states implemented (loading, empty, error, permission denied, validation, success).
- [ ] Client/internal separation verified.
- [ ] Professional, human-designed appearance — not generic AI-generated template.
- [ ] Smooth, subtle transitions.

### Testing

- [ ] Unit tests for business rules, calculations, validation, services.
- [ ] Integration/API tests for authentication, authorization, database operations, workflows.
- [ ] E2E tests for critical workflows (E2E-01 through E2E-10).
- [ ] Security testing (auth bypass, role escalation, project isolation, input security).
- [ ] Regression testing complete.
- [ ] Performance checks on common operations.
- [ ] Accessibility checks on representative screens.
- [ ] Responsive testing at all breakpoints.

### Release

- [ ] Frontend production build succeeds.
- [ ] Backend production build succeeds.
- [ ] TypeScript compilation succeeds.
- [ ] Lint checks pass.
- [ ] No critical defects open.
- [ ] No critical security issues open.
- [ ] Documentation synchronized with implementation.
- [ ] Portability verified (clean environment, no hardcoded URLs/ports/paths, `.env.example` complete).
- [ ] V1 release gate passed per `TESTING-QA.md` Section 39.

---

## 5. Documentation Synchronization Rules

For every phase, if implementation requires documentation changes:

| Change Type | Document to Update |
|---|---|
| Product behavior/scope | `PRD.md` |
| Technical constraint | `TRD.md` |
| Architecture | `ARCHITECTURE.md` |
| Database/schema | `DATABASE-DESIGN.md` |
| Navigation/user flow | `WEBSITE-FLOW.md` |
| UI/UX behavior | `UI-UX.md` |
| Testing/QA strategy | `TESTING-QA.md` |
| Project-wide implementation rule | `PROJECT-CONTEXT.md` |

The implementation plan itself must not silently modify those documents. If a change is needed, it must be identified, documented, and approved before implementation proceeds.

---

## 6. Documentation Conflicts / Clarifications

After reviewing all eight source-of-truth documents, the following observations are noted:

### 6.1 No Blocking Conflicts Found

All eight documents are internally consistent. The technology stack, architecture, role definitions, database design, website flows, UI/UX direction, and testing strategy align without contradiction.

### 6.2 Minor Clarifications

1. **Testing library selection** (`TRD.md` Section 30): Testing libraries are "intentionally not permanently locked until the implementation stage." This must be finalized in Phase 0. Recommended direction: Vitest (unit/integration), Supertest (API), Playwright or Cypress (E2E).

2. **Server-state library** (`TRD.md` Section 9): "The exact library will be finalized during implementation after evaluating the required complexity." This must be decided in Phase 0. Recommended direction: TanStack Query (React Query) for server state management.

3. **Client queries storage** (`WEBSITE-FLOW.md` Section 44): The database design does not include an explicit `client_queries` collection. Implementation should either use the `issues` collection with a CLIENT_QUERY category or introduce a dedicated collection. Decision deferred to Phase 19 implementation.

4. **Password reset delivery** (`PRD.md` Section 5.2): Email integration is out of V1 scope. Password reset tokens will be generated and stored in the database, but the delivery mechanism (e.g., admin-provided token, or console output in development) must be decided during Phase 4 implementation.

5. **API-SPECIFICATION.md and DEPLOYMENT-OPERATIONS.md**: These documents are referenced in `PRD.md` Section 17 as future documents but are not present in the current `DOCS/` folder. They are not required for this implementation plan, but should be created during implementation (API spec evolves with each phase; deployment operations documented when deployment is configured).

### 6.3 Assumptions Made

1. MongoDB replica set is available for transaction support (required for multi-document atomicity in inventory operations). If not available, the implementation will use careful sequential operations with compensating actions.

2. The six roles are fixed and cannot be extended by admin users, as stated in `PRD.md` Section 6 and `ARCHITECTURE.md` Section 7.

3. V1 password reset will use a token-based mechanism stored in the database. Since email integration is out of scope, the token delivery mechanism is an implementation detail to be decided in Phase 4.

4. WebSocket library selection will be made during Phase 17 implementation (Socket.io is the likely choice for V1 simplicity).

---

## 7. Implementation Summary

| Item | Detail |
|---|---|
| Total Phases | 22 (Phase 0 through Phase 21) |
| Architecture | Modular Monolith |
| Database | MongoDB |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Roles | 6 (Admin, Project Manager, Site Engineer, Store Manager, Contractor, Client) |
| Major Modules | 20+ (Auth, Users, Projects, Phases, Tasks, Materials, BOM, Inventory, Procurement, Vendors, Workforce, Equipment, Budget, Daily Reports, Issues, Quality, Safety, Documents, Notifications, Reports, Client Portal) |
| Testing Strategy | Incremental per phase (unit + integration + E2E) |
| Security Model | JWT + RBAC + Project Membership + Additional Permissions |
| Real-Time | WebSockets for authorized events |
| File Storage | Local filesystem behind storage abstraction |

---

## 8. Document Status

**Version:** 1.0
**Status:** V1 Implementation Roadmap
**Source Documents:** `PROJECT-CONTEXT.md`, `PRD.md`, `TRD.md`, `WEBSITE-FLOW.md`, `ARCHITECTURE.md`, `DATABASE-DESIGN.md`, `UI-UX.md`, `TESTING-QA.md`
**No existing source-of-truth documents were modified.**
