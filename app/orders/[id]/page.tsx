'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Store {
  id: number
  storeNumber: string
  name: string
}

interface Product {
  id: number
  name: string
}

interface OrderLine {
  id: number
  productId: number
  product: Product
  productNameSnapshot: string
  unitPriceCentsSnapshot: number
  currentQuantity: number
  orderQuantity: number
  lineTotalCents: number
  size?: string | null
  color?: string | null
  style?: string | null
}

interface Order {
  id: number
  storeId: number
  store: Store
  managerName: string
  createdAt: string
  orderDate: string
  subtotalCents: number
  notes?: string
  orderLines: OrderLine[]
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (!res.ok) {
        throw new Error('Order not found')
      }
      const data = await res.json()
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    // Parse the date and format it using local date components to avoid timezone conversion issues
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${monthNames[month - 1]} ${day}, ${year}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const generateInvoiceNumber = (orderId: number, orderDate: string) => {
    const date = new Date(orderDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const orderNum = String(orderId).padStart(6, '0')
    return `INV-${year}${month}-${orderNum}`
  }

  const handleGenerateInvoice = () => {
    if (!order) return
    router.push(`/orders/${order.id}/invoice`)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading order...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Orders Hub
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/orders"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Orders Hub
        </Link>
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-bold text-[#0066CC]">Order #{order.id}</h1>
          <div className="space-x-3">
            <button
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
            >
              Print
            </button>
            <button
              onClick={handleGenerateInvoice}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-bold text-[#0066CC] mb-4">Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-800">Store</div>
            <div className="text-lg font-bold text-gray-900">
              {order.store.storeNumber} - {order.store.name}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Manager</div>
            <div className="text-lg font-bold text-gray-900">
              {order.managerName}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Order Date</div>
            <div className="text-lg font-bold text-gray-900">
              {formatDate(order.orderDate)}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Created At</div>
            <div className="text-lg font-bold text-gray-900">
              {formatDateTime(order.createdAt)}
            </div>
          </div>
          {order.notes && (
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-gray-800">Notes</div>
              <div className="text-lg font-bold text-gray-900">
                {order.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-[#0066CC] mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#0066CC]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                  Product
                </th>
                {(order.orderLines.some((line) => line.size || line.color || line.style)) && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                      Style
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                  Current
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.orderLines.map((line) => (
                <tr key={line.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {line.productNameSnapshot}
                  </td>
                  {(line.size || line.color || line.style) && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {line.size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {line.color || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {line.style || '-'}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(line.unitPriceCentsSnapshot)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {line.currentQuantity ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {line.orderQuantity ?? (line as any).quantity ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#0066CC]">
                    {formatCurrency(line.lineTotalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-right text-sm font-medium text-gray-900"
                >
                  Subtotal:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatCurrency(order.subtotalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
