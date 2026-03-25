import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid store id' }, { status: 400 })
    }

    const body = await request.json()
    const { storeNumber, name } = body

    const updateData: { storeNumber?: string; name?: string } = {}

    if (storeNumber !== undefined) {
      if (typeof storeNumber !== 'string' || !storeNumber.trim()) {
        return NextResponse.json(
          { error: 'Store number cannot be empty' },
          { status: 400 }
        )
      }
      const trimmed = storeNumber.trim()
      const conflict = await prisma.store.findFirst({
        where: { storeNumber: trimmed, NOT: { id } },
      })
      if (conflict) {
        return NextResponse.json(
          { error: `Another store already uses number "${trimmed}"` },
          { status: 409 }
        )
      }
      updateData.storeNumber = trimmed
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Store name cannot be empty' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const store = await prisma.store.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid store id' }, { status: 400 })
    }

    const orderCount = await prisma.order.count({ where: { storeId: id } })
    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: `This store cannot be deleted because it has ${orderCount} order(s). Remove or reassign orders first.`,
        },
        { status: 409 }
      )
    }

    await prisma.store.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting store:', error)
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 })
  }
}
