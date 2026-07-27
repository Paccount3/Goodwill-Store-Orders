export function generateInvoiceNumber(orderId: number, orderDate: string) {
  const date = new Date(orderDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const orderNum = String(orderId).padStart(6, '0')
  return `INV-${year}${month}-${orderNum}`
}

export function generateVendorInvoiceNumber(orderId: number, orderDate: string) {
  const date = new Date(orderDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const orderNum = String(orderId).padStart(6, '0')
  return `VINV-${year}${month}-${orderNum}`
}

export function formatInvoiceCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatInvoiceDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export type VendorInvoiceLine = {
  vendorName: string
  totalCents: number
  itemCount: number
}

export function groupOrderLinesByVendor(
  orderLines: Array<{
    lineTotalCents: number
    product?: { vendor?: { name?: string } | null } | null
  }>
): VendorInvoiceLine[] {
  const totals = new Map<string, { totalCents: number; itemCount: number }>()

  for (const line of orderLines) {
    const vendorName = line.product?.vendor?.name?.trim() || 'Other'
    const existing = totals.get(vendorName) ?? { totalCents: 0, itemCount: 0 }
    totals.set(vendorName, {
      totalCents: existing.totalCents + line.lineTotalCents,
      itemCount: existing.itemCount + 1,
    })
  }

  return Array.from(totals.entries())
    .map(([vendorName, data]) => ({
      vendorName,
      totalCents: data.totalCents,
      itemCount: data.itemCount,
    }))
    .sort((a, b) => a.vendorName.localeCompare(b.vendorName))
}
