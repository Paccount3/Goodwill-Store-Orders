import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('storeId')
    const productId = searchParams.get('productId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const minSubtotal = searchParams.get('minSubtotal')
    const maxSubtotal = searchParams.get('maxSubtotal')
    const orderType = searchParams.get('orderType')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}

    if (storeId) {
      where.storeId = parseInt(storeId)
    }

    if (dateFrom || dateTo) {
      where.orderDate = {}
      if (dateFrom) {
        where.orderDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        where.orderDate.lte = toDate
      }
    }

    if (minSubtotal || maxSubtotal) {
      where.subtotalCents = {}
      if (minSubtotal) {
        // Convert dollars to cents
        where.subtotalCents.gte = Math.round(parseFloat(minSubtotal) * 100)
      }
      if (maxSubtotal) {
        // Convert dollars to cents
        where.subtotalCents.lte = Math.round(parseFloat(maxSubtotal) * 100)
      }
    }

    if (orderType) {
      // Map display values to database values
      const orderTypeMap: Record<string, string> = {
        'NSSO': 'NSSO',
        'SU': 'SU',
        'ADC S': 'ADC_S',
        'ADC M': 'ADC_M',
        'HM': 'HM',
      }
      where.orderType = orderTypeMap[orderType] || orderType
    }

    if (search) {
      // SQLite doesn't support case-insensitive mode, so we'll filter after fetching
      // For now, use case-sensitive contains
      where.OR = [
        { managerName: { contains: search } },
        { store: { name: { contains: search } } },
        { store: { storeNumber: { contains: search } } },
      ]
    }

    if (productId) {
      where.orderLines = {
        some: {
          productId: parseInt(productId),
        },
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        store: true,
        orderLines: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, managerName, orderDate, notes, orderType, lineItems } = body

    if (!storeId || !managerName || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate subtotal
    let subtotalCents = 0
    const orderLinesData = []

    for (const item of lineItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        )
      }

      const orderQuantity = item.orderQuantity || item.quantity || 0
      const currentQuantity = item.currentQuantity || item.current || 0
      const size = item.size || null
      const color = item.color || null
      const style = item.style || null

      if (orderQuantity < 1) {
        return NextResponse.json(
          { error: 'Order quantity must be at least 1' },
          { status: 400 }
        )
      }

      // For uniforms, use sizePriceMap if available, otherwise use base price
      let unitPriceCents = product.unitPriceCents
      if (product.isUniform && product.sizePriceMap && size) {
        try {
          const sizePriceMap = JSON.parse(product.sizePriceMap)
          if (sizePriceMap[size]) {
            unitPriceCents = sizePriceMap[size]
          }
        } catch (e) {
          // If parsing fails, use base price
          console.error('Error parsing sizePriceMap:', e)
        }
      }

      const lineTotal = unitPriceCents * orderQuantity
      subtotalCents += lineTotal

      orderLinesData.push({
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceCentsSnapshot: unitPriceCents,
        currentQuantity: currentQuantity,
        orderQuantity: orderQuantity,
        lineTotalCents: lineTotal,
        size,
        color,
        style,
      })
    }

    // Always use today's date at midnight local time to avoid timezone issues
    // Create date in local timezone, then convert to ISO string and parse back to avoid UTC conversion
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    // Create date at midnight in local timezone (not UTC)
    const todayLocal = new Date(year, month, day, 0, 0, 0, 0)
    
    const order = await prisma.order.create({
      data: {
        storeId: parseInt(storeId),
        managerName,
        orderDate: todayLocal, // Always use today's date at local midnight
        notes: notes || null,
        orderType: orderType || null,
        subtotalCents,
        orderLines: {
          create: orderLinesData,
        },
      },
      include: {
        store: true,
        orderLines: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
