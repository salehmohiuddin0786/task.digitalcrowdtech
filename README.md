# task.digitalcrowdtech

**Multi-Tenant SaaS Task Management & Operational Governance Platform**  
**Company:** Digital Crowd Technologies  
**Company Website:** [digitalcrowdtech.in](https://digitalcrowdtech.in/)  
**GitHub Repository:** [https://github.com/salehmohiuddin0786/task.digitalcrowdtech.git](https://github.com/salehmohiuddin0786/task.digitalcrowdtech.git)  
**Product Tagline:** *Assign Tasks. Track Progress. Get Work Done.*

---

## 📌 Project Overview

**task.digitalcrowdtech** is a multi-tenant SaaS task management and operational governance platform built with Next.js (App Router, JavaScript/JSX) and Node.js/Express with Prisma ORM and MySQL. It delivers strict role-based access control (RBAC), multi-branch supervision, team delegation, project velocity tracking with automatic project codes, task lifecycle management with mandatory proof of execution, supervisor reviews, and real-time updates via Socket.IO.

### Core Architecture & Ports
- **Frontend Web Application:** Runs on port `4100` (`http://localhost:4100`)
- **Backend REST API & WebSockets:** Runs on port `5100` (`http://localhost:5100`)
- **API Base Path:** `http://localhost:5100/api/v1`

---

## 🎨 Official Brand Identity & Palette

task.digitalcrowdtech uses an original, professional visual identity anchored by its official purple and lavender palette:

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

- **Frontend:** Next.js (App Router, JavaScript/JSX only — strict prohibition on TypeScript/TSX), React 19, Tailwind CSS v4, Lucide React icons.
- **Backend:** Node.js, Express.js (Versioned REST API under `/api/v1`), Socket.IO (Authenticated real-time events and room dispatch).
- **Database:** MySQL 8.x with InnoDB storage engine, Prisma ORM for migrations and multi-tenant isolation.
- **Security & Protection:** 
  - Dual JWT Access (15m) & Refresh Token (7d) rotation with database-backed session revocation.
  - Granular Role-Based Access Control (RBAC) with server-side portal gating.
  - Multi-tenant query scoping via `tenantId` on every request.
  - Express Rate Limiting (`express-rate-limit`) on authentication and public routes.
  - Helmet HTTP Security headers & Strict CORS configuration allowing `http://localhost:4100`.

---

## ⚡ Quick Start & Development Setup

### Prerequisites
1. **Node.js** (v20+ or v24+)
2. **npm** (v10+ or v11+)
3. **MySQL Server** (running on `localhost:3306`)

### 1. Database Initialization
Ensure MySQL is running. In MySQL CLI or phpMyAdmin:
```sql
CREATE DATABASE IF NOT EXISTS taskdigitalcrowd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Environment Variables Configuration

#### Backend Environment Variables (`backend/.env`)
Create a `.env` file in the `backend/` directory with the following variable names:
```env
PORT=5100
NODE_ENV=development
DATABASE_URL="mysql://<DB_USER>:<DB_PASSWORD>@localhost:3306/taskdigitalcrowd_db"
JWT_ACCESS_SECRET="<YOUR_JWT_ACCESS_SECRET>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="<YOUR_JWT_REFRESH_SECRET>"
JWT_REFRESH_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:4100"
ALLOWED_ORIGINS="http://localhost:4100,http://127.0.0.1:4100"
DEFAULT_TIMEZONE="Asia/Kolkata"
```

#### Frontend Environment Variables (`frontend/.env.local`)
Create a `.env.local` file in the `frontend/` directory with:
```env
NEXT_PUBLIC_API_URL=http://localhost:5100/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5100
```

### 3. Backend Startup & Seeding Commands

```bash
cd backend

# Install dependencies
npm install

# Push database schema to MySQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed initial roles, permissions, plans, and development accounts
npm run prisma:seed

# Start the Express API server on Port 5100
npm start
# or for hot-reloading development:
npm run dev
```

### 4. Frontend Startup Commands

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server on Port 4100
npm run dev
```

Visit [http://localhost:4100](http://localhost:4100) in your browser.

---

## 🧪 Running Automated Tests

Run the full automated test suite (58/58 passing tests across 9 test suites):

```bash
cd backend
npm test
```

### Verified Test Suites
1. `Phase 1 - Multi-Tenant Authentication & Authorization Tests` (6/6 passing)
2. `Phase 2 — Core Security, Administration & RBAC Tests` (5/5 passing)
3. `Phase 3 — Task Management Lifecycle, Checklists, & Workflow Tests` (7/7 passing)
4. `Phase 4 — Proof Uploads & Supervisor Review Tests` (5/5 passing)
5. `Phase 5 — Real-Time Socket.IO & Task Recurrence Tests` (4/4 passing)
6. `Phase 6 — Task Dependencies & Operational Analytics Tests` (5/5 passing)
7. `Phase 7 — Production Hardening, Security & End-to-End Sanity Tests` (6/6 passing)
8. `Role-Based Authorization & Dashboard Scoping Tests` (7/7 passing)
9. `Projects Management, Auto Code Sequence, & Project Lead Assignment Tests` (8/8 passing)

---

## 🔑 Development & Test Accounts

The database seed (`backend/prisma/seed.js`) provides standard development fixture accounts for testing each role portal:

| Portal / Role | Login URL | Login ID / Email | Password Status | Account Status |
|---|---|---|---|---|
| **Super Admin** | `http://localhost:4100/login` | `superadmin@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Support Admin** | `http://localhost:4100/login` | `superadmin@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Billing Admin** | `http://localhost:4100/login` | `superadmin@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Company Owner** | `http://localhost:4100/login` | `admin@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Company Admin** | `http://localhost:4100/login` | `admin@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Branch Manager** | `http://localhost:4100/login` | `manager@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Team Lead** | `http://localhost:4100/login` | `lead@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Employee** | `http://localhost:4100/login` | `employee@digitalcrowdtech.in` | Documented (`Password@123`) | Active |
| **Client / Viewer** | `http://localhost:4100/login` | `viewer@digitalcrowdtech.in` | Documented (`Password@123`) | Active |

---

## 📂 Repository Structure

```text
taskdigitalcrowd/
├── frontend/                     # Next.js JavaScript App Router (Port 4100)
│   ├── app/                      # App router pages
│   │   ├── page.js               # Marketing & Pricing Landing Page
│   │   ├── login/                # Secure User Authentication
│   │   ├── register/             # Self-service business onboarding
│   │   └── dashboard/            # Authenticated workspace
│   │       ├── page.js           # Role-based dashboard overview
│   │       ├── tasks/            # Task list, creation, filters
│   │       │   ├── page.js       # Task management hub
│   │       │   ├── [id]/page.js  # Deep task detail, checklists, evidence, reviews
│   │       │   └── recurrence/   # Recurring task schedules engine
│   │       ├── projects/         # Project management, auto-code, lead assignment
│   │       ├── board/            # Interactive Kanban board
│   │       ├── my-tasks/         # Individual employee task view
│   │       ├── branches/         # Multi-branch management & supervision console
│   │       ├── teams/            # Departmental teams & staff assignment
│   │       ├── employees/        # Employee invitations / Superadmin company directory
│   │       ├── roles/            # RBAC permissions matrix & Portal access management
│   │       ├── notifications/    # In-website notification center & history
│   │       ├── reports/          # Executive analytics, staff leaderboard & CSV export
│   │       └── settings/         # Company profile & tenant configuration
│   ├── components/               # Reusable components (Sidebar, Header, Modals)
│   ├── context/                  # AuthContext with true session state & permissions
│   └── lib/                      # Centralized API client (api.js, socket.js, navigation.js)
├── backend/                      # Node.js + Express API (Port 5100)
│   ├── src/
│   │   ├── config/               # Prisma singleton & environment config
│   │   ├── middleware/           # Auth, Tenant isolation, Rate limiting, Upload, Error handler
│   │   ├── modules/              # Auth, Tasks, Projects, Branches, Teams, Members, Superadmin
│   │   ├── sockets/              # Socket.IO room & real-time event dispatcher
│   │   ├── utils/                # JWT helpers, response formatters, logger
│   │   ├── app.js                # Express app setup with Helmet, CORS, Rate Limiters
│   │   └── server.js             # HTTP & Socket.IO server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma         # MySQL database models
│   │   └── seed.js               # Database seeder with roles, plans, test fixtures
│   ├── uploads/                  # Evidence & Proof storage pipeline
│   └── tests/                    # Automated integration test suite (58 tests)
└── README.md                     # Project documentation
```
