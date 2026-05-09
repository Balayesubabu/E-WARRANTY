# E-Warrantify — Complete Documentation

A full end-to-end guide for the E-Warrantify warranty management platform. This document covers architecture, setup, development, and usage.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [User Roles & Features](#5-user-roles--features)
6. [Installation & Setup](#6-installation--setup)
7. [Environment Variables](#7-environment-variables)
8. [Development](#8-development)
9. [API Overview](#9-api-overview)
10. [Frontend Routes](#10-frontend-routes)
11. [Key Concepts](#11-key-concepts)
12. [Build & Deployment](#12-build--deployment)

---

## 1. Overview

### What is E-Warrantify?

E-Warrantify is a warranty management system with role-based access. It streamlines warranty registration, verification, claims, and lifecycle management for customers, dealers, staff, and brand owners.

### Purpose

- Enable owners to create products, policies, and warranty codes
- Let dealers register warranties and assign them to customers
- Allow customers to register products and view warranty certificates
- Support staff in managing claims and support tickets
- Provide service centers with a dedicated claims interface

### Audience

- **Brand Owners** – Manage products, batches, dealers, and warranty settings
- **Dealers** – Register warranties, generate QR codes, verify products
- **Staff** – Handle claims and support tickets
- **Customers** – Register products and view warranties
- **Service Centers** – Manage warranty claims

---

## 2. Architecture

### High-Level Diagram

```
┌─────────────────────┐     HTTP/JSON      ┌─────────────────────┐
│   Frontend (React)  │ ◄────────────────► │   Backend (Node.js) │
│   Vite • Tailwind   │                    │   Express • Prisma  │
└─────────────────────┘                    └──────────┬──────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────────┐
                                            │   PostgreSQL DB     │
                                            └─────────────────────┘
```

### Components

| Layer        | Technology | Purpose                                   |
|-------------|------------|-------------------------------------------|
| Frontend    | React 18   | User interface and client-side logic      |
| Build Tool  | Vite 6     | Fast dev server and production builds     |
| Styling     | Tailwind   | Utility-first CSS                         |
| Backend     | Express    | REST API and business logic               |
| ORM         | Prisma     | Database access and migrations            |
| Database    | PostgreSQL | Persistent storage                        |
| Auth        | JWT        | Token-based authentication                |

### Data Flow

1. User logs in → Backend validates → Returns JWT
2. Frontend stores JWT in localStorage/cookies
3. All API calls include `Authorization: Bearer <token>`
4. Backend middleware validates token and sets `user_id`, `provider_id`, role
5. Controllers perform business logic and return JSON

---

## 3. Tech Stack

### Frontend

- **React 18.3** – UI library
- **React Router DOM 7** – Client-side routing
- **Vite 6** – Dev server and build
- **Tailwind CSS** – Styling
- **Radix UI** – Accessible components (Dialog, Select, etc.)
- **Lucide React** – Icons
- **Axios** – HTTP client
- **js-cookie** – Cookie handling
- **Sonner** – Toast notifications
- **Recharts** – Charts and analytics

### Backend

- **Node.js** – Runtime
- **Express** – Web framework
- **Prisma** – ORM for PostgreSQL
- **jsonwebtoken** – JWT generation/verification
- **bcrypt** – Password hashing
- **multer** – File uploads
- **pdfkit** – PDF generation (warranty certificates, QR labels)
- **qrcode** – QR code generation
- **nodemailer** – Email (OTP, notifications)
- **Razorpay** – Payments (coins)

---

## 4. Project Structure

```
eWarrantyFy-new-development/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── auth/            # Login, OTP, SignUp
│   │   │   ├── owner/           # Owner-specific screens
│   │   │   ├── dealer/          # Dealer screens
│   │   │   ├── staff/           # Staff screens
│   │   │   ├── customer/        # Customer screens
│   │   │   ├── servicecenter/   # Service center screens
│   │   │   ├── warranty/        # Warranty flows
│   │   │   ├── layout/          # Layouts (Owner, Dealer, Staff)
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── pages/               # Page-level components
│   │   ├── services/            # API services
│   │   ├── utils/               # Helpers, api.js
│   │   ├── contexts/            # React Context
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js API
│   ├── controller/              # Route handlers
│   │   ├── User/
│   │   ├── Owner/
│   │   ├── Dealer/
│   │   ├── E-Warranty/
│   │   ├── WarrantyClaim/
│   │   ├── Provider/
│   │   ├── Coins/
│   │   ├── ServiceCenter/
│   │   └── ...
│   ├── middleware/              # Auth, validation
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed/
│   ├── services/                # Business logic, PDF, etc.
│   ├── router/
│   ├── server.js
│   └── package.json
│
└── docs/
    └── DOCUMENTATION.md         # This file
```

---

## 5. User Roles & Features

### Owner (Brand Owner)

- Executive dashboard with metrics
- Product management (add products, policies, batches)
- Generate warranty QR codes (with custom warranty period: years + months)
- Warranty settings (registration URL, certificate template)
- Dealer management (approve, assign)
- Staff management
- Service center management
- Warranty claim management
- Coins wallet (buy codes, view balance)
- Profile and brand assets status

### Dealer

- Dashboard with registrations and analytics
- Register warranties for customers
- Generate warranty codes
- Verify warranties
- Dealer inventory and sales
- Warranty claims (dealer view)
- Profile

### Staff

- Dashboard
- Warranty claims handling
- Support tickets
- Warranty lookup
- Staff profile

### Customer

- Register products (self-registration)
- View my warranties
- Verify warranty status
- Download warranty certificates
- Profile

### Service Center

- Dedicated layout
- Warranty claims management (service center view)

---

## 6. Installation & Setup

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **PostgreSQL** (local or remote)
- **Git**

### Steps

#### 1. Clone the repository

```bash
git clone <repository-url>
cd eWarrantyFy-new-development
```

#### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file (see [Environment Variables](#7-environment-variables)).

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

Start the backend:

```bash
npm run dev
```

The API runs on the port configured in `.env` (e.g. `http://localhost:4000` or `5000`).

#### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `.env` with:

```
VITE_API_URL=http://localhost:4000/api
```

(Replace port with your backend port.)

Start the frontend:

```bash
npm run dev
```

The app runs on `http://localhost:5173` (Vite default).

---

## 7. Environment Variables

### Backend (.env)

| Variable          | Description                     | Example                    |
|-------------------|---------------------------------|----------------------------|
| DATABASE_URL      | PostgreSQL connection string    | postgresql://user:pass@host:5432/db |
| JWT_SECRET        | Secret for JWT signing          | your-secret-key            |
| PORT              | API server port                 | 4000                       |
| NODE_ENV          | development / production        | development                |
| ALLOWED_ORIGINS   | Comma-separated CORS origins    | https://ewarrantify.com    |
| FRONTEND_URL      | Public SPA origin (no trailing slash). Used for CORS and default warranty registration / QR links when System Settings URL is empty | https://ewarrantify.com    |
| OTP_EXPIRY_TIME   | OTP validity in minutes         | 5                          |
| RAZORPAY_KEY_ID   | Razorpay key (for coins)        | rzp_xxx                    |
| RAZORPAY_KEY_SECRET | Razorpay secret              | xxx                        |
| VITE_GOOGLE_CLIENT_ID | Google OAuth (optional)     | xxx.apps.googleusercontent.com |

### Frontend (.env)

| Variable      | Description            | Example                        |
|---------------|------------------------|--------------------------------|
| VITE_API_URL  | Backend API base URL   | http://localhost:4000/api      |
| VITE_GOOGLE_CLIENT_ID | Google OAuth client ID | xxx.apps.googleusercontent.com |

---

## 8. Development

### Backend commands

| Command            | Description                       |
|--------------------|-----------------------------------|
| `npm run dev`      | Start dev server (nodemon)        |
| `npm run start`    | Start production server           |
| `npm run prisma:generate` | Generate Prisma client     |
| `npm run prisma:migrate`  | Run migrations             |
| `npm run prisma:seed`     | Seed database              |
| `npm run prisma:studio`   | Open Prisma Studio         |

### Frontend commands

| Command       | Description             |
|---------------|-------------------------|
| `npm run dev` | Start Vite dev server   |
| `npm run build` | Production build     |

### API base URL

Frontend calls the backend via `VITE_API_URL`. Example: `http://localhost:4000/api`. All routes are prefixed with `/api` (configured in backend).

---

## 9. API Overview

### Base URL

- Local: `http://localhost:4000/api` (or your `PORT`)
- Production: `https://your-domain.com/api`

### Authentication

Send JWT in the header:

```
Authorization: Bearer <token>
```

Optional headers for role-based middleware:

- `franchise_id` – Provider/franchise ID
- `is_dealer` – `true` for dealer
- `is_staff` – `true` for staff
- `is_service_center` – `true` for service center

### Main API routes

| Prefix          | Purpose                              |
|-----------------|--------------------------------------|
| `/user`         | User auth, login, OTP, profile       |
| `/provider`     | Provider profile, upload documents   |
| `/owner`        | Owner operations, products, batches  |
| `/dealer`       | Dealer operations, inventory         |
| `/e-warranty`   | Warranty codes, registration, PDF    |
| `/customer`     | Customer warranties, certificates    |
| `/warranty-claim` | Warranty claims                   |
| `/service-center` | Service center auth and claims    |
| `/coins`        | Balance, transactions, check balance |

---

## 10. Frontend Routes

### Public

| Path                 | Component       | Description          |
|----------------------|-----------------|----------------------|
| `/`                  | LandingPage     | Landing page         |
| `/login`             | Login           | Login                |
| `/owner-signup`      | OwnerSignUp     | Owner registration   |
| `/customer-auth`     | CustomerAuth    | Customer registration|
| `/check-warranty`    | CheckWarrantyStatus | Public verification |
| `/activate/:token`   | ActivateWarranty | Token-based activation |

### Protected (authenticated)

| Path          | Roles   | Description        |
|---------------|---------|--------------------|
| `/home`       | All     | Role-based home    |
| `/profile`    | All     | Profile view       |
| `/edit-profile` | All   | Edit profile       |

### Owner (`/owner/`)

| Path                    | Description                 |
|-------------------------|-----------------------------|
| `/owner`                | Overview dashboard          |
| `/owner/profile`        | Owner profile               |
| `/owner/warranty-setup` | Add product / generate QR   |
| `/owner/warranty-batches` | Warranty batches          |
| `/owner/warranty-management` | Products and batches  |
| `/owner/dealer-management` | Dealer management       |
| `/owner/claims-management` | Claims management       |
| `/owner/warranty-settings` | System settings          |
| `/owner/wallet`         | Coins wallet                |
| `/owner/buy-warranty-codes` | Buy warranty codes     |

### Dealer (`/dealer/`)

| Path                 | Description          |
|----------------------|----------------------|
| `/dealer`            | Dashboard            |
| `/dealer/edit-profile` | Edit profile       |
| `/dealer/inventory`  | Inventory            |
| `/dealer/warranty-codes` | Warranty codes   |

### Staff (`/staff/`)

| Path                   | Description        |
|------------------------|--------------------|
| `/staff`               | Dashboard          |
| `/staff/claims`        | Warranty claims    |
| `/staff/support-tickets` | Support tickets  |

---

## 11. Key Concepts

### Coins system

- Owners buy coins and use them to generate warranty codes
- Cost per code depends on warranty duration:
  - ≤3 months: 1 coin
  - ≤6 months: 2 coins
  - ≤12 months: 4 coins
  - 24+ months: 4 coins

### Warranty flow

1. **Owner** creates product → policy → batch → generates warranty codes
2. **Dealer** (optional) gets codes, registers for customers
3. **Customer** registers product (or Dealer does it)
4. Warranty is active; customer can view certificate and verify status

### Custom warranty period

- Preset options: 3 mo, 6 mo, 1 yr, 2 yr, 3 yr
- Custom option: years + months (e.g. 1 year 6 months)
- Used in AddWarrantyProductWizard, GenerateWarrantyQRCodes, WarrantyCodeManagement

### Brand assets

- Company logo, QR code, signature, cover image
- Stored on Provider; used in warranty certificates and invoices
- Backend: `POST /provider/upload-document?file_type=COMPANY_LOGO|QR_CODE|SIGNATURE|COVER_IMAGE`
- No upload UI yet in the frontend

---

## 12. Build & Deployment

### Frontend build

```bash
cd frontend
npm run build
```

Output: `frontend/build/` (or `dist/` per Vite config).

### Backend production

```bash
cd backend
npm run prisma:migrate:prod   # Run migrations
npm run start
```

### Production checklist

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure `ALLOWED_ORIGINS` for frontend domain
- Use HTTPS
- Set `VITE_API_URL` to production API URL
- Ensure PostgreSQL is accessible and backed up

---

## Additional Resources

- **Frontend README**: `frontend/README.md` — Detailed frontend docs
- **Modules overview**: `frontend/src/MODULES_OVERVIEW.md` — Role-based design
- **Attributions**: `frontend/src/Attributions.md` — Third-party licenses

---

*Last updated: 2025*
