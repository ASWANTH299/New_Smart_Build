# Website Flow Document

## Construction Project & Resource Management Platform

**Document:** WEBSITE-FLOW.md  
**Version:** 1.0  
**Status:** V1 Baseline  
**Related:** PRD.md, TRD.md, UI-UX.md, ARCHITECTURE.md

---

# 1. Purpose

This document defines how users move through the application.

It covers:

- Sitemap
- Routes
- Navigation
- Application shell
- Role-specific navigation
- Project context
- Page inventory
- User journeys
- Page actions
- Permission behavior
- Loading, empty, error, success, and denied states
- Responsive navigation behavior
- Cross-module workflows

The PRD defines what the product does.

This document defines how users reach and use those capabilities through the website.

---

# 2. Global Product Flow

The primary application flow is:

```text
Login
  ↓
Authentication
  ↓
Session / Account Check
  ↓
Role + Permission Check
  ↓
Role-Specific Dashboard
  ↓
Project / Workspace Context
  ↓
Module
  ↓
List / Dashboard
  ↓
Detail
  ↓
Create / Edit / Action
  ↓
Confirmation where required
  ↓
Result
  ↓
Activity / Notification
```

The flow must remain consistent across modules.

---

# 3. Application Areas

The website has two primary experiences.

```text
Application
│
├── Internal Workspace
│   ├── Admin
│   ├── Project Manager
│   ├── Site Engineer
│   ├── Store Manager
│   └── Contractor
│
└── Client Portal
    └── Client
```

The Client Portal uses a simplified navigation experience and exposes only approved client-visible information.

---

# 4. Route Structure

The application uses a version-independent frontend route structure.

## 4.1 Public Routes

```text
/login
/forgot-password
/reset-password
/activate-account
```

## 4.2 Internal Application Routes

```text
/dashboard

/projects
/projects/new
/projects/:projectId
/projects/:projectId/overview
/projects/:projectId/phases
/projects/:projectId/tasks
/projects/:projectId/milestones
/projects/:projectId/materials
/projects/:projectId/inventory
/projects/:projectId/procurement
/projects/:projectId/vendors
/projects/:projectId/workforce
/projects/:projectId/equipment
/projects/:projectId/budget
/projects/:projectId/expenses
/projects/:projectId/quality
/projects/:projectId/safety
/projects/:projectId/issues
/projects/:projectId/daily-reports
/projects/:projectId/documents
/projects/:projectId/reports
/projects/:projectId/activity

/users
/users/new
/users/:userId

/materials
/materials/:materialId

/vendors
/vendors/:vendorId

/equipment
/equipment/:equipmentId

/workforce
/workforce/:workerId

/notifications
/reports
/audit
/login-history
/profile
/settings
```

The actual route visibility is permission-dependent.

A route existing in the application does not mean every role can access it.

## 4.3 Client Routes

```text
/client
/client/projects
/client/projects/:projectId
/client/projects/:projectId/overview
/client/projects/:projectId/progress
/client/projects/:projectId/milestones
/client/projects/:projectId/reports
/client/projects/:projectId/documents
/client/projects/:projectId/photos
/client/projects/:projectId/queries
/client/notifications
/client/profile
```

---

# 5. Authentication Flow

## 5.1 Login

```text
/login
   ↓
Enter Email
   ↓
Enter Password
   ↓
Submit
   ↓
Validate Credentials
   ↓
Check Account Status
   ↓
Check Lock / Security Rules
   ↓
Create Authenticated Session
   ↓
Determine Role + Permissions
   ↓
Redirect to Appropriate Dashboard
```

### Failure cases

```text
Invalid credentials
      ↓
Error message
      ↓
Failed-login counter updated
```

If the account becomes locked:

```text
Login Attempt
    ↓
Account Locked
    ↓
Access Denied
```

## 5.2 Logout

```text
User
 ↓
Logout
 ↓
Invalidate Session
 ↓
Disconnect Real-Time Connection
 ↓
Redirect to Login
```

## 5.3 Account Activation

```text
Admin Invites User
      ↓
Invitation
      ↓
User Opens Activation Page
      ↓
Set Account Credentials
      ↓
Account Activated
      ↓
Login
      ↓
Role Dashboard
```

---

# 6. Global Application Shell

Internal users use a common application shell.

```text
┌───────────────────────────────────────────────────────────────┐
│ Logo | Project Context | Search | Notifications | User Menu  │
├──────────────────┬────────────────────────────────────────────┤
│                  │                                            │
│ Dashboard        │                                            │
│ Projects         │                                            │
│ Module Links     │              MAIN CONTENT                  │
│                  │                                            │
│                  │                                            │
│                  │                                            │
│                  │                                            │
│ Settings         │                                            │
└──────────────────┴────────────────────────────────────────────┘
```

The exact sidebar items are generated from:

```text
Primary Role
+
Additional Permissions
+
Project Assignment
```

The sidebar should never display modules that the user cannot meaningfully access.

---

# 7. Header

The header contains:

- Product logo
- Current project/workspace context
- Search where available
- Notifications
- User menu
- Responsive menu control

## User menu

Possible items:

```text
Profile
Settings
Logout
```

Administrative users may also receive administrative shortcuts where appropriate.

---

# 8. Project Context

When a user enters a project, the project context becomes active.

Example:

```text
Projects
   ↓
Project A
   ↓
Project Workspace
```

The active project should remain available while navigating project modules.

Example:

```text
Project A
├── Overview
├── Phases
├── Tasks
├── Materials
├── Inventory
├── Workforce
├── Equipment
├── Budget
├── Quality
├── Safety
├── Documents
├── Reports
└── Activity
```

Users only see the modules allowed by their permissions.

---

# 9. Project Switcher

Where a user belongs to multiple projects, the header/project context should provide a project switcher.

```text
Current Project: Project A
        ↓
Project A
Project B
Project C
```

Selecting another project:

```text
Select Project B
     ↓
Update Project Context
     ↓
Load Project B Overview
     ↓
Keep User Role/Permissions
```

A user must never gain access to a project simply because it appears in a client-side selector.

The backend must verify project membership/access.

---

# 10. Page Design Pattern

Most modules follow a predictable pattern.

## 10.1 List Page

```text
Page Title
Description

[Search] [Filters] [Sort] [Primary Action]

Data Table / Cards

Pagination
```

Typical actions:

- View
- Edit
- Archive
- Deactivate
- Delete where authorized
- Export/report action where available

## 10.2 Detail Page

```text
← Back

Title
Status
Primary Action(s)

Summary

Tabs / Sections

Overview
Activity
Documents
History
```

## 10.3 Create/Edit Page

```text
← Back

Page Title

Section 1
Fields

Section 2
Fields

Section 3
Fields

[Cancel] [Save Draft] [Save / Submit]
```

## 10.4 Confirmation

Destructive or high-impact actions require confirmation.

```text
Action
 ↓
Confirmation Dialog
 ↓
Confirm / Cancel
 ↓
Execute
 ↓
Success / Error
```

---

# 11. Standard Page States

Major pages must support:

```text
Loading
Loaded
Empty
Error
Permission Denied
Validation Error
Submitting
Success
```

## Loading

Show useful loading feedback without blocking unrelated UI unnecessarily.

## Empty

Explain what is missing and provide an appropriate next action.

Example:

```text
No Projects Yet

Create your first project to begin.

[Create Project]
```

## Error

Provide:

- Clear message
- Retry where appropriate
- Safe fallback navigation

## Permission Denied

```text
You don't have permission to access this page.
```

Do not expose sensitive information about the protected resource.

---

# 12. ADMIN WEBSITE FLOW

## 12.1 Admin Dashboard

Route:

```text
/dashboard
```

Purpose:

Provide organization-level visibility and administrative controls.

Main areas:

- Project overview
- User overview
- Activity
- Security events
- Login activity
- Important alerts
- Organization-level statistics

Primary navigation:

```text
Dashboard
Projects
Users
Reports
Audit
Login History
Notifications
Settings
```

---

# 13. Admin User Management

## 13.1 User List

```text
Users
 ↓
Search / Filter
 ↓
User List
 ↓
Select User
 ↓
User Detail
```

Actions:

- Create/invite
- View
- Edit
- Activate
- Deactivate
- Assign project
- Manage additional permissions

## 13.2 Create User

```text
Create User
 ↓
Basic Information
 ↓
Primary Role
 ↓
Project Assignment(s)
 ↓
Additional Permissions
 ↓
Review
 ↓
Send Invitation
```

Admin cannot create a new role.

## 13.3 User Detail

Displays:

- Identity
- Account status
- Primary role
- Additional permissions
- Assigned projects
- Recent activity
- Login history where authorized

## 13.4 Remove Access

```text
User Detail
 ↓
Deactivate / Remove Access
 ↓
Confirmation
 ↓
Invalidate Sessions
 ↓
Stop API Access
 ↓
Disconnect WebSocket
 ↓
Remove Project Access
 ↓
Preserve Historical Records
 ↓
Create Audit Record
```

---

# 14. PROJECT MANAGER WEBSITE FLOW

## 14.1 Project Manager Dashboard

Main information:

- Active projects
- Project health
- Progress
- Budget
- Material status
- Workforce
- Equipment
- Open issues
- Quality
- Safety
- Pending approvals

Primary navigation:

```text
Dashboard
Projects
Tasks
Materials
Procurement
Workforce
Equipment
Budget
Quality
Safety
Documents
Reports
Notifications
```

---

# 15. Project List

Route:

```text
/projects
```

Flow:

```text
Projects
 ↓
Search / Filter
 ↓
Project List
 ↓
Select Project
 ↓
Project Overview
```

Project cards/table should show relevant summary information:

- Project name
- Type
- Status
- Health
- Progress
- Dates
- Project Manager

---

# 16. Create Project Flow

```text
Projects
 ↓
Create Project
 ↓
Project Information
 ↓
Project Type
 ↓
Template Selection
 ↓
Project Dates
 ↓
Client
 ↓
Team
 ↓
Phases
 ↓
BOM
 ↓
Budget
 ↓
Review
 ↓
Create
 ↓
Project Overview
```

The form should not force every configuration into one overwhelming screen.

Use logical sections or a step-based flow where appropriate.

---

# 17. Project Overview

Route:

```text
/projects/:projectId/overview
```

Shows:

- Project identity
- Status
- Health
- Progress
- Schedule
- Budget summary
- Material status
- Workforce summary
- Equipment summary
- Quality summary
- Safety summary
- Open issues
- Recent activity

Primary actions depend on permissions.

---

# 18. Phases

Route:

```text
/projects/:projectId/phases
```

Flow:

```text
Phases
 ↓
Phase List
 ↓
Phase Detail
```

Phase detail:

```text
Phase
├── Overview
├── Tasks
├── Milestones
├── Progress
├── Dependencies
├── Materials
├── Workforce
├── Equipment
├── Documents
└── Activity
```

---

# 19. Tasks

Route:

```text
/projects/:projectId/tasks
```

Flow:

```text
Tasks
 ↓
Search / Filter
 ↓
Task
 ↓
Task Detail
 ↓
Update / Assign / Complete
```

Task detail can include:

- Assignment
- Status
- Priority
- Quantity
- Unit
- Planned quantity
- Completed quantity
- Progress
- Dates
- Dependencies
- Materials
- Equipment
- Issues
- Attachments
- Activity

---

# 20. Milestones

Route:

```text
/projects/:projectId/milestones
```

Flow:

```text
Milestones
 ↓
Milestone Detail
 ↓
Update Status
 ↓
Record Actual Date
 ↓
Activity / Notification
```

---

# 21. Quantity-Based Progress Flow

```text
Task
 ↓
Enter Completed Quantity
 ↓
Validate Quantity
 ↓
Calculate Task Progress
 ↓
Update Phase Progress
 ↓
Update Project Progress
 ↓
Recalculate Project Health
 ↓
Update Dashboard
 ↓
Create Activity
 ↓
Notify Relevant Users
```

Example:

```text
Planned: 10,000 sq.ft
Completed: 6,500 sq.ft
Progress: 65%
```

---

# 22. SITE ENGINEER WEBSITE FLOW

Primary navigation:

```text
Dashboard
Projects
Tasks
Materials
Inventory / Material Requests
Workforce
Equipment
Daily Reports
Quality
Safety
Issues
Documents
Notifications
```

The Site Engineer focuses on execution rather than organization-level administration.

---

# 23. Site Engineer Daily Flow

Typical daily journey:

```text
Login
 ↓
Dashboard
 ↓
Current Project
 ↓
Today's Tasks
 ↓
Update Work
 ↓
Record Completed Quantity
 ↓
Record Materials
 ↓
Record Equipment
 ↓
Record Workforce
 ↓
Create Daily Report
 ↓
Record Issues / Quality / Safety
 ↓
Submit
```

---

# 24. Material Request Flow

```text
Site Engineer
 ↓
Material Request
 ↓
Select Project
 ↓
Select Material
 ↓
Enter Quantity
 ↓
Select Required Date
 ↓
Add Reason / Task
 ↓
Submit
 ↓
Project Manager Review
```

After approval:

```text
Approved
 ↓
Store Manager
 ↓
Issue Material
 ↓
Inventory Updated
 ↓
Site Engineer Notified
```

Rejected:

```text
Rejected
 ↓
Reason
 ↓
Site Engineer Notified
 ↓
Request History Updated
```

---

# 25. Daily Site Report Flow

```text
Daily Reports
 ↓
Create Report
 ↓
Work Performed
 ↓
Completed Quantities
 ↓
Materials Used
 ↓
Equipment Used
 ↓
Workforce
 ↓
Issues
 ↓
Quality
 ↓
Safety
 ↓
Photos
 ↓
Submit
 ↓
Project Manager Review
```

---

# 26. STORE MANAGER WEBSITE FLOW

Primary navigation:

```text
Dashboard
Inventory
Materials
Material Requests
Procurement
Purchase Orders
Vendors
Receiving
Transfers
Reports
Documents
Notifications
```

---

# 27. Inventory Flow

```text
Inventory
 ↓
Select Location
 ↓
Search Material
 ↓
Material Detail
 ↓
Stock / Transactions
```

Material detail shows:

- Current stock
- Minimum threshold
- Reserved quantity
- Available quantity
- Recent receipts
- Issues
- Returns
- Adjustments
- Transfers
- Consumption

---

# 28. Material Receiving Flow

```text
Purchase Order
 ↓
Receive Material
 ↓
Verify Material
 ↓
Enter Received Quantity
 ↓
Record Receipt
 ↓
Increase Inventory
 ↓
Create Inventory Transaction
 ↓
Audit
 ↓
Notification
```

---

# 29. Material Issue Flow

```text
Approved Material Request
 ↓
Store Manager
 ↓
Check Available Stock
 ↓
Select Quantity
 ↓
Confirm Issue
 ↓
Decrease Inventory
 ↓
Create Inventory Transaction
 ↓
Update Request
 ↓
Audit
 ↓
Notification
```

If stock is insufficient:

```text
Issue Attempt
 ↓
Insufficient Stock
 ↓
Block Issue
 ↓
Show Required / Available Quantity
```

Negative inventory is not permitted.

---

# 30. Procurement Flow

```text
Material Requirement
 ↓
Check Inventory
 ↓
Insufficient Stock
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
Expected Delivery
 ↓
Receiving
 ↓
Inventory
```

---

# 31. Vendor Flow

```text
Vendors
 ↓
Vendor List
 ↓
Vendor Detail
```

Vendor detail can include:

- Contact
- Status
- Materials supplied
- Purchase orders
- Delivery history
- Performance information
- Documents
- Activity

---

# 32. CONTRACTOR WEBSITE FLOW

Primary navigation:

```text
Dashboard
My Projects
My Tasks
Progress
Issues
Materials
Equipment
Documents
Notifications
```

The Contractor sees assigned work and authorized project information.

## Contractor task flow

```text
My Tasks
 ↓
Task
 ↓
Task Detail
 ↓
Update Progress
 ↓
Record Completed Quantity
 ↓
Attach Evidence where allowed
 ↓
Submit
 ↓
Activity
```

Contractors cannot access unrelated administrative or financial information unless explicitly permitted.

---

# 33. WORKFORCE FLOW

Routes:

```text
/workforce
/workforce/:workerId
/projects/:projectId/workforce
```

Flow:

```text
Workforce
 ↓
Worker List
 ↓
Worker Detail
 ↓
Project Assignment
 ↓
Attendance
 ↓
Working Hours
 ↓
Reports
```

Attendance:

```text
Select Project
 ↓
Select Date
 ↓
Workers
 ↓
Present / Absent / Other Status
 ↓
Check-in / Check-out where used
 ↓
Save
 ↓
Calculate Hours
```

---

# 34. EQUIPMENT FLOW

Routes:

```text
/equipment
/equipment/:equipmentId
/projects/:projectId/equipment
```

Assignment:

```text
Equipment
 ↓
Select Equipment
 ↓
Assign
 ↓
Select Project
 ↓
Select Dates
 ↓
Check Availability
 ↓
Check Maintenance Status
 ↓
Check Conflict
 ↓
Confirm
 ↓
Assignment Created
```

Conflicting assignments must be blocked.

---

# 35. EQUIPMENT MAINTENANCE FLOW

```text
Equipment
 ↓
Maintenance
 ↓
Schedule / Record Maintenance
 ↓
Set Status
 ↓
Upload Documents if required
 ↓
Save
 ↓
Notification / Alert
```

Breakdown:

```text
Equipment Breakdown
 ↓
Record Breakdown
 ↓
Equipment Status = Breakdown
 ↓
Affected Assignment Detected
 ↓
Notify Relevant Users
 ↓
Maintenance
 ↓
Repair Complete
 ↓
Inspection
 ↓
Available
```

---

# 36. BUDGET FLOW

Route:

```text
/projects/:projectId/budget
```

Budget overview:

- Original budget
- Current budget
- Actual cost
- Committed cost
- Remaining budget
- Variance
- Category breakdown

Flow:

```text
Budget
 ↓
Category
 ↓
Planned Cost
 ↓
Actual Cost
 ↓
Variance
```

---

# 37. BUDGET CHANGE FLOW

```text
Budget Change Request
 ↓
Enter Reason
 ↓
Enter Amount
 ↓
Supporting Information
 ↓
Submit
 ↓
Review
 ↓
Approve / Reject
```

If approved:

```text
Approved
 ↓
Budget Updated
 ↓
Audit
 ↓
Notification
```

---

# 38. QUALITY FLOW

Routes:

```text
/projects/:projectId/quality
```

Inspection:

```text
Quality
 ↓
Create Inspection
 ↓
Select Checklist
 ↓
Record Results
 ↓
PASS / FAIL
```

Pass:

```text
PASS
 ↓
Complete Inspection
 ↓
Record Result
```

Fail:

```text
FAIL
 ↓
Create Defect
 ↓
Assign Corrective Action
 ↓
Action Completed
 ↓
Reinspection
 ↓
Approve / Close
```

---

# 39. SAFETY FLOW

Routes:

```text
/projects/:projectId/safety
```

Incident:

```text
Safety
 ↓
Report Incident / Near Miss
 ↓
Record Details
 ↓
Severity
 ↓
People / Area / Project
 ↓
Evidence
 ↓
Submit
 ↓
Review
 ↓
Corrective Action
 ↓
Close
```

Hazard:

```text
Hazard Identified
 ↓
Record Hazard
 ↓
Risk / Severity
 ↓
Assign Corrective Action
 ↓
Mitigation
 ↓
Verification
 ↓
Close
```

---

# 40. ISSUE FLOW

Issues may be created from:

- Project
- Phase
- Task
- Material
- Equipment
- Quality
- Safety

Flow:

```text
Create Issue
 ↓
Category
 ↓
Priority
 ↓
Description
 ↓
Assign User
 ↓
Due Date
 ↓
Track Status
 ↓
Update
 ↓
Resolve
 ↓
Close
```

---

# 41. DOCUMENT FLOW

```text
Documents
 ↓
Select Project
 ↓
Upload Document
 ↓
Validate File
 ↓
Enter Metadata
 ↓
Save
 ↓
Document Available to Authorized Users
```

Version flow:

```text
Existing Document
 ↓
Upload New Version
 ↓
Version Created
 ↓
Previous Version Preserved
 ↓
Activity Recorded
```

Access:

```text
Request Document
 ↓
Authorization Check
 ↓
Allow / Deny
```

---

# 42. CLIENT PORTAL FLOW

The Client Portal is intentionally simpler than the internal application.

```text
Client Login
 ↓
Client Dashboard
 ↓
Projects
 ↓
Project Overview
 ↓
Approved Information
```

Navigation:

```text
Dashboard
Projects
Notifications
Profile
```

Within a project:

```text
Overview
Progress
Milestones
Reports
Documents
Photos
Queries
```

---

# 43. CLIENT PROJECT OVERVIEW

The client sees only approved information.

Possible information:

- Project name
- Status
- Health
- Overall progress
- Milestones
- Approved photographs
- Approved reports
- Approved documents
- Approved updates

Internal operational information remains hidden unless explicitly made client-visible.

---

# 44. CLIENT QUERY FLOW

```text
Client
 ↓
Project
 ↓
Queries
 ↓
New Query
 ↓
Subject
 ↓
Message
 ↓
Attachment where allowed
 ↓
Submit
 ↓
Project Team Notification
 ↓
Response
 ↓
Client Notification
 ↓
Query Closed
```

---

# 45. NOTIFICATION FLOW

Notifications may originate from:

```text
Business Event
 ↓
Notification Service
 ↓
Determine Recipients
 ↓
Permission Check
 ↓
Create Notification
 ↓
Database
 ↓
WebSocket Event
 ↓
Recipient UI
```

Examples:

```text
Material Request Approved
Budget Change Approved
Low Stock
Equipment Maintenance Due
Safety Incident
Client Query
Project Progress Update
```

---

# 46. SEARCH FLOW

Global or module search:

```text
Search
 ↓
Enter Query
 ↓
Apply Permission Scope
 ↓
Search Authorized Records
 ↓
Display Results
 ↓
Select Result
 ↓
Navigate to Detail
```

Search must never return records the user cannot access.

---

# 47. REPORT FLOW

```text
Reports
 ↓
Select Report Type
 ↓
Select Project / Date / Filters
 ↓
Generate
 ↓
Display
 ↓
Export where supported
```

Reports are generated from authorized data only.

---

# 48. AUDIT FLOW

Admin:

```text
Audit
 ↓
Filter
 ↓
Search
 ↓
Select Event
 ↓
View Details
```

Audit details may include:

- Actor
- Action
- Target
- Timestamp
- Project
- Result
- Relevant metadata

Audit records are preserved according to the product's record-retention rules.

---

# 49. USER ACCESS REMOVAL FLOW

When Admin removes a user's access:

```text
Admin
 ↓
User Detail
 ↓
Deactivate / Remove Access
 ↓
Confirmation
 ↓
Invalidate Existing Sessions
 ↓
Stop API Access
 ↓
Disconnect WebSocket
 ↓
Remove Project Access
 ↓
Preserve Historical Records
 ↓
Create Audit Record
 ↓
Notify where appropriate
```

The user's historical actions remain associated with the historical actor identity.

---

# 50. RECORD LIFECYCLE

Records may use different lifecycle actions depending on the module.

Supported administrative concepts:

```text
Active
Archive
Deactivate
Cancel
Mark as Deleted
Permanent Delete
```

Permanent deletion:

```text
Delete
 ↓
Authorization Check
 ↓
Explicit Confirmation
 ↓
Apply Retention / Dependency Rules
 ↓
Delete
 ↓
Audit
```

Not every entity should automatically support permanent deletion.

Entity-specific rules must be defined in the relevant module.

---

# 51. Permission-Based Navigation

Navigation is derived from effective permissions.

Example:

```text
Admin
 ├── Users
 ├── Projects
 ├── Audit
 └── Security

Project Manager
 ├── Projects
 ├── Tasks
 ├── Materials
 ├── Workforce
 ├── Equipment
 ├── Budget
 ├── Quality
 └── Safety

Site Engineer
 ├── Projects
 ├── Tasks
 ├── Materials
 ├── Workforce
 ├── Equipment
 ├── Daily Reports
 ├── Quality
 └── Safety

Store Manager
 ├── Inventory
 ├── Materials
 ├── Procurement
 ├── Vendors
 └── Requests

Contractor
 ├── My Projects
 ├── My Tasks
 ├── Progress
 ├── Issues
 └── Documents

Client
 ├── Projects
 ├── Progress
 ├── Milestones
 ├── Reports
 ├── Documents
 └── Queries
```

These are baseline navigation groups. Exact links are permission-aware.

---

# 52. Cross-Module Navigation

Important relationships should provide contextual navigation.

Examples:

```text
Task
 ↓
Related Materials
 ↓
Material Detail
```

```text
Task
 ↓
Related Equipment
 ↓
Equipment Detail
```

```text
Material Request
 ↓
Approval
 ↓
Inventory Issue
```

```text
Project
 ↓
Budget
 ↓
Expense
```

```text
Quality Defect
 ↓
Corrective Action
 ↓
Task / Issue
```

Users should be able to move between related records without losing the active project context.

---

# 53. Breadcrumbs

Project pages should use breadcrumbs where useful.

Example:

```text
Projects
 / Project Alpha
 / Materials
 / Material Request
```

Breadcrumbs should reflect the actual navigation context.

---

# 54. Back Navigation

Users should have predictable back behavior.

For example:

```text
Projects
 ↓
Project Alpha
 ↓
Tasks
 ↓
Task 102
```

Back:

```text
Task 102
 ↓
Tasks
```

Do not force users back to the global dashboard after every action.

---

# 55. Unsaved Changes

Forms with meaningful unsaved changes should warn users before leaving.

```text
Edit Project
 ↓
Changes Made
 ↓
Navigate Away
 ↓
Unsaved Changes Dialog
 ├── Stay
 ├── Discard
 └── Cancel
```

---

# 56. Form Submission

Standard flow:

```text
Fill Form
 ↓
Client Validation
 ↓
Submit
 ↓
Disable Duplicate Submission
 ↓
Backend Validation
 ↓
Business Rule Validation
 ↓
Save
 ↓
Success
 ↓
Update UI
 ↓
Notification / Activity where applicable
```

Errors should identify the field or business condition that needs correction.

---

# 57. Destructive Actions

Examples:

- Deactivate user
- Delete record
- Archive project
- Cancel purchase order
- Remove assignment

Flow:

```text
Action
 ↓
Confirmation
 ↓
Explain Consequence
 ↓
Confirm
 ↓
Execute
 ↓
Success
```

The confirmation must not be decorative. The backend must enforce the operation and authorization.

---

# 58. Responsive Website Flow

## Desktop

```text
Header
Sidebar
Main Content
```

## Tablet

```text
Header
Collapsible Sidebar
Main Content
```

## Mobile

```text
Header
Main Content
Contextual Navigation / Menu
```

Mobile behavior must be designed intentionally.

Large tables may use:

- Horizontal scrolling
- Compact rows
- Card representation
- Prioritized columns

Forms should generally collapse to a single-column layout.

---

# 59. Real-Time UI Flow

Example:

```text
Project Manager approves material request
            ↓
Backend updates database
            ↓
Audit event
            ↓
Notification created
            ↓
WebSocket event
            ↓
Site Engineer receives update
            ↓
UI updates
```

If a WebSocket connection is unavailable, the database/API remains the source of truth.

The UI must not assume that a real-time event was received successfully.

---

# 60. Global Error / Session Flow

If the session expires:

```text
Protected Page
 ↓
API returns authentication failure
 ↓
Clear invalid session
 ↓
Disconnect WebSocket
 ↓
Redirect to Login
 ↓
Show session-expired message
```

If authorization fails:

```text
API returns 403
 ↓
Show Permission Denied
 ↓
Do not expose protected data
```

If the resource does not exist:

```text
API returns 404
 ↓
Show Not Found
 ↓
Provide safe navigation option
```

---

# 61. Recommended Page Inventory

## Authentication

- Login
- Forgot Password
- Reset Password
- Activate Account

## Admin

- Admin Dashboard
- Users
- Create User
- User Detail
- Edit User
- Projects
- Audit
- Login History
- Reports
- Settings

## Project Management

- Project List
- Create Project
- Project Overview
- Project Edit
- Phases
- Phase Detail
- Tasks
- Task Detail
- Milestones
- Project Activity

## Materials

- Material Catalog
- Material Detail
- BOM
- Material Requests
- Material Request Detail
- Inventory
- Inventory Detail
- Receiving
- Material Issue
- Material Return
- Transfers
- Procurement Requests
- Purchase Orders
- Purchase Order Detail
- Vendors
- Vendor Detail

## Workforce

- Workforce List
- Worker Detail
- Project Workforce
- Attendance
- Workforce Reports

## Equipment

- Equipment List
- Equipment Detail
- Project Equipment
- Equipment Assignment
- Maintenance
- Inspections
- Equipment Reports

## Financial

- Budget Overview
- Budget Categories
- Expenses
- Expense Detail
- Budget Change Requests
- Cost Reports

## Operations

- Daily Reports
- Daily Report Detail
- Issues
- Issue Detail

## Quality

- Quality Dashboard
- Inspections
- Inspection Detail
- Defects
- Defect Detail
- Corrective Actions

## Safety

- Safety Dashboard
- Hazards
- Hazard Detail
- Incidents
- Incident Detail
- Corrective Actions
- Safety Reports

## Documents

- Project Documents
- Document Detail
- Upload Document
- Version History

## Reports

- Reports Dashboard
- Project Reports
- Progress Reports
- Material Reports
- Workforce Reports
- Equipment Reports
- Budget Reports
- Quality Reports
- Safety Reports

## Shared

- Notifications
- Profile
- Settings

## Client

- Client Dashboard
- Client Projects
- Client Project Overview
- Progress
- Milestones
- Reports
- Documents
- Photos
- Queries
- Notifications
- Profile

---

# 62. Core End-to-End User Journeys

## Journey 1 — Admin Onboards User

```text
Admin Login
 ↓
Dashboard
 ↓
Users
 ↓
Create User
 ↓
Primary Role
 ↓
Project Assignment
 ↓
Additional Permissions
 ↓
Invite
 ↓
User Activates
 ↓
User Login
```

## Journey 2 — Project Manager Creates Project

```text
Login
 ↓
Projects
 ↓
Create Project
 ↓
Project Type
 ↓
Template
 ↓
Project Details
 ↓
Phases
 ↓
BOM
 ↓
Budget
 ↓
Team
 ↓
Create
 ↓
Project Dashboard
```

## Journey 3 — Site Engineer Records Progress

```text
Login
 ↓
Dashboard
 ↓
Project
 ↓
Tasks
 ↓
Task Detail
 ↓
Completed Quantity
 ↓
Submit
 ↓
Progress Recalculated
 ↓
Project Dashboard Updated
 ↓
Activity / Notification
```

## Journey 4 — Site Engineer Requests Material

```text
Project
 ↓
Material Requests
 ↓
Create Request
 ↓
Material + Quantity
 ↓
Reason / Task
 ↓
Submit
 ↓
Project Manager
 ↓
Approve
 ↓
Store Manager
 ↓
Issue
 ↓
Inventory Updated
 ↓
Site Engineer Notified
```

## Journey 5 — Store Manager Receives Material

```text
Purchase Order
 ↓
Receiving
 ↓
Verify
 ↓
Receive
 ↓
Inventory Increased
 ↓
Transaction Created
 ↓
Audit
```

## Journey 6 — Equipment Assignment

```text
Equipment
 ↓
Select Equipment
 ↓
Project
 ↓
Dates
 ↓
Availability Check
 ↓
Maintenance Check
 ↓
Conflict Check
 ↓
Confirm Assignment
```

## Journey 7 — Quality Failure

```text
Inspection
 ↓
Checklist
 ↓
FAIL
 ↓
Defect
 ↓
Corrective Action
 ↓
Completion
 ↓
Reinspection
 ↓
PASS
 ↓
Close
```

## Journey 8 — Safety Incident

```text
Site Engineer
 ↓
Safety
 ↓
Report Incident
 ↓
Severity
 ↓
Evidence
 ↓
Submit
 ↓
Review
 ↓
Corrective Action
 ↓
Verification
 ↓
Close
```

## Journey 9 — Client Reviews Progress

```text
Client Login
 ↓
Dashboard
 ↓
Project
 ↓
Progress
 ↓
Milestones
 ↓
Approved Reports
 ↓
Documents
```

## Journey 10 — Admin Removes User Access

```text
Admin
 ↓
Users
 ↓
User Detail
 ↓
Deactivate
 ↓
Confirm
 ↓
Sessions Invalidated
 ↓
API Access Stopped
 ↓
WebSocket Disconnected
 ↓
Project Access Removed
 ↓
Historical Records Preserved
 ↓
Audit Created
```

---

# 63. Navigation Principles

1. Users should always know where they are.
2. Users should not lose project context unnecessarily.
3. Primary actions should be visually clear.
4. Destructive actions should be clearly distinguished.
5. Permission-restricted features should not appear as usable actions.
6. Backend authorization remains mandatory.
7. Related records should be easy to navigate between.
8. Search and filtering should be available on large datasets.
9. Empty states should guide the next action.
10. Error states should explain recovery.
11. Mobile navigation should remain usable.
12. Navigation should remain consistent across modules.

---

# 64. Website Flow Completion Criteria

The website flow is considered defined when:

- Authentication routes are defined.
- Role dashboards are defined.
- Navigation for all six roles is defined.
- Project context behavior is defined.
- Core project routes are defined.
- Module routes are defined.
- Create/edit/detail/list patterns are defined.
- Core workflows are defined.
- Permission behavior is defined.
- Destructive action behavior is defined.
- Standard UI states are defined.
- Responsive navigation is defined.
- Client portal flow is defined.
- Real-time interaction flow is defined.
- Cross-module navigation is defined.

---

# 65. Relationship With Other Documents

```text
PRD.md
  ↓
Defines WHAT the product does
  ↓
WEBSITE-FLOW.md
  ↓
Defines HOW users navigate and perform those functions
  ↓
UI-UX.md
  ↓
Defines HOW the interface looks and behaves visually
  ↓
TRD.md
  ↓
Defines technical implementation requirements
  ↓
ARCHITECTURE.md
  ↓
Defines internal system structure
  ↓
API-SPECIFICATION.md
  ↓
Defines frontend/backend contracts
  ↓
DATABASE-DESIGN.md
  ↓
Defines data storage
```

---

# 66. Status

**Version:** 1.0  
**Status:** V1 Website Flow Baseline

This document should be refined alongside UI/UX and architecture work.

Changes that affect product functionality should be reviewed against `PRD.md`.

Changes that affect implementation should be reflected in `TRD.md` or `ARCHITECTURE.md` as appropriate.
