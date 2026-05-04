# Goodwill Store Order MVP

A full-stack web application for managing store supply orders, replacing a spreadsheet-based workflow. Built with Next.js, TypeScript, Tailwind CSS, **PostgreSQL**, and Prisma.

## Features

- **Store Order Form**: Submit orders with multiple products, quantities, and notes
- **Orders Hub**: Browse, filter, search, and analyze orders with insights and outlier detection
- **Order Details**: View complete order information with line items
- **Invoice Generation**: Generate and download invoices in one click (print-ready HTML/PDF)
- **Product Catalog**: Browse all available products by category

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (local Docker, Supabase, or any Prisma-compatible host)
- **ORM**: Prisma
- **Runtime**: Node.js

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A **PostgreSQL** database (see `.env.example` for required connection variables)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies and runs `prisma generate` via `postinstall`.

### 2. Configure environment variables

- **`.env.example`** — committed template only (no real secrets).  
- **`.env`** — your real local secrets; copy from `.env.example`, fill in values, **never commit** (gitignored).

Copy `.env.example` to `.env` and set **`DATABASE_URL`** and **`DIRECT_URL`**. Each must be a full Postgres URI starting with **`postgresql://`** or **`postgres://`** (same requirement on Vercel).

**Local development (`npm run dev`, `npm run db:seed`, Prisma Studio)**  
Use Supabase’s **direct** connection to `db.<project-ref>.supabase.co` on port **5432** for **both** variables (same string twice). The **transaction pooler** (port **6543**) is for **deployed** serverless runtimes (e.g. Vercel); using it locally often causes “can’t reach” or **circuit breaker** errors.  
If your database password has special characters (`@`, `#`, `!`, etc.), it must be **URL-encoded** inside the connection string.

**Production (Vercel)**  
Set **`DATABASE_URL`** to the **pooled** URI (often port **6543**, `pgbouncer=true`) and **`DIRECT_URL`** to the **direct / session** URI on **5432**, as shown in the Supabase dashboard.

### 3. Create tables (migrations)

```bash
npm run db:migrate
```

This runs `prisma migrate dev`, applies migrations in `prisma/migrations/`, and updates your database. Use this during **development** when you change the schema.

For a **production** database (e.g. Supabase), use:

```bash
npm run db:migrate:deploy
```

### 4. Seed database (optional, first-time / dev)

```bash
npm run db:seed
```

Populates stores, products, and related catalog data. Intended for **first-time setup** or dev bootstrap—not for automated production deploys. See `prisma/seed.ts` and comments there.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — `prisma generate` + `next build` (no DB migration; safe for local builds without DB)
- `npm run build:vercel` — `prisma migrate deploy` + `prisma generate` + `next build` (optional for Vercel when env vars are set at build time)
- `npm start` — Start production server
- `npm run db:migrate` — `prisma migrate dev` (development migrations)
- `npm run db:migrate:deploy` — `prisma migrate deploy` (production / CI)
- `npm run db:push` — `prisma db push` (prototyping only; prefer migrations for anything shared)
- `npm run db:seed` — Run seed script (`prisma/seed.ts`)
- `npm run db:setup` — Migrate dev + seed (local convenience)
- `npm run db:studio` — Prisma Studio

## Deployment (Vercel + Supabase)

Step-by-step instructions for non-developers: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── orders/           # Order pages
│   ├── new-order/        # New order form
│   ├── catalog/          # Product catalog
│   └── layout.tsx        # Root layout
├── lib/
│   └── prisma.ts         # Prisma client instance
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # SQL migrations (PostgreSQL)
│   └── seed.ts           # Seed script (manual / first-time)
└── README.md
```

## Data Model

### Stores

- `id`: Integer (primary key, autoincrement)
- `storeNumber`: String (unique)
- `name`: String
- `sortOrder`: Integer

### Products

- `id`: Integer (primary key)
- `name`, `category`, `unitPriceCents`, optional JSON text fields for uniforms, etc.

### Orders

- `id`: Integer (primary key)
- `storeId`: Foreign key to Store
- `managerName`, `createdAt`, `orderDate`, `subtotalCents`, `notes`, `orderType`

### OrderLines

- Line items with snapshots of product name and price at order time

## Key Features

### Order Submission

- Select store from dropdown
- Enter manager name
- Add multiple products with quantities
- Real-time subtotal calculation

### Orders Hub

- Sortable table, search, filters, insights panel

### Invoice Generation

- Print-ready HTML; save as PDF via browser print

## Acceptance Tests

- Create an order with multiple items → saved → appears in Orders Hub
- Filtering, search, invoice generation work end-to-end

## Notes

- **Admin access** (`/admin-lock`, catalog, orders hub, order stats): password is checked server-side (`/api/admin/auth`). Set **`ADMIN_PASSWORD`** in `.env` / Vercel; otherwise a built-in default is used. An **httpOnly cookie** lasts **8 hours** after successful login.
- **Order submission** (confirm modal on order forms): passwords are checked via **`/api/order-submit/verify`** and again on **`POST /api/orders`** (same value the client sends as `orderSubmitPassword`). Use one Vercel env per store: **`ORDER_SUBMIT_PASSWORD_STORE_<storeNumber>`** where `<storeNumber>` is the store’s `storeNumber` in the database (for example `ORDER_SUBMIT_PASSWORD_STORE_01`; the OT location uses `storeNumber` **13** in the seed). If a per-store variable is missing or empty, **`ORDER_SUBMIT_PASSWORD`** is used; if that is also unset, a dev default applies. These secrets are **not** stored in Postgres.
- **Database** must be PostgreSQL for production-style hosting (e.g. Vercel + Supabase).
- **Orders**: API capabilities match the codebase (e.g. delete where implemented).

## Troubleshooting

### Database connection errors

1. Confirm `DATABASE_URL` and `DIRECT_URL` in `.env` match your provider’s **pooled** vs **direct** URLs.
2. Run `npx prisma migrate deploy` against the same database you use in production.

### Starting from scratch locally

1. Point `.env` at an empty Postgres database.
2. Run `npm run db:migrate` (or `db:migrate:deploy`).
3. Run `npm run db:seed` if you want demo stores and products.

## License

This is a demo project for internal use.
