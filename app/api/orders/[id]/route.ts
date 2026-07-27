import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isOrderFlagColor } from '@/lib/order-flag-colors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        store: true,
        orderLines: {
          include: {
            product: {
              include: {
                vendor: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id)

    // First check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Delete order lines first (cascade delete)
    await prisma.orderLine.deleteMany({
      where: { orderId },
    })

    // Delete the order
    await prisma.order.delete({
      where: { id: orderId },
    })

    return NextResponse.json({ message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id)
    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const body = await request.json()
    const { flagColor } = body
    if (flagColor !== null && !isOrderFlagColor(flagColor)) {
      return NextResponse.json(
        { error: 'Invalid flagColor (RED, GREEN, ORANGE, or null required)' },
        { status: 400 }
      )
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { flagColor },
      include: {
        store: true,
        orderLines: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order flag:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
