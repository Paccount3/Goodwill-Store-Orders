import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** POST body: { orderedIds: number[] } — vendor IDs in display order. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds must be a non-empty array of vendor IDs' },
        { status: 400 }
      )
    }

    const ids = orderedIds.map((id: unknown) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    if (ids.length !== orderedIds.length) {
      return NextResponse.json({ error: 'Invalid vendor ID in orderedIds' }, { status: 400 })
    }

    const unique = new Set(ids)
    if (unique.size !== ids.length) {
      return NextResponse.json({ error: 'Duplicate vendor IDs' }, { status: 400 })
    }

    const count = await prisma.vendor.count({ where: { id: { in: ids } } })
    if (count !== ids.length) {
      return NextResponse.json({ error: 'One or more vendor IDs do not exist' }, { status: 400 })
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.vendor.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering vendors:', error)
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
  }
}
