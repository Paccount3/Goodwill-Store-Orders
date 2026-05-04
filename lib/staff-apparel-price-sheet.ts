import type { PrismaClient } from '@prisma/client'
import { STAFF_APPAREL_CATEGORY } from './product-categories'

/** Canonical GW staff apparel rows (matches org price sheet). */
export type StaffApparelSheetRow = {
  name: string
  style: 'Unisex' | 'Men' | 'Women'
  sortOrder: number
  maxQuantity: number
  sizes: string[]
  colors: string[]
  /** Unit price in dollars for each size key */
  priceDollarsBySize: Record<string, number>
}

const XS_XL = ['XS', 'S', 'M', 'L', 'XL'] as const
const through4XL = [...XS_XL, 'XXL', '3XL', '4XL'] as const

const shortPoloSizes = [...through4XL] as string[]
const shortPoloPrices: Record<string, number> = {}
for (const s of XS_XL) shortPoloPrices[s] = 16
shortPoloPrices['XXL'] = 18
shortPoloPrices['3XL'] = 20
shortPoloPrices['4XL'] = 22

const longWomenSizes = [...through4XL] as string[]
const longWomenPrices: Record<string, number> = {}
for (const s of XS_XL) longWomenPrices[s] = 21
longWomenPrices['XXL'] = 23
longWomenPrices['3XL'] = 25
longWomenPrices['4XL'] = 27

const longMenSizes = [...through4XL] as string[]
const longMenPrices: Record<string, number> = {}
for (const s of XS_XL) longMenPrices[s] = 23
longMenPrices['XXL'] = 25
longMenPrices['3XL'] = 27
longMenPrices['4XL'] = 29

const dressSizes = [...through4XL] as string[]
const dressLongPrices: Record<string, number> = {}
for (const s of XS_XL) dressLongPrices[s] = 22
dressLongPrices['XXL'] = 24
dressLongPrices['3XL'] = 26
dressLongPrices['4XL'] = 28

const dressShortPrices: Record<string, number> = {}
for (const s of XS_XL) dressShortPrices[s] = 21
dressShortPrices['XXL'] = 23
dressShortPrices['3XL'] = 25
dressShortPrices['4XL'] = 27

const fleeceSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']
const fleecePrices: Record<string, number> = {
  S: 25,
  M: 25,
  L: 25,
  XL: 25,
  XXL: 27,
  '3XL': 30,
  '4XL': 33,
}

export const STAFF_APPAREL_PRICE_SHEET_ROWS: StaffApparelSheetRow[] = [
  {
    name: 'Short-Sleeve GW Polo Shirt',
    style: 'Unisex',
    sortOrder: 0,
    maxQuantity: 10,
    sizes: shortPoloSizes,
    colors: ['Navy Blue', 'Royal Blue', 'White'],
    priceDollarsBySize: shortPoloPrices,
  },
  {
    name: "Long-Sleeve GW Polo Shirt (Women's)",
    style: 'Women',
    sortOrder: 1,
    maxQuantity: 10,
    sizes: longWomenSizes,
    colors: ['Navy Blue', 'Royal Blue', 'White'],
    priceDollarsBySize: longWomenPrices,
  },
  {
    name: "Long-Sleeve GW Polo Shirt (Men's)",
    style: 'Men',
    sortOrder: 2,
    maxQuantity: 10,
    sizes: longMenSizes,
    colors: ['Navy Blue', 'Royal Blue', 'White'],
    priceDollarsBySize: longMenPrices,
  },
  {
    name: 'GW Dress Shirt — Long Sleeve',
    style: 'Unisex',
    sortOrder: 3,
    maxQuantity: 10,
    sizes: dressSizes,
    colors: [
      'Red',
      'Black',
      'White',
      'Light Blue',
      'Navy Blue',
      'Royal Blue',
      'Burgundy',
      'Light Stone',
      'Dark Green',
    ],
    priceDollarsBySize: dressLongPrices,
  },
  {
    name: 'GW Dress Shirt — Short Sleeve',
    style: 'Unisex',
    sortOrder: 4,
    maxQuantity: 10,
    sizes: dressSizes,
    colors: [
      'Red',
      'Black',
      'White',
      'Light Blue',
      'Navy Blue',
      'Royal Blue',
      'Burgundy',
      'Light Stone',
      'Dark Green',
    ],
    priceDollarsBySize: dressShortPrices,
  },
  {
    name: 'GW Fleece Zip Up',
    style: 'Unisex',
    sortOrder: 5,
    maxQuantity: 10,
    sizes: fleeceSizes,
    colors: ['Navy Blue'],
    priceDollarsBySize: fleecePrices,
  },
]

export const STAFF_APPAREL_PRICE_SHEET_NAMES = new Set(STAFF_APPAREL_PRICE_SHEET_ROWS.map((r) => r.name))

function rowToCreateData(row: StaffApparelSheetRow) {
  const sizePriceMapCents: Record<string, number> = {}
  for (const [k, v] of Object.entries(row.priceDollarsBySize)) {
    sizePriceMapCents[k] = Math.round(v * 100)
  }
  const minCents = Math.min(...Object.values(sizePriceMapCents))
  return {
    name: row.name,
    category: STAFF_APPAREL_CATEGORY,
    unitPriceCents: minCents,
    sortOrder: row.sortOrder,
    maxQuantity: row.maxQuantity,
    isActive: true,
    isUniform: true,
    availableSizes: JSON.stringify(row.sizes),
    availableColors: JSON.stringify(row.colors),
    style: row.style,
    sizePriceMap: JSON.stringify(sizePriceMapCents),
  }
}

/**
 * Upserts canonical Staff Apparel products from the GW price sheet.
 * - Updates existing rows matched by exact name + category.
 * - Creates missing rows.
 * - Removes legacy placeholder staff polo only when it has no order lines.
 * Does not delete other custom Staff Apparel products.
 */
export async function syncStaffApparelPriceSheetFromSeed(prisma: PrismaClient): Promise<void> {
  for (const row of STAFF_APPAREL_PRICE_SHEET_ROWS) {
    const data = rowToCreateData(row)
    const existing = await prisma.product.findFirst({
      where: { category: STAFF_APPAREL_CATEGORY, name: row.name },
    })
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          unitPriceCents: data.unitPriceCents,
          sortOrder: data.sortOrder,
          maxQuantity: data.maxQuantity,
          isActive: true,
          isUniform: true,
          availableSizes: data.availableSizes,
          availableColors: data.availableColors,
          style: data.style,
          sizePriceMap: data.sizePriceMap,
        },
      })
    } else {
      await prisma.product.create({ data })
    }
  }

  const legacy = await prisma.product.findMany({
    where: {
      category: STAFF_APPAREL_CATEGORY,
      name: { contains: '[Placeholder]' },
    },
    select: { id: true },
  })
  for (const { id } of legacy) {
    const line = await prisma.orderLine.findFirst({ where: { productId: id } })
    if (!line) {
      await prisma.product.delete({ where: { id } })
    } else {
      await prisma.product.update({ where: { id }, data: { isActive: false } })
    }
  }

  console.log(
    `Staff Apparel price sheet: upserted ${STAFF_APPAREL_PRICE_SHEET_ROWS.length} product(s).`
  )
}
