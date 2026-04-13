import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  STORE_SUPPLY_DB_CATEGORIES,
  isCatalogGroup,
} from '@/lib/catalog-order-forms'
import { STORE_MAINTENANCE_ORDER_CATEGORY } from '@/lib/product-categories'
import { formatPrismaError, logApiError } from '@/lib/api-prisma-error'

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
        category: {
          notIn: [
            'ADC Supply',
            'ADC Maintenance',
            STORE_MAINTENANCE_ORDER_CATEGORY,
            'Ecom Warehouse',
            'Ecom Books',
            'Ebooks Maintenance',
            'Ecomm Maintenance',
          ]
        }
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
          conditions.push({ category: 'Staff Apparel' })
          break
        case 'adcSupply':
          conditions.push({ category: 'ADC Supply' })
          break
        case 'adcMaintenance':
          conditions.push({ category: 'ADC Maintenance' })
          break
        case 'ebooksSupply':
          conditions.push({ category: 'Ecom Books' })
          break
        case 'ebooksMaintenance':
          conditions.push({ category: 'Ebooks Maintenance' })
          break
        case 'ecommSupply':
          conditions.push({ category: 'Ecom Warehouse' })
          break
        case 'ecommMaintenance':
          conditions.push({ category: 'Ecomm Maintenance' })
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
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
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
    const priceInCents = Math.round(unitPriceCents * 100)

    const product = await prisma.product.create({
      data: {
        name,
        category,
        unitPriceCents: priceInCents,
        maxQuantity: parseInt(maxQuantity),
        isActive: true,
        isUniform: isUniform || false,
        availableSizes: availableSizes ? JSON.stringify(availableSizes) : null,
        availableColors: availableColors ? JSON.stringify(availableColors) : null,
        style: style || null,
        sizePriceMap: sizePriceMap ? JSON.stringify(sizePriceMap) : null,
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
