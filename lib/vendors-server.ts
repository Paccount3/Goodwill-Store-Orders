import { prisma } from '@/lib/prisma'
import { DEFAULT_VENDOR_NAME } from '@/lib/default-vendors'

export async function getDefaultVendorId(): Promise<number> {
  const vendor = await prisma.vendor.findUnique({
    where: { name: DEFAULT_VENDOR_NAME },
    select: { id: true },
  })
  if (!vendor) {
    throw new Error(`Default vendor "${DEFAULT_VENDOR_NAME}" is not configured`)
  }
  return vendor.id
}

export async function resolveVendorId(vendorId: unknown): Promise<number> {
  if (vendorId === undefined || vendorId === null || vendorId === '') {
    return getDefaultVendorId()
  }
  const id = typeof vendorId === 'number' ? vendorId : parseInt(String(vendorId), 10)
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('Invalid vendorId')
  }
  const vendor = await prisma.vendor.findUnique({ where: { id }, select: { id: true } })
  if (!vendor) {
    throw new Error('Vendor not found')
  }
  return id
}
