# Smart Build --- Database Design

**Document:** `DATABASE-DESIGN.md`\
**Version:** 1.0\
**Status:** V1 Database Baseline\
**Authority:** Persistence design source of truth\
**Related:** `PRD.md`, `TRD.md`, `ARCHITECTURE.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the MongoDB data model, collection boundaries,
relationships, indexing strategy, lifecycle rules, and data-integrity
requirements for Smart Build V1.

MongoDB is the primary application database. MongoDB Compass is used as
a development inspection/management tool.

The design favors clear domain boundaries, historical traceability,
practical query performance, and server-enforced business rules.

------------------------------------------------------------------------

## 2. Database Principles

1.  MongoDB is the source of truth.
2.  Collections are organized by business domain.
3.  References are preferred for major independently managed entities.
4.  Small, tightly coupled snapshots may be embedded where historical
    accuracy requires it.
5.  Important historical records are preserved.
6.  State transitions are validated by the service layer.
7.  Database constraints and indexes support---but do not
    replace---business validation.
8.  Project-scoped records contain a project reference where applicable.
9.  Audit records are append-oriented.
10. Sensitive credentials are stored only as secure hashes/tokens as
    appropriate.
11. Files are stored outside MongoDB in V1; MongoDB stores controlled
    metadata and references.
12. Pagination is server-side for large collections.
13. Indexes must be added for actual query patterns rather than
    indiscriminately.

------------------------------------------------------------------------

## 3. Database Overview

``` text
users
  ├── user_project_assignments
  ├── login_history
  └── audit_logs

projects
  ├── phases
  │    ├── tasks
  │    └── milestones
  ├── progress_records
  ├── workforce_assignments
  ├── attendance
  ├── BOMs
  ├── material_requests
  ├── inventory
  ├── procurement_requests
  ├── purchase_orders
  ├── equipment_assignments
  ├── budgets
  ├── expenses
  ├── daily_reports
  ├── issues
  ├── quality_records
  ├── safety_records
  ├── documents
  ├── notifications
  └── activities
```

------------------------------------------------------------------------

## 4. Naming Conventions

Collections use plural lowercase names:

``` text
users
projects
phases
tasks
materials
vendors
equipment
budgets
expenses
documents
audit_logs
```

Primary MongoDB identifiers use `_id`.

Foreign references use explicit names such as:

``` text
projectId
userId
phaseId
taskId
materialId
vendorId
equipmentId
```

Dates are stored as BSON Date values.

Enumerations use controlled string values.

Amounts and quantities must use numeric types suitable for their
precision requirements. Financial values should not rely on binary
floating-point arithmetic in business logic; normalize monetary
calculations consistently.

------------------------------------------------------------------------

## 5. Core User Collections

### 5.1 `users`

Purpose: authenticated user identity and account state.

Core fields:

``` text
_id
name
email
passwordHash
primaryRole
additionalPermissions[]
status
accountLockedUntil
passwordChangedAt
lastLoginAt
failedLoginCount
createdAt
updatedAt
deactivatedAt
```

Allowed primary roles:

``` text
ADMIN
PROJECT_MANAGER
SITE_ENGINEER
STORE_MANAGER
CONTRACTOR
CLIENT
```

Constraints:

-   Email must be unique.
-   Password is never stored in plaintext.
-   Deactivated users cannot authenticate.
-   Historical records remain after deactivation.

Indexes:

``` text
unique: email
status
primaryRole
```

------------------------------------------------------------------------

### 5.2 `project_memberships`

Purpose: project-level assignment.

Fields:

``` text
_id
userId
projectId
assignmentStatus
assignedAt
removedAt
assignedBy
createdAt
updatedAt
```

Indexes:

``` text
unique: { userId, projectId }
projectId
userId
assignmentStatus
```

This collection is the primary source for project membership checks.

------------------------------------------------------------------------

### 5.3 `login_history`

Fields:

``` text
_id
userId
emailAttempted
success
failureReason
ipAddress
userAgent
timestamp
```

Indexes:

``` text
userId + timestamp
timestamp
success
```

Sensitive values must be handled according to the security policy.

------------------------------------------------------------------------

## 6. Projects

### 6.1 `projects`

Fields:

``` text
_id
code
name
typeId
clientUserId
location
description
plannedStartDate
plannedEndDate
actualStartDate
actualEndDate
projectManagerId
status
health
healthFactors
createdBy
createdAt
updatedAt
archivedAt
```

Project status:

``` text
DRAFT
PLANNING
ACTIVE
ON_HOLD
COMPLETED
ARCHIVED
```

Health:

``` text
HEALTHY
AT_RISK
CRITICAL
```

Indexes:

``` text
unique: code
status
projectManagerId
clientUserId
typeId
plannedEndDate
health
```

------------------------------------------------------------------------

### 6.2 `project_types`

Fields:

``` text
_id
name
code
description
status
createdAt
updatedAt
```

Examples include residential, apartment, villa, commercial, road,
bridge, industrial, renovation, and organization-defined types.

------------------------------------------------------------------------

### 6.3 `project_templates`

Fields:

``` text
_id
name
description
projectTypeId
defaultPhases[]
defaultTasks[]
defaultMilestones[]
defaultBOMItems[]
defaultBudgetCategories[]
defaultResourceRequirements[]
version
status
createdBy
createdAt
updatedAt
```

Templates are reusable blueprints. A project created from a template may
be customized independently.

------------------------------------------------------------------------

## 7. Project Planning

### 7.1 `phases`

Fields:

``` text
_id
projectId
name
description
sequence
plannedStartDate
plannedEndDate
actualStartDate
actualEndDate
status
progress
dependencies[]
createdAt
updatedAt
```

Indexes:

``` text
projectId + sequence
projectId + status
projectId + plannedEndDate
```

------------------------------------------------------------------------

### 7.2 `tasks`

Fields:

``` text
_id
projectId
phaseId
title
description
assigneeId
contractorId
priority
status
plannedStartDate
plannedEndDate
actualStartDate
actualEndDate
plannedQuantity
unit
completedQuantity
progress
dependencies[]
attachments[]
createdBy
createdAt
updatedAt
completedAt
```

Task status should be controlled and validated through the service
layer.

Quantity progress:

``` text
progress = completedQuantity / plannedQuantity × 100
```

with appropriate bounds and edge-case handling.

Indexes:

``` text
projectId + phaseId
projectId + assigneeId
projectId + status
projectId + priority
assigneeId
contractorId
plannedEndDate
```

------------------------------------------------------------------------

### 7.3 `milestones`

Fields:

``` text
_id
projectId
phaseId
name
description
plannedDate
actualDate
status
responsibleUserId
relatedTaskIds[]
clientVisible
createdAt
updatedAt
```

Indexes:

``` text
projectId + plannedDate
projectId + status
projectId + clientVisible
```

------------------------------------------------------------------------

### 7.4 `progress_records`

Purpose: historical quantity/progress entries.

Fields:

``` text
_id
projectId
taskId
phaseId
enteredBy
date
completedQuantity
unit
notes
source
createdAt
```

This collection preserves progress history rather than overwriting the
only record of previous updates.

Indexes:

``` text
taskId + date
phaseId + date
projectId + date
```

------------------------------------------------------------------------

## 8. Workforce

### 8.1 `workers`

Fields:

``` text
_id
name
workerType
trade
contractorId
contact
status
createdAt
updatedAt
```

This is operational workforce management, not a full HR/payroll system.

------------------------------------------------------------------------

### 8.2 `workforce_assignments`

Fields:

``` text
_id
projectId
workerId
phaseId
taskId
assignedBy
startDate
endDate
status
createdAt
updatedAt
```

Indexes:

``` text
projectId + workerId
projectId + taskId
workerId + startDate
```

------------------------------------------------------------------------

### 8.3 `attendance`

Fields:

``` text
_id
projectId
workerId
date
checkIn
checkOut
workingHours
overtimeHours
status
recordedBy
createdAt
updatedAt
```

Unique logical key:

``` text
workerId + projectId + date
```

------------------------------------------------------------------------

## 9. Materials and BOM

### 9.1 `materials`

Central material catalog.

Fields:

``` text
_id
code
name
category
unit
specifications
minimumStock
reorderLevel
status
notes
createdAt
updatedAt
```

Indexes:

``` text
unique: code
category
status
name
```

------------------------------------------------------------------------

### 9.2 `boms`

Fields:

``` text
_id
projectId
phaseId
taskId
version
status
approvalStatus
createdBy
approvedBy
approvedAt
createdAt
updatedAt
```

------------------------------------------------------------------------

### 9.3 `bom_items`

Fields:

``` text
_id
bomId
materialId
plannedQuantity
usedQuantity
remainingQuantity
variance
unit
notes
```

Indexes:

``` text
bomId
materialId
```

BOM versions are preserved when changes need historical traceability.

------------------------------------------------------------------------

## 10. Material Requests

### `material_requests`

Fields:

``` text
_id
projectId
requestedBy
phaseId
taskId
status
reason
items[]
reviewedBy
reviewedAt
rejectionReason
issuedAt
createdAt
updatedAt
```

Each item contains:

``` text
materialId
requestedQuantity
approvedQuantity
issuedQuantity
unit
```

Workflow states should include controlled values such as:

``` text
DRAFT
SUBMITTED
APPROVED
REJECTED
PARTIALLY_ISSUED
ISSUED
CANCELLED
```

Issuance without required approval is prohibited.

------------------------------------------------------------------------

## 11. Inventory

### 11.1 `inventory_locations`

Fields:

``` text
_id
name
type
projectId
status
createdAt
updatedAt
```

Location types:

``` text
CENTRAL_WAREHOUSE
PROJECT_STORE
```

------------------------------------------------------------------------

### 11.2 `inventory_balances`

Fields:

``` text
_id
locationId
materialId
quantity
reservedQuantity
averageUnitCost
updatedAt
```

Logical uniqueness:

``` text
locationId + materialId
```

Negative available inventory is prohibited.

------------------------------------------------------------------------

### 11.3 `inventory_transactions`

Fields:

``` text
_id
projectId
locationId
materialId
transactionType
quantity
unitCost
referenceType
referenceId
fromLocationId
toLocationId
performedBy
reason
timestamp
createdAt
```

Transaction types:

``` text
RECEIPT
ISSUE
RETURN
TRANSFER_OUT
TRANSFER_IN
ADJUSTMENT
CONSUMPTION
```

Indexes:

``` text
locationId + materialId + timestamp
projectId + timestamp
materialId + timestamp
referenceType + referenceId
```

The transaction history is append-oriented.

------------------------------------------------------------------------

## 12. Vendors and Procurement

### 12.1 `vendors`

Fields:

``` text
_id
name
code
contact
address
materialsSupplied[]
status
performanceSummary
createdAt
updatedAt
```

Indexes:

``` text
unique: code
status
name
```

------------------------------------------------------------------------

### 12.2 `procurement_requests`

Fields:

``` text
_id
projectId
requestedBy
reason
items[]
status
reviewedBy
reviewedAt
createdAt
updatedAt
```

------------------------------------------------------------------------

### 12.3 `purchase_orders`

Fields:

``` text
_id
poNumber
vendorId
projectId
items[]
subtotal
tax
total
expectedDeliveryDate
approvalStatus
status
createdBy
approvedBy
approvedAt
createdAt
updatedAt
```

Each item:

``` text
materialId
quantity
unit
unitPrice
total
```

Indexes:

``` text
unique: poNumber
vendorId
projectId
status
expectedDeliveryDate
```

------------------------------------------------------------------------

### 12.4 `material_receipts`

Fields:

``` text
_id
purchaseOrderId
vendorId
projectId
locationId
receivedBy
receivedAt
items[]
notes
createdAt
```

Receipt creation must update inventory through the inventory service.

------------------------------------------------------------------------

## 13. Equipment

### `equipment`

Fields:

``` text
_id
code
name
category
ownershipType
status
availability
purchaseDate
rentalDetails
maintenanceSchedule
documents[]
createdAt
updatedAt
```

Statuses include:

``` text
AVAILABLE
ASSIGNED
IN_USE
UNDER_MAINTENANCE
BREAKDOWN
INACTIVE
RETIRED
```

Indexes:

``` text
unique: code
status
ownershipType
```

------------------------------------------------------------------------

### `equipment_assignments`

Fields:

``` text
_id
equipmentId
projectId
assignedTo
startDate
endDate
purpose
status
createdBy
createdAt
updatedAt
```

Indexes:

``` text
equipmentId + startDate + endDate
projectId + startDate
```

Conflicting assignments must be rejected by the service layer.

------------------------------------------------------------------------

### `equipment_maintenance`

Fields:

``` text
_id
equipmentId
type
scheduledDate
completedDate
description
cost
performedBy
status
createdAt
updatedAt
```

------------------------------------------------------------------------

### `equipment_inspections`

Fields:

``` text
_id
equipmentId
projectId
inspectionDate
inspectedBy
result
findings
nextInspectionDate
createdAt
```

------------------------------------------------------------------------

## 14. Budget and Expenses

### 14.1 `budgets`

Fields:

``` text
_id
projectId
version
status
totalPlanned
totalActual
variance
categories[]
createdBy
approvedBy
approvedAt
createdAt
updatedAt
```

Categories can cover:

``` text
MATERIAL
WORKFORCE
EQUIPMENT
OTHER
```

------------------------------------------------------------------------

### 14.2 `expenses`

Fields:

``` text
_id
projectId
category
phaseId
taskId
description
amount
date
vendorId
reference
status
recordedBy
approvedBy
createdAt
updatedAt
```

Indexes:

``` text
projectId + date
projectId + category
projectId + status
```

Budget changes require appropriate approval.

------------------------------------------------------------------------

### 14.3 `budget_change_requests`

Fields:

``` text
_id
projectId
requestedBy
reason
currentBudget
requestedChange
proposedBudget
status
reviewedBy
reviewedAt
createdAt
updatedAt
```

------------------------------------------------------------------------

## 15. Site Operations

### 15.1 `daily_reports`

Fields:

``` text
_id
projectId
reportDate
submittedBy
status
workPerformed[]
quantities[]
materialUsage[]
equipmentUsage[]
workforceSummary[]
issues[]
photos[]
notes
reviewedBy
reviewedAt
createdAt
updatedAt
```

------------------------------------------------------------------------

### 15.2 `issues`

Fields:

``` text
_id
projectId
phaseId
taskId
category
title
description
priority
status
assignedTo
createdBy
dueDate
resolvedAt
createdAt
updatedAt
```

Categories may reference:

``` text
PROJECT
PHASE
TASK
MATERIAL
EQUIPMENT
QUALITY
SAFETY
OTHER
```

Indexes:

``` text
projectId + status
projectId + priority
assignedTo + status
projectId + dueDate
```

------------------------------------------------------------------------

## 16. Quality

### `quality_inspections`

Fields:

``` text
_id
projectId
phaseId
taskId
inspectionType
checklist
status
result
inspectedBy
inspectionDate
createdAt
updatedAt
```

------------------------------------------------------------------------

### `quality_defects`

Fields:

``` text
_id
projectId
inspectionId
title
description
severity
status
assignedTo
correctiveAction
dueDate
resolvedAt
reinspectionId
createdAt
updatedAt
```

------------------------------------------------------------------------

### `quality_reinspections`

Fields:

``` text
_id
projectId
defectId
inspectedBy
inspectionDate
result
notes
approvedBy
approvedAt
createdAt
```

------------------------------------------------------------------------

## 17. Safety

### `safety_records`

Fields:

``` text
_id
projectId
type
title
description
severity
status
reportedBy
assignedTo
correctiveAction
incidentDate
closedAt
createdAt
updatedAt
```

Types:

``` text
HAZARD
INCIDENT
NEAR_MISS
```

Indexes:

``` text
projectId + type
projectId + severity
projectId + status
projectId + incidentDate
```

------------------------------------------------------------------------

## 18. Documents

### `documents`

Fields:

``` text
_id
projectId
name
category
description
currentVersionId
visibility
uploadedBy
createdAt
updatedAt
archivedAt
```

Visibility must support controlled internal/client-visible access.

------------------------------------------------------------------------

### `document_versions`

Fields:

``` text
_id
documentId
versionNumber
originalName
storedFilename
storagePath
mimeType
size
checksum
uploadedBy
createdAt
```

The file itself is stored in V1 local filesystem storage through the
storage abstraction.

Indexes:

``` text
documentId + versionNumber
projectId where query denormalization is intentionally used
```

No user-controlled filename should be used directly as the storage
filename.

------------------------------------------------------------------------

## 19. Notifications and Activity

### 19.1 `notifications`

Fields:

``` text
_id
recipientUserId
type
title
message
projectId
entityType
entityId
readAt
createdAt
```

Indexes:

``` text
recipientUserId + createdAt
recipientUserId + readAt
projectId + createdAt
```

------------------------------------------------------------------------

### 19.2 `activities`

Fields:

``` text
_id
actorUserId
projectId
action
entityType
entityId
summary
metadata
createdAt
```

Activities provide human-readable operational history.

------------------------------------------------------------------------

## 20. Audit and Security

### 20.1 `audit_logs`

Fields:

``` text
_id
actorUserId
action
entityType
entityId
projectId
result
metadata
timestamp
```

Audit logs are append-oriented.

Important actions include:

-   Login/security changes
-   User activation/deactivation
-   Permission changes
-   Project access changes
-   Approval/rejection
-   Inventory adjustments
-   Material issuance
-   Budget changes
-   Document sensitive actions
-   Deletions/archives
-   Security events

Indexes:

``` text
timestamp
actorUserId + timestamp
projectId + timestamp
entityType + entityId
action + timestamp
```

------------------------------------------------------------------------

### 20.2 `security_events`

Fields:

``` text
_id
type
userId
severity
description
metadata
timestamp
resolvedAt
resolvedBy
```

Used for security monitoring separate from general audit history.

------------------------------------------------------------------------

## 21. Reports

V1 reports can be generated from operational collections rather than
requiring a separate reporting database.

Potential report domains:

-   Project progress
-   Budget/cost
-   Materials/inventory
-   Workforce
-   Equipment
-   Quality
-   Safety
-   Delays
-   Approvals
-   Organization overview

Do not introduce a data warehouse for V1 unless a later requirement
explicitly requires it.

------------------------------------------------------------------------

## 22. Relationships

Major relationships:

``` text
User ──< ProjectMembership >── Project

Project ──< Phase ──< Task
Project ──< Milestone
Task ──< ProgressRecord

Project ──< BOM ──< BOMItem >── Material

Project ──< MaterialRequest
Material ──< InventoryBalance
InventoryLocation ──< InventoryBalance
InventoryLocation ──< InventoryTransaction

Vendor ──< PurchaseOrder ──< MaterialReceipt

Project ──< WorkforceAssignment >── Worker
Worker ──< Attendance

Project ──< EquipmentAssignment >── Equipment
Equipment ──< Maintenance
Equipment ──< Inspection

Project ──< Budget
Project ──< Expense
Project ──< BudgetChangeRequest

Project ──< DailyReport
Project ──< Issue
Project ──< QualityInspection ──< Defect
Project ──< SafetyRecord

Project ──< Document ──< DocumentVersion

User ──< Notification
User ──< AuditLog
Project ──< Activity
```

------------------------------------------------------------------------

## 23. Transactions and Atomicity

Use MongoDB transactions for multi-document operations where partial
completion would create invalid business state.

Examples:

### Material issue

``` text
Validate request
 → validate approval
 → validate stock
 → create issue transaction
 → decrement inventory
 → update request status
 → create audit/activity
```

### Material receipt

``` text
Validate purchase order
 → create receipt
 → increment inventory
 → create inventory transaction
 → audit/activity
```

### Budget approval

``` text
Validate request
 → update budget
 → close change request
 → audit
 → notification
```

The service layer coordinates these operations.

------------------------------------------------------------------------

## 24. Data Integrity Rules

The application must enforce:

-   Unique user email
-   Unique project code
-   Unique material code
-   Unique vendor code
-   Unique equipment code
-   Unique purchase-order number
-   No negative inventory
-   No issuance without required approval
-   No unauthorized project access
-   No conflicting equipment assignment
-   No invalid workflow state transitions
-   No progress above valid quantity bounds
-   No unauthorized client visibility
-   Historical records are preserved where required

------------------------------------------------------------------------

## 25. Soft Deletion and Archival

Default behavior for important business entities:

``` text
Active
 ↓
Archived / Deactivated
```

Use hard deletion only where:

-   The entity is disposable,
-   No historical/audit requirement exists,
-   The operation is explicitly authorized.

Audit history must not be casually deleted.

------------------------------------------------------------------------

## 26. Pagination and Query Strategy

Large collections must support:

-   Search
-   Filtering
-   Sorting
-   Pagination

Server-side pagination is mandatory for collections such as:

-   Projects
-   Users
-   Materials
-   Vendors
-   Equipment
-   Workforce
-   Issues
-   Documents
-   Audit logs
-   Notifications

Do not load entire large collections into the browser by default.

------------------------------------------------------------------------

## 27. Indexing Strategy

Index creation should follow actual access patterns.

Priority indexes include:

``` text
users: email, status, primaryRole
project_memberships: userId+projectId, projectId
projects: code, status, projectManagerId
tasks: projectId+phaseId, assigneeId, status
materials: code, category
inventory_balances: locationId+materialId
inventory_transactions: locationId+materialId+timestamp
purchase_orders: poNumber, vendorId, projectId
equipment: code, status
budgets: projectId
expenses: projectId+date
documents: projectId
notifications: recipientUserId+createdAt
audit_logs: projectId+timestamp, actorUserId+timestamp
```

Avoid excessive indexes because every index adds write/storage cost.

------------------------------------------------------------------------

## 28. Data Migration Principles

When schema changes occur:

1.  Document the change.
2.  Preserve existing historical information where possible.
3.  Provide a migration script for existing environments when required.
4.  Test migration on a representative dataset.
5.  Verify indexes after migration.
6.  Never silently discard business history.

------------------------------------------------------------------------

## 29. Database Anti-Patterns to Avoid

Do not:

-   Store passwords in plaintext.
-   Store files as uncontrolled filesystem paths throughout business
    code.
-   Put every domain into one giant collection.
-   Create a global unbounded document containing all project data.
-   Depend on frontend validation for integrity.
-   Allow negative inventory.
-   Delete audit history casually.
-   Duplicate mutable business data without a clear reason.
-   Add indexes without query justification.
-   Introduce a separate reporting database prematurely.

------------------------------------------------------------------------

## 30. Future Evolution

The V1 schema leaves room for:

-   Object storage
-   More advanced reporting
-   External integrations
-   Additional project types
-   Additional permission capabilities
-   Service extraction if scale later requires it

These are future evolution paths, not V1 implementation requirements.
