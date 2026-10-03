<div align="center">
  <h1>Smart Build &mdash; Construction Project & Resource Management Platform</h1>
  <p><b>A unified, role-governed digital ERP for multi-stage construction site planning, engineering quantities, field operations, budgeting, and stakeholder transparency.</b></p>

  <!-- Status Badges -->
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build Status" />
  <img src="https://img.shields.io/badge/Test_Suite-300+_Passing-brightgreen?style=flat-square" alt="Test Suite" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-blue?style=flat-square" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-v18-blue?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-orange?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Architecture-16--Phase_V1_Complete-blueviolet?style=flat-square" alt="Architecture" />
</div>

<br />

## 1. Executive Summary: Core Problem & Solution

**The Problem:** Traditional construction management is often plagued by fragmented spreadsheets, delayed daily field logs, budget overruns, and a significant lack of client visibility. Disparate systems for materials, workforce, equipment, and financials lead to reconciliation errors and schedule delays.

**The Solution:** Smart Build replaces these disjointed tools with a centralized, automated digital environment. From auto-seeded project lifecycle baselines and WBS tracking to real-time budget burn rate and live vendor PO tracking, Smart Build ensures that site engineers, store managers, and executives are all working from a single, auditable source of truth.

---

## 2. Complete Tech Stack

| Layer | Technology | Key Functionality |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS | High-performance, responsive UI, strict typing, rapid build tooling, and utility-first styling. |
| **Backend** | Node.js, Express, TypeScript | Modular monolith REST API, strict request validation, and highly scalable controller architecture. |
| **Database** | MongoDB, Mongoose | NoSQL flexible document storage, schema enforcement, and rapid aggregate querying. |
| **Authentication** | JWT, bcrypt | Secure stateless identity management, hashed password storage, and HTTP-only protection. |
| **Testing** | Vitest/Jest, Supertest, RTL | Unit/Integration testing suite, robust API testing, and React component validation. |

---

## 3. Role-Based Access Control (RBAC) Matrix

Smart Build implements a strict 6-Role governance model mapping users to authorized system responsibilities:

| Role | Authorized Responsibilities & Access Levels |
| :--- | :--- |
| **Admin** | Unrestricted global access. Manages users, organization settings, project master setup, and global catalogs. |
| **Project Manager** | Full read/write access to assigned projects. Manages budgets, approvals, WBS planning, and workforce. |
| **Site Engineer** | Daily site operations. Submits Daily Progress Reports (DPR), tracks tasks, and creates material requests. |
| **Store Manager** | Warehouse and inventory oversight. Receives purchase orders, tracks BOM allocations, and logs material utilization. |
| **Contractor** | Restricted access to assigned tasks. Logs attendance, updates snag resolutions, and reports field progress. |
| **Client** | Read-only executive transparency. Accesses curated project milestones, verified photo galleries, and financial summaries. |

---

## 4. 16-Phase V1 Implemented Feature Suite

The V1 system architecture has been fully realized across 16 sequential implementation phases. The platform provides:

- **Identity & Security:** Robust JWT authentication, session revocation, route guards, and granular RBAC authorization.
- **Planning & Engineering:** Auto-seeded 4-stage project lifecycles, WBS task structures with measurable unit quantities (e.g., sq.ft, cu.m), and an auto-reconciling progress engine.
- **Supply Chain & Machinery:** Centralized master materials catalog, location-based inventory tracking, full procurement pipeline (POs), and heavy equipment fleet management.
- **Field Operations & Attendance:** Roster assignment, daily shift check-in/check-out tracking, Daily Site Reports (DPR), and a complete snag/issue resolution lifecycle.
- **Financials & Reporting:** Comprehensive multi-category budget tracking (Material, Workforce, Equipment, Overhead), expense logging, burn rate analysis, live cost variance, and dynamic CSV/JSON report exports.
- **Client Portal:** A dedicated, read-only executive dashboard ensuring stakeholder transparency, highlighting curated milestones, approved photo galleries, and payment tranche tracking.

---

## 5. System Architecture & Workflow Flowchart

```text
  [ Client / PM / Site Engineer ]
               │
               ▼
       ┌───────────────┐
       │   React App   │ (Vite, Tailwind, TypeScript)
       └───────┬───────┘
               │ JSON / REST
               ▼
     ┌───────────────────┐
     │ Express API Gw    │ (Node.js)
     └─────────┬─────────┘
               │
               ▼
     ┌───────────────────┐
     │  RBAC Middleware  │ (JWT Verification)
     └─────────┬─────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
 ┌─────────┐      ┌─────────┐
 │ Auth    │      │ Projects│ ... Domain Modules
 └────┬────┘      └────┬────┘
      │                │
      ▼                ▼
 ┌───────────────────────┐
 │   MongoDB Database    │ (Mongoose ODM)
 └───────────────────────┘
```

---

## 6. Local Environment & Runtime Setup Guide

### Prerequisites
- **Node.js**: v18+ or v20+
- **Package Manager**: npm
- **Database**: Local MongoDB instance or MongoDB Atlas connection string

### Port Allocation Table
| Service | Endpoint |
| :--- | :--- |
| **Frontend Application** | `http://localhost:5173` (Vite Default) |
| **Backend API Server** | `http://localhost:5000` (Configurable via `.env`) |
| **Health Check Endpoint** | `http://localhost:5000/api/v1/health` |
| **Database** | `mongodb://localhost:27017/smart_build` (Default MongoDB Port) |

### Environment Configuration (`.env` instructions)

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_build
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Step-by-Step Execution Commands

1. **Install Dependencies**
   Navigate to the respective directories to install required packages:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Database Seeding**
   Seed the initial administrative accounts, project templates, and master material catalogs:
   ```bash
   npm --prefix backend run seed
   ```

3. **Run Application**
   Run the backend and frontend simultaneously in separate terminals:
   ```bash
   # Terminal 1 (Backend API)
   cd backend && npm run dev

   # Terminal 2 (Frontend Client)
   cd frontend && npm run dev
   ```

4. **Verification Step**
   Open [http://localhost:5173](http://localhost:5173) in your browser and log in using the demo credentials provided during the seeding process.

---

## 7. Quality Assurance & Verification

Smart Build ensures code reliability and continuous stability through a robust verification process:

- **Run Test Suite:**
  ```bash
  npm test
  ```
- **Lint Codebase:**
  ```bash
  npm run lint
  ```
- **Production Build:**
  ```bash
  npm run build
  ```

**Coverage Summary:** Comprehensive test coverage enforces strict API validation, database modeling constraints, RBAC logic isolation, and React component state correctness across all 16 implemented phases.

---

## 8. Future Scope & V2 Roadmap

While V1 successfully models the core ERP requirements, the following modules are designated for the Future Development (V2) Scope:

- **V2.1: Quality Management & Inspection Checklists** (Punch lists, defect tracking)
- **V2.2: Safety Management & Compliance** (OSHA incident reports, hazard audits)
- **V2.3: Document & Blueprint Vault** (Cloud object storage for CAD/PDF blueprints and versioning)
- **V2.4: Real-Time WebSocket Infrastructure** (Live push notifications and collaborative multi-user editing)
