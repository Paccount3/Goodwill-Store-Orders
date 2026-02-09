# Goodwill Store Order MVP

A full-stack web application for managing store supply orders, replacing a spreadsheet-based workflow. Built with Next.js, TypeScript, Tailwind CSS, SQLite, and Prisma.

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
- **Database**: SQLite
- **ORM**: Prisma
- **Runtime**: Node.js

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including Next.js, Prisma, and Tailwind CSS.

### 2. Set Up Database

```bash
npm run db:push
```

This creates the SQLite database file and applies the Prisma schema.

### 3. Seed Database

```bash
npm run db:seed
```

This populates the database with:
- 15 stores (Hartford, New Haven, Stamford, etc.)
- ~40 products across categories (Tags, Bags, Labels, Cleaning, Shipping, Office)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push Prisma schema to database
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── orders/       # Order endpoints
│   │   ├── stores/       # Store endpoints
│   │   └── products/     # Product endpoints
│   ├── components/       # React components
│   ├── orders/           # Order pages
│   │   └── [id]/         # Order details & invoice
│   ├── new-order/        # New order form
│   ├── catalog/          # Product catalog
│   └── layout.tsx        # Root layout
├── lib/
│   └── prisma.ts         # Prisma client instance
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── README.md
```

## Data Model

### Stores
- `id`: Integer (primary key)
- `storeNumber`: String (unique, e.g., "01")
- `name`: String (e.g., "Hartford Store")

### Products
- `id`: Integer (primary key)
- `name`: String
- `category`: String
- `unitPriceCents`: Integer
- `isActive`: Boolean

### Orders
- `id`: Integer (primary key)
- `storeId`: Integer (foreign key)
- `managerName`: String
- `createdAt`: DateTime
- `orderDate`: DateTime
- `subtotalCents`: Integer
- `notes`: String (optional)

### OrderLines
- `id`: Integer (primary key)
- `orderId`: Integer (foreign key)
- `productId`: Integer (foreign key)
- `productNameSnapshot`: String (historical snapshot)
- `unitPriceCentsSnapshot`: Integer (historical snapshot)
- `quantity`: Integer
- `lineTotalCents`: Integer

## Key Features

### Order Submission
- Select store from dropdown
- Enter manager name
- Add multiple products with quantities
- Real-time subtotal calculation
- Validation for required fields and minimum quantities

### Orders Hub
- Table view with sortable columns
- Search by store name/number, manager, or order ID
- Filters:
  - Date range (order date)
  - Store filter
  - Product filter
  - Subtotal range (min/max)
- Insights panel:
  - Total spend in date range
  - Top store by spend
  - Top product by quantity
  - Outlier stores (orders > 2x average)

### Invoice Generation
- One-click invoice generation from order details
- Invoice number format: `INV-YYYYMM-000123`
- Print-ready HTML layout
- Download via browser print dialog (Save as PDF)

## Acceptance Tests

✅ Create an order with multiple items → saved → appears in Orders Hub immediately
✅ Orders Hub filtering by store and date range works
✅ Search by manager name works
✅ Order details shows exact snapshot prices and totals
✅ Generate invoice from an order works in one click (view + printable/downloadable)

## Notes

- **No Authentication**: This is a dummy MVP without user authentication
- **Local Database**: SQLite database file is stored in `prisma/dev.db`
- **Append-Only Orders**: Orders cannot be edited or deleted (as per requirements)
- **Invoice Format**: Invoices use print-friendly HTML that can be saved as PDF via browser print dialog

## Troubleshooting

### Database Issues
If you encounter database errors:
1. Delete `prisma/dev.db` and `prisma/dev.db-journal`
2. Run `npm run db:push` again
3. Run `npm run db:seed` to repopulate data

### Port Already in Use
If port 3000 is already in use:
- Kill the process using port 3000, or
- Set a different port: `PORT=3001 npm run dev`

## License

This is a demo project for internal use.
