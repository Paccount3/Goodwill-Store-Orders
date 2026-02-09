'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Store {
  id: number
  storeNumber: string
  name: string
}

interface Product {
  id: number
  name: string
  category: string
  unitPriceCents: number
  maxQuantity: number
  isActive: boolean
}

interface ProductOrder {
  productId: number
  productName: string
  category: string
  unitPriceCents: number
  maxQuantity: number
  current: number
  order: number
}

// Helper function to get today's date in local timezone (YYYY-MM-DD format)
const getTodayLocalDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ADCSupplyPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    storeId: '', // Will be set to first store by default
    managerName: '',
    orderDate: getTodayLocalDate(),
    notes: '',
  })

  const [productOrders, setProductOrders] = useState<Record<number, ProductOrder>>({})

  useEffect(() => {
    fetchStores()
    fetchProducts()
  }, [])

  useEffect(() => {
    // Set default storeId to first store when stores are loaded
    if (stores.length > 0 && !formData.storeId) {
      setFormData(prev => ({ ...prev, storeId: stores[0].id.toString() }))
    }
  }, [stores])

  useEffect(() => {
    // Initialize productOrders when products are loaded
    if (Array.isArray(products) && products.length > 0) {
      const initial: Record<number, ProductOrder> = {}
      products.forEach((product) => {
        initial[product.id] = {
          productId: product.id,
          productName: product.name,
          category: product.category,
          unitPriceCents: product.unitPriceCents,
          maxQuantity: product.maxQuantity,
          current: 0,
          order: 0,
        }
      })
      setProductOrders(initial)
    }
  }, [products])

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setStores(data)
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?activeOnly=true&category=ADC Supply')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('API Error Response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to fetch products')
      }
      const data = await res.json()
      // Ensure data is an array
      setProducts(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching products:', error)
      console.error('Error details:', error.message)
      setProducts([]) // Set to empty array on error
      setLoading(false)
    }
  }

  const updateProductOrder = (productId: number, field: 'current' | 'order', value: number) => {
    setProductOrders((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: Math.max(0, value),
      },
    }))
  }

  const getOrderedItems = () => {
    return Object.values(productOrders).filter((po) => po.order > 0)
  }

  const getSubtotalCents = () => {
    return getOrderedItems().reduce((sum, item) => {
      return sum + item.unitPriceCents * item.order
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.managerName) {
      alert('Please fill in all required fields')
      return
    }

    // Use first store as default if storeId is not set
    const storeIdToUse = formData.storeId || (stores.length > 0 ? stores[0].id.toString() : '')
    if (!storeIdToUse) {
      alert('No stores available')
      return
    }

    const orderedItems = getOrderedItems()
    if (orderedItems.length === 0) {
      alert('Please enter order quantities for at least one product')
      return
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true)
    setPassword('')
    setPasswordError('')
  }

  const handleConfirmSubmit = async () => {
    // Validate password
    if (password !== 'BIGBLUE') {
      setPasswordError('Incorrect password')
      return
    }

    setPasswordError('')
    setShowConfirmModal(false)
    setSubmitting(true)

    // Use first store as default if storeId is not set
    const storeIdToUse = formData.storeId || (stores.length > 0 ? stores[0].id.toString() : '')
    if (!storeIdToUse) {
      alert('No stores available')
      setSubmitting(false)
      return
    }

    const orderedItems = getOrderedItems()

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeIdToUse,
          managerName: formData.managerName,
          orderDate: formData.orderDate,
          notes: formData.notes,
          orderType: 'ADC_S',
          lineItems: orderedItems.map((item) => ({
            productId: item.productId,
            currentQuantity: item.current,
            orderQuantity: item.order,
          })),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const order = await res.json()
      setCreatedOrderId(order.id)
      setSubmitting(false)

      // Show loading animation for 1 second before showing success
      setShowLoadingAnimation(true)
      setTimeout(() => {
        setShowLoadingAnimation(false)
        setShowSuccessModal(true)
      }, 1000)
    } catch (error: any) {
      alert(error.message || 'Failed to create order')
      setSubmitting(false)
    }
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
    setPassword('')
    setPasswordError('')
  }

  const handleOrderAgain = () => {
    // Reset form (keep default storeId)
    const defaultStoreId = stores.length > 0 ? stores[0].id.toString() : ''
    setFormData({
      storeId: defaultStoreId,
      managerName: '',
      orderDate: getTodayLocalDate(),
      notes: '',
    })

    // Reset all product orders
    const reset: Record<number, ProductOrder> = {}
    if (Array.isArray(products)) {
      products.forEach((product) => {
        reset[product.id] = {
          productId: product.id,
          productName: product.name,
          category: product.category,
          unitPriceCents: product.unitPriceCents,
          maxQuantity: product.maxQuantity,
          current: 0,
          order: 0,
        }
      })
    }
    setProductOrders(reset)

    setShowSuccessModal(false)
    setCreatedOrderId(null)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGoToOrdersHub = () => {
    router.push('/orders')
  }

  const handlePrintOrder = () => {
    if (createdOrderId) {
      router.push(`/orders/${createdOrderId}/invoice`)
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const productsByCategory = Array.isArray(products) ? products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>) : {}

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <h1 className="text-2xl font-bold text-[#0066CC] mb-4">ADC Supply Order Form</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header Info - Condensed */}
        <div className="bg-white shadow rounded-lg p-3 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                Order Type
              </label>
              <select
                disabled
                value="ADC_S"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-gray-100 cursor-not-allowed"
              >
                <option value="ADC_S">ADC S</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                Manager Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Date</label>
              <input
                type="date"
                value={getTodayLocalDate()}
                readOnly
                disabled
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
                placeholder="Add any notes..."
              />
            </div>
          </div>
        </div>

        {/* Products Table - Condensed */}
        <div className="bg-white shadow rounded-lg p-3 border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-xs">
              <thead className="bg-[#0066CC]">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-bold text-white uppercase border-r border-blue-400">Item</th>
                  <th className="px-2 py-1 text-center text-xs font-bold text-white uppercase border-r border-blue-400 w-20">Current</th>
                  <th className="px-2 py-1 text-center text-xs font-bold text-white uppercase border-r border-blue-400 w-16">Max.</th>
                  <th className="px-2 py-1 text-center text-xs font-bold text-white uppercase w-20">Order</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(productsByCategory).map(([category, prods]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-[#E6F2FF]">
                      <td colSpan={4} className="px-2 py-1 font-bold text-xs text-[#0066CC]">
                        {category}
                      </td>
                    </tr>
                    {prods.map((product) => {
                      const po = productOrders[product.id]
                      if (!po) return null
                      return (
                        <tr key={product.id} className="hover:bg-blue-50">
                          <td className="px-2 py-1 text-xs font-medium text-gray-900 border-r border-gray-200">
                            {product.name}
                          </td>
                          <td className="px-2 py-1 border-r border-gray-200">
                            <input
                              type="number"
                              min="0"
                              value={po.current || ''}
                              onChange={(e) =>
                                updateProductOrder(
                                  product.id,
                                  'current',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full text-center border border-gray-300 rounded px-1 py-0.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-1 text-center text-xs font-semibold text-gray-900 border-r border-gray-200">
                            {product.maxQuantity}
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              min="0"
                              max={product.maxQuantity}
                              value={po.order || ''}
                              onChange={(e) =>
                                updateProductOrder(
                                  product.id,
                                  'order',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full text-center border border-gray-300 rounded px-1 py-0.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estimated Order Summary - Condensed */}
        {getOrderedItems().length > 0 && (
          <div className="bg-white shadow rounded-lg p-3 border border-gray-200">
            <h2 className="text-sm font-bold text-[#0066CC] mb-2">Estimated Order Summary</h2>
            <div className="space-y-1 text-xs">
              {getOrderedItems().map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-gray-900">
                    {item.productName} x {item.order}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(item.unitPriceCents * item.order)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-1 mt-1 flex justify-between">
                <span className="font-bold text-[#0066CC]">Subtotal:</span>
                <span className="font-bold text-[#0066CC]">
                  {formatCurrency(getSubtotalCents())}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/orders')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-900 text-sm font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#0066CC] text-white font-bold text-sm rounded hover:bg-[#0052A3] disabled:opacity-50 transition-colors shadow"
          >
            {submitting ? 'Submitting...' : 'Submit Order'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#0066CC] mb-4">
                Confirm Order Submission
              </h2>
              <p className="text-gray-700 mb-6">
                Are you ready to submit this order? An email will be sent to our fulfillment team.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                  <span className="text-xs text-gray-500">Temporary Password</span> BIGBLUE
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  placeholder="Enter password"
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmSubmit()
                    }
                  }}
                />
                {passwordError && (
                  <p className="text-red-600 text-sm mt-1 text-left">{passwordError}</p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Animation Modal */}
      {showLoadingAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0066CC] border-t-transparent"></div>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Processing your order...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#0066CC] mb-2">
                Order Successful!
              </h2>
              <p className="text-gray-700 mb-6">
                Your ADC Supply order has been submitted successfully.
                {createdOrderId && (
                  <span className="block mt-1 text-sm text-gray-600">
                    Order #{createdOrderId}
                  </span>
                )}
                <span className="block mt-3 text-sm text-gray-600">
                  Please reach out to our fulfillment team for any issues or delays.
                </span>
              </p>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  What would you like to do next?
                </p>

                <button
                  onClick={handleOrderAgain}
                  className="w-full bg-white border-2 border-[#0066CC] text-[#0066CC] font-bold py-3 px-4 rounded-lg hover:bg-[#0066CC] hover:text-white transition shadow-md"
                >
                  Order Again
                </button>

                <button
                  onClick={handleGoToOrdersHub}
                  className="w-full bg-white border-2 border-[#0066CC] text-[#0066CC] font-bold py-3 px-4 rounded-lg hover:bg-[#0066CC] hover:text-white transition shadow-md"
                >
                  Go to Orders Hub
                </button>

                <button
                  onClick={handlePrintOrder}
                  className="w-full bg-white border-2 border-[#0066CC] text-[#0066CC] font-bold py-3 px-4 rounded-lg hover:bg-[#0066CC] hover:text-white transition shadow-md"
                >
                  Print Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
