import { PrismaClient } from '@prisma/client'
import { STORE_MAINTENANCE_ORDER_CATEGORY } from '../lib/product-categories'

const prisma = new PrismaClient()

/**
 * Manual bootstrap only — do not run from Vercel/Railway start hooks or deploy pipelines.
 * Safe to run on a fresh database after `prisma migrate deploy`; on populated DB it only fills
 * missing catalog slices (e.g. Ecom categories) and runs non-destructive migrations.
 */
/** Legacy DB category; renamed to STORE_MAINTENANCE_ORDER_CATEGORY in migrateStoreMaintenanceCategoryName. */
const LEGACY_STORE_MAINTENANCE_CATEGORY = 'Housatonic Maintenance'

const ECOM_WAREHOUSE_CATEGORY = 'Ecom Warehouse'
const ECOM_BOOKS_CATEGORY = 'Ecom Books'
const EBOOKS_MAINTENANCE_CATEGORY = 'Ebooks Maintenance'
const ECOMM_MAINTENANCE_CATEGORY = 'Ecomm Maintenance'

async function seedEcomWarehouseProducts(prismaInstance: PrismaClient) {
  await prismaInstance.product.createMany({
    data: [
      { name: 'Copy Paper (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 500, maxQuantity: 5, isActive: true },
      { name: 'Rubberbands (bag) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'E-COMM Tags (box of 1000) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'Black Pens (box of 36) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Black Markers (box of 36) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Highlighters (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Multi-Color Dry Erase (pack of 16) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Multi-Color Post-Its (box of 24) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 2, isActive: true },
      { name: 'AA Batteries (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'AAA Batteries (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'C Batteries (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: '9 Volt Batteries (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves – S (case of 1000) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – M (case of 1000) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – L (case of 1000) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – XL (case of 1000) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – S (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – M (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – L (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – XL (case) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Fragile Labels (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 400, maxQuantity: 10, isActive: true },
      { name: 'MaxGear Thermal Labels (4x6) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 800, maxQuantity: 5, isActive: true },
      { name: 'Betckey Thermal Labels (1 1/8 x 3 1/2) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 5, isActive: true },
      { name: '6x9 Bubble Mailers (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 300, maxQuantity: 4, isActive: true },
      { name: '10.5X16 Bubble Mailers (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 500, maxQuantity: 4, isActive: true },
      { name: '10x13 Poly Mailers (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 400, maxQuantity: 4, isActive: true },
      { name: '14.5x19 Poly Mailers (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 4, isActive: true },
      { name: '12x16 Morepack Bags (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 500, maxQuantity: 4, isActive: true },
      { name: 'Wireless Computer Mouse (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 2500, maxQuantity: 3, isActive: true },
      { name: 'Tera Handheld Scanner (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 8000, maxQuantity: 3, isActive: true },
      { name: 'Clear Plastic Handbags (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 400, maxQuantity: 10, isActive: true },
      { name: 'Safety Box Cutter (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 600, maxQuantity: 5, isActive: true },
      { name: 'Scissors (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Stapler (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Staples (box) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 400, maxQuantity: 2, isActive: true },
      { name: 'Wire Cutters (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 1000, maxQuantity: 3, isActive: true },
      { name: 'Tape Measures (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 800, maxQuantity: 5, isActive: true },
      { name: 'Safety Labels (sheet of 15 stickers) (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 300, maxQuantity: 1, isActive: true },
      { name: 'Disposable Masks (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Truck Seals (Ecom Warehouse)', category: ECOM_WAREHOUSE_CATEGORY, unitPriceCents: 500, maxQuantity: 45, isActive: true },
    ],
  })
  console.log('Created Ecom Warehouse products')
}

async function seedEcomBooksProducts(prismaInstance: PrismaClient) {
  await prismaInstance.product.createMany({
    data: [
      { name: 'Copy Paper - White (case) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Copy Paper - Red (ream) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'Copy Paper - Yellow (ream) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'Copy Paper - Green (ream) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'Copy Paper - Blue (ream) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'Black Pens (box of 36) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Black Markers (box of 36) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Multi-Color Post-Its (box of 24) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves - S (case) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves - M (case) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves - L (case) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves - XL (case) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Disposable Masks (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'MaxGear Thermal Labels (4x6) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 800, maxQuantity: 3, isActive: true },
      { name: 'Thermal Receipt Paper (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 400, maxQuantity: 3, isActive: true },
      { name: '10x13 Poly Mailers (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 300, maxQuantity: 5, isActive: true },
      { name: '14.5x19 Poly Mailers (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'Tera Handheld Scanner (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 8000, maxQuantity: 2, isActive: true },
      { name: 'Safety Box Cutter (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 600, maxQuantity: 3, isActive: true },
      { name: 'Scissors (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Stapler (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Staples (box) (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'Tape Measures (Ecom Books)', category: ECOM_BOOKS_CATEGORY, unitPriceCents: 800, maxQuantity: 2, isActive: true },
    ],
  })
  console.log('Created Ecom Books products')
}

async function seedEbooksMaintenanceProducts(prismaInstance: PrismaClient) {
  await prismaInstance.product.createMany({
    data: [
      { name: 'Paper Towels (case) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Clean Linen (case) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags - Small (case) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Fantastik Multi-Surface Disinfectant with triggers (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Masking Tape (case) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Dust Mop Head (dry) 36\" (each) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 3, isActive: true },
      { name: 'Backbraces (each) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 2500, maxQuantity: 3, isActive: true },
      { name: 'Push Broom 24\" - refill (single) - order as needed (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1200, maxQuantity: 0, isActive: true },
      { name: 'Heavy Duty Street Broom (complete) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Dust Mop (complete set) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Dustpan & Brush (normal length broom) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Paper Plates (case) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Spoons - plastic (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Forks - plastic (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Knives - plastic (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer - single pump bottle (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 800, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves - Small (case of 1000) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves - Medium (case of 1000) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves - Large (case of 1000) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves - XL (case of 1000) (Ebooks Maintenance)', category: EBOOKS_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
    ],
  })
  console.log('Created Ebooks Maintenance products')
}

async function seedEcommMaintenanceProducts(prismaInstance: PrismaClient) {
  await prismaInstance.product.createMany({
    data: [
      { name: 'Toilet Paper (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2500, maxQuantity: 5, isActive: true },
      { name: 'Toilet Paper Dispensers (single) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 4500, maxQuantity: 1, isActive: true },
      { name: 'Toilet Brush (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Urinal Block with Screen (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Paper Towels (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3000, maxQuantity: 4, isActive: true },
      { name: 'Paper Towel Dispensers (single) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Antibacterial Hand Foam Soap (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3200, maxQuantity: 1, isActive: true },
      { name: 'Soap Dispensers (single) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Disinfectant Foam Cleaner (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2800, maxQuantity: 2, isActive: true },
      { name: 'Dust Mop Treatment (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2200, maxQuantity: 1, isActive: true },
      { name: 'Bowl Cleaner (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Cherry (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Citrus (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Clean Linen (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Dispensers (single) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Goo Off (can) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Spray Bottle & Trigger (single) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 500, maxQuantity: 4, isActive: true },
      { name: 'Glass Cleaner (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2400, maxQuantity: 1, isActive: true },
      { name: 'Pine Kleen (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2200, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags - Large (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 2, isActive: true },
      { name: 'Clear Trash Bags - Small (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 2, isActive: true },
      { name: 'Comet Cleaner with bleach 3-30 with triggers (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2600, maxQuantity: 1, isActive: true },
      { name: 'Fantastik Multi-Surface Disinfectant with triggers (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'One Shot (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Twine (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Masking Tape (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Sanitary Napkin Bags (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Cotton Mop Heads 32oz (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2800, maxQuantity: 1, isActive: true },
      { name: 'Dust Mop Head (dry) 36" (each) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 12, isActive: true },
      { name: 'Backbraces (each) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2500, maxQuantity: 6, isActive: true },
      { name: 'Push Broom 24" - refill (single) - order as needed (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1200, maxQuantity: 0, isActive: true },
      { name: 'Floor Mop (complete) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Heavy Duty Street Broom (complete) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3500, maxQuantity: 2, isActive: true },
      { name: 'Long Handle Scraper (each) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 3, isActive: true },
      { name: 'Dust Mop (complete set) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 3000, maxQuantity: 3, isActive: true },
      { name: 'Dustpan & Brush (normal length broom) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 4, isActive: true },
      { name: 'Mop Bucket (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 2, isActive: true },
      { name: 'Plastic Cups (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Paper Plates (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Spoons - plastic (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Forks - plastic (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Knives - plastic (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Blades for Long Handle Scraper (pack) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 4, isActive: true },
      { name: 'Hand Sanitizer Foam Ref. (case) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer - single pump bottle (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 800, maxQuantity: 4, isActive: true },
      { name: 'Nitrile Gloves - Small (case of 1000) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves - Medium (case of 1000) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves - Large (case of 1000) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves - XL (case of 1000) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Newsprint (bundle) (Ecomm Maintenance)', category: ECOMM_MAINTENANCE_CATEGORY, unitPriceCents: 500, maxQuantity: 6, isActive: true },
    ],
  })
  console.log('Created Ecomm Maintenance products')
}

async function migrateProductCategoryNames(prismaInstance: PrismaClient) {
  const result = await prismaInstance.product.updateMany({
    where: { category: 'Staff Uniforms' },
    data: { category: 'Staff Apparel' },
  })
  if (result.count > 0) {
    console.log(`Migrated ${result.count} product(s): Staff Uniforms → Staff Apparel`)
  }
}

/** Rename Store Maintenance product suffix (HM) → (SMO) in existing databases. */
async function migrateStoreMaintenanceProductSuffixHmToSmo(prismaInstance: PrismaClient) {
  const rows = await prismaInstance.product.findMany({
    where: { category: LEGACY_STORE_MAINTENANCE_CATEGORY },
    select: { id: true, name: true },
  })
  let n = 0
  for (const row of rows) {
    if (row.name.endsWith(' (HM)')) {
      await prismaInstance.product.update({
        where: { id: row.id },
        data: { name: row.name.replace(/ \(HM\)$/, ' (SMO)') },
      })
      n++
    }
  }
  if (n > 0) {
    console.log(`Migrated ${n} Store Maintenance product name(s): (HM) → (SMO)`)
  }
}

async function migrateStoreMaintenanceCategoryName(prismaInstance: PrismaClient) {
  const result = await prismaInstance.product.updateMany({
    where: { category: LEGACY_STORE_MAINTENANCE_CATEGORY },
    data: { category: STORE_MAINTENANCE_ORDER_CATEGORY },
  })
  if (result.count > 0) {
    console.log(
      `Migrated ${result.count} product(s): ${LEGACY_STORE_MAINTENANCE_CATEGORY} → ${STORE_MAINTENANCE_ORDER_CATEGORY}`
    )
  }
}

/** Regional / HQ locations beyond core retail 01–20; inserted only if missing (does not overwrite admin edits). */
const DEFAULT_EXTRA_STORES: { storeNumber: string; name: string }[] = [
  { storeNumber: '21', name: 'Bridgeport Headquarters' },
  { storeNumber: '22', name: 'Cheshire CR' },
  { storeNumber: '23', name: 'Greenwich ADC' },
  { storeNumber: '24', name: 'Hartford Campus' },
  { storeNumber: '25', name: 'Manchester CR' },
  { storeNumber: '26', name: 'Ridgefield ADC' },
  { storeNumber: '27', name: 'Riverside ADC' },
  { storeNumber: '28', name: 'Hartford ADC' },
]

async function migrateStoreSortOrder(prismaInstance: PrismaClient) {
  const all = await prismaInstance.store.findMany({ orderBy: { storeNumber: 'asc' } })
  if (all.length === 0) return
  const allZero = all.every((s) => s.sortOrder === 0)
  if (!allZero) return
  for (let i = 0; i < all.length; i++) {
    await prismaInstance.store.update({
      where: { id: all[i].id },
      data: { sortOrder: i },
    })
  }
  console.log(`Initialized store display order (${all.length} stores)`)
}

async function ensureMissingExtraStores(prismaInstance: PrismaClient) {
  for (const row of DEFAULT_EXTRA_STORES) {
    const existing = await prismaInstance.store.findUnique({
      where: { storeNumber: row.storeNumber },
    })
    if (!existing) {
      const maxAgg = await prismaInstance.store.aggregate({ _max: { sortOrder: true } })
      const nextSort = (maxAgg._max.sortOrder ?? -1) + 1
      await prismaInstance.store.create({
        data: { ...row, sortOrder: nextSort },
      })
      console.log(`Added store ${row.storeNumber} – ${row.name}`)
    }
  }
}

async function main() {
  console.log('Seeding database...')

  await migrateProductCategoryNames(prisma)
  await migrateStoreMaintenanceProductSuffixHmToSmo(prisma)
  await migrateStoreMaintenanceCategoryName(prisma)
  await migrateStoreSortOrder(prisma)

  // Check if database is already seeded
  const storeCount = await prisma.store.count()
  const productCount = await prisma.product.count()

  // If database already has data, only seed Ecom Warehouse / Ecom Books / Ebooks Maintenance products if missing
  if (storeCount > 0 || productCount > 0) {
    const ewhCount = await prisma.product.count({ where: { category: ECOM_WAREHOUSE_CATEGORY } })
    const ebooksCount = await prisma.product.count({ where: { category: ECOM_BOOKS_CATEGORY } })
    const ebooksMaintCount = await prisma.product.count({ where: { category: EBOOKS_MAINTENANCE_CATEGORY } })
    const ecommMaintCount = await prisma.product.count({ where: { category: ECOMM_MAINTENANCE_CATEGORY } })

    if (ewhCount > 0 && ebooksCount > 0 && ebooksMaintCount > 0 && ecommMaintCount > 0) {
      console.log(`Database already has data. Ecom Warehouse (${ewhCount}), Ecom Books (${ebooksCount}), Ebooks Maintenance (${ebooksMaintCount}), and Ecomm Maintenance (${ecommMaintCount}) products exist. Skipping seed.`)
      await ensureMissingExtraStores(prisma)
      return
    }

    if (ewhCount === 0) {
      console.log('Database has data but no Ecom Warehouse products. Seeding Ecom Warehouse...')
      await seedEcomWarehouseProducts(prisma)
    }

    if (ebooksCount === 0) {
      console.log('Database has data but no Ecom Books products. Seeding Ecom Books...')
      await seedEcomBooksProducts(prisma)
    }

    if (ebooksMaintCount === 0) {
      console.log('Database has data but no Ebooks Maintenance products. Seeding Ebooks Maintenance...')
      await seedEbooksMaintenanceProducts(prisma)
    }

    if (ecommMaintCount === 0) {
      console.log('Database has data but no Ecomm Maintenance products. Seeding Ecomm Maintenance...')
      await seedEcommMaintenanceProducts(prisma)
    }

    await ensureMissingExtraStores(prisma)
    return
  }

  console.log('Database is empty. Seeding initial data...')

  // Tables should be empty after migrations; we do not delete here (avoids accidental wipes).

  // Seed Stores
  const stores = await prisma.store.createMany({
    data: [
      { storeNumber: '01', name: 'AVON' },
      { storeNumber: '02', name: 'BLOOMFIELD' },
      { storeNumber: '03', name: 'BROOKFIELD' },
      { storeNumber: '04', name: 'DANBURY' },
      { storeNumber: '05', name: 'ENFIELD' },
      { storeNumber: '06', name: 'FAIRFIELD' },
      { storeNumber: '07', name: 'GLASTONBURY' },
      { storeNumber: '08', name: 'MANCHESTER' },
      { storeNumber: '09', name: 'MILFORD' },
      { storeNumber: '10', name: 'MONROE' },
      { storeNumber: '11', name: 'NEW MILFORD' },
      { storeNumber: '12', name: 'NORWALK' },
      { storeNumber: '13', name: 'OT' },
      { storeNumber: '14', name: 'OXFORD' },
      { storeNumber: '15', name: 'SHELTON' },
      { storeNumber: '16', name: 'STAM. BROAD' },
      { storeNumber: '17', name: 'STAM. ELM' },
      { storeNumber: '18', name: 'TORRINGTON' },
      { storeNumber: '19', name: 'WATERBURY' },
      { storeNumber: '20', name: 'WESTPORT' },
    ],
  })

  console.log(`Created ${stores.count} stores`)

  // Seed Products with the new list
  const products = await prisma.product.createMany({
    data: [
      // General Supplies
      { name: 'Copy Paper', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 3, isActive: true },
      { name: 'Clear Barbs', category: 'General Supplies', unitPriceCents: 300, maxQuantity: 10, isActive: true },
      { name: 'Super Slices', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 3, isActive: true },
      { name: 'Garment Guns', category: 'General Supplies', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Garment Needles', category: 'General Supplies', unitPriceCents: 250, maxQuantity: 5, isActive: true },
      { name: 'Furniture Tags (book)', category: 'General Supplies', unitPriceCents: 600, maxQuantity: 6, isActive: true },
      { name: 'Sizing Rings (S–XL)', category: 'General Supplies', unitPriceCents: 350, maxQuantity: 10, isActive: true },
      { name: 'Sizing Ring Squares (S–XL)', category: 'General Supplies', unitPriceCents: 350, maxQuantity: 10, isActive: true },
      { name: "Men's Sizing Rings", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: "Women's Sizing Rings", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: "Women's Sizing Ring Squares", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: "Children's Sizing Rings", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 4, isActive: true },
      { name: 'Large Rubberbands', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 5, isActive: true },
      { name: 'ECOMM Dymo Labels', category: 'General Supplies', unitPriceCents: 450, maxQuantity: 1, isActive: true },
      { name: 'ECOMM Jewelry Bags (bundle)', category: 'General Supplies', unitPriceCents: 300, maxQuantity: 3, isActive: true },
      { name: 'ECOMM Seals (bag of 100)', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 2, isActive: true },
      { name: 'ECOMM Tags (box of 1000)', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'ECOMM Zip Ties (bag of 1000)', category: 'General Supplies', unitPriceCents: 600, maxQuantity: 2, isActive: true },
      { name: 'Clear 8" Zipties', category: 'General Supplies', unitPriceCents: 350, maxQuantity: 1, isActive: true },
      { name: '9 Volt Batteries', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'AA Batteries', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'AAA Batteries', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'C Batteries', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Shirt Hanger Grips', category: 'General Supplies', unitPriceCents: 200, maxQuantity: 2, isActive: true },
      { name: 'Window Squeegee', category: 'General Supplies', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Sterilization Tags (250)', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 4, isActive: true },
      
      // Labels, Tape, & Office Supplies
      { name: 'Sterifab Dispenser', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Safety Labels (sheet of 15)', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 1, isActive: true },
      { name: 'Scotch Tape', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'Yellow Tape', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 500, maxQuantity: 4, isActive: true },
      { name: 'Dry Erase Black', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Dry Erase Green', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Dry Erase Red', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Ballpoint Pens', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 500, maxQuantity: 12, isActive: true },
      { name: 'Highlighters (pack of 6 colors)', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Silver Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 12, isActive: true },
      { name: 'Red Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 12, isActive: true },
      { name: 'Black Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 12, isActive: true },
      { name: 'Counterfeit Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1000, maxQuantity: 12, isActive: true },
      { name: 'Magnum Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Star Post-Its', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 400, maxQuantity: 2, isActive: true },
      { name: 'White Out', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 350, maxQuantity: 1, isActive: true },
      { name: 'Scissors', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Wire Cutters', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Staplers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Staples', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'Safety Box Cutter', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 600, maxQuantity: 6, isActive: true },
      { name: 'Vacuum Belts', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 2, isActive: true },
      { name: 'Truck Seals', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 500, maxQuantity: 45, isActive: true },
      
      // Gloves & PPE
      { name: 'Gloves Heavy Duty – M (one pair)', category: 'Gloves & PPE', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – L (one pair)', category: 'Gloves & PPE', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – XL (one pair)', category: 'Gloves & PPE', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – S (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – M (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – L (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – XL (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Disposable Masks', category: 'Gloves & PPE', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Goggles', category: 'Gloves & PPE', unitPriceCents: 800, maxQuantity: 2, isActive: true },
      
      // Stickers & Tags
      { name: 'White Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'White Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Red Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Red Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Yellow Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Yellow Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Green Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Green Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Blue Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Blue Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Orange Stickers (roll)', category: 'Stickers & Tags', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      
      // Bags & Paper
      { name: 'Reusable Bags – Large Design', category: 'Bags & Paper', unitPriceCents: 200, maxQuantity: 4, isActive: true },
      { name: 'Reusable Bags – Small Blue', category: 'Bags & Paper', unitPriceCents: 150, maxQuantity: 2, isActive: true },
      { name: 'Thermal Paper', category: 'Bags & Paper', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'Rubberbands', category: 'Bags & Paper', unitPriceCents: 500, maxQuantity: 4, isActive: true },
      
      // Nitrile Gloves (merged into Gloves & PPE)
      { name: 'Nitrile Gloves – S (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – M (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – L (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – XL (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      
      // Hangers
      { name: "Children's Hangers", category: 'Hangers', unitPriceCents: 200, maxQuantity: 6, isActive: true },
      { name: 'Shirt Hangers', category: 'Hangers', unitPriceCents: 250, maxQuantity: 10, isActive: true },
      { name: 'Pant Hangers', category: 'Hangers', unitPriceCents: 300, maxQuantity: 10, isActive: true },
      
      // Store Apparel
      { name: 'Aprons', category: 'Store Apparel', unitPriceCents: 800, maxQuantity: 10, isActive: true },
      { name: 'Baseball Caps', category: 'Store Apparel', unitPriceCents: 600, maxQuantity: 10, isActive: true },
      { name: 'Beanies', category: 'Store Apparel', unitPriceCents: 500, maxQuantity: 10, isActive: true },
      
      // Miscellaneous
      { name: 'Sterifab', category: 'Miscellaneous', unitPriceCents: 1200, maxQuantity: 6, isActive: true },
      { name: 'Sortkwik Fingertip Moistener', category: 'Miscellaneous', unitPriceCents: 400, maxQuantity: 2, isActive: true },
      { name: 'Sizing and Colorization Charts', category: 'Miscellaneous', unitPriceCents: 300, maxQuantity: 10, isActive: true },
    ],
  })

  console.log(`Created ${products.count} products`)

  // Seed Uniform Products
  const uniformSizes = JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'])
  const poloColors = JSON.stringify(['Navy Blue', 'Royal Blue', 'White'])
  const dressShirtColors = JSON.stringify(['Red', 'Black', 'White', 'Light Blue', 'Navy Blue', 'Royal Blue', 'Burgundy', 'Light Stone', 'Dark Green'])
  const fleeceColors = JSON.stringify(['Navy'])

  // Short-Sleeve GW Polo Shirt - Unisex
  const shortPoloSizes = JSON.stringify({ XS: 1600, S: 1600, M: 1600, L: 1600, XL: 1600, XXL: 1800, '3XL': 2000, '4XL': 2200 })
  await prisma.product.create({
    data: {
      name: 'Short-Sleeve GW Polo Shirt',
      category: 'Staff Apparel',
      unitPriceCents: 1600,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: poloColors,
      style: 'Unisex',
      sizePriceMap: shortPoloSizes,
    },
  })

  // Long-Sleeve GW Polo Shirt - Unisex
  const longPoloSizes = JSON.stringify({ XS: 2100, S: 2100, M: 2100, L: 2100, XL: 2100, XXL: 2300, '3XL': 2500, '4XL': 2700 })
  await prisma.product.create({
    data: {
      name: 'Long-Sleeve GW Polo Shirt',
      category: 'Staff Apparel',
      unitPriceCents: 2100,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: poloColors,
      style: 'Unisex',
      sizePriceMap: longPoloSizes,
    },
  })

  // Short-Sleeve GW Dress Shirt - Unisex
  const shortDressSizes = JSON.stringify({ XS: 2100, S: 2100, M: 2100, L: 2100, XL: 2100, XXL: 2300, '3XL': 2500, '4XL': 2700 })
  await prisma.product.create({
    data: {
      name: 'Short-Sleeve GW Dress Shirt',
      category: 'Staff Apparel',
      unitPriceCents: 2100,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: dressShirtColors,
      style: 'Unisex',
      sizePriceMap: shortDressSizes,
    },
  })

  // Long-Sleeve GW Dress Shirt - Unisex
  const longDressSizes = JSON.stringify({ XS: 2200, S: 2200, M: 2200, L: 2200, XL: 2200, XXL: 2400, '3XL': 2600, '4XL': 2800 })
  await prisma.product.create({
    data: {
      name: 'Long-Sleeve GW Dress Shirt',
      category: 'Staff Apparel',
      unitPriceCents: 2200,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: dressShirtColors,
      style: 'Unisex',
      sizePriceMap: longDressSizes,
    },
  })

  // GW Fleece Zip Up - Unisex
  const fleeceSizes = JSON.stringify(['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'])
  const fleeceSizePrices = JSON.stringify({ S: 2500, M: 2500, L: 2500, XL: 2500, XXL: 2700, '3XL': 3000, '4XL': 3300 })
  await prisma.product.create({
    data: {
      name: 'GW Fleece Zip Up',
      category: 'Staff Apparel',
      unitPriceCents: 2500,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: fleeceSizes,
      availableColors: fleeceColors,
      style: 'Unisex',
      sizePriceMap: fleeceSizePrices,
    },
  })

  console.log('Created uniform products')

  // Seed ADC Supply Products
  await prisma.product.createMany({
    data: [
      // General Supplies
      { name: 'Rubberbands (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 4, isActive: true },
      { name: 'Magnum Markers (ADC S)', category: 'ADC Supply', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Gloves Heavy Duty – M (one pair) (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – L (one pair) (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – XL (one pair) (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – S (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves – M (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves – L (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves – XL (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nylon Gloves – S (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – M (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – L (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – XL (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Disposable Masks (ADC S)', category: 'ADC Supply', unitPriceCents: 300, maxQuantity: 1, isActive: true },
      { name: 'Case of Water (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 5, isActive: true },
      // Store Apparel
      { name: 'Aprons (ADC S)', category: 'ADC Supply', unitPriceCents: 800, maxQuantity: 5, isActive: true },
      { name: 'Baseball Caps (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 5, isActive: true },
      { name: 'Beanies (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 5, isActive: true },
    ],
  })

  console.log('Created ADC Supply products')

  // Seed ADC Maintenance Products
  await prisma.product.createMany({
    data: [
      { name: 'Toilet Paper (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Toilet Paper Dispensers (single) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Toilet Brush (ADC M)', category: 'ADC Maintenance', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Urinal Block with Screen (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Paper Towels (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Paper Towel Dispensers (single) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Antibacterial Hand Foam Soap (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Soap Dispensers (single) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Disinfectant Foam Cleaner (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Lysol Disinfectant Spray (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 4500, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags – Large (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags – Small (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Bleach (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Quat 64 Concentrate Disinfectant (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 5000, maxQuantity: 1, isActive: true },
      { name: 'Masking Tape (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Sanitary Napkin Bags (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'OneShot Floor Cleaner (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Backbraces (each) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2500, maxQuantity: 2, isActive: true },
      { name: 'Dustpan & Brush (normal length broom) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer Foaming Ref. (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer – single pump bottle (ADC M)', category: 'ADC Maintenance', unitPriceCents: 800, maxQuantity: 1, isActive: true },
    ],
  })

  console.log('Created ADC Maintenance products')

  // Seed Store Maintenance Order products
  await prisma.product.createMany({
    data: [
      { name: 'Toilet Paper (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2000, maxQuantity: 5, isActive: true },
      { name: 'Toilet Paper Dispensers (single) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Toilet Brush (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Urinal Block with Screen (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Paper Towels (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3000, maxQuantity: 4, isActive: true },
      { name: 'Paper Towel Dispensers (single) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Antibacterial Hand Foam Soap (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Soap Dispensers (single) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Disinfectant Foam Cleaner (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 4000, maxQuantity: 2, isActive: true },
      { name: 'Dust Mop Treatment (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Lysol Disinfectant Spray (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 4500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Cherry (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Citrus (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Clean Linen (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Dispensers (single) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Goo Off (can) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Spray Bottle & Trigger (single) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 800, maxQuantity: 4, isActive: true },
      { name: 'Glass Cleaner (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Pine Kleen (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags – Large (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2500, maxQuantity: 2, isActive: true },
      { name: 'Clear Trash Bags – Small (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2000, maxQuantity: 2, isActive: true },
      { name: 'Bleach (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Quat 64 Concentrate Disinfectant (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 5000, maxQuantity: 1, isActive: true },
      { name: 'Twine (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Masking Tape (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Sanitary Napkin Bags (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Cotton Mop Heads 32oz (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Dust Mop Head (dry) 36" (each) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1500, maxQuantity: 12, isActive: true },
      { name: 'OneShot Floor Cleaner (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Backbraces (each) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2500, maxQuantity: 6, isActive: true },
      { name: 'Push Broom 24" - refill (single) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1200, maxQuantity: 0, isActive: true },
      { name: 'Floor Mop (complete) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Heavy Duty Street Broom (complete) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3500, maxQuantity: 2, isActive: true },
      { name: 'Long Handle Scraper (each) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2000, maxQuantity: 3, isActive: true },
      { name: 'Dust Mop (complete set) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 3000, maxQuantity: 3, isActive: true },
      { name: 'Dustpan & Brush (normal length broom) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1500, maxQuantity: 4, isActive: true },
      { name: 'Mop Bucket (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2000, maxQuantity: 2, isActive: true },
      { name: 'Plastic Cups (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Paper Plates (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Spoons - plastic (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Forks - plastic (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Knives - plastic (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Blades for Long Handle Scraper (pack) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 1500, maxQuantity: 4, isActive: true },
      { name: 'Hand Sanitizer Foam Ref. (case) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer – single pump bottle (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 800, maxQuantity: 4, isActive: true },
      { name: 'Newsprint (bundle) (SMO)', category: STORE_MAINTENANCE_ORDER_CATEGORY, unitPriceCents: 500, maxQuantity: 6, isActive: true },
    ],
  })

  console.log('Created Store Maintenance Order products')
  await seedEcomWarehouseProducts(prisma)
  await seedEcomBooksProducts(prisma)
  await seedEbooksMaintenanceProducts(prisma)
  await seedEcommMaintenanceProducts(prisma)

  await migrateStoreSortOrder(prisma)
  await ensureMissingExtraStores(prisma)

  console.log('Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
