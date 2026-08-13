# Military Asset Management System

> Enterprise-style military asset tracking and inventory management platform for managing vehicles, weapons, and ammunition across multiple military bases.

A full-stack asset management application designed to provide **real-time inventory visibility, secure role-based access, cross-base transfers, operational accountability, and complete auditability**.

---

## 📌 Overview

The Military Asset Management System centralizes the management of critical military assets across multiple bases.

The platform tracks:

* Asset purchases
* Cross-base transfers
* Personnel assignments
* Asset expenditures
* Opening balances
* Net movement
* Closing balances
* Audit history

The system uses **role-based access control (RBAC)** to ensure users only access the operations and base data permitted to them.

The application is built with a React frontend, Node.js/Express backend, PostgreSQL database, and Prisma ORM.

---

## ✨ Key Features

### 📊 Operational Dashboard

* Opening Balance
* Purchases
* Transfers In
* Transfers Out
* Net Movement
* Assigned Assets
* Expenditures
* Closing Balance
* Date-based filtering
* Base filtering
* Equipment-type filtering
* Asset movement charts
* Category-based visualizations
* Net Movement breakdown modal

### 🔐 Authentication & Authorization

* JWT-based authentication
* Secure bcrypt password hashing
* Role-Based Access Control
* Base-level data isolation
* Protected frontend routes
* Protected backend APIs
* Server-side authorization enforcement

### 👥 User Roles

| Role                  | Access                                        |
| --------------------- | --------------------------------------------- |
| **Admin**             | Global system access                          |
| **Base Commander**    | Access restricted to assigned base            |
| **Logistics Officer** | Operational access to purchases and transfers |

### 📦 Asset Management

The system manages three major asset categories:

* **Weapons**
* **Vehicles**
* **Ammunition**

### 🚚 Cross-Base Transfers

* Transfer assets between military bases
* Source and destination validation
* Inventory availability validation
* Transaction-safe operations
* Transfer history
* Transfer status tracking
* Automatic audit logging

### 🧾 Purchases

* Record new asset purchases
* Track purchase history
* Associate purchases with bases and equipment types
* Automatically reflect purchases in inventory calculations

### 👤 Assignments

* Assign assets to personnel
* Track assignment history
* Prevent assignments exceeding available inventory

### 💥 Expenditures

* Record consumed/expended assets
* Capture expenditure reason
* Prevent expenditure exceeding available inventory

### 📝 Audit Logging

All major asset-changing operations generate audit records.

Tracked actions include:

* `PURCHASE`
* `TRANSFER`
* `ASSIGNMENT`
* `EXPENDITURE`

Each audit record contains the acting user, action, details, and timestamp.

---

# 🏗️ Architecture

```text
┌───────────────────────────────┐
│         React Frontend        │
│                               │
│ React + Vite + Tailwind CSS   │
│ React Router + Axios          │
│ Recharts + Lucide React       │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│       Express Backend         │
│                               │
│ Authentication                │
│ RBAC                          │
│ Business Logic                │
│ Validation                    │
│ Audit Logging                 │
└───────────────┬───────────────┘
                │
                │ Prisma ORM
                ▼
┌───────────────────────────────┐
│       PostgreSQL Database     │
│                               │
│ Users                         │
│ Bases                         │
│ Equipment Types               │
│ Purchases                     │
│ Transfers                     │
│ Assignments                   │
│ Expenditures                  │
│ Audit Logs                    │
└───────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Recharts
* Lucide React

## Backend

* Node.js
* Express.js
* JWT
* bcrypt
* Helmet
* CORS
* Prisma ORM

## Database

* PostgreSQL

## Development Tools

* Git
* GitHub
* Postman / API testing tools
* npm

---

# 📁 Project Structure

```text
military-asset-management/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── prisma.js
│   │   └── index.js
│   │
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 🗄️ Database Design

The application uses PostgreSQL with Prisma ORM.

### Core Entities

```text
Users
  │
  ├── Bases
  │
  └── Audit Logs

Bases
  │
  ├── Purchases
  ├── Transfers
  ├── Assignments
  └── Expenditures

Equipment Types
  │
  ├── Purchases
  ├── Transfers
  ├── Assignments
  └── Expenditures
```

### Main Tables

| Table             | Purpose                          |
| ----------------- | -------------------------------- |
| `users`           | Authentication and authorization |
| `bases`           | Military base information        |
| `equipment_types` | Asset categories and types       |
| `purchases`       | Incoming asset transactions      |
| `transfers`       | Cross-base asset movement        |
| `assignments`     | Asset allocation to personnel    |
| `expenditures`    | Consumed assets                  |
| `audit_logs`      | System activity history          |

---

# 📐 Inventory Calculation

The dashboard derives inventory metrics from transactional data.

### Net Movement

```text
Net Movement =
Purchases + Transfers In - Transfers Out
```

### Closing Balance

```text
Closing Balance =
Opening Balance + Net Movement - Assigned - Expended
```

For date-range filtering, the system considers historical transactions when calculating the opening position.

This avoids maintaining duplicated, manually updated inventory totals.

---

# 🔒 Security & RBAC

The application uses multiple layers of security.

### Authentication

JWT authentication is used for protected API access.

JWT payload contains:

```text
userId
role
baseId
```

### Password Security

Passwords are never stored as plain text.

They are hashed using:

```text
bcrypt
```

### Authorization

Backend authorization is enforced independently from the frontend.

For example, a Base Commander cannot gain access to another base simply by changing:

```text
?baseId=2
```

The backend derives the authorized base from the authenticated user's role and assigned base.

---

# 🔄 Transaction Safety

Cross-base transfers use PostgreSQL transactions through Prisma.

A transfer follows this process:

```text
Validate Request
      ↓
Check Source Inventory
      ↓
Create Transfer
      ↓
Create Audit Log
      ↓
Commit Transaction
```

If an operation fails:

```text
ROLLBACK
```

This prevents partially completed transfers and inconsistent inventory records.

---

# 🌐 API Endpoints

## Authentication

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| POST   | `/api/auth/login` | Authenticate user |

## Dashboard

| Method | Endpoint                 | Description                |
| ------ | ------------------------ | -------------------------- |
| GET    | `/api/dashboard/metrics` | Retrieve inventory metrics |

## Bases

| Method | Endpoint     | Description    |
| ------ | ------------ | -------------- |
| GET    | `/api/bases` | Retrieve bases |

## Equipment

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/equipment-types` | Retrieve equipment types |

## Purchases

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| GET    | `/api/purchases` | Purchase history |
| POST   | `/api/purchases` | Create purchase  |

## Transfers

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| GET    | `/api/transfers` | Transfer history |
| POST   | `/api/transfers` | Create transfer  |

## Assignments

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | `/api/assignments` | Assignment history |
| POST   | `/api/assignments` | Create assignment  |

## Expenditures

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| GET    | `/api/expenditures` | Expenditure history |
| POST   | `/api/expenditures` | Record expenditure  |

## Audit Logs

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| GET    | `/api/audit-logs` | Retrieve audit history |

## Users

| Method | Endpoint     | Description    |
| ------ | ------------ | -------------- |
| GET    | `/api/users` | Retrieve users |
| POST   | `/api/users` | Create user    |

---

# ⚙️ Local Development

## Prerequisites

Make sure you have installed:

* Node.js 18+
* npm
* PostgreSQL

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd military-asset-management
```

---

# 🔧 Backend Setup

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

using `.env.example` as a template.

Example:

```env
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
JWT_SECRET="your-secure-secret"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

Generate Prisma Client:

```bash
npx prisma generate
```

Push the database schema:

```bash
npx prisma db push
```

Seed the database:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

The API will run on:

```text
http://localhost:4000
```

---

# 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL="http://localhost:4000/api"
```

Start the frontend:

```bash
npm run dev
```

The application will be available at the Vite development URL shown in the terminal.

---

# 🔑 Demo Credentials

The seeded database contains the following test accounts.

| Role              | Username            | Password            | Base       |
| ----------------- | ------------------- | ------------------- | ---------- |
| Admin             | `admin_user`        | `AdminPass123!`     | All Bases  |
| Base Commander    | `commander_alpha`   | `CommandPass123!`   | Fort Alpha |
| Logistics Officer | `logistics_officer` | `LogisticsPass123!` | Fort Alpha |

> These credentials are intended for demonstration/testing purposes.

---

# 🧪 Testing

The application should be tested for:

* Successful login
* Invalid credentials
* JWT authentication
* Role authorization
* Base-level access restrictions
* Purchase creation
* Transfer creation
* Insufficient inventory handling
* Same-base transfer rejection
* Assignment validation
* Expenditure validation
* Audit log creation
* Dashboard calculations
* Date filtering
* Base filtering
* Equipment filtering

---

# 🚀 Production Deployment

The application is structured for separate frontend and backend deployment.

### Frontend

Recommended platforms:

* Vercel
* Netlify

Configure:

```env
VITE_API_BASE_URL=<DEPLOYED_BACKEND_API_URL>
```

### Backend

Recommended platforms:

* Render
* Railway

Configure:

```env
DATABASE_URL=<POSTGRESQL_CONNECTION_STRING>
JWT_SECRET=<SECURE_SECRET>
PORT=4000
FRONTEND_URL=<DEPLOYED_FRONTEND_URL>
```

### Database

Any PostgreSQL-compatible hosted provider can be used.

Ensure the production `DATABASE_URL` is configured before running Prisma commands.

---

# 🔐 Environment Variables

## Backend

```env
DATABASE_URL=
JWT_SECRET=
PORT=
FRONTEND_URL=
```

## Frontend

```env
VITE_API_BASE_URL=
```

Never commit real `.env` files or production credentials to GitHub.

---

# 📋 RBAC Matrix

| Feature         | Admin | Base Commander | Logistics Officer |
| --------------- | :---: | :------------: | :---------------: |
| Dashboard       |   ✅   |   ✅ Own Base   |         ✅         |
| Purchases       |   ✅   |   ✅ Own Base   |         ✅         |
| Transfers       |   ✅   |   ✅ Own Base   |         ✅         |
| Assignments     |   ✅   |   ✅ Own Base   |     Restricted    |
| Expenditures    |   ✅   |   ✅ Own Base   |     Restricted    |
| Audit Logs      |   ✅   |   ✅ Own Base   |      Relevant     |
| User Management |   ✅   |        ❌       |         ❌         |

---

# 📈 Future Improvements

Potential future enhancements include:

* Advanced inventory forecasting
* Automated low-stock alerts
* Multi-factor authentication
* More granular permissions
* Exportable operational reports
* Advanced audit analytics
* Real-time notifications
* Automated deployment pipelines

---

# 👨‍💻 Development

This project was developed as a full-stack enterprise application demonstrating:

* REST API design
* Relational database modeling
* Prisma ORM
* PostgreSQL transactions
* JWT authentication
* RBAC
* Secure password handling
* Inventory aggregation
* Transactional business logic
* React application architecture
* Dashboard visualization
* Auditability

---

# 📄 License

This project was developed for educational and technical assessment purposes.
