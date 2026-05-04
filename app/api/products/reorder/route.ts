import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST body: { orderedIds: number[] }
 * Reassigns Product.sortOrder to match the provided order (top → bottom).
 *
 * Notes:
 * - Caller is responsible for scoping orderedIds (e.g. one category, or a flattened "Store Supply" list).
 * - IDs must be unique and all must exist.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = body as { orderedIds?: unknown }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds must be a non-empty array of product IDs' },
        { status: 400 }
      )
    }

    const ids = orderedIds
      .map((id: unknown) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)

    if (ids.length !== orderedIds.length) {
      return NextResponse.json({ error: 'Invalid product ID in orderedIds' }, { status: 400 })
    }

    const unique = new Set(ids)
    if (unique.size !== ids.length) {
      return NextResponse.json({ error: 'Duplicate product IDs' }, { status: 400 })
    }

    const count = await prisma.product.count({ where: { id: { in: ids } } })
    if (count !== ids.length) {
      return NextResponse.json(
        { error: 'One or more product IDs do not exist' },
        { status: 400 }
      )
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.product.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering products:', error)
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
  }
}

