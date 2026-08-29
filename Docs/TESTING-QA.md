# Smart Build --- Testing & QA Strategy

**Document:** `TESTING-QA.md`\
**Version:** 1.0\
**Status:** V1 QA Baseline\
**Authority:** Testing and quality source of truth\
**Related:** `PRD.md`, `TRD.md`, `ARCHITECTURE.md`,
`DATABASE-DESIGN.md`, `UI-UX.md`, `WEBSITE-FLOW.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the testing strategy, quality gates, test levels,
business-rule validation, security testing, UI testing, API testing,
database testing, real-time testing, and release criteria for Smart
Build V1.

The goal is not maximum test volume. The goal is reliable validation of
important business workflows, authorization boundaries, data integrity,
and user experience.

------------------------------------------------------------------------

## 2. QA Principles

1.  Test business rules, not only UI behavior.
2.  Test authorization on the backend.
3.  Test happy paths and failure paths.
4.  Test important workflow transitions.
5.  Protect historical data.
6.  Prevent invalid inventory and financial states.
7.  Test project-level isolation.
8.  Test responsive behavior.
9.  Test accessibility fundamentals.
10. Automate repeatable regression checks.
11. Keep test data deterministic.
12. A feature is incomplete until its critical failure cases are tested.

------------------------------------------------------------------------

## 3. Testing Pyramid

``` text
             ┌─────────────────┐
             │   E2E Tests     │
             │ Critical flows  │
             └────────┬────────┘
                      │
             ┌────────┴────────┐
             │ Integration/API │
             │   + DB tests    │
             └────────┬────────┘
                      │
             ┌────────┴────────┐
             │  Unit Tests     │
             │ Business rules  │
             └─────────────────┘
```

Prioritize unit tests for complex business rules, integration tests for
API/database behavior, and E2E tests for the most important cross-module
journeys.

------------------------------------------------------------------------

## 4. Test Levels

### 4.1 Static Checks

Run on every implementation stage:

-   TypeScript compilation
-   Linting
-   Formatting checks
-   Import/module validation
-   Build validation

### 4.2 Unit Tests

Test isolated:

-   Services
-   Business-rule functions
-   Validators
-   Permission calculations
-   Progress calculations
-   Health calculations
-   Status-transition rules

### 4.3 Integration Tests

Test:

-   API routes
-   Authentication
-   Authorization
-   MongoDB persistence
-   Service/repository interaction
-   Transactions
-   File metadata operations
-   Notification creation

### 4.4 End-to-End Tests

Test complete user journeys through the browser.

### 4.5 Manual QA

Use manual testing for:

-   Visual quality
-   Responsive behavior
-   Accessibility checks
-   Complex workflow usability
-   Realistic data validation

------------------------------------------------------------------------

## 5. Environment Strategy

Use separate environment configuration for:

``` text
Development
Test
Production
```

Tests must never depend on a developer's personal production data.

Test credentials and secrets must be provided through test environment
configuration.

Never commit real secrets.

------------------------------------------------------------------------

## 6. Test Data Strategy

Test data should include:

-   Multiple users
-   All six roles
-   Multiple projects
-   Users assigned to multiple projects
-   Users without project access
-   Active/deactivated users
-   Projects in different lifecycle states
-   Materials above and below stock thresholds
-   Approved and unapproved requests
-   Equipment with schedule conflicts
-   Budget change requests
-   Quality failures
-   Safety incidents
-   Client-visible and internal documents
-   Notifications
-   Audit records

Test fixtures should be deterministic and resettable.

------------------------------------------------------------------------

## 7. Authentication Test Matrix

### Login

Test:

-   Valid credentials
-   Invalid email
-   Invalid password
-   Missing fields
-   Deactivated account
-   Locked account
-   Failed-login counter
-   Successful-login history
-   Session creation
-   Session expiration

### Logout

Test:

-   Session invalidation
-   Redirect to login
-   Real-time connection disconnect
-   Previously protected API request denied

### Password

Test:

-   Password hashing
-   Password change
-   Password reset
-   Invalid reset token
-   Expired reset token
-   Weak/invalid password
-   Old password no longer usable where required

------------------------------------------------------------------------

## 8. Authorization Testing

Authorization is a critical QA area.

For every protected operation, test:

``` text
Unauthenticated
Authenticated but wrong role
Correct role without permission
Correct role with permission
Correct role/project access
Correct role without project access
Resource belongs to another project
Deactivated user
```

Expected outcomes:

``` text
401 → unauthenticated
403 → authenticated but forbidden
404 → resource not exposed where appropriate
200/201/204 → authorized success
```

Never rely on frontend route hiding as the authorization test.

------------------------------------------------------------------------

## 9. Project Isolation Tests

For users assigned to Project A but not Project B:

-   Project B must not appear as accessible.
-   Direct Project B URL must fail.
-   Project B API request must fail.
-   Project B data must not appear in search results.
-   WebSocket events for Project B must not be received.
-   Project switcher must not grant access.

This is one of the highest-priority security test groups.

------------------------------------------------------------------------

## 10. User Management Tests

Test:

-   Create/invite user
-   Assign role
-   Assign project
-   Grant additional permissions
-   Activate account
-   Edit user
-   Deactivate user
-   Remove project access
-   Historical records remain
-   Sessions are invalidated after deactivation
-   WebSocket access is disconnected
-   Audit record is created

Admin must not be able to create arbitrary new roles.

------------------------------------------------------------------------

## 11. Project Management Tests

Test project lifecycle:

``` text
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

Validate:

-   Required project fields
-   Unique project code
-   Project type
-   Project manager
-   Team assignment
-   Planned dates
-   Actual dates
-   Invalid lifecycle transitions
-   Archive behavior
-   Historical preservation

------------------------------------------------------------------------

## 12. Phase/Task/Milestone Tests

### Phases

Test:

-   Creation
-   Dates
-   Dependencies
-   Status
-   Progress
-   Project association

### Tasks

Test:

-   Assignment
-   Dates
-   Priority
-   Status
-   Quantity
-   Unit
-   Progress
-   Dependencies
-   Attachments
-   Comments
-   Issues

### Quantity progress

Given:

``` text
Planned = 10,000
Completed = 6,500
```

Expected:

``` text
Progress = 65%
```

Also test:

-   Zero planned quantity
-   Completed \> planned
-   Negative quantity
-   Decimal quantity
-   Quantity updates over time
-   Progress history
-   Phase/project recalculation

### Milestones

Test:

-   Planned date
-   Actual date
-   Status
-   Responsible person
-   Related work
-   Client visibility

------------------------------------------------------------------------

## 13. Material and BOM Tests

Test:

-   Material creation
-   Unique material code
-   Categories
-   Units
-   Stock thresholds
-   BOM creation
-   BOM versioning
-   Planned quantity
-   Used quantity
-   Remaining quantity
-   Variance
-   Approval history

Ensure material references remain valid.

------------------------------------------------------------------------

## 14. Material Request Workflow Tests

Required workflow:

``` text
Site Engineer
 → Request
 → Project Manager
 → Approve / Reject
 → Store Manager
 → Check Inventory
 → Issue
 → Inventory Updated
 → Audit
 → Notification
```

Test:

### Valid path

Request → approval → issue → inventory update.

### Invalid paths

-   Request without project access
-   Unauthorized approval
-   Issuance before approval
-   Issue quantity above approved quantity
-   Issue quantity above available stock
-   Duplicate issue
-   Cancelled request issue
-   Rejected request issue

Expected result:

**Negative inventory must never occur.**

------------------------------------------------------------------------

## 15. Inventory Tests

Test every transaction type:

``` text
RECEIPT
ISSUE
RETURN
TRANSFER_OUT
TRANSFER_IN
ADJUSTMENT
CONSUMPTION
```

Validate:

-   Balance updates
-   Transaction history
-   Source/destination locations
-   Project scope
-   Quantity rules
-   Cost handling
-   Audit records
-   Negative inventory prevention

For multi-document inventory operations, verify atomicity.

------------------------------------------------------------------------

## 16. Procurement Tests

Test:

``` text
Shortage
 → Procurement Request
 → Review
 → Approval
 → Purchase Order
 → Vendor
 → Receiving
 → Inventory
```

Validate:

-   Vendor selection
-   Material quantities
-   Unit price
-   Total calculation
-   Expected delivery
-   Approval
-   PO status
-   Receiving
-   Inventory update

Test rejection and cancellation paths.

------------------------------------------------------------------------

## 17. Workforce and Attendance Tests

Test:

-   Worker creation
-   Worker types/trades
-   Contractor relationship
-   Project assignment
-   Task assignment
-   Attendance
-   Check-in
-   Check-out
-   Working-hour calculation
-   Overtime calculation
-   Duplicate attendance prevention
-   Assignment history

Do not test payroll features because payroll is out of V1 scope.

------------------------------------------------------------------------

## 18. Equipment Tests

Test:

-   Equipment creation
-   Status changes
-   Assignment
-   Schedule
-   Usage
-   Transfer
-   Breakdown
-   Maintenance
-   Inspection
-   Rental equipment
-   Costs
-   Documents

Critical rule:

``` text
Existing conflicting assignment
        ↓
New assignment
        ↓
REJECT
```

Also reject assignments where equipment is unavailable due to
maintenance/breakdown as defined by business rules.

------------------------------------------------------------------------

## 19. Budget and Expense Tests

Test:

-   Budget creation
-   Categories
-   Planned costs
-   Actual costs
-   Variance
-   Expenses
-   Budget change requests
-   Approval/rejection
-   Audit

Validate:

``` text
Planned
Actual
Variance
```

Test unauthorized budget changes.

Do not test full accounting/payroll behavior because those are out of V1
scope.

------------------------------------------------------------------------

## 20. Daily Reports and Issues

### Daily reports

Test:

-   Work performed
-   Quantities
-   Materials
-   Equipment
-   Workforce
-   Issues
-   Photos
-   Notes
-   Submission
-   Review

### Issues

Test:

-   Create
-   Assign
-   Priority
-   Status
-   Due date
-   Update
-   Resolve
-   Close
-   Project association
-   Cross-module references

------------------------------------------------------------------------

## 21. Quality Tests

Required workflow:

``` text
Inspection
 → Checklist
 → PASS → Complete

or

Inspection
 → FAIL
 → Defect
 → Corrective Action
 → Reinspection
 → Approval
```

Test:

-   Checklist validation
-   Pass path
-   Fail path
-   Defect creation
-   Severity
-   Corrective action
-   Assignment
-   Due date
-   Reinspection
-   Approval
-   Historical quality records

Invalid transitions must be rejected.

------------------------------------------------------------------------

## 22. Safety Tests

Test:

-   Hazard
-   Incident
-   Near miss
-   Severity
-   Corrective action
-   Assignment
-   Review
-   Closure
-   Safety history

Verify high-severity records are handled according to required workflow
and authorization.

------------------------------------------------------------------------

## 23. Document Tests

Test:

-   Upload
-   File type validation
-   File size validation
-   Secure generated filename
-   Metadata creation
-   Version creation
-   Version numbering
-   Project access
-   Client visibility
-   Unauthorized download
-   Archive
-   Audit logging

Test path traversal and unsafe filename inputs.

The browser must never be able to access another project's file by
guessing a path.

------------------------------------------------------------------------

## 24. Client Portal Tests

Client must be able to:

-   Login
-   View authorized projects
-   View approved progress
-   View milestones
-   View approved reports
-   View approved documents
-   View approved photographs
-   View approved health information
-   Submit queries
-   Participate in explicitly approved workflows

Client must not be able to:

-   Modify internal operational data
-   View internal-only documents
-   View internal notes
-   View unauthorized financial information
-   Access another client's project
-   Use internal workspace APIs without permission

------------------------------------------------------------------------

## 25. Notification Tests

Test:

-   Notification creation
-   Correct recipient
-   Correct project
-   Read/unread state
-   Navigation target
-   Unauthorized target handling
-   Notification persistence
-   Duplicate event handling where required

Representative events:

-   Progress update
-   Material request
-   Material approval
-   Stock update
-   Budget request/approval
-   Client query
-   Activity

------------------------------------------------------------------------

## 26. WebSocket Tests

Test:

1.  Authentication on connection
2.  Authorization on subscription
3.  Project-level access
4.  Event payload validation
5.  Authorized event delivery
6.  Unauthorized event rejection
7.  Disconnect after account deactivation
8.  Reconnection behavior
9.  Database remains source of truth

Example:

``` text
User assigned Project A
 → subscribes to Project A
 → receives Project A update

Same user
 → attempts Project B subscription
 → rejected
```

------------------------------------------------------------------------

## 27. API Testing

Every API should test:

-   Method correctness
-   Authentication
-   Authorization
-   Required fields
-   Data types
-   Enum validation
-   Date validation
-   Numeric ranges
-   ID validation
-   File metadata
-   Business constraints
-   Success response
-   Error response
-   Pagination
-   Filtering
-   Sorting

Test expected status codes including:

``` text
200
201
204
400
401
403
404
409
422
429
500
```

Production error responses must not expose internal implementation
details.

------------------------------------------------------------------------

## 28. Database Testing

Verify:

-   Required fields
-   Unique indexes
-   Referential consistency at service level
-   Transaction behavior
-   Inventory balances
-   Historical records
-   Indexes
-   Migration scripts
-   Soft deletion/archive behavior

Database tests must verify that multi-document workflows do not leave
partial state.

------------------------------------------------------------------------

## 29. Frontend Testing

Test:

-   Route rendering
-   Permission-aware navigation
-   Project switcher
-   Forms
-   Validation
-   Loading states
-   Empty states
-   Error states
-   Permission denied states
-   Success feedback
-   Modals
-   Tables
-   Filters
-   Pagination
-   Notifications
-   File upload UI

Frontend authorization checks are tested for UX, but backend tests
remain authoritative for security.

------------------------------------------------------------------------

## 30. Responsive Testing

Test representative screens at:

-   Desktop
-   Tablet
-   Mobile browser

Verify:

-   Sidebar behavior
-   Header
-   Tables
-   Forms
-   Dialogs
-   Cards
-   Charts/analytics
-   File upload
-   Notifications
-   Project switcher

No critical action should become unusable at smaller widths.

------------------------------------------------------------------------

## 31. Accessibility QA

Check:

-   Keyboard navigation
-   Focus visibility
-   Semantic headings
-   Form labels
-   Error association
-   Button names
-   Contrast
-   Status communication without color alone
-   Touch target usability
-   Reduced-motion behavior where applicable

Accessibility issues affecting core workflows are release blockers.

------------------------------------------------------------------------

## 32. Security QA

Test:

### Authentication

-   Brute-force resistance/lock behavior
-   Session expiration
-   Logout invalidation
-   Password reset security

### Authorization

-   Role escalation attempts
-   Permission bypass
-   Project ID tampering
-   Direct URL access
-   API access without UI

### Input security

-   Malformed IDs
-   Unexpected types
-   Oversized input
-   Injection-oriented payloads
-   Unsafe file names
-   Path traversal attempts

### Data exposure

-   Unauthorized project data
-   Internal client-hidden information
-   Sensitive error responses
-   Audit data exposure

Never expose secrets in logs or API responses.

------------------------------------------------------------------------

## 33. Performance QA

V1 performance testing should focus on practical user-facing behavior.

Test:

-   Initial page load
-   Dashboard rendering
-   Large table pagination
-   Search/filter response
-   Project switching
-   Document listing
-   Notification loading
-   API response times for common operations
-   WebSocket event handling

Avoid loading large collections unnecessarily.

------------------------------------------------------------------------

## 34. Error Recovery QA

Test recoverable failures:

-   API timeout
-   Temporary server error
-   Network disconnect
-   WebSocket disconnect
-   File upload failure
-   Validation failure
-   Session expiry
-   Stale data
-   Concurrent update conflicts where applicable

The UI should provide a clear recovery path.

------------------------------------------------------------------------

## 35. Regression Strategy

Whenever a feature changes:

1.  Run affected unit tests.
2.  Run affected API/integration tests.
3.  Run critical E2E flows.
4.  Run authorization tests for changed permissions.
5.  Run relevant responsive/UI checks.
6.  Run full regression before release.

High-risk areas always included in regression:

-   Authentication
-   Authorization
-   Project access
-   Inventory
-   Material approval/issue
-   Budget approval
-   Client visibility
-   Documents
-   Audit

------------------------------------------------------------------------

## 36. Critical End-to-End Scenarios

At minimum, automate these journeys:

### E2E-01 User onboarding

``` text
Public user submits access request (/request-access)
 → status: PENDING
 → Admin logs in & opens Access Requests (/admin/users)
 → Admin reviews & approves request, confirming role from 6 locked roles
 → Account created with status: PENDING_ACTIVATION
 → Activation token generated & dispatched
 → User visits /activate with token
 → User sets secure password
 → Account status transitions to ACTIVE
 → User logs in (/login)
 → System enforces role-scoped dashboard and project access
```

### E2E-02 Project creation

``` text
Project Manager login
 → create project
 → choose type/template
 → configure phases
 → configure BOM
 → set budget
 → assign team
 → create
 → project workspace
```

### E2E-03 Progress update

``` text
Site Engineer
 → project
 → task
 → enter completed quantity
 → submit
 → progress recalculated
 → dashboard reflects update
```

### E2E-04 Material lifecycle

``` text
Site Engineer
 → request
 → Project Manager approval
 → Store Manager issue
 → inventory updated
 → notification
 → audit
```

### E2E-05 Procurement lifecycle

``` text
Shortage
 → procurement request
 → approval
 → purchase order
 → receiving
 → inventory updated
```

### E2E-06 Equipment assignment

``` text
Project Manager
 → equipment
 → select dates
 → availability check
 → conflict check
 → assignment
```

### E2E-07 Quality failure

``` text
Inspection
 → fail checklist
 → defect
 → corrective action
 → reinspection
 → approval
```

### E2E-08 Safety incident

``` text
Record incident
 → severity
 → corrective action
 → review
 → close
```

### E2E-09 Client portal

``` text
Client login
 → assigned project
 → approved progress
 → milestones
 → reports/documents
 → submit query
```

### E2E-10 Access removal

``` text
Admin deactivates user
 → existing session invalidated
 → API denied
 → WebSocket disconnected
 → historical records preserved
 → audit record created
```

------------------------------------------------------------------------

## 37. QA Test Case Format

Use a consistent structure:

``` text
Test ID:
Feature:
Priority:
Preconditions:
Test Data:
Steps:
Expected Result:
Actual Result:
Status:
Environment:
Notes:
```

Priority:

``` text
P0 — Release blocker
P1 — Critical
P2 — Important
P3 — Minor
```

------------------------------------------------------------------------

## 38. Defect Severity

### Critical

-   Security bypass
-   Cross-project data exposure
-   Data corruption
-   Negative inventory
-   Unauthorized financial modification
-   Authentication bypass
-   Complete workflow failure

### High

-   Major business workflow broken
-   Authorization incorrect for a meaningful operation
-   Client sees unauthorized information
-   Critical data not persisted

### Medium

-   Important feature partially broken
-   Significant usability issue
-   Non-critical calculation/display defect

### Low

-   Minor visual issue
-   Cosmetic inconsistency
-   Non-blocking copy issue

------------------------------------------------------------------------

## 39. Release Gates

A V1 release should require:

### Build

-   Frontend build passes
-   Backend build passes
-   TypeScript checks pass
-   Lint checks pass

### Functional

-   Critical E2E flows pass
-   No open Critical defects
-   No open High-severity security defects
-   Authentication works
-   Authorization works
-   Project isolation works

### Data

-   Inventory integrity verified
-   Budget calculations verified
-   Audit records verified
-   Historical records preserved

### UI/UX

-   Responsive checks pass
-   Core accessibility checks pass
-   Loading/empty/error states implemented
-   Client portal visibility verified

### Security

-   No committed secrets
-   Authorization bypass tests pass
-   File access controls pass
-   Safe production errors verified

------------------------------------------------------------------------

## 40. Definition of Done

A feature is considered complete only when:

-   Product requirement is satisfied.
-   Technical architecture is respected.
-   Backend validation exists.
-   Backend authorization exists where applicable.
-   Database behavior is tested.
-   Business rules are tested.
-   UI states are handled.
-   Responsive behavior is checked.
-   Accessibility basics are checked.
-   Audit/notification behavior is implemented where required.
-   Relevant documentation is updated.
-   Critical regression tests pass.

------------------------------------------------------------------------

## 41. QA Workflow

``` text
Requirement
    ↓
Implementation
    ↓
Unit Tests
    ↓
Integration/API Tests
    ↓
Frontend Tests
    ↓
E2E Critical Flow
    ↓
Security/Authorization Checks
    ↓
Responsive + Accessibility QA
    ↓
Regression
    ↓
Release Gate
```

------------------------------------------------------------------------

## 42. Documentation Change Rule

If implementation changes:

-   Product scope → update `PRD.md`
-   Technical constraints → update `TRD.md`
-   Architecture → update `ARCHITECTURE.md`
-   Database model → update `DATABASE-DESIGN.md`
-   Navigation/flow → update `WEBSITE-FLOW.md`
-   Visual/interaction behavior → update `UI-UX.md`
-   Testing strategy/acceptance → update `TESTING-QA.md`

Documentation must remain synchronized with implementation.

------------------------------------------------------------------------

## 43. V1 QA Non-Goals

Do not create V1 QA requirements for:

-   AI behavior
-   Mobile applications
-   IoT hardware
-   GPS tracking
-   BIM
-   Payment gateways
-   SMS
-   Email integrations
-   Kubernetes
-   Mandatory cloud infrastructure
-   Full ERP/accounting
-   Full payroll/HR

These are outside the locked V1 product scope.
