'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Store {
  id: number
  storeNumber: string
  name: string
}

interface OrderLine {
  id: number
  productNameSnapshot: string
  unitPriceCentsSnapshot: number
  currentQuantity?: number
  orderQuantity?: number
  quantity?: number
  lineTotalCents: number
  size?: string | null
  color?: string | null
  style?: string | null
}

interface Order {
  id: number
  store: Store
  managerName: string
  orderDate: string
  subtotalCents: number
  notes?: string
  orderLines: OrderLine[]
}

export default function InvoicePage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [editableLines, setEditableLines] = useState<OrderLine[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [invoiceNotes, setInvoiceNotes] = useState('')

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

      const normalizedLines: OrderLine[] = (data.orderLines || []).map((line: OrderLine) => {
        const quantity =
          line.quantity ?? line.orderQuantity ?? line.currentQuantity ?? 0
        const unitPrice = line.unitPriceCentsSnapshot
        return {
          ...line,
          quantity,
          lineTotalCents: unitPrice * quantity,
        }
      })

      setEditableLines(normalizedLines)
      setInvoiceNotes(data.notes || '')
      setIsEditing(false)
      setHasEdits(false)
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const generateInvoiceNumber = (orderId: number, orderDate: string) => {
    const date = new Date(orderDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const orderNum = String(orderId).padStart(6, '0')
    return `INV-${year}${month}-${orderNum}`
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const handleStartEditing = () => {
    setIsEditing(true)
  }

  const resetEditsFromOrder = (sourceOrder: Order) => {
    const normalizedLines: OrderLine[] = (sourceOrder.orderLines || []).map((line: OrderLine) => {
      const quantity =
        line.quantity ?? line.orderQuantity ?? line.currentQuantity ?? 0
      const unitPrice = line.unitPriceCentsSnapshot
      return {
        ...line,
        quantity,
        lineTotalCents: unitPrice * quantity,
      }
    })

    setEditableLines(normalizedLines)
    setInvoiceNotes(sourceOrder.notes || '')
  }

  const handleCancelEdits = () => {
    if (order) {
      resetEditsFromOrder(order)
    }
    setIsEditing(false)
    setHasEdits(false)
  }

  const handleSaveEdits = () => {
    // Edits are intentionally kept client-side only for invoice purposes
    setIsEditing(false)
    if (editableLines.length > 0 || invoiceNotes.trim().length > 0) {
      setHasEdits(true)
    }
  }

  const handleLineChange = (index: number, field: 'unitPrice' | 'quantity', value: string) => {
    setEditableLines((prev) => {
      const updated = [...prev]
      const line = { ...updated[index] }

      if (field === 'unitPrice') {
        const dollars = parseFloat(value || '0')
        const cents = isNaN(dollars) ? 0 : Math.round(dollars * 100)
        line.unitPriceCentsSnapshot = cents
      } else if (field === 'quantity') {
        const qty = parseInt(value || '0', 10)
        line.quantity = isNaN(qty) || qty < 0 ? 0 : qty
      }

      const quantity =
        line.quantity ?? line.orderQuantity ?? line.currentQuantity ?? 0
      line.lineTotalCents = line.unitPriceCentsSnapshot * quantity

      updated[index] = line
      return updated
    })
    setHasEdits(true)
  }

  const handleNotesChange = (value: string) => {
    setInvoiceNotes(value)
    setHasEdits(true)
  }

  const computedSubtotalCents = editableLines.reduce(
    (sum, line) => sum + (line.lineTotalCents || 0),
    0
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading invoice...</div>
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

  const invoiceNumber = generateInvoiceNumber(order.id, order.orderDate)
  const invoiceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Action buttons - hidden when printing */}
      <div className="mb-6 print:hidden">
        <Link
          href={`/orders/${order.id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Order
        </Link>
        <div className="flex justify-end space-x-3">
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEditing}
              className="border border-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
            >
              Edit Invoice
            </button>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleCancelEdits}
                className="border border-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel Edits
              </button>
              <button
                type="button"
                onClick={handleSaveEdits}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Save Invoice Edits
              </button>
            </>
          )}
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:p-0">
        {/* Header */}
        <div className="mb-4 pb-4 border-b-2 border-gray-300">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Goodwill Industries
              </h1>
              <p className="text-gray-600">Store Supply Order System</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <p className="text-sm text-gray-600">Invoice #: {invoiceNumber}</p>
              <p className="text-sm text-gray-600">Date: {invoiceDate}</p>
            </div>
          </div>

          {(isEditing || hasEdits) && (
            <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
              <p className="font-semibold">
                {hasEdits ? 'Edited Invoice' : 'Editing Invoice'}
              </p>
              <p className="mt-1">
                Changes made here adjust this invoice view only and do not
                modify the original order or item catalog prices.
              </p>
            </div>
          )}
        </div>

        {/* Bill To */}
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

        {/* Order Reference */}
        <div className="mb-8 p-4 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">
            <strong>Order Reference:</strong> Order #{order.id} - {formatDate(order.orderDate)}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                {(editableLines.some((line) => line.size || line.color || line.style)) && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Style
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {editableLines.map((line, index) => (
                <tr key={line.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {line.productNameSnapshot}
                  </td>
                  {(line.size || line.color || line.style) && (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {line.size || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {line.color || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {line.style || '-'}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm"
                        value={(line.unitPriceCentsSnapshot / 100).toFixed(2)}
                        onChange={(e) =>
                          handleLineChange(index, 'unitPrice', e.target.value)
                        }
                      />
                    ) : (
                      formatCurrency(line.unitPriceCentsSnapshot)
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-right text-sm"
                        value={line.quantity ?? line.orderQuantity ?? line.currentQuantity ?? 0}
                        onChange={(e) =>
                          handleLineChange(index, 'quantity', e.target.value)
                        }
                      />
                    ) : (
                      line.quantity ?? line.orderQuantity ?? line.currentQuantity ?? 0
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(line.lineTotalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Subtotal:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(computedSubtotalCents)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(computedSubtotalCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Invoice Notes:
          </h3>
          {isEditing ? (
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              rows={3}
              value={invoiceNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add any notes about invoice adjustments or special handling here."
            />
          ) : invoiceNotes ? (
            <p className="text-gray-700 whitespace-pre-line">{invoiceNotes}</p>
          ) : (
            <p className="text-gray-400 italic">
              No additional invoice notes.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Thank you for your order!</p>
          <p className="mt-2">
            This is an automatically generated invoice from the Goodwill Store Order System.
          </p>
        </div>
      </div>

      {/* Print styles */}
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
