# Smart Build --- System Architecture

**Document:** `ARCHITECTURE.md`\
**Version:** 1.0\
**Status:** V1 Implementation Baseline\
**Authority:** System architecture source of truth\
**Related:** `PROJECT-CONTEXT.md`, `PRD.md`, `TRD.md`,
`WEBSITE-FLOW.md`, `DATABASE-DESIGN.md`, `UI-UX.md`, `TESTING-QA.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the implementation architecture for Smart Build, a
secure web-based construction project and resource-management platform
for a single organization managing multiple construction projects.

The architecture translates the locked product and technical
requirements into implementation boundaries. It does not introduce new
product scope.

The V1 architecture is a **modular monolith** with a React frontend,
Node.js/Express backend, and MongoDB database.

------------------------------------------------------------------------

## 2. Architectural Principles

1.  **Modular monolith first.** V1 uses one backend application with
    clear domain modules; microservices are not required.
2.  **Backend is the security boundary.** Frontend permission checks are
    UX controls only.
3.  **Business rules live in services.** Controllers and routes remain
    thin.
4.  **MongoDB is the source of truth.** WebSockets distribute authorized
    updates; they do not replace persistence.
5.  **Project context is explicit.** Project-scoped operations must
    verify project membership/access on the server.
6.  **Historical records are preserved.** Prefer
    archive/deactivate/cancel semantics over destructive deletion.
7.  **Audit important actions.** Business and security actions must be
    traceable.
8.  **Validate at boundaries.** Backend validation is mandatory;
    frontend validation improves UX.
9.  **Use domain-oriented code.** Feature-specific code should remain
    close to its business domain.
10. **Avoid premature complexity.** Do not introduce infrastructure,
    libraries, or abstractions without a V1 requirement.
11. **Configuration through environment variables.** Secrets and
    environment-specific settings are never committed.
12. **Responsive, practical UI.** The architecture must support desktop,
    tablet, and mobile browser layouts without requiring a separate
    mobile application.

------------------------------------------------------------------------

## 3. High-Level System

``` text
┌──────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  React + TypeScript + Vite + React Router + Tailwind CSS    │
│  Internal Workspace / Client Portal                          │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / REST / WebSocket
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Node.js + Express                         │
│                                                              │
│  Auth → Authorization → Validation → Controllers            │
│                         ↓                                    │
│                    Application Services                      │
│                         ↓                                    │
│                    Repositories                              │
│                         ↓                                    │
│                      MongoDB                                 │
│                                                              │
│  Cross-cutting: errors, logging, audit, security, files     │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │
                ▼                              ▼
        Local File Storage              WebSocket Layer
        behind storage abstraction      for authorized events
```

The system is one deployable backend application for V1.

------------------------------------------------------------------------

## 4. Repository Structure

``` text
smart-build/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── websocket/
│   │   ├── storage/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
│
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

The exact directory naming can evolve during implementation, but the
architectural boundaries must remain intact.

------------------------------------------------------------------------

## 5. Backend Module Boundaries

The backend is divided into business modules:

``` text
modules/
├── auth/
├── users/
├── projects/
├── project-templates/
├── phases/
├── tasks/
├── milestones/
├── progress/
├── workforce/
├── attendance/
├── materials/
├── bom/
├── procurement/
├── vendors/
├── inventory/
├── equipment/
├── budget/
├── expenses/
├── daily-reports/
├── issues/
├── quality/
├── safety/
├── documents/
├── notifications/
├── reports/
├── audit/
└── security/
```

A module may contain:

``` text
module/
├── controller.ts
├── service.ts
├── repository.ts
├── routes.ts
├── validator.ts
├── types.ts
└── constants.ts
```

Not every module needs every file. Keep the structure proportional to
its complexity.

------------------------------------------------------------------------

## 6. Backend Request Flow

All protected requests follow:

``` text
HTTP Request
   ↓
Route
   ↓
Authentication Middleware
   ↓
Account/Session Check
   ↓
Authorization Middleware
   ↓
Request Validation
   ↓
Controller
   ↓
Application Service
   ↓
Business Rules
   ↓
Repository
   ↓
MongoDB
   ↓
Audit / Notification / Event as required
   ↓
Response
```

### Route

Defines method, URL, middleware, and controller.

### Middleware

Handles cross-cutting concerns:

-   Authentication
-   Authorization
-   Request validation
-   Rate limiting where required
-   Request logging
-   Error handling

### Controller

Responsible for:

-   Reading validated input
-   Calling the service
-   Mapping the service result to an HTTP response

Controllers must not contain large business workflows.

### Service

Owns application and business logic such as:

-   Progress calculation
-   Approval transitions
-   Inventory rules
-   Budget rules
-   Equipment conflict detection
-   Project health calculation
-   Permission-sensitive workflows

### Repository

Owns MongoDB access and isolates persistence details from business
logic.

------------------------------------------------------------------------

## 7. Authorization Architecture

Effective access is:

``` text
User
 ├── Primary Role
 ├── Additional Permissions
 └── Project Assignments
          ↓
     Effective Access
```

The six locked roles are:

-   Admin
-   Project Manager
-   Site Engineer
-   Store Manager
-   Contractor
-   Client

Every protected API operation must verify:

1.  Authentication
2.  Account/session validity
3.  Required permission
4.  Project access where applicable
5.  Resource-level access where applicable

The frontend may hide inaccessible navigation, but a user must receive
`403 Forbidden` when attempting an unauthorized API operation.

When access is removed:

``` text
Deactivate / Remove Access
        ↓
Invalidate sessions
        ↓
Stop API access
        ↓
Disconnect WebSocket
        ↓
Remove project access
        ↓
Preserve historical records
        ↓
Create audit record
```

------------------------------------------------------------------------

## 8. Project Context Architecture

Project-scoped routes use:

``` text
/projects/:projectId/...
```

The client may store the active project context for navigation
convenience, but the server must always validate access.

Project switching:

``` text
Select Project
   ↓
Request project context
   ↓
Backend verifies membership
   ↓
Load project
   ↓
Update frontend context
   ↓
Navigate to project overview
```

A project ID supplied by the browser is never trusted by itself.

------------------------------------------------------------------------

## 9. Core Business Workflows

### 9.1 Progress

``` text
Site Engineer
 → completed quantity
 → validation
 → progress calculation
 → task/phase/project update
 → health recalculation
 → audit/activity
 → notification/event
```

Progress should be derived from quantities where applicable, not based
only on arbitrary manual percentages.

### 9.2 Materials

``` text
Requirement
 → inventory check
 ├─ sufficient → request/approval → issue
 └─ insufficient → procurement → receipt → inventory → issue
```

Negative inventory is prohibited.

### 9.3 Equipment

``` text
Assignment request
 → availability check
 → schedule conflict check
 → maintenance status check
 → assignment
```

Conflicting assignments must be rejected.

### 9.4 Budget

``` text
Budget change request
 → authorized review
 → approve/reject
 → if approved, update budget
 → audit
 → notification
```

### 9.5 Quality

``` text
Inspection
 → checklist
 ├─ PASS → complete
 └─ FAIL → defect → corrective action → reinspection → approval
```

### 9.6 Safety

``` text
Incident/Hazard
 → record
 → severity
 → corrective action
 → review
 → close
```

------------------------------------------------------------------------

## 10. API Architecture

All V1 APIs use:

``` text
/api/v1/
```

Representative resource groups:

``` text
/auth
/users
/projects
/tasks
/materials
/inventory
/procurement
/workforce
/equipment
/budgets
/quality
/safety
/documents
/notifications
/reports
/audit
```

`API-SPECIFICATION.md` will contain the exact endpoint contract.

API responses must:

-   Use appropriate HTTP status codes
-   Validate input
-   Enforce authorization
-   Support server-side pagination where required
-   Avoid leaking implementation details
-   Return safe error messages

Example error:

``` json
{
  "success": false,
  "message": "Material request cannot be approved.",
  "code": "MATERIAL_REQUEST_INVALID_STATUS"
}
```

------------------------------------------------------------------------

## 11. Authentication

V1 uses:

-   Email/username-based login
-   Password authentication
-   Secure password hashing
-   JWT-based authentication
-   Session expiration
-   Logout
-   Password reset
-   Account lock behavior
-   Failed-login tracking
-   Login history

Passwords are never stored in plaintext.

Secrets are supplied through environment variables.

------------------------------------------------------------------------

## 12. WebSocket Architecture

WebSockets are used only where real-time behavior adds clear value.

Candidate events include:

-   Notifications
-   Approval updates
-   Project progress updates
-   Inventory changes
-   Activity updates
-   Client query updates

Connection flow:

``` text
Connect
 ↓
Authenticate
 ↓
Authorize
 ↓
Subscribe to permitted context
 ↓
Receive event
 ↓
Update UI
```

The database remains the source of truth.

A WebSocket event must never bypass:

-   Authentication
-   Authorization
-   Validation
-   Project access checks

------------------------------------------------------------------------

## 13. File Storage Architecture

V1 uses controlled local filesystem storage.

``` text
Application
    ↓
Storage Service Interface
    ↓
Local Storage Adapter
    ↓
Filesystem
```

The application should not scatter direct filesystem calls throughout
business modules.

Documents require:

-   Metadata
-   Project-level authorization
-   Controlled file types
-   File-size validation
-   Secure generated filenames
-   Version tracking
-   Audit logging for sensitive actions

The storage abstraction allows future object-storage migration without
redesigning document workflows.

------------------------------------------------------------------------

## 14. Frontend Architecture

The frontend uses:

``` text
React
 + TypeScript
 + Vite
 + React Router
 + Tailwind CSS
```

Recommended layers:

``` text
App
├── Routes
├── Layouts
├── Pages
├── Features
├── Shared Components
├── Hooks
├── Services/API
├── Types
└── Utilities
```

Feature-oriented examples:

``` text
features/
├── projects/
├── tasks/
├── materials/
├── inventory/
├── workforce/
├── equipment/
├── budget/
├── quality/
├── safety/
└── notifications/
```

------------------------------------------------------------------------

## 15. Frontend State

### Local UI state

Use component/local state for:

-   Modal visibility
-   Dropdowns
-   Tabs
-   Form interaction
-   Temporary UI state

### Server state

API-backed data should use an appropriate server-state/data-fetching
approach. Do not put all API data into one global store.

### Global state

Only genuinely global information belongs globally:

-   Authenticated user
-   Effective permissions
-   Organization context
-   Current project context
-   Required UI preferences

------------------------------------------------------------------------

## 16. Route Architecture

Public routes:

``` text
/login
/forgot-password
/reset-password
/activate-account
```

Internal routes follow the documented project structure, including:

``` text
/dashboard
/projects
/projects/:projectId/overview
/projects/:projectId/phases
/projects/:projectId/tasks
/projects/:projectId/materials
/projects/:projectId/inventory
/projects/:projectId/procurement
/projects/:projectId/workforce
/projects/:projectId/equipment
/projects/:projectId/budget
/projects/:projectId/quality
/projects/:projectId/safety
/projects/:projectId/issues
/projects/:projectId/daily-reports
/projects/:projectId/documents
/projects/:projectId/reports
/projects/:projectId/activity
```

The client portal is isolated under `/client`.

------------------------------------------------------------------------

## 17. Observability and Audit

Application logs and audit logs are separate.

### Application logs

Used for technical diagnostics:

-   Startup/shutdown
-   Request failures
-   Unexpected exceptions
-   Integration/storage errors

### Audit logs

Used for business/security traceability:

-   Actor
-   Action
-   Target
-   Timestamp
-   Project/context
-   Result where applicable

Important state-changing actions should generate audit records.

------------------------------------------------------------------------

## 18. Error Handling

A centralized error handler converts expected errors into safe API
responses.

Production responses must not expose:

-   Stack traces
-   Database errors
-   Secrets
-   Internal file paths
-   Credentials

Frontend pages must consistently handle:

-   Loading
-   Empty
-   Error
-   Permission denied
-   Validation error
-   Submitting
-   Success

------------------------------------------------------------------------

## 19. Security Architecture

Security controls include:

-   Password hashing
-   JWT authentication
-   Session expiration
-   Account lock behavior
-   Failed-login tracking
-   Backend RBAC
-   Project-level authorization
-   Input validation
-   Safe error responses
-   File validation
-   Secure generated filenames
-   Rate limiting where required
-   Audit logging
-   Login history
-   Security monitoring
-   Environment-based secrets

Security must be implemented at the backend boundary.

------------------------------------------------------------------------

## 20. Non-Goals

The architecture must not introduce V1 requirements for:

-   AI/LLM APIs
-   Gemini/Vertex AI
-   OCR
-   IoT
-   GPS workforce tracking
-   BIM
-   Mobile applications
-   Offline-first workflows
-   Payment gateways
-   SMS
-   Email integrations
-   Docker requirement
-   Kubernetes
-   Mandatory cloud infrastructure
-   ERP integrations
-   Full accounting
-   Full payroll/HR
-   Equipment telematics

------------------------------------------------------------------------

## 21. Implementation Order

Recommended implementation sequence:

1.  Repository and development foundation
2.  Backend bootstrap and configuration
3.  MongoDB connection and health endpoint
4.  API/error/validation foundation
5.  Frontend bootstrap and routing shell
6.  Authentication
7.  Authorization and project access
8.  Users and project foundation
9.  Project workspace
10. Tasks, phases, milestones and progress
11. Materials, BOM and inventory
12. Procurement and vendors
13. Workforce and attendance
14. Equipment
15. Budget and expenses
16. Daily reports and issues
17. Quality and safety
18. Documents
19. Notifications and required WebSocket events
20. Client portal
21. Reports/analytics
22. Security hardening and QA

------------------------------------------------------------------------

## 22. Architectural Decision Rule

Any proposed implementation change must be evaluated against:

``` text
Product requirement
       ↓
Technical requirement
       ↓
Architecture boundary
       ↓
Existing workflow
       ↓
Security implications
       ↓
Testing impact
```

If a change modifies product behavior, update `PRD.md`.

If it modifies technical constraints, update `TRD.md`.

If it modifies architecture, update `ARCHITECTURE.md`.

If it modifies navigation or user flow, update `WEBSITE-FLOW.md`.

If it modifies visual interaction/design rules, update `UI-UX.md`.

If it modifies persistence structure, update `DATABASE-DESIGN.md`.

If it modifies quality strategy or acceptance criteria, update
`TESTING-QA.md`.
