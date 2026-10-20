# TaskDigitalCrowd

**Multi-Tenant SaaS Task Board & Workflow Platform**  
**Company:** Digital Crowd Technologies  
**Company Website:** [digitalcrowdtech.in](https://digitalcrowdtech.in/)  
**Proposed Web Domain:** `tasks.digitalcrowdtech.in`  
**Proposed API Domain:** `api-tasks.digitalcrowdtech.in`  
**Product Tagline:** *Assign Tasks. Track Progress. Get Work Done.*

---

## 🎨 Official Brand Identity & Palette

TaskDigitalCrowd uses an original, professional SaaS visual identity anchored by its official purple and lavender palette:

| Brand Color | Hex Code | Purpose |
|---|---|---|
| **Deep Purple** | `#4C2365` | Main brand anchor, dark sidebar, primary headings, major brand elements |
| **Medium Purple** | `#7F5D99` | Primary interactive buttons, active navigation indicators, key controls |
| **Soft Purple** | `#9E7EB5` | Secondary actions, badges, supporting accents, hover states |
| **Light Lavender** | `#C4A4DA` | Subtle highlights, soft borders, selected state accents |
| **Canvas Background** | `#F8F6FA` | Clean neutral light page background |
| **Primary Text** | `#251A2D` | High-contrast readable typography |

---

## 🚀 Technology Stack

- **Frontend:** Next.js (App Router, JavaScript/JSX only — strict prohibition on TypeScript/TSX), React, Tailwind CSS v4, Lucide React icons.
- **Backend:** Node.js, Express.js (Versioned REST API under `/api/v1`), Socket.IO (Authenticated real-time events and room dispatch).
- **Database:** MySQL 8.x / 9.x with InnoDB storage engine, Prisma ORM for migrations and multi-tenant isolation.
- **Security & Protection:** 
  - Argon2/Bcrypt password hashing
  - Dual JWT Access & Refresh Token rotation with database-backed session revocation
  - Granular Role-Based Access Control (RBAC) with anti-lockout safeguards
  - Multi-tenant query scoping via `tenantId` on every request
  - Express Rate Limiting (`express-rate-limit`) on authentication and public routes
  - Helmet HTTP Security headers & Strict CORS configuration

---

## 📂 Repository Structure

```text
taskdigitalcrowd/
├── frontend/                     # Next.js JavaScript App Router
│   ├── app/                      # App router pages
│   │   ├── page.js               # Marketing & Pricing Landing Page
│   │   ├── login/                # User login with instant demo role switcher
│   │   ├── register/             # Self-service business onboarding
│   │   └── dashboard/            # Authenticated workspace
│   │       ├── page.js           # Executive dashboard & metrics overview
│   │       ├── tasks/            # Task management & board view
│   │       │   ├── page.js       # Task list & filter view
│   │       │   ├── [id]/page.js  # Deep task detail, checklists, proof, dependencies
│   │       │   └── recurrence/   # Recurring task schedules engine
│   │       ├── board/            # Interactive Kanban board
│   │       ├── my-tasks/         # Individual employee task view
│   │       ├── branches/         # Multi-branch management
│   │       ├── teams/            # Departmental teams & staff assignment
│   │       ├── employees/        # Employee invitations & member directory
│   │       ├── roles/            # RBAC permissions matrix editor
│   │       ├── notifications/    # In-website notification center & history
│   │       ├── reports/          # Executive analytics, staff leaderboard & CSV export
│   │       └── settings/         # Company profile & tenant configuration
│   ├── components/               # Reusable purple-themed components (Sidebar, Header, etc.)
│   ├── context/                  # AuthContext with instant demo role switcher
│   └── lib/                      # Centralized API client (api.js)
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── config/               # Prisma singleton & environment config
│   │   ├── middleware/           # Auth, Tenant isolation, Rate limiting, Upload, Error handler
│   │   ├── modules/              # Auth, Tasks, Branches, Teams, Members, Notifications, Reports
│   │   ├── sockets/              # Socket.IO room & real-time event dispatcher
│   │   ├── utils/                # JWT helpers, response formatters, logger
│   │   ├── app.js                # Express app setup with Helmet, CORS, Rate Limiters
│   │   └── server.js             # HTTP & Socket.IO server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma         # 24 core MySQL models
│   │   └── seed.js               # Database seed with roles, permissions, plans, demo data
│   ├── uploads/                  # Evidence & Proof storage pipeline
│   └── tests/                    # Automated integration & tenant isolation test suite
└── README.md                     # Comprehensive project documentation
```

---

## 🔑 Default Seed Credentials for Role Testing

The database seed provides ready-to-test accounts for all four organizational roles:

| Role | Email | Password | Scope & Permissions |
|---|---|---|---|
| **Business Owner** | `admin@digitalcrowdtech.in` | `Password@123` | Full workspace admin, branches, teams, tasks, settings |
| **Branch Manager** | `manager@digitalcrowdtech.in` | `Password@123` | Branch tasks, reviews, staff oversight, approvals |
| **Team Leader** | `lead@digitalcrowdtech.in` | `Password@123` | Team task assignment, execution tracking |
| **Staff Employee** | `employee@digitalcrowdtech.in` | `Password@123` | Assigned task view, checklist execution, proof submission |

*Tip:* On the `/login` page or inside the Dashboard header, click any role in the **Instant Role Switcher** to switch profiles seamlessly.

---

## ⚡ Quick Start & Local Development

### Prerequisites

1. **Node.js** (v20+ or v24+)
2. **npm** (v10+ or v11+)
3. **MySQL Server** (running on `localhost:3306`)

### 1. Database Initialization

Ensure MySQL is running. In MySQL CLI or phpMyAdmin:

```sql
CREATE DATABASE IF NOT EXISTS taskdigitalcrowd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Push database schema to MySQL
npx prisma db push

# Run the database seeder
npm run prisma:seed

# Run the full automated integration test suite (43/43 passing)
npm test

# Start the Express API server (port 5000)
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Build verification
npm run build

# Start the Next.js development server (port 3000)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Comprehensive Phase Completion Summary

### Phase 1: Multi-Tenant Architecture & Auth Foundation
- MySQL Prisma schema featuring 24 tables with strict foreign keys and cascading rules.
- Dual-token JWT architecture (15-minute access, 7-day refresh) with database session tracking.
- Dynamic tenant resolution preventing cross-tenant data leakage.
- Next.js responsive app shell styled in the official purple brand palette.

### Phase 2: Administration, RBAC & Organization Structure
- Active session management with remote revocation.
- Tenant usage limits enforcing plan quotas (`maxUsers`, `maxBranches`).
- Granular RBAC matrix with anti-lockout protection ensuring `OWNER` retains critical rights.
- Branch & Departmental Team CRUD with member associations.
- Employee invitation lifecycle with SHA-256 token verification and onboarding.

### Phase 3: Task Management, Checklists & Collaboration
- Task lifecycle: `PENDING` ➔ `IN_PROGRESS` ➔ `SUBMITTED` ➔ `COMPLETED` / `CANCELLED`.
- Interactive subtask checklists with percentage calculation.
- Discussion thread with user timestamps and audit timeline tracking.
- Dedicated Task Detail view (`/dashboard/tasks/[id]`) and My Tasks view (`/dashboard/my-tasks`).

### Phase 4: Proof of Execution & Supervisor Review Workflow
- Mandatory proof requirement toggle (`PHOTO`, `VIDEO`, `DOCUMENT`, `OPTIONAL`).
- Multi-file evidence upload pipeline powered by `multer`.
- Interactive Lightbox viewer for full-screen photo, video, and document inspection.
- Two-way supervisor review decisions: `APPROVED` or `CHANGES_REQUESTED` with required feedback.

### Phase 5: Real-Time WebSockets & Recurring Tasks Engine
- Authenticated Socket.IO server with room scoping (`tenant:<id>` and `user:<id>`).
- Real-time event broadcasting (`notification:new`, `task:status_changed`, `task:created`).
- In-website Notification Center with header badge counter, quick popup, and history page (`/dashboard/notifications`).
- Recurring task scheduler supporting `DAILY`, `WEEKLY`, `MONTHLY`, and `CUSTOM_DAYS` recurrence rules.

### Phase 6: Task Dependencies, Prerequisite Blocking & Analytics
- Directed Acyclic Graph (DAG) task dependencies with self-loop prevention and circular dependency detection.
- Prerequisite execution blocking preventing dependent tasks from starting or completing early.
- Managerial override workflow requiring documented business reasons.
- Executive Analytics Dashboard (`/dashboard/reports`) with KPI cards, pipeline distribution, branch performance, and staff leaderboard.
- Direct RFC 4180-compliant CSV data export.

### Phase 7: Production Hardening, Security & Health Diagnostics
- Rate limiting middleware with brute-force defense on auth endpoints and general API throttling.
- Helmet security headers (`X-Content-Type-Options: nosniff`, CORS isolation).
- Centralized health checks on `/health` and `/api/v1/health` with live MySQL latency and memory diagnostics.
- Comprehensive end-to-end integration test suite verifying the entire multi-tenant task lifecycle.

---

## 🌐 Production Deployment Architecture

Proposed deployment domains:
- **Frontend App:** `https://tasks.digitalcrowdtech.in`
- **Backend API:** `https://api-tasks.digitalcrowdtech.in`

### Production Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=mysql://dbuser:StrongPassword@localhost:3306/taskdigitalcrowd_db
JWT_ACCESS_SECRET=your_production_access_jwt_secret_key_2026
JWT_REFRESH_SECRET=your_production_refresh_jwt_secret_key_2026
CLIENT_URL=https://tasks.digitalcrowdtech.in
ALLOWED_ORIGINS=https://tasks.digitalcrowdtech.in,https://digitalcrowdtech.in
DEFAULT_TIMEZONE=Asia/Kolkata
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api-tasks.digitalcrowdtech.in/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api-tasks.digitalcrowdtech.in
```

### Nginx Reverse Proxy Configuration

```nginx
# Backend API & Socket.IO — api-tasks.digitalcrowdtech.in
server {
    server_name api-tasks.digitalcrowdtech.in;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend Next.js — tasks.digitalcrowdtech.in
server {
    server_name tasks.digitalcrowdtech.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 Automated Test Verification

Run all test suites across the entire platform:

```bash
cd backend
npm test
```

**Results:**
- **43 passing integration tests** across **7 test suites** (`phase1` through `phase7`).
- **0 failures, 0 skipped**.
- Frontend Next.js build: **18 routes compiled and statically rendered with 0 errors**.
