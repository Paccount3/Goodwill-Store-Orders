/**
 * Item Catalog filter + labels aligned with order forms.
 * `Product.category` uses the canonical strings in `lib/product-categories.ts`.
 */

import {
  STORE_SUPPLY_ORDER_CATEGORY,
  STORE_MAINTENANCE_ORDER_CATEGORY,
  STAFF_APPAREL_CATEGORY,
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  EBOOKS_SUPPLY_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_SUPPLY_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
  PRODUCT_ORDER_FORM_CATEGORIES,
} from './product-categories'

/** NSSO aggregate: one DB category for all store-supply items. */
export const STORE_SUPPLY_DB_CATEGORIES = [STORE_SUPPLY_ORDER_CATEGORY] as const

export type CatalogGroup =
  | 'storeSupply'
  | 'storeMaintenance'
  | 'staffApparel'
  | 'adcSupply'
  | 'adcMaintenance'
  | 'ebooksSupply'
  | 'ebooksMaintenance'
  | 'ecommSupply'
  | 'ecommMaintenance'

export const CATALOG_GROUP_LABELS: Record<CatalogGroup, string> = {
  storeSupply: STORE_SUPPLY_ORDER_CATEGORY,
  storeMaintenance: STORE_MAINTENANCE_ORDER_CATEGORY,
  staffApparel: STAFF_APPAREL_CATEGORY,
  adcSupply: ADC_SUPPLY_ORDER_CATEGORY,
  adcMaintenance: ADC_MAINTENANCE_ORDER_CATEGORY,
  ebooksSupply: EBOOKS_SUPPLY_ORDER_CATEGORY,
  ebooksMaintenance: EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ecommSupply: ECOMM_SUPPLY_ORDER_CATEGORY,
  ecommMaintenance: ECOMM_MAINTENANCE_ORDER_CATEGORY,
}

/** Order of entries in the catalog “Order form” filter dropdown */
export const CATALOG_GROUP_OPTIONS: { value: CatalogGroup; label: string }[] = [
  { value: 'storeSupply', label: CATALOG_GROUP_LABELS.storeSupply },
  { value: 'storeMaintenance', label: CATALOG_GROUP_LABELS.storeMaintenance },
  { value: 'staffApparel', label: CATALOG_GROUP_LABELS.staffApparel },
  { value: 'adcSupply', label: CATALOG_GROUP_LABELS.adcSupply },
  { value: 'adcMaintenance', label: CATALOG_GROUP_LABELS.adcMaintenance },
  { value: 'ebooksSupply', label: CATALOG_GROUP_LABELS.ebooksSupply },
  { value: 'ebooksMaintenance', label: CATALOG_GROUP_LABELS.ebooksMaintenance },
  { value: 'ecommSupply', label: CATALOG_GROUP_LABELS.ecommSupply },
  { value: 'ecommMaintenance', label: CATALOG_GROUP_LABELS.ecommMaintenance },
]

/**
 * Non–store-supply DB categories, in on-page section order (below the NSSO block).
 */
export const ORDER_FORM_DB_CATEGORY_ORDER = [
  STORE_MAINTENANCE_ORDER_CATEGORY,
  STAFF_APPAREL_CATEGORY,
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  EBOOKS_SUPPLY_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_SUPPLY_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
] as const

/** Section titles for grouped catalog tables */
export const DB_CATEGORY_SECTION_LABEL: Record<string, string> = {
  [STORE_SUPPLY_ORDER_CATEGORY]: STORE_SUPPLY_ORDER_CATEGORY,
  [STORE_MAINTENANCE_ORDER_CATEGORY]: STORE_MAINTENANCE_ORDER_CATEGORY,
  [STAFF_APPAREL_CATEGORY]: STAFF_APPAREL_CATEGORY,
  [ADC_SUPPLY_ORDER_CATEGORY]: ADC_SUPPLY_ORDER_CATEGORY,
  [ADC_MAINTENANCE_ORDER_CATEGORY]: ADC_MAINTENANCE_ORDER_CATEGORY,
  [EBOOKS_SUPPLY_ORDER_CATEGORY]: EBOOKS_SUPPLY_ORDER_CATEGORY,
  [EBOOKS_MAINTENANCE_ORDER_CATEGORY]: EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  [ECOMM_SUPPLY_ORDER_CATEGORY]: ECOMM_SUPPLY_ORDER_CATEGORY,
  [ECOMM_MAINTENANCE_ORDER_CATEGORY]: ECOMM_MAINTENANCE_ORDER_CATEGORY,
  'Staff Uniforms': STAFF_APPAREL_CATEGORY,
}

/** Add-product datalist: canonical category strings only. */
export const ADD_PRODUCT_DB_CATEGORY_OPTIONS: { value: string; label: string }[] =
  PRODUCT_ORDER_FORM_CATEGORIES.map((c) => ({ value: c, label: c }))

export function isCatalogGroup(s: string | null): s is CatalogGroup {
  return (
    s !== null &&
    [
      'storeSupply',
      'storeMaintenance',
      'staffApparel',
      'adcSupply',
      'adcMaintenance',
      'ebooksSupply',
      'ebooksMaintenance',
      'ecommSupply',
      'ecommMaintenance',
    ].includes(s)
  )
}
