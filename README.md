# Military Asset Management System

An enterprise-style system for tracking military equipment across multiple
bases: purchases, cross-base transfers, personnel assignments, expenditures,
and a full audit trail — with role-based access control enforced on the
backend.

## Overview

Base commanders, logistics officers, and administrators need a shared,
trustworthy view of equipment inventory across bases. This system gives them:

- A real-time dashboard of opening/closing balances, net movement, and
  category breakdowns, computed live from the transaction ledger (never
  hardcoded).
- Purchase, transfer, assignment, and expenditure workflows with server-side
  validation (no negative inventory, no self-transfers, no bypassing another
  base's authorization from the frontend).
- A full audit log of every mutation in the system.

## Features

- JWT authentication with bcrypt password hashing
- Role-based access control (ADMIN, BASE_COMMANDER, LOGISTICS_OFFICER),
  enforced server-side — a Base Commander cannot see or act on another
  base's data no matter what the frontend sends
- Atomic, Prisma-transactional transfers with stock re-validation inside
  the transaction to prevent race conditions
- Dashboard inventory formulas computed via database aggregation:
  - `Net Movement = Purchases + Transfers In - Transfers Out`
  - `Closing Balance = Opening Balance + Net Movement - Assigned - Expended`
- Filterable views (base, equipment type, date range) across purchases,
  transfers, dashboard metrics, and audit logs
- Full audit logging of every purchase, transfer, assignment, and
  expenditure, written inside the same Prisma transaction as the mutation
- Polished dark navy "operations dashboard" UI: sidebar, stat cards, charts,
  tables, modals, toasts, loading/empty/error states
- Prisma seed script across 3 bases, 3 equipment types, and 3 demo users,
  with a realistic transaction history that never produces negative
  inventory

## Architecture

```
military-asset-mgmt/
├── backend/                  Express API
│   ├── prisma/
│   │   ├── schema.prisma     PostgreSQL schema (models, relations, indexes)
│   │   └── seed.js            Prisma-based seed script
│   └── src/
│       ├── prisma.js          PrismaClient singleton
│       ├── middleware/        JWT auth, RBAC, centralized error handling
│       ├── routes/            One file per resource (auth, dashboard, purchases, ...)
│       ├── utils/              Inventory math + audit log helper (Prisma)
│       └── index.js            App entrypoint
└── frontend/                  React + Vite + Tailwind SPA
    └── src/
        ├── api/                Axios client with auth interceptor
        ├── context/            Auth + Toast providers
        ├── components/         Sidebar, Navbar, Modal, FilterBar, StatCard, ...
        └── pages/               Login, Dashboard, Purchases, Transfers, ...
```

The backend runs on **PostgreSQL via Prisma ORM**. All routes use
`prisma.<model>.*` calls through the shared client in `backend/src/prisma.js`;
there is no runtime dependency on SQLite or any other embedded database.

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Lucide React,
Recharts

**Backend:** Node.js, Express, **PostgreSQL**, **Prisma ORM**, JWT, bcrypt,
Helmet, CORS

## Database Schema

See `backend/prisma/schema.prisma` for the authoritative schema (models,
relations, indexes). Summary:

- **User** — username, passwordHash, role, baseId (nullable for ADMIN)
- **Base** — name, location
- **EquipmentType** — name, category (WEAPON / VEHICLE / AMMUNITION)
- **Purchase** — base, equipmentType, quantity, date, createdBy
- **Transfer** — sourceBase, destinationBase, equipmentType, quantity,
  status, initiatedBy, timestamp
- **Assignment** — base, equipmentType, personnelName, quantity, assignedBy
- **Expenditure** — base, equipmentType, quantity, reason, recordedBy
- **AuditLog** — user, action, details, createdAt

## Environment Variables

**backend/.env** (see `backend/.env.example`)
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="change-this"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

**frontend/.env** (see `frontend/.env.example`)
```
VITE_API_BASE_URL=http://localhost:4000/api
```

Never commit real secrets — `.env` is gitignored; only `.env.example` files
are checked in.

## Installation

```bash
# Backend
cd backend
npm install            # runs `prisma generate` automatically via postinstall
cp .env.example .env   # then fill in a real DATABASE_URL and JWT_SECRET

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

## Database Migration & Seed

With a reachable PostgreSQL instance and `DATABASE_URL` set in `backend/.env`:

```bash
cd backend
npx prisma generate   # regenerate the client if you skipped postinstall
npx prisma db push    # create/sync tables from schema.prisma
npm run seed           # wipes and reseeds demo data via prisma/seed.js
```

(`npx prisma migrate dev --name init` is the alternative if you want tracked
migration files instead of a plain `db push`.)

## Running the App

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open http://localhost:5173 and sign in with one of the demo accounts below.

## API Endpoints

| Method | Endpoint                  | Description                              |
|--------|----------------------------|-------------------------------------------|
| POST   | `/api/auth/login`          | Authenticate, returns JWT + user          |
| GET    | `/api/dashboard/metrics`   | Inventory metrics + chart data            |
| GET    | `/api/bases`                | List bases                                |
| GET    | `/api/equipment-types`      | List equipment types                      |
| GET    | `/api/purchases`            | List purchases (filterable)               |
| POST   | `/api/purchases`            | Record a purchase                         |
| GET    | `/api/transfers`            | List transfers (filterable)               |
| POST   | `/api/transfers`            | Initiate a transfer (atomic)              |
| GET    | `/api/assignments`          | List assignments                          |
| POST   | `/api/assignments`          | Record an assignment                      |
| GET    | `/api/expenditures`         | List expenditures                         |
| POST   | `/api/expenditures`         | Record an expenditure                     |
| GET    | `/api/audit-logs`           | List audit log entries (filterable)       |
| GET    | `/api/users`                 | List users (ADMIN only)                   |
| POST   | `/api/users`                 | Create a user (ADMIN only)                |

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.
This contract is unchanged from earlier versions of the project — the
frontend requires no changes.

## Authentication

- `POST /api/auth/login` verifies the password with bcrypt and issues a JWT
  (8h expiry) containing `userId`, `role`, and `baseId`.
- The frontend stores the token in `localStorage`, attaches it to every
  request via an Axios interceptor, and redirects to `/login` on a 401
  response (expired/invalid token).
- Password hashes are never included in any API response.

## RBAC

| Role               | Access                                                                 |
|---------------------|--------------------------------------------------------------------------|
| ADMIN               | Full access to all bases, all resources, user management, audit logs |
| BASE_COMMANDER      | Scoped to their own base only; can view/create purchases, transfers (out of their base), assignments, and expenditures, and view audit logs |
| LOGISTICS_OFFICER   | Purchases and transfers                                                |

**Base scoping is enforced entirely server-side.** `resolveScopedBaseId()`
(`backend/src/middleware/auth.js`) forces every `BASE_COMMANDER` request to
`req.user.baseId` from the JWT — any `baseId` sent from the frontend for a
different base (via query string or request body) is rejected with `403`.
The frontend hides irrelevant nav items and disables the base selector for
commanders purely as a UX convenience; it is never the security boundary.

## Inventory Formulas

```
Net Movement    = Purchases + Transfers In − Transfers Out
Closing Balance = Opening Balance + Net Movement − Assigned − Expended
```

Opening balance for a filtered range is computed from every transaction
strictly before the range's start date; all figures are computed live via
Prisma `aggregate({ _sum: { quantity: true } })` calls, never hardcoded.

## Transaction Handling

Transfers, assignments, and expenditures each run inside
`prisma.$transaction(async (tx) => { ... })`:

1. Validate the request shape and positive quantity.
2. Look up source/destination base and equipment type; 404 if missing.
3. Re-check available stock *inside* the transaction (available =
   purchases + transfers in − transfers out − assigned − expended) to guard
   against race conditions.
4. Reject with `409` if stock is insufficient — inventory can never go
   negative.
5. Insert the record and its audit log entry together, in the same
   transaction.
6. The transaction commits when the callback resolves; throwing anywhere
   inside rolls the entire transaction back automatically.

Transfers additionally reject `sourceBaseId === destinationBaseId` with
`400` before any stock check runs.

## Audit Logging

Every purchase, transfer, assignment, and expenditure writes an `AuditLog`
row via Prisma, inside the same `$transaction` as the mutation itself,
recording the acting user, an action code (`PURCHASE`, `TRANSFER`,
`ASSIGNMENT`, `EXPENDITURE`, `USER_CREATED`), a human-readable detail string
(e.g. *"User transferred 20 M4 Carbine from Fort Alpha to Fort Bravo."*), and
a timestamp. `ADMIN` and `BASE_COMMANDER` can view and filter the audit
trail from the UI.

## Error Handling

Centralized Express error middleware (`backend/src/middleware/errorHandler.js`)
maps `ApiError(status, message)` throws to consistent JSON responses:

- `400` — validation error (missing/invalid fields)
- `401` — authentication error (missing/invalid/expired token, bad login)
- `403` — authorization error (role or base-scope violation)
- `404` — not found (unknown base/equipment/route)
- `409` — business conflict (insufficient stock, duplicate username)
- `500` — server error (logged server-side, generic message to client)

The frontend surfaces these via inline form errors and toast notifications.

## Deployment Notes

- Provision a PostgreSQL instance (e.g. RDS, Cloud SQL, Supabase, Neon, or
  a self-managed server) and set `DATABASE_URL` accordingly.
- Set a strong, random `JWT_SECRET` in production.
- Run `npx prisma migrate deploy` (or `prisma db push` for simple setups)
  against the production database as part of your deploy step, then
  `npm run seed` only for a fresh demo environment — never against real
  production data.
- Build the frontend with `npm run build` (outputs to `frontend/dist/`) and
  serve it via any static host or behind the same reverse proxy as the API;
  set `VITE_API_BASE_URL` to the deployed API URL at build time.
- Set `FRONTEND_URL` on the backend to the deployed frontend origin (used
  for CORS).

## Demo Credentials

| Username             | Password             | Role               | Base       |
|-----------------------|------------------------|---------------------|------------|
| `admin_user`           | `AdminPass123!`         | ADMIN               | —          |
| `commander_alpha`      | `CommandPass123!`       | BASE_COMMANDER      | Fort Alpha |
| `logistics_officer`    | `LogisticsPass123!`     | LOGISTICS_OFFICER   | Fort Alpha |
