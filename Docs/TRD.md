# Technical Requirements Document (TRD)

## Construction Project & Resource Management Platform

**Document:** TRD.md  
**Version:** 1.0  
**Status:** Initial Technical Baseline  
**Related:** PRD.md, WEBSITE-FLOW.md, UI-UX.md, ARCHITECTURE.md

---

# 1. Purpose

This document defines the technical requirements, technology stack, development standards, libraries, tooling, environments, and implementation constraints for the Construction Project & Resource Management Platform.

The TRD translates the product requirements in `PRD.md` into a practical technical baseline.

Detailed system architecture belongs in `ARCHITECTURE.md`.

Detailed navigation and page behavior belongs in `WEBSITE-FLOW.md`.

Detailed visual design belongs in `UI-UX.md`.

---

# 2. Technical Goals

The system should be:

- Maintainable
- Secure
- Responsive
- Modular
- Scalable for the intended V1 scope
- Easy for developers to understand
- Easy to test
- Easy to run locally
- Portable to future hosting environments
- Consistent across frontend and backend
- Designed around clear business rules
- Free from unnecessary technical complexity

The implementation should prioritize practical engineering over over-engineering.

---

# 3. Technology Stack

## 3.1 Frontend

### Core

- React
- TypeScript
- Vite

### Routing

- React Router

### Styling

- Tailwind CSS

### Frontend responsibilities

The frontend is responsible for:

- Rendering the user interface
- Client-side navigation
- Form interaction
- Client-side validation where appropriate
- Displaying API data
- Managing UI state
- Managing local interaction state
- Displaying loading/error/empty states
- Permission-aware navigation
- Real-time UI updates
- Responsive layouts

The frontend must not be treated as the security boundary.

All important authorization must be enforced by the backend.

---

# 4. Backend

## 4.1 Core

- Node.js
- Express
- TypeScript

## 4.2 API

The primary API style is REST.

The backend should expose clear resource-oriented endpoints.

Example structure:

```text
/api/v1/auth
/api/v1/users
/api/v1/projects
/api/v1/tasks
/api/v1/materials
/api/v1/inventory
/api/v1/workforce
/api/v1/equipment
/api/v1/budgets
/api/v1/procurement
/api/v1/quality
/api/v1/safety
/api/v1/documents
/api/v1/notifications
/api/v1/reports
/api/v1/audit
```

The exact endpoint contract will be finalized in `API-SPECIFICATION.md`.

---

# 5. Database

## 5.1 Database

**MongoDB**

MongoDB is the application's primary database.

## 5.2 Database Management Tool

**MongoDB Compass**

MongoDB Compass is used as a graphical database-management and inspection tool during development.

Compass itself is not the database.

## 5.3 Database Requirements

The database must support:

- Multiple projects
- Multiple users
- Project assignments
- Role and permission relationships
- Project phases
- Tasks
- Milestones
- Materials
- BOMs
- Inventory
- Procurement
- Vendors
- Workforce
- Attendance
- Equipment
- Maintenance
- Budgets
- Expenses
- Quality records
- Safety records
- Documents
- Notifications
- Audit records

Detailed collections and indexes will be defined in `DATABASE-DESIGN.md`.

---

# 6. Architecture Style

## 6.1 Modular Monolith

V1 will use a modular-monolith architecture.

The backend will be one deployable application divided into clear business modules.

```text
Backend
│
├── Auth
├── Users
├── Projects
├── Tasks
├── Materials
├── Inventory
├── Procurement
├── Workforce
├── Equipment
├── Budget
├── Quality
├── Safety
├── Documents
├── Notifications
├── Reports
└── Audit
```

This is preferred over microservices for V1 because it:

- Reduces operational complexity
- Simplifies local development
- Simplifies deployment
- Keeps transactions and business rules easier to manage
- Allows clear module boundaries
- Leaves room for future extraction if required

---

# 7. Backend Layering

The backend should use clear separation of responsibilities.

Recommended structure:

```text
HTTP Request
    ↓
Route
    ↓
Middleware
    ↓
Controller
    ↓
Application Service
    ↓
Business Rules
    ↓
Repository / Data Access
    ↓
MongoDB
```

## 7.1 Routes

Routes define:

- HTTP method
- URL
- Middleware
- Controller

Routes should remain thin.

## 7.2 Middleware

Middleware handles cross-cutting concerns such as:

- Authentication
- Authorization
- Request validation
- Error handling
- Request logging
- Rate limiting where required

## 7.3 Controllers

Controllers should:

- Receive requests
- Extract validated input
- Call application services
- Return appropriate responses

Controllers should not contain large business workflows.

## 7.4 Services

Services contain application/business logic.

Examples:

- ProjectService
- MaterialRequestService
- InventoryService
- BudgetService
- EquipmentService

## 7.5 Repositories

Repositories isolate MongoDB access from business logic.

---

# 8. Frontend Architecture

Recommended structure:

```text
frontend/
└── src/
    ├── app/
    ├── assets/
    ├── components/
    ├── layouts/
    ├── pages/
    ├── features/
    ├── hooks/
    ├── services/
    ├── routes/
    ├── types/
    ├── utils/
    └── styles/
```

Feature-specific code should remain close to its domain where practical.

Example:

```text
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

---

# 9. State Management

State should be separated by purpose.

## Local UI state

Use React state for:

- Modal visibility
- Dropdowns
- Tabs
- Form interaction
- Temporary UI state

## Server state

API-backed data should use an appropriate server-state/data-fetching approach.

The exact library will be finalized during implementation after evaluating the required complexity.

The system should avoid putting all API data into one global state store.

## Global application state

Only genuinely global information should be stored globally, such as:

- Authenticated user
- Effective permissions
- Current organization context
- Current project context
- UI preferences where required

---

# 10. Authentication

V1 authentication uses:

- Username/email-based login
- Password authentication
- Password hashing
- JWT-based authentication
- Session expiration
- Logout
- Password reset
- Account lock behavior
- Failed-login tracking
- Login history

Authentication implementation must ensure that passwords are never stored in plaintext.

JWT secrets and other credentials must be supplied through environment configuration.

They must never be committed to Git.

---

# 11. Authorization

Authorization uses:

```text
Primary Role
     +
Additional Permissions
     +
Project Assignment
     ↓
Effective Permissions
```

Backend authorization is mandatory.

A frontend route guard is useful for UX but is not sufficient for security.

Every protected API operation must verify:

1. Authentication
2. User status
3. Required permission
4. Project access where applicable
5. Resource ownership/access rules where applicable

---

# 12. API Requirements

All APIs should:

- Use consistent naming
- Use appropriate HTTP methods
- Validate input
- Return predictable response structures
- Return meaningful HTTP status codes
- Enforce authorization
- Support pagination where required
- Support filtering where required
- Avoid exposing internal implementation details
- Return safe error messages

Recommended status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

The final API contract belongs in `API-SPECIFICATION.md`.

---

# 13. API Versioning

API routes should use an explicit version:

```text
/api/v1/
```

This provides a clean path for future breaking changes.

V1 changes should avoid breaking existing consumers unless the API version is intentionally changed.

---

# 14. Validation

Validation must exist at the backend boundary.

Validate:

- Required fields
- Data types
- String lengths
- Numeric ranges
- Enum values
- Dates
- IDs
- File metadata
- Business constraints

Frontend validation improves UX but cannot replace backend validation.

---

# 15. Error Handling

The backend should use centralized error handling.

Errors should be converted into consistent API responses.

Example:

```json
{
  "success": false,
  "message": "Material request cannot be approved.",
  "code": "MATERIAL_REQUEST_INVALID_STATUS"
}
```

Do not expose:

- Stack traces
- Database errors
- Secrets
- Internal file paths
- Authentication credentials

in production API responses.

---

# 16. Real-Time Communication

WebSockets are required only where real-time behavior adds clear value.

Possible real-time events:

- Notifications
- Approval updates
- Project progress updates
- Inventory changes
- Activity updates
- Client query updates

The database remains the source of truth.

WebSocket events must:

- Authenticate the connection
- Authorize subscriptions
- Validate event payloads
- Respect project permissions
- Avoid exposing unauthorized data

WebSockets must not be used to bypass REST/business validation.

---

# 17. File Management

V1 uses controlled local filesystem storage behind a storage abstraction.

The abstraction should make future migration to object storage possible without rewriting the document module.

Requirements:

- Validate file type
- Validate file size
- Generate safe server-side filenames
- Store metadata in MongoDB
- Restrict access through authorization
- Do not expose arbitrary filesystem paths
- Preserve document versions
- Log sensitive file actions

Suggested separation:

```text
Document Metadata → MongoDB
File Content      → Storage Layer
```

---

# 18. Notifications

V1 requires in-website notifications.

Notifications should support:

- Recipient
- Type
- Priority
- Title
- Message
- Related entity
- Read/unread state
- Timestamp

Notifications can be generated by business events.

Examples:

```text
Material Request Approved
Budget Change Requires Review
Low Stock Detected
Equipment Maintenance Due
Safety Incident Reported
Client Query Received
```

---

# 19. Search, Filtering & Pagination

Large collections must not load unlimited records into the browser.

Server-side pagination is required where datasets can grow significantly.

Filtering should occur on the backend.

Typical filter fields:

- Project
- Status
- Date
- Role
- Category
- User
- Priority
- Vendor
- Equipment
- Material

Search implementation should use MongoDB-supported indexes and query patterns appropriate to the data.

---

# 20. MongoDB Data Design Principles

Collections should be designed around actual access patterns.

Requirements:

- Avoid uncontrolled document growth
- Use references where appropriate
- Embed small tightly coupled data where beneficial
- Index frequent queries
- Preserve historical records where required
- Use timestamps consistently
- Validate important business states in application logic

Typical metadata:

```text
_id
createdAt
updatedAt
createdBy
updatedBy
```

Audit-specific records should contain additional actor/action context.

---

# 21. Transaction & Consistency Requirements

Operations that modify multiple related records must consider consistency.

Examples:

### Material Issue

```text
Validate Request
    ↓
Validate Approval
    ↓
Validate Stock
    ↓
Create Inventory Transaction
    ↓
Update Stock
    ↓
Update Request
    ↓
Create Audit Event
```

### Material Receipt

```text
Validate Purchase/Receipt
    ↓
Create Receipt
    ↓
Increase Inventory
    ↓
Create Inventory Transaction
    ↓
Create Audit Event
```

Where MongoDB transactions are appropriate, they should be used to protect multi-document state changes.

---

# 22. Business Rule Placement

Business rules must not live only in:

- React components
- Route files
- Database UI scripts

Business rules belong in backend application/domain services.

Examples:

- Material issuance approval
- Negative inventory prevention
- Equipment conflict detection
- Budget approval
- Project access
- Progress calculations
- Project health calculations

---

# 23. Security Requirements

The implementation must include:

- Secure password hashing
- JWT authentication
- Authorization middleware
- Project-level authorization
- Input validation
- Secure file handling
- Centralized error handling
- Audit logging
- Login history
- Failed-login tracking
- Rate limiting for sensitive endpoints where appropriate
- Secure HTTP configuration
- CORS configuration
- Environment-based secrets
- No sensitive information in logs

Sensitive values that must not appear in logs include:

- Passwords
- Password reset tokens
- JWT secrets
- Full authentication tokens
- Encryption secrets
- Unnecessary personal data

---

# 24. Responsive UI Technical Requirement

The frontend must support:

- Desktop
- Laptop
- Tablet
- Mobile browser

Responsive behavior should be designed per component.

Examples:

- Tables may become horizontally scrollable or switch to compact cards.
- Sidebars may collapse.
- Multi-column forms may become single-column.
- Action groups may collapse into menus.
- Dashboards may change grid structure.

Responsive design is part of the implementation, not an afterthought.

---

# 25. UI Performance

The frontend should:

- Avoid unnecessary renders
- Lazy-load appropriate routes
- Avoid loading large datasets unnecessarily
- Paginate large tables
- Optimize images
- Avoid excessive animation
- Avoid excessive WebSocket events
- Show useful loading feedback

---

# 26. UI Interaction & Animation

Animations should be:

- Subtle
- Fast
- Consistent
- Purposeful

Use transitions for:

- Navigation
- Sidebar
- Modals
- Dropdowns
- Tabs
- Expand/collapse
- Notifications
- Button feedback

Do not use animation simply for decoration.

The product must feel like a professional construction-management system rather than an AI-generated visual template.

---

# 27. Code Quality Standards

The project should follow:

- TypeScript strict typing
- SOLID principles
- DRY
- KISS
- Separation of concerns
- Single responsibility
- Meaningful naming
- Small focused functions
- Reusable components
- Reusable services
- Centralized configuration
- Consistent error handling

Avoid:

- Giant components
- Giant controller functions
- Duplicate business rules
- Unnecessary abstractions
- Premature microservices
- Hard-coded secrets
- Hard-coded environment-specific URLs

---

# 28. Environment Configuration

Use environment variables for environment-specific configuration.

Examples:

```text
NODE_ENV
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
STORAGE_PATH
```

The actual variable names and required values will be documented in the project setup documentation.

A safe example environment file may be committed:

```text
.env.example
```

Actual `.env` files must be excluded from Git.

---

# 29. Git & Repository Requirements

GitHub is the source-control repository.

Recommended structure:

```text
project-root/
├── frontend/
├── backend/
├── docs/
├── .gitignore
├── README.md
└── package configuration
```

Development branches should follow the team's agreed workflow.

Commits should use clear messages.

Do not commit:

- `.env`
- Secrets
- Passwords
- JWT keys
- Database credentials
- Local uploaded files
- Build artifacts
- Dependency directories

---

# 30. Testing Stack

The exact testing libraries are intentionally not permanently locked until the implementation stage.

The project must support:

### Unit Testing

For:

- Business rules
- Services
- Calculations
- Utilities

### Integration Testing

For:

- Database interactions
- Authentication
- Authorization
- Core workflows

### API Testing

For:

- Request validation
- Status codes
- Permissions
- Error responses
- Pagination

### UI Testing

For:

- Forms
- Navigation
- Role-based screens
- Important user interactions

### End-to-End Testing

Critical workflows should be tested end-to-end.

The final testing libraries will be selected before implementation of the testing layer.

---

# 31. Logging

The backend should maintain structured application logs.

Logs should support:

- Timestamp
- Severity
- Request context
- Operation
- Result
- Error information where appropriate

Application logs and audit logs are separate.

### Application log

Used for technical troubleshooting.

### Audit log

Used to record business/security actions.

---

# 32. Audit Requirements

Audit events should be created for important actions such as:

- User creation
- User deactivation
- Permission changes
- Project creation
- Project status changes
- Budget changes
- Material approvals
- Inventory adjustments
- Equipment assignments
- Quality actions
- Safety actions
- Document actions
- Security events

Audit records must preserve historical context.

---

# 33. Accessibility

The UI should follow practical accessibility principles.

Requirements include:

- Keyboard-accessible interactions
- Visible focus states
- Proper labels
- Semantic HTML where appropriate
- Sufficient text contrast
- Accessible form errors
- Avoiding color as the only status indicator
- Accessible modal behavior
- Descriptive button labels

Detailed accessibility rules belong in `UI-UX.md`.

---

# 34. Deployment Baseline

For the current project phase:

**GitHub is the source-code repository.**

The exact production hosting provider is intentionally not locked in this TRD yet.

The architecture should remain portable so the application can later be deployed to a suitable hosting environment without major redesign.

Deployment requirements will be finalized in:

`DEPLOYMENT-OPERATIONS.md`

---

# 35. Development Environment

Recommended development tools:

- VS Code
- Git
- GitHub
- Node.js
- npm
- MongoDB
- MongoDB Compass
- Modern browser with developer tools

Developers should use a consistent Node.js version.

The exact version should be pinned before implementation begins.

---

# 36. Dependency Management

Dependencies should be added only when they provide meaningful value.

Before adding a package, consider:

1. Is the functionality already available?
2. Is the package actively maintained?
3. Is the package necessary?
4. Does it introduce unnecessary complexity?
5. Does it have security or licensing concerns?
6. Does it fit the architecture?

Avoid dependency-heavy implementation when a simple native solution is sufficient.

---

# 37. Technical Constraints

The V1 implementation must not require:

- Microservices
- Kubernetes
- Docker
- External AI services
- Google OAuth
- Enterprise SSO
- IoT
- GPS tracking
- BIM
- Drone systems
- Payment gateways
- SMS providers
- External ERP integrations

These constraints keep V1 manageable and aligned with the PRD.

---

# 38. Future-Proofing

The system should be designed so future capabilities can be added without unnecessary rewrites.

Potential future extensions include:

- Cloud object storage
- Email notifications
- SMS
- OAuth/SSO
- Mobile application
- IoT equipment telemetry
- GPS
- BIM integration
- AI-assisted analytics
- Advanced predictive maintenance
- ERP integration

These are not V1 requirements.

---

# 39. Technical Definition of Done

A technical feature is complete when:

- TypeScript compiles successfully.
- Required validation exists.
- Authentication/authorization is enforced.
- Business logic is placed in the appropriate backend layer.
- Database operations are implemented correctly.
- Errors are handled consistently.
- UI loading/empty/error states are implemented.
- Responsive behavior is implemented.
- Relevant audit events exist.
- Relevant real-time events exist where required.
- Tests for critical logic pass.
- Documentation is updated.
- No secrets are committed.

---

# 40. Related Technical Documents

```text
docs/
├── PRD.md
├── TRD.md
├── WEBSITE-FLOW.md
├── UI-UX.md
├── ARCHITECTURE.md
├── API-SPECIFICATION.md
├── DATABASE-DESIGN.md
├── TESTING-QA.md
└── DEPLOYMENT-OPERATIONS.md
```

### Document responsibilities

**PRD.md**
- What the product must do.

**TRD.md**
- Which technologies and technical standards will be used.

**WEBSITE-FLOW.md**
- How users navigate and interact with the website.

**UI-UX.md**
- How the product looks and behaves visually.

**ARCHITECTURE.md**
- How the system is structured internally.

**API-SPECIFICATION.md**
- How frontend and backend communicate.

**DATABASE-DESIGN.md**
- How application data is stored.

**TESTING-QA.md**
- How correctness and quality are verified.

**DEPLOYMENT-OPERATIONS.md**
- How environments are configured, built, deployed, monitored, and maintained.

---

# 41. Technical Baseline Summary

| Area | Baseline |
|---|---|
| Frontend | React |
| Language | TypeScript |
| Frontend Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Backend | Node.js |
| Backend Framework | Express |
| Backend Language | TypeScript |
| API | REST |
| Real-Time | WebSockets where required |
| Database | MongoDB |
| Database GUI | MongoDB Compass |
| Architecture | Modular Monolith |
| Source Control | Git + GitHub |
| UI | Responsive |
| Animation | Smooth and subtle |
| Authentication | JWT |
| Authorization | RBAC + Project Access + Additional Permissions |
| File Storage V1 | Controlled Local Filesystem |
| API Version | `/api/v1` |
| AI Services | Not required for V1 |
| Microservices | Not required |
| Docker | Not required |
| Kubernetes | Not required |
| Production Hosting | Not locked yet |

---

# 42. Status

**Version:** 1.0  
**Status:** Technical Baseline  
**Product Requirements Source:** PRD.md

The next technical/design documents should refine this baseline rather than contradict it:

1. `WEBSITE-FLOW.md`
2. `UI-UX.md`
3. `ARCHITECTURE.md`
4. `API-SPECIFICATION.md`
5. `DATABASE-DESIGN.md`
6. `TESTING-QA.md`
7. `DEPLOYMENT-OPERATIONS.md`
