/**
 * Item Catalog filter + labels aligned with order forms.
 * Product rows still use granular `Product.category` values in the database.
 */

import { STORE_MAINTENANCE_ORDER_CATEGORY } from './product-categories'

export const STORE_SUPPLY_DB_CATEGORIES = [
  'General Supplies',
  'Labels, Tape, & Office Supplies',
  'Gloves & PPE',
  'Stickers & Tags',
  'Bags & Paper',
  'Hangers',
  'Store Apparel',
  'Miscellaneous',
] as const

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
  storeSupply: 'Store Supply Order',
  storeMaintenance: 'Store Maintenance Order',
  staffApparel: 'Staff Apparel',
  adcSupply: 'ADC Supply Order',
  adcMaintenance: 'ADC Maintenance Order',
  ebooksSupply: 'Ebooks Supply Order',
  ebooksMaintenance: 'Ebooks Maintenance Order',
  ecommSupply: 'Ecomm Supply Order',
  ecommMaintenance: 'Ecomm Maintenance Order',
}

/** Order of entries in the category filter dropdown */
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
 * Non–store-supply DB categories, in on-page section order.
 * Matches filter / form order after Store Supply Order: maintenance → staff → ADC → ebooks → ecomm.
 */
export const ORDER_FORM_DB_CATEGORY_ORDER = [
  STORE_MAINTENANCE_ORDER_CATEGORY,
  'Staff Apparel',
  'ADC Supply',
  'ADC Maintenance',
  'Ecom Books',
  'Ebooks Maintenance',
  'Ecom Warehouse',
  'Ecomm Maintenance',
] as const

/** Section titles for grouped catalog tables (DB category → heading) */
export const DB_CATEGORY_SECTION_LABEL: Record<string, string> = {
  'ADC Supply': CATALOG_GROUP_LABELS.adcSupply,
  'ADC Maintenance': CATALOG_GROUP_LABELS.adcMaintenance,
  [STORE_MAINTENANCE_ORDER_CATEGORY]: CATALOG_GROUP_LABELS.storeMaintenance,
  'Staff Apparel': CATALOG_GROUP_LABELS.staffApparel,
  'Ecom Warehouse': CATALOG_GROUP_LABELS.ecommSupply,
  'Ecom Books': CATALOG_GROUP_LABELS.ebooksSupply,
  'Ebooks Maintenance': CATALOG_GROUP_LABELS.ebooksMaintenance,
  'Ecomm Maintenance': CATALOG_GROUP_LABELS.ecommMaintenance,
  'Staff Uniforms': CATALOG_GROUP_LABELS.staffApparel,
}

/** Add-product datalist: granular DB `category` strings (store supply stays split). */
export const ADD_PRODUCT_DB_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  ...STORE_SUPPLY_DB_CATEGORIES.map((c) => ({ value: c, label: c })),
  { value: 'Staff Apparel', label: 'Staff Apparel' },
  { value: 'ADC Supply', label: 'ADC Supply Order' },
  { value: 'ADC Maintenance', label: 'ADC Maintenance Order' },
  { value: STORE_MAINTENANCE_ORDER_CATEGORY, label: 'Store Maintenance Order' },
  { value: 'Ecom Warehouse', label: 'Ecomm Supply Order' },
  { value: 'Ecom Books', label: 'Ebooks Supply Order' },
  { value: 'Ebooks Maintenance', label: 'Ebooks Maintenance Order' },
  { value: 'Ecomm Maintenance', label: 'Ecomm Maintenance Order' },
]

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
