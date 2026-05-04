import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STORE_SUPPLY_DB_CATEGORIES, isCatalogGroup } from '@/lib/catalog-order-forms'
import {
  STORE_MAINTENANCE_ORDER_CATEGORY,
  NSSO_EXCLUDED_CATEGORY_VALUES,
  STAFF_APPAREL_CATEGORY,
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  EBOOKS_SUPPLY_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_SUPPLY_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
} from '@/lib/product-categories'
import { formatPrismaError, logApiError } from '@/lib/api-prisma-error'
import { buildUniformSizePriceMap } from '@/lib/uniform-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const catalogGroup = searchParams.get('catalogGroup')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const uniformsOnly =
      searchParams.get('uniformsOnly') === 'true' ||
      searchParams.get('includeUniforms') === 'true'
    const excludeUniforms = searchParams.get('excludeUniforms') === 'true'

    const where: any = {}

    // Build conditions array for AND logic
    const conditions: any[] = []

    if (activeOnly) {
      conditions.push({ isActive: true })
    }

    if (uniformsOnly) {
      conditions.push({ isUniform: true })
    } else if (excludeUniforms) {
      // Exclude uniforms: isUniform is false or not true
      // For SQLite, we'll just check for false, and products without isUniform set will default to false
      conditions.push({ isUniform: false })
      // Also exclude ADC / Store Maintenance Order and E-commerce categories (these have dedicated forms)
      conditions.push({
        category: { notIn: [...NSSO_EXCLUDED_CATEGORY_VALUES] },
      })
    }

    if (catalogGroup && isCatalogGroup(catalogGroup)) {
      switch (catalogGroup) {
        case 'storeSupply':
          conditions.push({
            category: { in: [...STORE_SUPPLY_DB_CATEGORIES] },
          })
          break
        case 'storeMaintenance':
          conditions.push({ category: STORE_MAINTENANCE_ORDER_CATEGORY })
          break
        case 'staffApparel':
          conditions.push({ category: STAFF_APPAREL_CATEGORY })
          break
        case 'adcSupply':
          conditions.push({ category: ADC_SUPPLY_ORDER_CATEGORY })
          break
        case 'adcMaintenance':
          conditions.push({ category: ADC_MAINTENANCE_ORDER_CATEGORY })
          break
        case 'ebooksSupply':
          conditions.push({ category: EBOOKS_SUPPLY_ORDER_CATEGORY })
          break
        case 'ebooksMaintenance':
          conditions.push({ category: EBOOKS_MAINTENANCE_ORDER_CATEGORY })
          break
        case 'ecommSupply':
          conditions.push({ category: ECOMM_SUPPLY_ORDER_CATEGORY })
          break
        case 'ecommMaintenance':
          conditions.push({ category: ECOMM_MAINTENANCE_ORDER_CATEGORY })
          break
      }
    } else if (category) {
      conditions.push({ category })
    }

    if (search) {
      // SQLite doesn't support case-insensitive mode
      conditions.push({ name: { contains: search } })
    }

    // Combine all conditions with AND
    if (conditions.length === 1) {
      Object.assign(where, conditions[0])
    } else if (conditions.length > 1) {
      where.AND = conditions
    }

    console.log('[api/products] GET where:', JSON.stringify(where, null, 2))

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    })

    console.log(`[api/products] GET ok, count=${products.length}`)
    return NextResponse.json(products)
  } catch (error: unknown) {
    logApiError('api/products', 'GET', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: formatPrismaError(error),
        code: 'PRODUCTS_QUERY_FAILED',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      category, 
      unitPriceCents, 
      maxQuantity, 
      isUniform, 
      availableSizes, 
      availableColors, 
      style, 
      sizePriceMap 
    } = body

    if (!name || !category || unitPriceCents === undefined || maxQuantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, unitPriceCents, maxQuantity' },
        { status: 400 }
      )
    }

    // Convert dollars to cents if needed
    const priceInCents = Math.round(Number(unitPriceCents) * 100)

    let finalIsUniform = Boolean(isUniform)
    let sizesJson: string | null = null
    let colorsJson: string | null = null
    let styleVal: string | null = style || null
    let sizeMapJson: string | null = null

    if (category === STAFF_APPAREL_CATEGORY) {
      const sizes = Array.isArray(availableSizes) ? availableSizes : null
      const colors = Array.isArray(availableColors) ? availableColors : null
      if (!sizes?.length || !colors?.length) {
        return NextResponse.json(
          {
            error:
              'Staff Apparel requires availableSizes and availableColors (non-empty arrays of strings)',
          },
          { status: 400 }
        )
      }
      finalIsUniform = true
      sizesJson = JSON.stringify(sizes)
      colorsJson = JSON.stringify(colors)
      const map =
        sizePriceMap && typeof sizePriceMap === 'object' && !Array.isArray(sizePriceMap)
          ? (sizePriceMap as Record<string, number>)
          : buildUniformSizePriceMap(sizes.map(String), priceInCents)
      sizeMapJson = JSON.stringify(map)
    } else {
      sizesJson = availableSizes ? JSON.stringify(availableSizes) : null
      colorsJson = availableColors ? JSON.stringify(availableColors) : null
      sizeMapJson = sizePriceMap ? JSON.stringify(sizePriceMap) : null
    }

    let storedUnitPriceCents = priceInCents
    if (category === STAFF_APPAREL_CATEGORY && sizeMapJson) {
      try {
        const m = JSON.parse(sizeMapJson) as Record<string, number>
        const min = Math.min(...Object.values(m).map((v) => Number(v)))
        if (Number.isFinite(min)) storedUnitPriceCents = min
      } catch {
        // keep priceInCents
      }
    }

    const maxAgg = await prisma.product.aggregate({
      where: { category },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxAgg._max.sortOrder ?? -1) + 1

    const product = await prisma.product.create({
      data: {
        name,
        category,
        unitPriceCents: storedUnitPriceCents,
        sortOrder: nextSortOrder,
        maxQuantity: parseInt(maxQuantity, 10),
        isActive: true,
        isUniform: finalIsUniform,
        availableSizes: sizesJson,
        availableColors: colorsJson,
        style: styleVal,
        sizePriceMap: sizeMapJson,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: unknown) {
    logApiError('api/products', 'POST', error)
    return NextResponse.json(
      { error: 'Failed to create product', details: formatPrismaError(error) },
      { status: 500 }
    )
  }
}
