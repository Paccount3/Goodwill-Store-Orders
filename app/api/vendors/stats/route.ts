import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatPrismaError, logApiError } from '@/lib/api-prisma-error'

export const dynamic = 'force-dynamic'

export type VendorStatRow = {
  vendorId: number
  vendorName: string
  spendCents: number
  itemCount: number
  lineCount: number
  percentOfTotal: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    const where: { orderDate?: { gte: Date; lt: Date } } = {}

    if (year || month) {
      where.orderDate = { gte: new Date(0), lt: new Date(8640000000000000) }
      if (year) {
        const yearNum = parseInt(year, 10)
        if (!Number.isFinite(yearNum)) {
          return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
        }
        where.orderDate.gte = new Date(yearNum, 0, 1)
        where.orderDate.lt = new Date(yearNum + 1, 0, 1)
      }
      if (month) {
        const monthNum = parseInt(month, 10) - 1
        if (!Number.isFinite(monthNum) || monthNum < 0 || monthNum > 11) {
          return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
        }
        const yearNum = year ? parseInt(year, 10) : new Date().getFullYear()
        where.orderDate.gte = new Date(yearNum, monthNum, 1)
        where.orderDate.lt = new Date(yearNum, monthNum + 1, 1)
      }
    }

    const [allVendors, orders] = await Promise.all([
      prisma.vendor.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.order.findMany({
        where: Object.keys(where).length ? where : undefined,
        include: {
          orderLines: {
            include: {
              product: {
                include: { vendor: { select: { id: true, name: true } } },
              },
            },
          },
        },
      }),
    ])

    const totals = new Map<number, { spendCents: number; itemCount: number; lineCount: number }>()

    for (const order of orders) {
      for (const line of order.orderLines) {
        const vendorId = line.product.vendorId
        const existing = totals.get(vendorId) ?? { spendCents: 0, itemCount: 0, lineCount: 0 }
        const qty = line.orderQuantity ?? 0
        totals.set(vendorId, {
          spendCents: existing.spendCents + line.lineTotalCents,
          itemCount: existing.itemCount + qty,
          lineCount: existing.lineCount + 1,
        })
      }
    }

    const rows: VendorStatRow[] = allVendors.map((vendor) => {
      const data = totals.get(vendor.id) ?? { spendCents: 0, itemCount: 0, lineCount: 0 }
      return {
        vendorId: vendor.id,
        vendorName: vendor.name,
        spendCents: data.spendCents,
        itemCount: data.itemCount,
        lineCount: data.lineCount,
        percentOfTotal: 0,
      }
    })

    const totalSpendCents = rows.reduce((sum, row) => sum + row.spendCents, 0)
    for (const row of rows) {
      row.percentOfTotal =
        totalSpendCents > 0 ? Math.round((row.spendCents / totalSpendCents) * 1000) / 10 : 0
    }

    rows.sort((a, b) => b.spendCents - a.spendCents)

    return NextResponse.json({
      totalSpendCents,
      vendors: rows,
      orderCount: orders.length,
    })
  } catch (error: unknown) {
    logApiError('api/vendors/stats', 'GET', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor stats', details: formatPrismaError(error) },
      { status: 500 }
    )
  }
}
