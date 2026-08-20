# Product Requirements Document (PRD)

## Smart Build

**Document:** PRD.md  
**Version:** 1.0  
**Status:** Locked V1 Baseline  
**Authority:** Product requirements single source of truth

---

## 1. Product Overview

The product is a secure web-based construction project and resource management platform for a single organization managing multiple construction projects.

The platform centralizes project operations that are commonly distributed across spreadsheets, paper records, separate tools, and manual communication.

The core product integrates:

- Project management
- Quantity-based progress tracking
- Workforce and attendance
- Materials and BOM
- Procurement and inventory
- Equipment and asset management
- Budget and cost management
- Site operations
- Quality management
- Safety management
- Documents
- Client portal
- Notifications and real-time updates
- Reports and analytics
- Audit and security controls

V1 is designed as a practical, professional construction-management web application. It should feel human-designed and production-oriented rather than like a generic AI-generated dashboard.

---

## 2. Product Vision

Provide one centralized system where construction teams can plan projects, manage resources, record site activities, track progress, control materials and costs, manage quality and safety, communicate with stakeholders, and provide clients with controlled project visibility.

---

## 3. Problem Statement

Construction projects require coordination across project managers, site engineers, store teams, contractors, clients, materials, equipment, workforce, budgets, documents, quality, and safety.

Without a centralized system, information can become:

- Fragmented
- Difficult to verify
- Delayed
- Duplicated
- Difficult to audit
- Difficult to share with the correct stakeholders

The platform addresses this by connecting operational data and workflows in one permission-controlled system.

---

## 4. Goals & Objectives

### 4.1 Business Goals

1. Centralize construction project operations.
2. Reduce dependency on manual records.
3. Improve resource utilization.
4. Improve material and inventory visibility.
5. Improve budget monitoring.
6. Improve project transparency.
7. Reduce avoidable delays.
8. Improve communication between stakeholders.
9. Protect sensitive construction information.
10. Provide actionable project analytics.

### 4.2 Product Goals

- Provide clear role-specific experiences.
- Make project information easy to find and understand.
- Reduce duplicate data entry where workflows can be connected.
- Preserve historical records.
- Make important actions traceable.
- Provide clear status, progress, and exception information.
- Support multiple projects within one organization.

### 4.3 Technical Direction

Detailed technical implementation belongs in TRD.md and Architecture.md. The current product baseline is:

- React + TypeScript + Vite
- Tailwind CSS
- Node.js + Express + TypeScript
- MongoDB
- MongoDB Compass as the development database-management GUI
- REST API
- WebSockets where real-time functionality is required
- Git and GitHub for source control
- Modular-monolith architecture

---

## 5. Scope

### 5.1 V1 In Scope

- Authentication and identity
- User management
- Role-based access control
- Project-level authorization
- Project management
- Project types
- Project templates
- Phases
- Tasks
- Milestones
- Quantity-based progress
- Workforce management
- Attendance
- Material catalog
- BOM
- Procurement
- Vendors
- Purchase orders
- Material receiving
- Central and project-level inventory
- Material requests
- Approval workflows
- Material issue and return
- Equipment and asset management
- Equipment assignment and scheduling
- Equipment maintenance and inspections
- Budget and cost management
- Expense tracking
- Budget approvals
- Daily site reports
- Issue tracking
- Quality inspections
- Defect management
- Safety management
- Safety incidents and hazards
- Corrective actions
- Document management
- Document versions
- Client portal
- In-website notifications
- WebSocket real-time updates
- Role-specific dashboards
- Reports and analytics
- Rule-based project intelligence
- Audit logs
- Login history
- Security monitoring
- Responsive UI
- Smooth, subtle UI transitions

### 5.2 Explicitly Out of Scope for V1

- External AI APIs
- Gemini/Vertex AI
- AI-generated project reports
- AI construction assistant
- Predictive AI services
- Google OAuth
- Enterprise SSO
- OCR
- IoT integrations
- GPS workforce tracking
- Drone integrations
- BIM integrations
- Mobile application
- Offline-first mobile workflows
- Payment gateway
- SMS integration
- Email notification integration
- Docker requirement
- Kubernetes
- Mandatory cloud infrastructure
- Third-party construction APIs
- Third-party ERP integrations
- Full accounting/ERP functionality
- Full payroll/HR platform
- Advanced fleet telematics
- Automatic equipment telemetry

These may be considered future enhancements but are not V1 requirements.

---

## 6. Target Users & Roles

The platform has six primary roles.

### 6.1 Admin

Organization-level administration.

Responsibilities include:

- User management
- Role assignment
- Account activation/deactivation
- Project administration
- Security monitoring
- Audit log access
- Login history
- System configuration
- Organization-level analytics

Admin can grant specific additional permissions to users but cannot create new roles.

### 6.2 Project Manager

Responsible for project planning and management.

Responsibilities include:

- Project creation
- Project configuration
- Project templates
- Phases
- Tasks
- Milestones
- Workforce assignment
- Equipment assignment
- Budget management
- Material request approval
- Progress monitoring
- Quality and safety oversight
- Reports
- Client communication
- Project operations

### 6.3 Site Engineer

Responsible for day-to-day site operations.

Responsibilities include:

- Daily site activities
- Work progress
- Quantity updates
- Material requests
- Material consumption records
- Equipment usage
- Daily reports
- Site issues
- Quality inspections
- Safety incidents
- Site photographs

### 6.4 Store Manager

Responsible for material and inventory operations.

Responsibilities include:

- Material catalog
- Inventory
- Material receiving
- Material issuing
- Material returns
- Purchase records
- Stock monitoring
- Low-stock management
- Inventory transactions
- Project-store operations

### 6.5 Contractor

Responsible for assigned construction work.

Responsibilities include:

- Assigned projects
- Assigned tasks
- Work updates
- Work completion
- Issues
- Relevant documents
- Project communication
- Relevant material consumption reporting
- Equipment usage where assigned

### 6.6 Client

The Client has a separate, simplified external-facing portal.

Clients can:

- View authorized projects
- View approved progress
- View milestones
- View approved reports
- View approved documents
- View client-visible project photographs
- View approved project health information
- Submit project queries
- Participate in selected approved workflows

Clients cannot modify internal operational project data.

---

## 7. Authorization & Permission Model

The platform uses:

**Role-Based Access Control (RBAC) + project-level authorization + additional permissions.**

Authorization must be enforced on the backend. Frontend navigation is not a security boundary.

### User access model

```text
User
 ├── Primary Role
 ├── Additional Permissions
 └── Project Assignment(s)
          ↓
      Effective Access
```

A user may be assigned to multiple projects.

Admin:

1. Creates or invites user.
2. Assigns primary role.
3. Assigns project(s).
4. Grants specific additional permissions.
5. User activates account.

Admin cannot create new roles.

### User deactivation/removal

When a user's access is removed:

1. Existing sessions are invalidated.
2. API access stops.
3. WebSocket connections are disconnected.
4. Project access stops immediately.
5. Historical records remain.
6. An audit record is created.

Administrative record actions support:

- Archive
- Deactivate
- Cancel where applicable
- Mark as deleted
- Preserve audit history
- Permanent deletion only after explicit confirmation and appropriate authorization

---

## 8. Product Modules

### 8.1 Authentication & Identity

- Registration/invitation
- Login
- Logout
- Password hashing
- Password change
- Password reset
- JWT authentication
- Session timeout
- Account lock
- Login history
- Failed-login tracking
- Password-expiry reminder where applicable

### 8.2 User Management

- User creation/invitation
- User editing
- Primary role assignment
- Additional permission assignment
- Account activation/deactivation
- Project assignment
- User search and filtering
- Historical record preservation

### 8.3 Project Management

Projects support:

- Project ID/code
- Project name
- Project type
- Client
- Location
- Description
- Planned and actual dates
- Project Manager
- Team
- Status
- Health
- Phases
- Tasks
- Milestones
- Documents
- Activity history

Project lifecycle:

```text
Draft
  ↓
Planning
  ↓
Active
  ↓
On Hold ↔ Active
  ↓
Completed
  ↓
Archived
```

Project types are configurable and may include residential, apartment, villa, commercial, road, bridge, industrial, renovation, infrastructure, and other organization-defined types.

### 8.4 Project Templates

Templates can provide:

- Default phases
- Default tasks
- BOM structure
- Budget categories
- Milestones
- Resource requirements

Templates are reusable blueprints. Projects created from templates can be customized.

### 8.5 Phases, Tasks & Milestones

Projects contain phases.

Phases contain tasks and milestones.

Phases support:

- Planned/actual dates
- Status
- Progress
- Dependencies
- Tasks
- Milestones
- Documents

Tasks support:

- Assignment
- Dates
- Priority
- Status
- Quantity
- Unit
- Progress
- Dependencies
- Attachments
- Comments
- Issues
- Activity history

Basic task and phase dependencies are supported, primarily Finish-to-Start.

Milestones represent important project events and support planned/actual dates, status, responsible person, related work, and client visibility.

### 8.6 Quantity-Based Progress

Progress is based on planned and completed quantities where applicable.

Example:

```text
Planned:   10,000 sq.ft
Completed:  6,500 sq.ft
Progress:       65%
```

Progress should be calculated consistently rather than relying only on manually entered percentages.

Phase and project progress can be derived from task/phase progress using defined weighting/business rules.

### 8.7 Project Health

Project health uses transparent business rules.

Primary health states:

- Healthy
- At Risk
- Critical

Factors may include:

- Schedule
- Budget
- Progress
- Material availability
- Open issues
- Safety
- Quality
- Resource availability

No external AI is required.

### 8.8 Workforce & Attendance

The workforce module manages project workforce operations, not full HR/payroll.

Includes:

- Worker records
- Worker types/trades
- Contractor workforce
- Project assignments
- Phase/task assignments
- Attendance
- Check-in/check-out where used
- Working-hour calculation
- Overtime reporting
- Workforce planning
- Workforce productivity indicators
- Workforce reports
- Assignment history

Out of scope:

- Payroll
- Tax processing
- Benefits
- Full HR management
- Recruitment
- Biometric hardware integration

### 8.9 Materials & BOM

A central Material Catalog contains:

- Material ID/code
- Name
- Category
- Unit
- Specifications
- Stock thresholds
- Status
- Notes

BOMs are project/phase/task-linked planned material requirements.

BOM supports:

- Planned quantity
- Used quantity
- Remaining quantity
- Variance
- Material links
- Versioning
- Approval history

Material requirements may originate from BOM, phase, task, or authorized manual requests.

### 8.10 Procurement & Vendors

Procurement supports:

```text
Material Shortage
      ↓
Procurement Request
      ↓
Review
      ↓
Approval
      ↓
Purchase Order
      ↓
Vendor
      ↓
Receiving
      ↓
Inventory
```

Vendor records include identity, contact information, materials supplied, status, and relevant performance information.

Purchase orders support:

- Vendor
- Project
- Materials
- Quantities
- Unit prices
- Total
- Expected delivery
- Approval
- Status
- Notes

### 8.11 Inventory

Inventory supports:

- Central warehouse
- Project-level stores
- Transfers
- Receiving
- Issuing
- Returns
- Adjustments
- Consumption
- Stock alerts
- Inventory valuation
- Inventory history

Inventory transactions include:

```text
RECEIPT
ISSUE
RETURN
TRANSFER_OUT
TRANSFER_IN
ADJUSTMENT
CONSUMPTION
```

Negative inventory is prohibited.

### 8.12 Material Requests

Core workflow:

```text
Site Engineer
      ↓
Material Request
      ↓
Project Manager
      ↓
Approve / Reject
      ↓
Store Manager
      ↓
Check Inventory
      ↓
Issue Material
      ↓
Inventory Updated
      ↓
Audit
      ↓
Notification
```

Material issuance without required approval is prohibited.

### 8.13 Material Traceability

Material lifecycle can be traced:

```text
Vendor
  ↓
Purchase Order
  ↓
Receipt
  ↓
Warehouse
  ↓
Transfer
  ↓
Project Store
  ↓
Issue
  ↓
Task
  ↓
Consumption / Return
```

### 8.14 Equipment & Asset Management

Equipment supports:

- Equipment master
- Ownership type
- Status
- Availability
- Assignment
- Scheduling
- Usage
- Transfers
- Breakdowns
- Maintenance
- Inspections
- Rental equipment
- Costs
- Documents
- History
- Alerts
- Analytics

Equipment status includes:

- Available
- Assigned
- In Use
- Under Maintenance
- Breakdown
- Inactive
- Retired

Conflicting assignments must be rejected.

V1 does not require IoT or telematics.

### 8.15 Budget & Cost Management

Budget management supports:

- Project budgets
- Budget categories
- Phase-level budgeting
- Planned costs
- Material costs
- Workforce costs
- Equipment costs
- Other expenses
- Actual costs
- Variance
- Budget change requests
- Approval workflow
- Cost reports
- Client-visible financial information where explicitly approved

Budget changes require appropriate approval.

V1 does not attempt to become a full accounting system.

### 8.16 Site Operations

Daily site reports support:

- Work performed
- Quantities
- Materials
- Equipment
- Workforce
- Issues
- Photos
- Notes
- Submission
- Project Manager review

### 8.17 Issue Management

Issues can be created, assigned, prioritized, tracked, updated, and closed.

Issues may relate to:

- Project
- Phase
- Task
- Material
- Equipment
- Quality
- Safety
- Other operational areas

### 8.18 Quality Management

Quality supports:

- Inspections
- Checklists
- Defects
- Corrective actions
- Reinspection
- Approval
- Quality history
- Quality reports

Workflow:

```text
Inspection
   ↓
Checklist
   ↓
PASS ─────→ Complete

FAIL
   ↓
Defect
   ↓
Corrective Action
   ↓
Reinspection
   ↓
Approval
```

### 8.19 Safety Management

Safety supports:

- Hazards
- Incidents
- Near misses
- Severity classification
- Corrective actions
- Review
- Closure
- Safety reports
- Safety history

Workflow:

```text
Incident / Hazard
       ↓
Record
       ↓
Classify Severity
       ↓
Assign Action
       ↓
Corrective Action
       ↓
Review
       ↓
Close
```

### 8.20 Documents & File Management

Authorized users can upload project documents.

Requirements:

- Project-level access control
- Document metadata
- Document versions
- Controlled file types
- File size limits
- Secure generated filenames
- Audit logging for sensitive actions

V1 uses controlled local filesystem storage with a storage abstraction that can support future object storage migration.

### 8.21 Client Portal

The Client portal is separate and simplified.

Client can:

- View authorized projects
- View progress
- View milestones
- View approved reports
- View approved documents
- View approved photographs
- View approved project health
- Submit queries
- Participate in selected approval workflows

Client workflow:

```text
Client Login
      ↓
Client Dashboard
      ↓
Assigned Project
      ↓
Approved Information
      ↓
Progress / Milestones
      ↓
Reports / Documents
      ↓
Query
      ↓
Project Team Response
```

### 8.22 Notifications & Real-Time

In-website notifications are supported.

WebSockets are used for appropriate real-time events.

Representative events:

- Project progress updated
- Material request created
- Material request approved
- Material stock updated
- Budget change requested
- Budget change approved
- Notification created
- Activity created
- Client query created

The database remains the source of truth. WebSockets distribute authorized updates and never bypass normal authorization or validation.

### 8.23 Reports & Analytics

Role-specific dashboards provide relevant information.

Admin:

- Organization overview
- Projects
- Users
- Security events
- Activity

Project Manager:

- Progress
- Budget
- Materials
- Workforce
- Equipment
- Quality
- Safety
- Delays
- Approvals

Site Engineer:

- Tasks
- Progress
- Materials
- Daily reports
- Issues

Store Manager:

- Inventory
- Low stock
- Requests
- Purchases
- Material movements

Contractor:

- Assigned work
- Progress
- Schedule
- Issues

Client:

- Approved progress
- Milestones
- Reports
- Documents
- Project health

### 8.24 Search, Filtering & Pagination

Large collections support:

- Search
- Filtering
- Sorting
- Pagination

Applicable areas include:

- Projects
- Users
- Materials
- Vendors
- Equipment
- Workforce
- Issues
- Documents
- Audit logs
- Notifications

Pagination limits are enforced server-side.

### 8.25 Audit & Activity

Important business and security actions are traceable.

Audit/activity information includes:

- Actor
- Action
- Target
- Timestamp
- Relevant project/context
- Result where applicable

Application logs and audit logs remain separate concepts.

---

## 9. Core Product Workflows

### 9.1 User Onboarding

```text
Admin
 ↓
Create / Invite User
 ↓
Assign Primary Role
 ↓
Assign Project(s)
 ↓
Grant Additional Permissions
 ↓
User Activates Account
```

### 9.2 Project Creation

```text
Project Manager
 ↓
Select Project Type
 ↓
Select Template
 ↓
Configure Project
 ↓
Configure Phases
 ↓
Customize BOM
 ↓
Set Budget
 ↓
Assign Team
 ↓
Create Project
```

### 9.3 Material Lifecycle

```text
Project Template
 ↓
BOM
 ↓
Material Requirement
 ↓
Check Inventory
 ┌──────────┴──────────┐
Sufficient              Insufficient
 ↓                      ↓
Request                 Purchase
 ↓                      ↓
Approval                Vendor
 ↓                      ↓
Issue                   Receive
 └──────────┬───────────┘
            ↓
      Inventory Updated
```

### 9.4 Progress Workflow

```text
Site Engineer
 ↓
Enter Completed Quantity
 ↓
Validate
 ↓
Calculate Progress
 ↓
Update Project
 ↓
Recalculate Health
 ↓
Dashboard Update
 ↓
Real-Time Event
```

### 9.5 Budget Workflow

```text
Project Manager
 ↓
Budget Change Request
 ↓
Admin Review
 ↓
Approve / Reject
 ↓
If Approved
 ↓
Budget Updated
 ↓
Audit
 ↓
Notification
```

### 9.6 Equipment Workflow

```text
Project Manager
 ↓
Equipment Assignment
 ↓
Check Availability
 ↓
Check Schedule Conflict
 ↓
Check Maintenance Status
 ↓
Assign Equipment
```

### 9.7 Daily Site Report

```text
Site Engineer
 ↓
Create Daily Report
 ↓
Enter Work / Quantity
 ↓
Record Materials
 ↓
Record Equipment
 ↓
Record Workforce
 ↓
Add Issues / Photos
 ↓
Submit
 ↓
Project Manager Review
```

---

## 10. UI/UX Product Requirements

The UI/UX specification will be maintained separately in UI-UX.md, but the PRD establishes these product requirements.

### 10.1 Responsive

The website must support:

- Desktop
- Laptop
- Tablet
- Mobile browser

Responsive behavior must be intentional rather than simply shrinking desktop layouts.

### 10.2 Visual Direction

The product should feel:

- Professional
- Practical
- Clean
- Structured
- Consistent
- Fast
- Intuitive
- Production-ready

It should look like a real construction-management product rather than a generic AI-generated dashboard.

Avoid:

- Excessive gradients
- Excessive glassmorphism
- Decorative elements without purpose
- Overuse of rounded cards
- Excessive shadows
- Excessive animation
- Generic AI/SaaS visual patterns

### 10.3 Interaction

Use subtle, smooth transitions for:

- Navigation
- Sidebar
- Dropdowns
- Modals
- Tabs
- Buttons
- Cards
- Notifications
- Expand/collapse interactions
- Loading states

Animations must not negatively affect usability or lower-end devices.

### 10.4 Consistency

The same interaction patterns should behave consistently throughout the application.

Examples:

- Confirmation dialogs follow a common pattern.
- Forms use consistent validation.
- Tables use consistent interaction patterns.
- Notifications use consistent states.
- Dashboards share a design language.

### 10.5 Required UI States

Major screens should account for:

- Loading
- Loaded
- Empty
- Error
- Permission denied
- Validation errors
- Success
- Network/recoverable errors

Destructive actions require confirmation.

---

## 11. Data Integrity & Business Rules

Core business rules include:

- Backend authorization is mandatory.
- Project-level access is enforced.
- Inventory cannot become negative.
- Material issuance requires required approval.
- Equipment assignment conflicts are rejected.
- Required budget changes require approval.
- Historical records remain when access is removed.
- Database is the source of truth.
- WebSockets do not bypass validation.
- Business rules must be implemented outside UI components.
- Sensitive values must not be exposed.
- Secrets must not be committed to source control.

---

## 12. Security Requirements

The application must provide:

- Secure password hashing
- JWT-based authentication
- Session expiration
- Account locking
- Failed-login tracking
- Login history
- RBAC
- Project-level authorization
- Additional permissions
- Backend authorization enforcement
- Secure file access
- Input validation
- Centralized error handling
- Audit logging
- Security event logging
- Protection against unauthorized WebSocket subscriptions
- No secrets in source control

Logs must not contain passwords, JWT secrets, full authentication tokens, or unnecessary sensitive information.

---

## 13. Non-Functional Requirements

### Performance

- Efficient list queries
- Server-side pagination
- Appropriate filtering and sorting
- Avoid unnecessary real-time events
- Responsive user interactions

### Maintainability

The codebase should follow:

- SOLID
- DRY
- KISS
- Separation of Concerns
- Single Responsibility
- Reusable components
- Reusable services
- Strong typing
- Consistent naming
- Small focused functions
- Centralized configuration
- Centralized error handling
- Boundary validation

Business rules must not be embedded directly inside UI components.

### Portability

The application should work in:

- Local development
- Institutional/local environments
- Optional future hosted environments

Configuration should be environment-driven.

The application should remain portable to future hosting without redesigning the core product.

---

## 14. Testing Requirements

Testing should cover:

### Unit

- Business rules
- Calculations
- Validation
- Services
- Utilities

### Integration

- Authentication
- Database operations
- Material workflows
- Approval workflows
- Budget workflows
- WebSocket integration

### API

- Status codes
- Validation
- Authorization
- Error handling
- Pagination
- Filtering

### Security

- Unauthorized access
- RBAC bypass attempts
- Invalid tokens
- Account locking
- File upload security
- Injection attempts
- Input validation

### UI

- Forms
- Navigation
- Role-specific screens
- Dashboard behavior
- Error states

### End-to-End Critical Workflows

1. Login
2. Create project
3. Configure BOM
4. Purchase material
5. Receive material
6. Request material
7. Approve request
8. Issue material
9. Update progress
10. Update dashboard
11. Generate report
12. Client views approved project information

---

## 15. Acceptance Criteria

V1 is considered functionally complete when:

### Authentication

- Users can securely log in and log out.
- Passwords are securely hashed.
- JWT authentication works.
- Account lock rules work.
- Session expiration works.

### Authorization

- All six roles have appropriate access.
- Unauthorized operations are rejected server-side.
- Project-level access is enforced.
- Additional permissions work.

### Projects

- Multiple projects can be created.
- Multiple project types are supported.
- Templates can be selected and customized.
- Phases and milestones work.
- Quantity-based progress works.

### Materials

- BOMs can be configured.
- Inventory can receive materials.
- Material requests follow approval workflows.
- Approved materials can be issued.
- Returns update inventory.
- Negative stock is prevented.
- Low-stock notifications work.

### Workforce

- Users/workers can be assigned to projects.
- Attendance can be recorded.
- Check-in/check-out can be supported.
- Working hours are calculated.
- Assignment conflicts are detected.

### Equipment

- Equipment can be assigned.
- Scheduling conflicts are detected.
- Maintenance status is tracked.

### Budget

- Budgets can be created.
- Expenses can be recorded.
- Variance is calculated.
- Budget changes require appropriate approval.

### Site Operations

- Daily reports can be submitted.
- Quantities can be recorded.
- Images can be uploaded.
- Issues can be tracked.

### Quality & Safety

- Inspections can be recorded.
- Defects can be tracked.
- Safety incidents and near misses can be recorded.
- Corrective actions can be managed.

### Client

- Clients can securely log in.
- Clients see only authorized projects.
- Approved information is visible.
- Client queries can be submitted.

### Documents

- Authorized users can upload documents.
- Unauthorized document access is prevented.
- Document metadata and versions are maintained.

### Real-Time

- Notifications can be delivered through WebSockets.
- Approval updates can be reflected in real time.
- Dashboard updates can be reflected in real time.
- Activity updates can be delivered to authorized users.
- WebSocket authorization is enforced.

### Security

- Audit logs work.
- Login history works.
- Failed login attempts are tracked.
- Sensitive values are not exposed.
- Secrets are not stored in source control.

---

## 16. Implementation Direction

Implementation should proceed in dependency order:

1. Foundation
2. Authentication & security
3. Project management
4. Workforce & equipment
5. Materials & procurement
6. Budget & site operations
7. Quality, safety & documents
8. Client portal & real-time features
9. Analytics & reporting
10. Testing and release validation

The detailed implementation plan belongs in TRD.md and Architecture.md.

---

## 17. Product Documentation

The project maintains separate documents for different concerns:

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

### PRD

Product requirements and scope.

### TRD

Technology stack, development standards, tooling, libraries, and technical requirements.

### WEBSITE-FLOW

Routes, navigation, page inventory, user journeys, actions, and interaction flows.

### UI-UX

Visual design system, colors, typography, layouts, components, responsive behavior, animations, and design rules.

### ARCHITECTURE

System architecture, frontend/backend structure, modules, integrations, real-time architecture, storage, and security architecture.

### API-SPECIFICATION

Backend API contracts, routes, request/response structures, validation, authorization, errors, filtering, and pagination.

### DATABASE-DESIGN

MongoDB collections, schemas, relationships/references, indexes, constraints, and data lifecycle.

### TESTING-QA

Testing strategy, test cases, automation, security testing, performance testing, and acceptance validation.

### DEPLOYMENT-OPERATIONS

Environment configuration, local setup, build, deployment, backups, monitoring, and operational procedures.

---

## 18. Definition of Done

A feature is complete only when:

- Requirements are implemented.
- Backend authorization exists.
- Input validation exists.
- Business rules are implemented.
- Database operations are correct.
- Error handling exists.
- UI states are complete.
- Loading and empty states are handled.
- Relevant audit events exist.
- Real-time events are implemented where required.
- Tests pass.
- Documentation is updated.

---

## 19. Product Governance

This PRD is the single source of truth for product requirements.

Any proposed major change must identify:

1. Requirement being changed
2. Reason for change
3. Impact on existing features
4. Database impact
5. Architecture impact
6. Security impact
7. Testing impact
8. Implementation impact

Detailed technical documents must remain consistent with this PRD.

No major feature should be introduced that conflicts with this document without an explicit requirements review.

---

## 20. Final Product Definition

V1 is a secure construction project and resource management platform for a single organization managing multiple construction projects.

Its core value comes from integrating:

**Project Management + Quantity-Based Progress + BOM + Inventory + Procurement + Workforce + Equipment + Budget + Site Operations + Quality + Safety + Documents + Client Portal + Analytics + Security + Real-Time Communication**

The application is designed as a responsive professional web application with a human-designed visual language, clear workflows, subtle transitions, and role-specific experiences.

External AI services are not required for V1. Rule-based business intelligence is used for project health, delay detection, budget risk, material risk, and related operational insights.

---

## 21. Document Status

**Version:** 1.0  
**Status:** Locked V1 Baseline  
**Authority:** Single Source of Truth  
**Next Related Documents:** WEBSITE-FLOW.md, UI-UX.md, TRD.md, ARCHITECTURE.md
