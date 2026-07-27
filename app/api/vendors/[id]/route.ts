import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_VENDOR_NAME } from '@/lib/default-vendors'
import { getDefaultVendorId } from '@/lib/vendors-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid vendor id' }, { status: 400 })
    }

    const body = await request.json()
    const { name } = body

    if (name === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Vendor name cannot be empty' }, { status: 400 })
    }

    const trimmed = name.trim()
    const conflict = await prisma.vendor.findFirst({
      where: { name: trimmed, NOT: { id } },
    })
    if (conflict) {
      return NextResponse.json(
        { error: `Another vendor already uses the name "${trimmed}"` },
        { status: 409 }
      )
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { name: trimmed },
    })
    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Error updating vendor:', error)
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid vendor id' }, { status: 400 })
    }

    const vendor = await prisma.vendor.findUnique({ where: { id } })
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    if (vendor.name === DEFAULT_VENDOR_NAME) {
      return NextResponse.json(
        { error: `"${DEFAULT_VENDOR_NAME}" cannot be removed — it is the default vendor for products.` },
        { status: 409 }
      )
    }

    const otherVendorId = await getDefaultVendorId()

    await prisma.$transaction([
      prisma.product.updateMany({
        where: { vendorId: id },
        data: { vendorId: otherVendorId },
      }),
      prisma.vendor.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 })
  }
}
