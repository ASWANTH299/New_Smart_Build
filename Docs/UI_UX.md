# Smart Build --- UI/UX Specification

**Document:** `UI-UX.md`\
**Version:** 1.0\
**Status:** V1 UI/UX Baseline\
**Authority:** Visual and interaction source of truth\
**Related:** `PRD.md`, `TRD.md`, `WEBSITE-FLOW.md`, `ARCHITECTURE.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the visual language, interaction principles,
information hierarchy, responsive behavior, component patterns, and
usability standards for Smart Build.

The product must feel like a practical professional
construction-management application designed for real users.

It must not look like a generic AI-generated dashboard.

------------------------------------------------------------------------

## 2. Core UX Principles

1.  **Clarity over decoration**
2.  **Operational information first**
3.  **Consistent navigation**
4.  **Minimal cognitive load**
5.  **Fast access to frequent actions**
6.  **Clear status and exceptions**
7.  **Permission-aware experiences**
8.  **Predictable forms and workflows**
9.  **Responsive by design**
10. **Subtle, purposeful motion**
11. **Realistic construction data**
12. **Accessible interaction states**

------------------------------------------------------------------------

## 3. Product Experiences

The application has two distinct experiences.

### Internal Workspace

For:

-   Admin
-   Project Manager
-   Site Engineer
-   Store Manager
-   Contractor

### Client Portal

For:

-   Client

The Client Portal is simplified and exposes only approved client-visible
information.

------------------------------------------------------------------------

## 4. Visual Direction

The interface should communicate:

-   Professional
-   Reliable
-   Operational
-   Structured
-   Trustworthy
-   Construction-oriented
-   Information-dense without being cluttered

Avoid:

-   Excessive gradients
-   Glowing effects
-   Heavy glassmorphism
-   Decorative animations
-   Oversized hero typography
-   Excessive rounded-card layouts
-   Generic "AI dashboard" visual patterns
-   Decorative charts with no operational purpose

------------------------------------------------------------------------

## 5. Application Shell

Internal users use a common shell:

``` text
┌──────────────────────────────────────────────────────────────┐
│ Logo | Project Context | Search | Notifications | User Menu │
├──────────────────┬───────────────────────────────────────────┤
│ Dashboard        │                                           │
│ Projects         │                                           │
│ Module Links     │             MAIN CONTENT                  │
│                  │                                           │
│                  │                                           │
│ Settings         │                                           │
└──────────────────┴───────────────────────────────────────────┘
```

Sidebar visibility is derived from:

``` text
Primary Role
+
Additional Permissions
+
Project Assignment
```

A user should not see navigation for modules they cannot meaningfully
use.

------------------------------------------------------------------------

## 6. Header

The header contains:

-   Product logo
-   Current project/workspace
-   Search where useful
-   Notifications
-   User menu
-   Responsive navigation control

User menu:

``` text
Profile
Settings
Logout
```

Administrative shortcuts may appear where appropriate.

------------------------------------------------------------------------

## 7. Project Context

The active project should remain visible while navigating project
modules.

Example:

``` text
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

The project switcher should be easy to understand for users assigned to
multiple projects.

Important rule:

**A project appearing in the switcher never grants access.**

The backend must validate project membership.

------------------------------------------------------------------------

## 8. Information Hierarchy

Pages should generally follow:

``` text
Page identity
 ↓
Context
 ↓
Primary status / summary
 ↓
Important actions
 ↓
Operational details
 ↓
History / supporting information
```

Avoid hiding critical operational information behind excessive
navigation.

------------------------------------------------------------------------

## 9. Standard List Page

Pattern:

``` text
Page Title
Description

[Search] [Filters] [Sort] [Primary Action]

Data Table / Cards

Pagination
```

Typical row actions:

-   View
-   Edit
-   Archive
-   Deactivate
-   Delete where authorized
-   Export/report where available

Tables are preferred for operational records where users need to compare
multiple fields.

Cards are useful for:

-   Summary dashboards
-   Mobile layouts
-   Compact entity previews

------------------------------------------------------------------------

## 10. Standard Detail Page

Pattern:

``` text
← Back

Title
Status
Primary Actions

Summary

Tabs / Sections
├── Overview
├── Activity
├── Documents
└── History
```

High-impact actions should remain visually clear without dominating the
page.

------------------------------------------------------------------------

## 11. Standard Create/Edit Page

Pattern:

``` text
← Back

Page Title

Section
Fields

Section
Fields

Section
Fields

[Cancel] [Save Draft] [Save / Submit]
```

Forms should:

-   Group related fields
-   Use clear labels
-   Show required fields
-   Explain constraints
-   Preserve user input after validation errors
-   Avoid unnecessary fields
-   Clearly distinguish draft vs submission
-   Prevent accidental duplicate submissions

------------------------------------------------------------------------

## 12. Confirmation Patterns

Use confirmation dialogs for destructive or high-impact actions:

``` text
Action
 ↓
Confirmation
 ↓
Confirm / Cancel
 ↓
Execute
 ↓
Success / Error
```

Examples:

-   Deactivate user
-   Remove project access
-   Archive project
-   Reject important approval
-   Inventory adjustment
-   Delete where deletion is permitted

Confirmation text should explain the consequence.

------------------------------------------------------------------------

## 13. Standard Page States

Every major page must support:

``` text
Loading
Loaded
Empty
Error
Permission Denied
Validation Error
Submitting
Success
```

### Loading

Use useful loading feedback without blocking unrelated UI unnecessarily.

### Empty

Explain the absence of data and provide the next useful action.

### Error

Provide:

-   Clear explanation
-   Retry where appropriate
-   Safe navigation

### Permission denied

Use a clear non-sensitive message.

Do not reveal protected resource details.

### Success

Confirm completion and provide a useful next action where appropriate.

------------------------------------------------------------------------

## 14. Dashboard UX

Dashboards are role-specific and should prioritize decisions rather than
displaying every metric.

### Admin

Prioritize:

-   Organization overview
-   Projects
-   Users
-   Security events
-   Activity
-   Important alerts

### Project Manager

Prioritize:

-   Project progress
-   Budget
-   Materials
-   Workforce
-   Equipment
-   Quality
-   Safety
-   Delays
-   Approvals

### Site Engineer

Prioritize:

-   Tasks
-   Progress
-   Materials
-   Daily reports
-   Issues

### Store Manager

Prioritize:

-   Inventory
-   Low stock
-   Material requests
-   Purchases
-   Material movements

### Contractor

Prioritize:

-   Assigned work
-   Progress
-   Schedule
-   Issues

### Client

Prioritize:

-   Approved progress
-   Milestones
-   Reports
-   Documents
-   Project health

------------------------------------------------------------------------

## 15. Project Overview UX

The project overview should answer quickly:

1.  What is the project status?
2.  Is it healthy, at risk, or critical?
3.  How much work is complete?
4.  What needs attention?
5.  What upcoming milestones matter?
6.  What approvals/actions are pending?

Possible information groups:

``` text
Project Header
Progress
Health
Schedule
Budget
Materials
Workforce
Equipment
Quality
Safety
Issues
Upcoming Milestones
Recent Activity
```

Do not make every group visually equal. Use hierarchy.

------------------------------------------------------------------------

## 16. Progress UX

Quantity-based progress should be understandable.

Example:

``` text
Concrete Work
Planned:    10,000 sq.ft
Completed:   6,500 sq.ft
Progress:       65%
```

The UI should distinguish:

-   Planned quantity
-   Completed quantity
-   Remaining quantity
-   Unit
-   Progress
-   Last updated

Avoid presenting manually entered percentages when a calculated
quantity-based percentage is available.

------------------------------------------------------------------------

## 17. Materials and Inventory UX

Material workflows should make lifecycle state obvious:

``` text
Requested
 → Approved
 → Issued
 → Consumed / Returned
```

Inventory views should prioritize:

-   Current stock
-   Minimum/reorder threshold
-   Pending requests
-   Recent movements
-   Low-stock alerts

Material transaction history should be understandable without requiring
users to know database terminology.

Never expose a UI path that permits negative inventory.

------------------------------------------------------------------------

## 18. Procurement UX

Procurement should visually communicate:

``` text
Request
 → Review
 → Approval
 → Purchase Order
 → Vendor
 → Receiving
 → Inventory
```

Purchase-order pages should emphasize:

-   Vendor
-   Project
-   Items
-   Quantities
-   Unit prices
-   Total
-   Expected delivery
-   Approval state
-   Status

------------------------------------------------------------------------

## 19. Workforce UX

Workforce pages should support:

-   Worker identity
-   Trade/type
-   Assignment
-   Attendance
-   Hours
-   Overtime
-   Productivity indicators

Do not present the module as a payroll system.

------------------------------------------------------------------------

## 20. Equipment UX

Equipment pages should emphasize availability and operational state.

Example status grouping:

``` text
Available
Assigned
In Use
Under Maintenance
Breakdown
Inactive
Retired
```

Assignment UI must surface schedule conflicts and maintenance
restrictions before confirmation.

------------------------------------------------------------------------

## 21. Budget UX

Budget pages should communicate:

``` text
Planned
Actual
Variance
```

Useful breakdowns:

-   Material
-   Workforce
-   Equipment
-   Other

Budget change requests should clearly show:

``` text
Current Budget
Requested Change
Proposed Budget
Reason
Approval Status
```

Financial information must not be presented as a full accounting system.

------------------------------------------------------------------------

## 22. Quality UX

Quality workflow:

``` text
Inspection
 ↓
Checklist
 ├─ PASS → Complete
 └─ FAIL → Defect
              ↓
        Corrective Action
              ↓
         Reinspection
              ↓
           Approval
```

The UI should clearly distinguish:

-   Inspection status
-   Result
-   Defects
-   Corrective actions
-   Reinspection status

------------------------------------------------------------------------

## 23. Safety UX

Safety records should emphasize:

-   Incident/hazard type
-   Severity
-   Date
-   Description
-   Assigned corrective action
-   Status
-   Closure

Critical or high-severity records should be visually prominent without
relying only on color.

------------------------------------------------------------------------

## 24. Documents UX

Document pages should provide:

-   Name
-   Category
-   Current version
-   Visibility
-   Uploaded by
-   Updated date
-   Version history

Document actions must respect project and client visibility permissions.

File upload UI should clearly communicate:

-   Allowed file types
-   Maximum size
-   Upload status
-   Failure reason
-   Version behavior

------------------------------------------------------------------------

## 25. Client Portal UX

The client experience is intentionally simplified.

Flow:

``` text
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

The client should not see:

-   Internal operational data
-   Internal notes
-   Unauthorized financial information
-   Internal-only documents
-   Internal activity
-   Internal permission controls

Client-visible information must be explicitly approved/authorized.

------------------------------------------------------------------------

## 26. Notifications UX

Notifications should be useful, not noisy.

Examples:

-   Material request approved
-   Material stock updated
-   Budget change approved
-   Progress updated
-   Client query received
-   Approval pending

Notification UI should support:

-   Read/unread state
-   Relevant project
-   Clear action
-   Timestamp
-   Navigation to the affected record where authorized

------------------------------------------------------------------------

## 27. Search, Filters and Pagination

Operational lists should provide appropriate:

-   Search
-   Filters
-   Sorting
-   Pagination

Filters should be domain-specific.

Examples:

Projects:

``` text
Status
Health
Project Type
Manager
Date
```

Inventory:

``` text
Location
Material
Stock Status
Movement Type
```

Issues:

``` text
Status
Priority
Category
Assignee
Due Date
```

Do not create generic filter panels containing every possible field.

------------------------------------------------------------------------

## 28. Responsive Design

### Desktop

Use:

-   Persistent sidebar
-   Full tables where useful
-   Multi-column layouts
-   Rich dashboard summaries

### Tablet

Use:

-   Collapsible sidebar
-   Reduced table density
-   Responsive form layouts
-   Condensed summary sections

### Mobile browser

Use:

-   Drawer navigation
-   Stacked content
-   Card/list transformations
-   Horizontal scrolling only when necessary
-   Large enough touch targets
-   Simplified forms
-   Prioritized actions

V1 does not require a separate mobile application.

------------------------------------------------------------------------

## 29. Accessibility

The UI should provide:

-   Keyboard-accessible controls
-   Visible focus states
-   Semantic headings
-   Form labels
-   Accessible button names
-   Error messages associated with fields
-   Sufficient text/background contrast
-   Non-color-only status communication
-   Reasonable touch target sizes

Accessibility is part of QA acceptance.

------------------------------------------------------------------------

## 30. Motion and Transitions

Use subtle transitions for:

-   Navigation
-   Modal entry/exit
-   Dropdowns
-   Status changes
-   Toasts
-   Expand/collapse

Avoid:

-   Long animations
-   Constant motion
-   Decorative page transitions
-   Motion that delays operational tasks

Respect reduced-motion preferences where practical.

------------------------------------------------------------------------

## 31. Status Design

Statuses should communicate meaning through multiple cues:

``` text
Label + icon/shape + visual treatment
```

Do not depend solely on color.

Primary project health:

``` text
Healthy
At Risk
Critical
```

Workflow status should use consistent terminology across modules.

------------------------------------------------------------------------

## 32. Forms and Validation UX

Validation should occur:

-   During interaction where helpful
-   On submit
-   Always on the backend

Messages should be:

-   Specific
-   Actionable
-   Near the relevant field when possible

Example:

``` text
Completed quantity cannot exceed planned quantity.
```

Avoid generic messages such as:

``` text
Invalid input.
```

------------------------------------------------------------------------

## 33. Tables

Operational tables should:

-   Have clear column labels
-   Keep high-value fields visible
-   Support sorting where useful
-   Support row actions
-   Avoid excessive columns
-   Preserve readable density
-   Adapt to smaller screens

For complex records, move secondary information into detail pages rather
than overcrowding the table.

------------------------------------------------------------------------

## 34. Feedback

Use appropriate feedback:

-   Inline validation
-   Toasts for lightweight completed actions
-   Confirmation dialogs for high-impact actions
-   Progress indicators for uploads/submissions
-   Empty-state actions
-   Retry controls for recoverable errors

Do not use a toast as the only explanation for a serious workflow
failure.

------------------------------------------------------------------------

## 35. Content Guidelines

Use:

-   Clear labels
-   Construction-domain terminology
-   Short action-oriented buttons
-   Consistent capitalization
-   Realistic sample data

Avoid:

-   Generic filler text
-   Artificial "AI-style" copy
-   Unnecessary jargon
-   Ambiguous buttons such as "Do It"
-   Decorative statistics with no business meaning

------------------------------------------------------------------------

## 36. UI Component Baseline

Expected shared components include:

``` text
AppShell
Sidebar
Header
ProjectSwitcher
Breadcrumbs
PageHeader
StatusBadge
Button
Input
Select
Textarea
DatePicker
Modal
ConfirmationDialog
DataTable
Pagination
FilterBar
EmptyState
LoadingState
ErrorState
PermissionDenied
Tabs
Card
Metric
ProgressIndicator
Toast
NotificationPanel
FileUploader
Timeline
ActivityFeed
```

Components should be reusable where patterns genuinely repeat.

Do not build a huge design system before real product screens expose the
required patterns.

------------------------------------------------------------------------

## 37. UI/UX Acceptance Rules

A feature is not UI-complete unless it supports:

-   Correct permission visibility
-   Responsive behavior
-   Loading state
-   Empty state where applicable
-   Error state
-   Validation state
-   Success feedback
-   Appropriate confirmation for high-impact actions
-   Accessible controls
-   Consistent navigation
-   Correct project context

------------------------------------------------------------------------

## 38. Documentation Boundary

Changes to visual behavior belong here.

Changes to:

-   Product capability → `PRD.md`
-   Technical implementation → `TRD.md` / `ARCHITECTURE.md`
-   Navigation/route/workflow → `WEBSITE-FLOW.md`
-   Data structure → `DATABASE-DESIGN.md`
-   QA strategy/acceptance → `TESTING-QA.md`

------------------------------------------------------------------------

## 39. V1 Visual Non-Goals

Do not add:

-   Excessive animations
-   AI chat interfaces
-   AI-generated dashboards
-   Glassmorphism-heavy layouts
-   Decorative 3D construction scenes
-   Unnecessary visual effects
-   Separate mobile app UI
-   Complex design-system infrastructure without need