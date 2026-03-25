import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const storeId = searchParams.get('storeId')
    const productId = searchParams.get('productId')
    const orderType = searchParams.get('orderType')

    const where: any = {}
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

    if (storeId) {
      where.storeId = parseInt(storeId)
    }

    if (orderType) {
      where.orderType = orderType
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
    })

    // Total spend
    const totalSpendCents = orders.reduce((sum, order) => sum + order.subtotalCents, 0)

    // Top stores by spend (top 3)
    const storeSpend: Record<number, number> = {}
    orders.forEach((order) => {
      storeSpend[order.storeId] = (storeSpend[order.storeId] || 0) + order.subtotalCents
    })
    
    const topStoreEntries = Object.entries(storeSpend)
      .sort((a, b) => storeSpend[parseInt(b[0])] - storeSpend[parseInt(a[0])])
      .slice(0, 3)
    
    const topStoreIds = topStoreEntries.map(([id]) => parseInt(id))
    const topStoresData = await prisma.store.findMany({
      where: { id: { in: topStoreIds } },
    })
    
    const topStores = topStoresData
      .map((store) => ({
        ...store,
        spendCents: storeSpend[store.id] || 0,
      }))
      .sort((a, b) => b.spendCents - a.spendCents)

    // Top products by quantity (top 3)
    const productQuantities: Record<number, number> = {}
    orders.forEach((order) => {
      order.orderLines.forEach((line) => {
        const qty = line.orderQuantity || (line as any).quantity || 0
        productQuantities[line.productId] =
          (productQuantities[line.productId] || 0) + qty
      })
    })
    
    const topProductEntries = Object.entries(productQuantities)
      .sort((a, b) => productQuantities[parseInt(b[0])] - productQuantities[parseInt(a[0])])
      .slice(0, 3)
    
    const topProductIds = topProductEntries.map(([id]) => parseInt(id))
    const topProductsData = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
    })
    
    const topProducts = topProductsData
      .map((product) => ({
        ...product,
        quantity: productQuantities[product.id] || 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)

    // Calculate order type counts
    const orderTypeCounts: Record<string, number> = {}
    orders.forEach((order) => {
      const orderType = order.orderType || 'NSSO' // Default for old orders
      let displayType: string
      if (orderType === 'ADC_S') displayType = 'ADC S'
      else if (orderType === 'ADC_M') displayType = 'ADC M'
      else if (orderType === 'NSSO') displayType = 'SSO'
      else if (orderType === 'SU') displayType = 'SA'
      else displayType = orderType
      orderTypeCounts[displayType] = (orderTypeCounts[displayType] || 0) + 1
    })

    // Get all stores (not just top 3) sorted by spend
    const allStoreEntries = Object.entries(storeSpend)
      .sort((a, b) => storeSpend[parseInt(b[0])] - storeSpend[parseInt(a[0])])
    
    const allStoreIds = allStoreEntries.map(([id]) => parseInt(id))
    const allStoresData = await prisma.store.findMany({
      where: { id: { in: allStoreIds } },
    })
    
    const allStores = allStoresData
      .map((store) => ({
        ...store,
        spendCents: storeSpend[store.id] || 0,
      }))
      .sort((a, b) => b.spendCents - a.spendCents)

    return NextResponse.json({
      totalSpendCents: totalSpendCents || 0,
      topStores: topStores,
      allStores: allStores, // All stores sorted by spend
      topProducts: topProducts,
      orderTypeCounts: orderTypeCounts,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
