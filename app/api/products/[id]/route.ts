import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { unitPriceCents, maxQuantity } = body

    const updateData: any = {}

    if (unitPriceCents !== undefined) {
      if (unitPriceCents < 0) {
        return NextResponse.json(
          { error: 'Invalid unitPriceCents value' },
          { status: 400 }
        )
      }
      // The frontend sends dollars, convert to cents
      updateData.unitPriceCents = Math.round(unitPriceCents * 100)
    }

    if (maxQuantity !== undefined) {
      if (maxQuantity < 0 || !Number.isInteger(maxQuantity)) {
        return NextResponse.json(
          { error: 'Invalid maxQuantity value' },
          { status: 400 }
        )
      }
      updateData.maxQuantity = parseInt(maxQuantity)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const product = await prisma.product.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product is used in any orders
    const orderLines = await prisma.orderLine.findFirst({
      where: { productId: parseInt(params.id) },
    })

    if (orderLines) {
      // Don't delete, just deactivate
      const product = await prisma.product.update({
        where: { id: parseInt(params.id) },
        data: { isActive: false },
      })
      return NextResponse.json(product)
    } else {
      // Safe to delete
      await prisma.product.delete({
        where: { id: parseInt(params.id) },
      })
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
