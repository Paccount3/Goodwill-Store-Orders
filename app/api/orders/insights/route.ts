import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STORE_MAINTENANCE_ORDER_CATEGORY } from '@/lib/product-categories'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const category = searchParams.get('category')
    const storeIds = searchParams.get('storeIds') // Comma-separated list of store IDs

    const where: any = {}
    
    if (year || month) {
      where.orderDate = {}
      if (year) {
        const yearNum = parseInt(year)
        where.orderDate.gte = new Date(yearNum, 0, 1)
        where.orderDate.lt = new Date(yearNum + 1, 0, 1)
      }
      if (month) {
        const monthNum = parseInt(month) - 1 // 0-indexed
        const yearNum = year ? parseInt(year) : new Date().getFullYear()
        where.orderDate.gte = new Date(yearNum, monthNum, 1)
        where.orderDate.lt = new Date(yearNum, monthNum + 1, 1)
      }
    }

    // Filter by store IDs if provided
    if (storeIds) {
      const storeIdArray = storeIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      if (storeIdArray.length > 0) {
        where.storeId = { in: storeIdArray }
      }
    }

    // Get all orders with their lines and stores
    const orders = await prisma.order.findMany({
      where,
      include: {
        store: true,
        orderLines: {
          include: {
            product: true,
          },
        },
      },
    })

    // Check if this is a non-store category (not associated with stores)
    const isNonStoreCategory =
      category === 'ADC Supply' ||
      category === 'ADC Maintenance' ||
      category === STORE_MAINTENANCE_ORDER_CATEGORY ||
      category === 'Ebooks Maintenance' ||
      category === 'Ecomm Maintenance'

    // Filter orders by category if specified
    let filteredOrders = orders
    if (category) {
      if (category === 'Store Supply') {
        // Exclude non-store and specialized categories
        filteredOrders = orders.filter((order) =>
          order.orderLines.some(
            (line) =>
              line.product.category !== 'ADC Supply' &&
              line.product.category !== 'ADC Maintenance' &&
              line.product.category !== STORE_MAINTENANCE_ORDER_CATEGORY &&
              line.product.category !== 'Staff Apparel' &&
              line.product.category !== 'Ecom Warehouse' &&
              line.product.category !== 'Ecom Books' &&
              line.product.category !== 'Ebooks Maintenance' &&
              line.product.category !== 'Ecomm Maintenance'
          )
        )
      } else if (category === 'Staff Apparel') {
        // Only include orders with uniform products
        filteredOrders = orders.filter((order) =>
          order.orderLines.some((line) => line.product.isUniform === true)
        )
      } else {
        // Filter by specific category
        filteredOrders = orders.filter((order) =>
          order.orderLines.some((line) => line.product.category === category)
        )
      }
    }

    // Calculate total spend
    const totalSpendCents = filteredOrders.reduce(
      (sum, order) => sum + order.subtotalCents,
      0
    )

    // Calculate spend per store and order counts
    const storeSpend: Record<number, { storeId: number; storeName: string; spendCents: number; orderCount: number }> = {}
    
    if (isNonStoreCategory) {
      // For non-store categories, aggregate all into a single entry
      const totalSpend = filteredOrders.reduce((sum, order) => sum + order.subtotalCents, 0)
      const nonStoreDisplayName =
        category === STORE_MAINTENANCE_ORDER_CATEGORY
          ? 'Store Maintenance Order'
          : category === 'Ebooks Maintenance'
          ? 'Ebooks Maintenance'
          : category === 'Ecomm Maintenance'
          ? 'Ecomm Maintenance'
          : (category || 'Unknown')
      storeSpend[-1] = {
        storeId: -1,
        storeName: nonStoreDisplayName,
        spendCents: totalSpend,
        orderCount: filteredOrders.length,
      }
    } else {
      filteredOrders.forEach((order) => {
        if (!storeSpend[order.storeId]) {
          storeSpend[order.storeId] = {
            storeId: order.storeId,
            storeName: order.store.name,
            spendCents: 0,
            orderCount: 0,
          }
        }
        storeSpend[order.storeId].spendCents += order.subtotalCents
        storeSpend[order.storeId].orderCount += 1
      })
    }

    const spendPerStore = Object.values(storeSpend)
      .sort((a, b) => b.spendCents - a.spendCents)
      .map((item) => ({
        storeId: item.storeId,
        storeName: item.storeName,
        spendCents: item.spendCents,
        orderCount: item.orderCount,
      }))

    // Calculate spend per item and total quantities
    const itemSpend: Record<number, { productId: number; productName: string; spendCents: number; orderCount: number }> = {}
    
    filteredOrders.forEach((order) => {
      order.orderLines.forEach((line) => {
        // Only include lines that match the category filter
        if (category) {
          if (category === 'Store Supply') {
            if (
              line.product.category === 'ADC Supply' ||
              line.product.category === 'ADC Maintenance' ||
              line.product.category === STORE_MAINTENANCE_ORDER_CATEGORY ||
              line.product.category === 'Staff Apparel'
            ) {
              return // Skip this line
            }
          } else if (category === 'Staff Apparel') {
            if (line.product.isUniform !== true) {
              return // Skip this line
            }
          } else {
            if (line.product.category !== category) {
              return // Skip this line
            }
          }
        }

        if (!itemSpend[line.productId]) {
          itemSpend[line.productId] = {
            productId: line.productId,
            productName: line.productNameSnapshot,
            spendCents: 0,
            orderCount: 0,
          }
        }
        itemSpend[line.productId].spendCents += line.lineTotalCents
        // Sum the orderQuantity (number of items), not count orders
        const quantity = line.orderQuantity || (line as any).quantity || 0
        itemSpend[line.productId].orderCount += quantity
      })
    })

    const spendPerItem = Object.values(itemSpend)
      .sort((a, b) => b.spendCents - a.spendCents)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        spendCents: item.spendCents,
        orderCount: item.orderCount,
      }))

    return NextResponse.json({
      totalSpendCents,
      spendPerStore,
      spendPerItem,
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
