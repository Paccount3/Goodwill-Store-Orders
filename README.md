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

Copy `.env.example` to `.env` and fill in:

- **`DATABASE_URL`** — Postgres connection string (pooled URI if you use PgBouncer, e.g. Supabase port 6543)
- **`DIRECT_URL`** — Direct Postgres connection for migrations (e.g. Supabase port 5432). For a simple local Postgres with no pooler, use the **same** value as `DATABASE_URL`.

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

- **Admin access** uses the app’s existing password/cookie flow (see admin routes).
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
