# TaskDigitalCrowd

**Multi-Tenant SaaS Task Board Manager**  
**Company:** Digital Crowd Technologies  
**Company Website:** [digitalcrowdtech.in](https://digitalcrowdtech.in/)  
**Tagline:** *Assign Tasks. Track Progress. Get Work Done.*

---

## 🎨 Official Brand Identity & Palette

TaskDigitalCrowd uses an original, professional SaaS visual identity anchored by its official purple and lavender palette:

| Brand Color | Hex Code | Purpose |
|---|---|---|
| **Deep Purple** | `#4C2365` | Main anchor, sidebar, brand headings, major UI zones |
| **Medium Purple** | `#7F5D99` | Primary interactive buttons, active navigation indicators, key controls |
| **Soft Purple** | `#9E7EB5` | Secondary actions, badges, supporting accents, hover states |
| **Light Lavender** | `#C4A4DA` | Subtle highlights, soft borders, selected state accents |

---

## 🚀 Technology Stack

- **Frontend:** Next.js (App Router, JavaScript/JSX only — No TypeScript/TSX), Tailwind CSS v4, Lucide React icons.
- **Backend:** Node.js, Express.js (Versioned REST API under `/api/v1`), Socket.IO (Authenticated real-time events).
- **Database:** MySQL 9.x / 8.x with InnoDB engine, Prisma ORM for migrations and tenant-isolated operations.
- **Security:** Argon/Bcrypt password hashing, JWT Access & Refresh Token rotation with database-backed session revocation, Role-Based Access Control (RBAC), and Tenant-isolation validation on every request.

---

## 📂 Repository Structure

```text
taskdigitalcrowd/
├── frontend/                     # Next.js JavaScript App Router
│   ├── app/                      # App router pages (/dashboard, /login, /register, etc.)
│   ├── components/               # Reusable purple-themed components (Sidebar, Header, etc.)
│   ├── context/                  # AuthContext with instant demo role switcher
│   ├── lib/                      # Centralized API client (api.js)
│   └── package.json
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── config/               # Prisma singleton & environment config
│   │   ├── middleware/           # Auth, Tenant isolation, Validation, Error handler
│   │   ├── modules/              # Auth, Tasks, Dashboard, Branches, Teams, Notifications
│   │   ├── sockets/              # Socket.IO room & event dispatcher
│   │   ├── utils/                # JWT helpers, response formatters, logger
│   │   ├── app.js                # Express app setup with Helmet & CORS
│   │   └── server.js             # HTTP & Socket.IO server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma         # 24 core MySQL models
│   │   └── seed.js               # Database seed with roles, permissions, plans, demo data
│   ├── tests/                    # Integration & tenant isolation test suite
│   └── package.json
├── docs/                         # Architecture documentation & phase summaries
├── .env.example                  # Environment configuration template
└── README.md
```

---

## ⚡ Quick Start & Setup Instructions

### Prerequisites

1. **Node.js** (v20+ or v24+)
2. **npm** (v10+ or v11+)
3. **MySQL Server** (running on `localhost:3306`)

### 1. Database Setup

Ensure MySQL is running. In MySQL CLI or phpMyAdmin:

```sql
CREATE DATABASE IF NOT EXISTS taskdigitalcrowd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd backend

# Environment configuration is already preset in .env
# Push database schema to MySQL
npx prisma db push

# Run the database seeder
npm run prisma:seed

# Run the integration test suite
npm test

# Start the Express API server (port 5000)
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Build production verification
npm run build

# Start the Next.js development server (port 3000)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

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

## 📋 Phase 1 Implementation Status

- [x] Inspected project workspace and verified Node.js v24.20.0 and MySQL.
- [x] Selected and configured **Prisma ORM** with MySQL.
- [x] Designed and applied database schema migrations with foreign keys and tenant isolation.
- [x] Seeded standard roles (`OWNER`, `BRANCH_MANAGER`, `TEAM_LEADER`, `EMPLOYEE`, `VIEWER`), 19 granular permissions, subscription plans, and initial demo tenant.
- [x] Implemented multi-tenant authentication (`/register`, `/login`, `/logout`, `/me`, `/refresh`, `/switch-tenant`).
- [x] Implemented tenant isolation middleware preventing cross-tenant leakage.
- [x] Created Express REST API under `/api/v1` and Socket.IO real-time notification engine.
- [x] Built responsive Next.js JavaScript/JSX frontend with official brand colors (`#4C2365`, `#7F5D99`, `#9E7EB5`, `#C4A4DA`).
- [x] Implemented Dashboard overview with metric cards, active task queue, branch workload, activity stream, and instant task creation modal.
- [x] Built in-app Notification Center with unread badge counter and mark-as-read controls.
- [x] Successfully verified backend automated integration test suite (`6 passing tests`).
- [x] Successfully verified production build (`next build` compiled with 0 errors).
