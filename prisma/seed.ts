import { PrismaClient } from '@prisma/client'
import {
  STORE_MAINTENANCE_ORDER_CATEGORY,
  STORE_SUPPLY_ORDER_CATEGORY,
  STAFF_APPAREL_CATEGORY,
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  EBOOKS_SUPPLY_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_SUPPLY_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
} from '../lib/product-categories'
import { syncStaffApparelPriceSheetFromSeed } from '../lib/staff-apparel-price-sheet'
import { DEFAULT_VENDOR_NAMES, DEFAULT_VENDOR_NAME } from '../lib/default-vendors'
import {
  DAILY_ANNOUNCEMENT_ID,
  DEFAULT_DAILY_ANNOUNCEMENT,
} from '../lib/daily-announcement-defaults'

const prisma = new PrismaClient()

/**
 * Manual bootstrap only — do not run from Vercel/Railway start hooks or deploy pipelines.
 * Seeds a minimal placeholder catalog (one item per order form) on empty DBs so admins can
 * replace/extend products through the Item Catalog.
 */
const LEGACY_STORE_MAINTENANCE_CATEGORY = 'Housatonic Maintenance'

const DEFAULT_STORE_SEED: { storeNumber: string; name: string }[] = [
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
]

/** Regional / HQ locations beyond core retail 01–20 */
const DEFAULT_EXTRA_STORES: { storeNumber: string; name: string }[] = [
  { storeNumber: '21', name: 'Bridgeport Headquarters' },
  { storeNumber: '22', name: 'Cheshire CR' },
  { storeNumber: '23', name: 'Greenwich ADC' },
  { storeNumber: '24', name: 'Hartford Campus' },
  { storeNumber: '25', name: 'Manchester CR' },
  { storeNumber: '26', name: 'Ridgefield ADC' },
  { storeNumber: '27', name: 'Riverside ADC' },
  { storeNumber: '28', name: 'Hartford ADC' },
  { storeNumber: '29', name: 'Ecomm' },
  { storeNumber: '30', name: 'Ebooks' },
]

async function migrateProductCategoryNames(prismaInstance: PrismaClient) {
  const result = await prismaInstance.product.updateMany({
    where: { category: 'Staff Uniforms' },
    data: { category: 'Staff Apparel' },
  })
  if (result.count > 0) {
    console.log(`Migrated ${result.count} product(s): Staff Uniforms → Staff Apparel`)
  }
}

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

async function ensureDefaultVendors(prismaInstance: PrismaClient): Promise<number> {
  for (let i = 0; i < DEFAULT_VENDOR_NAMES.length; i++) {
    const name = DEFAULT_VENDOR_NAMES[i]
    await prismaInstance.vendor.upsert({
      where: { name },
      create: { name, sortOrder: i },
      update: { sortOrder: i },
    })
  }
  const other = await prismaInstance.vendor.findUnique({
    where: { name: DEFAULT_VENDOR_NAME },
    select: { id: true },
  })
  if (!other) throw new Error(`Default vendor "${DEFAULT_VENDOR_NAME}" is missing`)
  return other.id
}

/** One placeholder per non–Staff-Apparel form. Staff Apparel is synced from the GW price sheet separately. */
async function seedMinimalPlaceholderCatalog(prismaInstance: PrismaClient, defaultVendorId: number) {
  await prismaInstance.product.createMany({
    data: [
      {
        name: '[Placeholder] Store Supply — replace in Item Catalog',
        category: STORE_SUPPLY_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
      {
        name: '[Placeholder] Store Maintenance — replace in Item Catalog',
        category: STORE_MAINTENANCE_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
      {
        name: '[Placeholder] ADC Supply — replace in Item Catalog',
        category: ADC_SUPPLY_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
      {
        name: '[Placeholder] ADC Maintenance — replace in Item Catalog',
        category: ADC_MAINTENANCE_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
      {
        name: '[Placeholder] Ebooks Supply — replace in Item Catalog',
        category: EBOOKS_SUPPLY_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
      {
        name: '[Placeholder] Ebooks Maintenance — replace in Item Catalog',
        category: EBOOKS_MAINTENANCE_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
      {
        name: '[Placeholder] Ecomm Supply — replace in Item Catalog',
        category: ECOMM_SUPPLY_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
      {
        name: '[Placeholder] Ecomm Maintenance — replace in Item Catalog',
        category: ECOMM_MAINTENANCE_ORDER_CATEGORY,
        unitPriceCents: 100,
        maxQuantity: 5,
        isActive: true,
        vendorId: defaultVendorId,
      },
    ],
  })

  console.log('Created 8 placeholder products (non–Staff-Apparel forms).')
}

async function main() {
  console.log('Seeding database...')

  await migrateProductCategoryNames(prisma)
  await migrateStoreMaintenanceProductSuffixHmToSmo(prisma)
  await migrateStoreMaintenanceCategoryName(prisma)
  await migrateStoreSortOrder(prisma)
  await ensureDefaultVendors(prisma)

  const storeCount = await prisma.store.count()
  const productCount = await prisma.product.count()

  if (storeCount === 0 && productCount === 0) {
    console.log('Empty database: creating stores and minimal placeholder catalog.')
    const defaultVendorId = await ensureDefaultVendors(prisma)
    await prisma.store.createMany({ data: DEFAULT_STORE_SEED })
    console.log(`Created ${DEFAULT_STORE_SEED.length} stores`)
    await seedMinimalPlaceholderCatalog(prisma, defaultVendorId)
    await migrateStoreSortOrder(prisma)
    await ensureMissingExtraStores(prisma)
    await syncStaffApparelPriceSheetFromSeed(prisma)
    await ensureDailyAnnouncement(prisma)
    console.log('Seeding completed.')
    return
  }

  await ensureMissingExtraStores(prisma)
  console.log(
    'Database already has data; skipped inserting catalog. Apply prisma migrations (e.g. trim to one product per category) and manage products in the Item Catalog.'
  )
  await syncStaffApparelPriceSheetFromSeed(prisma)
  await ensureDailyAnnouncement(prisma)
}

async function ensureDailyAnnouncement(prismaInstance: PrismaClient) {
  await prismaInstance.dailyAnnouncement.upsert({
    where: { id: DAILY_ANNOUNCEMENT_ID },
    create: {
      id: DAILY_ANNOUNCEMENT_ID,
      title: DEFAULT_DAILY_ANNOUNCEMENT.title,
      body: DEFAULT_DAILY_ANNOUNCEMENT.body,
      isEnabled: DEFAULT_DAILY_ANNOUNCEMENT.isEnabled,
    },
    update: {},
  })
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
