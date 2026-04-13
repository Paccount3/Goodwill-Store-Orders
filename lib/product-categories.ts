/**
 * Canonical `Product.category` values — one string per order form.
 * Stored in Postgres (e.g. Supabase) via Prisma; admin/catalog CRUD updates these rows.
 */

export const STORE_SUPPLY_ORDER_CATEGORY = 'Store Supply Order' as const
export const STORE_MAINTENANCE_ORDER_CATEGORY = 'Store Maintenance Order' as const
export const STAFF_APPAREL_CATEGORY = 'Staff Apparel' as const
export const ADC_SUPPLY_ORDER_CATEGORY = 'ADC Supply Order' as const
export const ADC_MAINTENANCE_ORDER_CATEGORY = 'ADC Maintenance Order' as const
export const EBOOKS_SUPPLY_ORDER_CATEGORY = 'Ebooks Supply Order' as const
export const EBOOKS_MAINTENANCE_ORDER_CATEGORY = 'Ebooks Maintenance Order' as const
export const ECOMM_SUPPLY_ORDER_CATEGORY = 'Ecomm Supply Order' as const
export const ECOMM_MAINTENANCE_ORDER_CATEGORY = 'Ecomm Maintenance Order' as const

/** All nine values, in the same order as the Item Catalog dropdown. */
export const PRODUCT_ORDER_FORM_CATEGORIES = [
  STORE_SUPPLY_ORDER_CATEGORY,
  STORE_MAINTENANCE_ORDER_CATEGORY,
  STAFF_APPAREL_CATEGORY,
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  EBOOKS_SUPPLY_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_SUPPLY_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
] as const

export type ProductOrderFormCategory = (typeof PRODUCT_ORDER_FORM_CATEGORIES)[number]

/** Pre-migration granular NSSO labels (replaced by Store Supply Order). */
export const LEGACY_GRANULAR_STORE_SUPPLY_CATEGORIES = [
  'General Supplies',
  'Labels, Tape, & Office Supplies',
  'Gloves & PPE',
  'Stickers & Tags',
  'Bags & Paper',
  'Hangers',
  'Store Apparel',
  'Miscellaneous',
] as const

/** Pre-migration names for non-NSSO order forms (for stats filters on existing DBs). */
export const LEGACY_OTHER_ORDER_FORM_CATEGORIES = [
  'ADC Supply',
  'ADC Maintenance',
  'Ecom Warehouse',
  'Ecom Books',
  'Ebooks Maintenance',
  'Ecomm Maintenance',
] as const

/**
 * NSSO product fetch (`excludeUniforms`): omit products that belong to another order form.
 */
export const NON_NSSO_PRODUCT_CATEGORIES: readonly string[] = [
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  STORE_MAINTENANCE_ORDER_CATEGORY,
  STAFF_APPAREL_CATEGORY,
  EBOOKS_SUPPLY_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_SUPPLY_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
]

/**
 * Canonical + legacy DB strings excluded from NSSO (`excludeUniforms` / stats “Store Supply” product list).
 */
export const NSSO_EXCLUDED_CATEGORY_VALUES: readonly string[] = [
  ...NON_NSSO_PRODUCT_CATEGORIES,
  ...LEGACY_OTHER_ORDER_FORM_CATEGORIES,
]

/**
 * Order Stats / insights UI value for the aggregated NSSO bucket (not stored on Product rows).
 */
export const ORDER_STATS_STORE_SUPPLY_UI = 'Store Supply' as const

/**
 * Categories that use a single aggregate “store” row in stats (no per-store breakdown).
 */
export const INSIGHTS_NON_STORE_CATEGORIES: readonly string[] = [
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  STORE_MAINTENANCE_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
]

/** Pre-migration names still used in bookmarks or old rows. */
const LEGACY_INSIGHTS_NON_STORE_EXTRA = [
  'ADC Supply',
  'ADC Maintenance',
  'Ebooks Maintenance',
  'Ecomm Maintenance',
] as const

export function isInsightsNonStoreCategory(category: string | null | undefined): boolean {
  if (!category) return false
  if (INSIGHTS_NON_STORE_CATEGORIES.includes(category)) return true
  return (LEGACY_INSIGHTS_NON_STORE_EXTRA as readonly string[]).includes(category)
}

/** Categories that belong to a dedicated order form other than NSSO aggregate (new + legacy DB values). */
const OTHER_ORDER_FORM_CATEGORIES_SET = new Set<string>([
  ...NON_NSSO_PRODUCT_CATEGORIES,
  ...LEGACY_OTHER_ORDER_FORM_CATEGORIES,
])

/** True if this product category is counted in the Order Stats “Store Supply” aggregate. */
export function isNssoStoreSupplyStatsCategory(category: string): boolean {
  if (OTHER_ORDER_FORM_CATEGORIES_SET.has(category)) return false
  if (category === STORE_SUPPLY_ORDER_CATEGORY) return true
  return (LEGACY_GRANULAR_STORE_SUPPLY_CATEGORIES as readonly string[]).includes(category)
}

/** Map pre-migration `Product.category` values to the canonical name (identity if already canonical). */
const LEGACY_TO_CANONICAL_CATEGORY: Record<string, string> = {
  'ADC Supply': ADC_SUPPLY_ORDER_CATEGORY,
  'ADC Maintenance': ADC_MAINTENANCE_ORDER_CATEGORY,
  'Ecom Books': EBOOKS_SUPPLY_ORDER_CATEGORY,
  'Ecom Warehouse': ECOMM_SUPPLY_ORDER_CATEGORY,
  'Ebooks Maintenance': EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  'Ecomm Maintenance': ECOMM_MAINTENANCE_ORDER_CATEGORY,
}

export function canonicalProductCategory(category: string): string {
  return LEGACY_TO_CANONICAL_CATEGORY[category] ?? category
}

/** Compare a product row’s category to an order-stats / insights filter (supports legacy DB values). */
export function productCategoryMatchesStatsFilter(productCategory: string, filterCategory: string): boolean {
  return canonicalProductCategory(productCategory) === canonicalProductCategory(filterCategory)
}

/** Values to pass to Prisma `in` when loading products for a stats filter (canonical + legacy aliases). */
export function dbCategoryValuesForStatsFilter(filterCategory: string): string[] {
  const canon = canonicalProductCategory(filterCategory)
  const out = new Set<string>([canon])
  for (const [legacy, mapped] of Object.entries(LEGACY_TO_CANONICAL_CATEGORY)) {
    if (mapped === canon) out.add(legacy)
  }
  return [...out]
}
