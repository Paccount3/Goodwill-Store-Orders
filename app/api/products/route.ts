import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const uniformsOnly = searchParams.get('uniformsOnly') === 'true'
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
      // Also exclude ADC/Housatonic and E-commerce categories (these have dedicated forms)
      conditions.push({
        category: {
          notIn: [
            'ADC Supply',
            'ADC Maintenance',
            'Housatonic Maintenance',
            'Ecom Warehouse',
            'Ecom Books',
          ]
        }
      })
    }

    if (category) {
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

    console.log('Fetching products with where clause:', JSON.stringify(where, null, 2))
    
    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    console.log(`Found ${products.length} products`)
    return NextResponse.json(products)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error?.message || String(error) },
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
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
