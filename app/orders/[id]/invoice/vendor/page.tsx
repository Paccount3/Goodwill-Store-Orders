'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  generateVendorInvoiceNumber,
  groupOrderLinesByVendor,
} from '@/lib/order-invoice'

interface Store {
  id: number
  storeNumber: string
  name: string
}

interface OrderLine {
  id: number
  lineTotalCents: number
  product?: {
    vendor?: {
      id: number
      name: string
    } | null
  } | null
}

interface Order {
  id: number
  store: Store
  managerName: string
  orderDate: string
  subtotalCents: number
  orderLines: OrderLine[]
}

export default function VendorInvoicePage() {
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading vendor invoice...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Link href="/orders" className="text-blue-600 hover:text-blue-800">
            Back to Orders Hub
          </Link>
        </div>
      </div>
    )
  }

  const vendorLines = groupOrderLinesByVendor(order.orderLines)
  const invoiceNumber = generateVendorInvoiceNumber(order.id, order.orderDate)
  const invoiceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const computedTotalCents = vendorLines.reduce((sum, line) => sum + line.totalCents, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 print:hidden">
        <Link
          href={`/orders/${order.id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Order
        </Link>
        <div className="flex justify-end space-x-3">
          <Link
            href={`/orders/${order.id}/invoice`}
            className="border border-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
          >
            View Item Invoice
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:p-0">
        <div className="mb-4 pb-4 border-b-2 border-gray-300">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Goodwill Industries
              </h1>
              <p className="text-gray-600">Store Supply Order System</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">VENDOR INVOICE</h2>
              <p className="text-sm text-gray-600">Invoice #: {invoiceNumber}</p>
              <p className="text-sm text-gray-600">Date: {invoiceDate}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Bill To:
          </h3>
          <div className="text-lg">
            <div className="font-semibold text-gray-900">
              {order.store.storeNumber} - {order.store.name}
            </div>
            <div className="text-gray-600">Manager: {order.managerName}</div>
          </div>
        </div>

        <div className="mb-8 p-4 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">
            <strong>Order Reference:</strong> Order #{order.id} - {formatInvoiceDate(order.orderDate)}
          </div>
        </div>

        <div className="mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendorLines.map((line) => (
                <tr key={line.vendorName}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {line.vendorName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {line.itemCount}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    {formatInvoiceCurrency(line.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Subtotal:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatInvoiceCurrency(computedTotalCents)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatInvoiceCurrency(computedTotalCents)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Thank you for your order!</p>
          <p className="mt-2">
            This vendor summary invoice groups order line totals by supplier.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:p-0 {
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}
