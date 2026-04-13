import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  isInsightsNonStoreCategory,
  ORDER_STATS_STORE_SUPPLY_UI,
  NSSO_EXCLUDED_CATEGORY_VALUES,
  dbCategoryValuesForStatsFilter,
  canonicalProductCategory,
} from '@/lib/product-categories'

export const dynamic = 'force-dynamic'

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

    const isNonStoreCategory = isInsightsNonStoreCategory(category)

    // Get all stores and products for the table structure
    let stores: Array<{ id: number; storeNumber: string; name: string }> = []
    
    if (isNonStoreCategory) {
      const nonStoreDisplayName = category
        ? canonicalProductCategory(category)
        : 'Unknown'
      stores = [{
        id: -1, // Special ID for non-store categories
        storeNumber: '',
        name: nonStoreDisplayName,
      }]
    } else {
      // For regular categories, get actual stores
      const allStores = await prisma.store.findMany({
        orderBy: { storeNumber: 'asc' },
      })
      
      // Filter stores if storeIds provided
      if (storeIds) {
        const storeIdArray = storeIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        if (storeIdArray.length > 0) {
          stores = allStores.filter(store => storeIdArray.includes(store.id))
        } else {
          stores = allStores
        }
      } else {
        stores = allStores
      }
    }

    // Filter products based on category selection
    const productWhere: any = { isActive: true }
    if (category === ORDER_STATS_STORE_SUPPLY_UI) {
      productWhere.category = { notIn: [...NSSO_EXCLUDED_CATEGORY_VALUES] }
    } else if (category) {
      productWhere.category = { in: dbCategoryValuesForStatsFilter(category) }
    }

    const products = await prisma.product.findMany({
      where: productWhere,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Aggregate data: productId -> storeId -> total quantity
    // This sums up all orderQuantity values for each product/store combination
    const aggregation: Record<number, Record<number, number>> = {}

    orders.forEach((order) => {
      order.orderLines.forEach((line) => {
        const productId = line.productId
        
        // For non-store categories, aggregate all orders into a single "store" (-1)
        // For regular categories, use the actual storeId
        const storeId = isNonStoreCategory ? -1 : order.storeId
        
        // Use orderQuantity (the quantity ordered), not currentQuantity
        const quantity = line.orderQuantity || (line as any).quantity || 0

        if (!aggregation[productId]) {
          aggregation[productId] = {}
        }
        if (!aggregation[productId][storeId]) {
          aggregation[productId][storeId] = 0
        }
        // Sum all quantities for this product/store combination across all orders
        aggregation[productId][storeId] += quantity
      })
    })

    // Format the response
    const result = products.map((product) => {
      const storeQuantities: Record<number, number> = aggregation[product.id] || {}
      let total = 0

      const storeData = stores.map((store) => {
        // For non-store categories, sum all quantities into the single store entry
        // For regular categories, use the specific store quantity
        const qty = isNonStoreCategory 
          ? (storeQuantities[-1] || 0) // All orders aggregated into -1
          : (storeQuantities[store.id] || 0)
        total += qty
        return {
          storeId: store.id,
          storeNumber: store.storeNumber,
          storeName: store.name,
          quantity: qty,
        }
      })

      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        stores: storeData,
        total: total,
      }
    })

    return NextResponse.json({
      products: result,
      stores: stores.map((s) => ({
        id: s.id,
        storeNumber: s.storeNumber,
        name: s.name,
      })),
    })
  } catch (error) {
    console.error('Error fetching aggregated orders:', error)
    return NextResponse.json({ error: 'Failed to fetch aggregated orders' }, { status: 500 })
  }
}
