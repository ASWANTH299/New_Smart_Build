# PROJECT-CONTEXT.md

## 1. Project Context

This document is the portable high-level context for the project.

It exists so the project can be continued in another ChatGPT account or a new conversation without depending on the complete old chat history.

The detailed project specifications are maintained in:

```text
docs/
├── PRD.md
├── TRD.md
└── WEBSITE-FLOW.md
```

These documents should be treated as the main project source of truth.

---

## 2. Project Status

The project has already passed the initial planning stage.

The following have been discussed and locked at a high level:

* Product requirements have been reviewed.
* Major features have been decided.
* Technical direction has been discussed.
* Technology stack direction has been locked.
* Responsive UI is required.
* Smooth transitions are required.
* The website must not look obviously AI-generated.
* Project documentation is being maintained inside `docs/`.

The next step is implementation based on the approved documentation.

---

## 3. Core Documentation

### PRD.md

Defines:

* Product purpose
* Goals
* Target users
* Features
* Functional requirements
* Non-functional requirements
* Scope
* Feature priorities

### TRD.md

Defines:

* Technical architecture
* Frontend
* Backend
* Database
* APIs
* Project structure
* Development standards
* Technical constraints

### WEBSITE-FLOW.md

Defines:

* Website pages
* Navigation
* User journey
* Page-to-page flow
* Major interactions
* Authentication/user flow where applicable

When a detailed decision exists in these files, follow the latest version of those files.

---

## 4. Technology Direction

### Frontend

A modern web frontend will be used.

The exact framework and libraries should follow the finalized `TRD.md`.

Frontend requirements:

* Responsive design
* Reusable components
* Clean component structure
* Smooth transitions
* Good UX
* Maintainable code
* Mobile, tablet and desktop support

---

### Backend

A separate backend layer will be used.

The exact backend framework/runtime should follow `TRD.md`.

Backend responsibilities include:

* API handling
* Business logic
* Validation
* Database operations
* Server-side functionality
* Authentication/authorization where required

---

### Database

**MongoDB is the selected database.**

MongoDB Compass may be used during local development to inspect and manage the database.

Important:

> MongoDB Compass is a GUI/client for MongoDB. It is not the database server itself.

The exact production MongoDB setup should follow the finalized `TRD.md`.

---

### Deployment / Repository

The project should remain simple and GitHub-centered.

GitHub is the central repository for the project.

Avoid introducing unnecessary cloud services or infrastructure unless the project requirements actually require them.

---

## 5. UI / UX Direction

The website must be:

### Responsive

The UI should work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

Layouts should adapt rather than simply shrinking the desktop version.

---

### Smooth

Use smooth transitions for:

* Navigation
* Buttons
* Cards
* Modals
* Menus
* Page/state changes
* Other meaningful interactions

Animations should improve UX and should not be excessive.

---

### Human-designed appearance

One of the most important requirements:

> The website should NOT look like an AI-generated website.

Avoid:

* Generic AI landing-page patterns
* Excessive gradients
* Unnecessary glowing effects
* Excessive glassmorphism
* Random animations
* Overuse of huge headings
* Repetitive card layouts
* Generic "AI startup" visual patterns
* Decorative elements without UX purpose

Prefer:

* Clear visual hierarchy
* Natural spacing
* Consistent typography
* Practical layouts
* Purposeful components
* Realistic content
* Restrained animations
* Consistent design language

The website should look like something a professional developer/designer intentionally built.

---

## 6. Development Principles

The implementation should prioritize:

1. Simplicity
2. Maintainability
3. Clean architecture
4. Responsive behavior
5. Good UX
6. Consistent UI
7. Smooth but restrained animations
8. Clear code organization
9. Separation of frontend/backend responsibilities
10. Avoiding unnecessary complexity

Do not add technologies just because they are popular.

Every dependency should have a purpose.

---

## 7. GitHub Workflow

The project uses a branch-based Git workflow.

Current conceptual structure:

```text
main
│
└── develop
    │
    ├── frontend
    │   ├── feature branches
    │   └── ...
    │
    └── backend
        ├── feature branches
        └── ...
```

### Branches

`main`

* Stable/default branch
* Should contain stable project code

`develop`

* Main development/integration branch

`frontend`

* Frontend development

`backend`

* Backend development

Feature branches

* Used for individual features or tasks

---

## 8. Basic Git Workflow

Before starting work, make sure the local branch is up to date.

Typical workflow:

```bash
git pull origin main
```

Then create/work on the appropriate branch.

After completing work:

```bash
git add .
git commit -m "clear descriptive message"
git push origin <branch-name>
```

Use clear commit messages.

Do not directly mix unrelated features into the same branch.

---

## 9. Documentation Rules

Keep documentation synchronized with the actual project.

Use:

### PRD.md

For:

> What the product does and why.

### TRD.md

For:

> How the product is technically built.

### WEBSITE-FLOW.md

For:

> How the user moves through the website.

### PROJECT-CONTEXT.md

For:

> Portable high-level context and important locked decisions.

---

## 10. Decision Rules

Do not change a locked decision without discussing it first.

If a new requirement conflicts with an existing decision:

1. Identify the conflict.
2. Explain the impact.
3. Propose the change.
4. Get approval.
5. Update the appropriate documentation.
6. Only then implement the change.

Do not silently change the technology stack, architecture, or major features.

---

## 11. Current Project Direction

The project should now move from planning/documentation toward implementation.

The expected sequence is:

```text
PRD
 ↓
TRD
 ↓
WEBSITE-FLOW
 ↓
Project structure
 ↓
Frontend implementation
 ↓
Backend implementation
 ↓
Database integration
 ↓
Integration/testing
 ↓
Responsive testing
 ↓
UI/UX refinement
 ↓
Final cleanup
```

Do not repeatedly restart the planning stage unless a real requirement is missing.

---

## 12. Important Implementation Constraint

The project should not be over-engineered.

The goal is a working, maintainable, professional website — not a demonstration of how many technologies can be added.

Prefer:

* Simple architecture
* Small number of dependencies
* Reusable components
* Clear APIs
* Straightforward database structure
* Easy local development
* Easy GitHub collaboration

---

## 13. New ChatGPT Session Instructions

If this project is continued in another ChatGPT account:

1. Read `PROJECT-CONTEXT.md`.
2. Read `docs/PRD.md`.
3. Read `docs/TRD.md`.
4. Read `docs/WEBSITE-FLOW.md`.
5. Treat the documentation as the source of truth.
6. Preserve all approved decisions.
7. Do not restart the project from scratch.
8. Do not introduce a new stack without approval.
9. Do not add unapproved features.
10. Continue from the current implementation status.
11. When an important decision changes, update the appropriate documentation.

---

## 14. Source-of-Truth Priority

When there is conflicting information, use this order:

```text
1. Latest explicitly approved decision
2. Latest PRD.md
3. Latest TRD.md
4. Latest WEBSITE-FLOW.md
5. PROJECT-CONTEXT.md
6. Older ChatGPT conversation
```

Older chat messages should not override newer documented decisions.

---

## 15. Context Completeness

This file contains the important high-level context currently established.

Detailed information such as:

* Exact feature names
* Exact page requirements
* Exact frontend framework
* Exact backend framework
* API contracts
* Database schemas
* Authentication details
* Component specifications
* Page-specific behavior

should be taken from the latest:

```text
docs/PRD.md
docs/TRD.md
docs/WEBSITE-FLOW.md
```

Therefore, whenever moving the project to another ChatGPT account, transfer all four files if possible.

---

## 16. Final Project Principle

Do not build a website merely because it is technically impressive.

Build the website according to the approved product requirements, with:

* Clean architecture
* Professional UI
* Responsive behavior
* Smooth interactions
* Practical UX
* Maintainable code
* Simple technology choices
* Consistent documentation

The final result should feel like a **real professionally developed website**, not an AI-generated template.

---

# END OF PROJECT CONTEXT
