import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatPrismaError, logApiError } from '@/lib/api-prisma-error'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(vendors)
  } catch (error: unknown) {
    logApiError('api/vendors', 'GET', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: formatPrismaError(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()

    const existing = await prisma.vendor.findUnique({ where: { name: trimmedName } })
    if (existing) {
      return NextResponse.json(
        { error: `A vendor named "${trimmedName}" already exists` },
        { status: 409 }
      )
    }

    const maxSort = await prisma.vendor.aggregate({ _max: { sortOrder: true } })
    const nextSort = (maxSort._max.sortOrder ?? -1) + 1

    const vendor = await prisma.vendor.create({
      data: { name: trimmedName, sortOrder: nextSort },
    })
    return NextResponse.json(vendor)
  } catch (error: unknown) {
    logApiError('api/vendors', 'POST', error)
    return NextResponse.json(
      { error: 'Failed to create vendor', details: formatPrismaError(error) },
      { status: 500 }
    )
  }
}
