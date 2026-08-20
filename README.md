# Smart Build — Construction Project & Resource Management Platform

Smart Build is a secure, web-based construction project and resource management platform for organizations managing multiple construction projects. It centralizes operations across project planning, quantity-based progress tracking, materials & BOM, procurement & inventory, workforce & attendance, equipment, budgets, daily site reports, quality & safety, documents, and an external client portal.

---

## 1. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router v7
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB (with MongoDB Compass for development inspection)
- **API Style:** REST (`/api/v1/`)
- **Real-Time:** WebSockets (where required)
- **Architecture:** Modular Monolith
- **Source Control:** Git + GitHub

---

## 2. Monorepo Directory Structure

```text
smart-build/
├── frontend/                     # React + Vite + TypeScript application
│   ├── src/
│   │   ├── app/                  # Application root & providers
│   │   ├── assets/               # Static assets & images
│   │   ├── components/           # Shared reusable UI components
│   │   ├── features/             # Domain-specific feature modules
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layouts/              # App layouts (Internal, Auth, Client)
│   │   ├── pages/                # Route page components
│   │   ├── routes/               # Routing configuration
│   │   ├── services/             # API client & services
│   │   ├── styles/               # Global styles & Tailwind config
│   │   ├── types/                # TypeScript shared types
│   │   └── utils/                # Helper utilities
│   ├── public/                   # Public assets
│   ├── index.html                # Entry HTML
│   ├── vite.config.ts            # Vite configuration
│   ├── tailwind.config.ts        # Tailwind design tokens
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json
│
├── backend/                      # Node.js + Express + TypeScript application
│   ├── src/
│   │   ├── config/               # Environment & service configurations
│   │   ├── middleware/           # Express middleware (auth, error, logger, validation)
│   │   ├── modules/              # Business domain modules
│   │   ├── routes/               # Route registry
│   │   ├── services/             # Application & domain services
│   │   ├── repositories/         # MongoDB data access layer
│   │   ├── validators/           # Request schema validation
│   │   ├── websocket/            # WebSocket handlers
│   │   ├── storage/              # Local storage adapter abstraction
│   │   ├── utils/                # Utility helpers & custom errors
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Server entry point
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json
│
├── DOCS/                         # Project documentation & source of truth
├── .env.example                  # Documented environment variables template
├── .gitignore                    # Git ignore configuration
├── package.json                  # Root workspace configuration
└── README.md                     # Project overview and setup instructions
```

---

## 3. Prerequisites

- **Node.js:** v20.x or higher (Node.js v24.x LTS tested)
- **npm:** v10.x or higher
- **MongoDB:** v6.x or higher running locally (or via connection URI)
- **MongoDB Compass:** Recommended for graphical database inspection during development

---

## 4. Setup & Installation

### Step 1: Clone Repository & Switch to Development Branch

```bash
git clone https://github.com/ASWANTH299/New_Smart_Build.git
cd New_Smart_Build
git checkout dev
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Adjust variables in `.env` if your local ports, MongoDB URI, or secrets differ from the defaults.

### Step 3: Install Dependencies

```bash
npm install
```

This installs dependencies across all workspaces (`backend` and `frontend`).

---

## 5. Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both backend and frontend development servers concurrently |
| `npm run dev:backend` | Start backend development server with hot reload |
| `npm run dev:frontend` | Start frontend Vite development server |
| `npm run build` | Build both backend and frontend for production |
| `npm run build:backend` | Compile backend TypeScript to `dist/` |
| `npm run build:frontend` | Build frontend production bundle |
| `npm run lint` | Run ESLint across both workspaces |
| `npm run test` | Run tests across both workspaces |
| `npm run test:backend` | Run backend tests |
| `npm run test:frontend` | Run frontend tests |

---

## 6. Git Branching Strategy

- `master` — Stable release branch. Direct commits and pushes are strictly restricted.
- `dev` — Active development and integration branch.
- Feature work is verified and audited before merging into `dev`.

---

## 7. Portability & Configuration Guidelines

- **No Hardcoded Ports:** Server ports are read dynamically from `PORT` (backend) and `VITE_PORT` (frontend) environment variables.
- **No Hardcoded URLs:** Frontend connects to the backend via `VITE_API_URL`.
- **No Committed Secrets:** `.env` is ignored by Git. Never commit production secrets or keys.
- **Environment Validation:** All required variables are documented in `.env.example`.

---

## 8. Documentation Reference

Detailed specifications are maintained in the `DOCS/` folder:

- `DOCS/PROJECT-CONTEXT.md` — Project context, locked decisions & principles
- `DOCS/PRD.md` — Product Requirements Document
- `DOCS/TRD.md` — Technical Requirements Document
- `DOCS/WEBSITE-FLOW.md` — Complete route, sitemap & user journeys
- `DOCS/ARCHITECTURE.md` — Modular monolith system architecture
- `DOCS/DATABASE-DESIGN.md` — MongoDB schema, collections & indexing strategy
- `DOCS/UI-UX.md` — Visual design tokens, layout hierarchy & UX guidelines
- `DOCS/TESTING-QA.md` — QA strategy, testing pyramid & release criteria
- `DOCS/IMPLEMENTATION-PLAN.md` — 22-phase sequential implementation roadmap
