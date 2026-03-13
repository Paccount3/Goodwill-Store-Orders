'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Store {
  id: number
  storeNumber: string
  name: string
}

interface UniformProduct {
  id: number
  name: string
  category: string
  unitPriceCents: number
  maxQuantity: number
  isActive: boolean
  availableSizes: string | null
  availableColors: string | null
  style: string | null
  sizePriceMap: string | null
}

interface UniformOrderItem {
  productId: number
  productName: string
  size: string
  color: string
  style: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
}

// Helper function to get today's date in local timezone (YYYY-MM-DD format)
const getTodayLocalDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function StaffUniformsPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [uniforms, setUniforms] = useState<UniformProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    storeId: '',
    managerName: '',
    orderDate: getTodayLocalDate(),
    notes: '',
  })

  const [orderItems, setOrderItems] = useState<UniformOrderItem[]>([])

  useEffect(() => {
    fetchStores()
    fetchUniforms()
  }, [])

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setStores(data)
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchUniforms = async () => {
    try {
      const res = await fetch('/api/products?activeOnly=true&uniformsOnly=true')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('API Error Response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to fetch uniforms')
      }
      const data = await res.json()
      // Ensure data is an array
      const uniformsArray = Array.isArray(data) ? data : []
      console.log('Fetched uniforms:', uniformsArray.length, uniformsArray)
      setUniforms(uniformsArray)
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching uniforms:', error)
      console.error('Error details:', error.message)
      setUniforms([]) // Set to empty array on error
      setLoading(false)
    }
  }

  const addItemToOrder = (product: UniformProduct) => {
    const sizes = product.availableSizes ? JSON.parse(product.availableSizes) : []
    const colors = product.availableColors ? JSON.parse(product.availableColors) : []
    const defaultSize = sizes.length > 0 ? sizes[0] : ''
    const defaultColor = colors.length > 0 ? colors[0] : ''
    const defaultStyle = product.style || ''

    // Get price for default size
    let unitPriceCents = product.unitPriceCents
    if (product.sizePriceMap && defaultSize) {
      try {
        const sizePriceMap = JSON.parse(product.sizePriceMap)
        if (sizePriceMap[defaultSize]) {
          unitPriceCents = sizePriceMap[defaultSize]
        }
      } catch (e) {
        console.error('Error parsing sizePriceMap:', e)
      }
    }

    const newItem: UniformOrderItem = {
      productId: product.id,
      productName: product.name,
      size: defaultSize,
      color: defaultColor,
      style: defaultStyle,
      quantity: 1,
      unitPriceCents,
      lineTotalCents: unitPriceCents,
    }

    setOrderItems([...orderItems, newItem])
  }

  const updateItem = (index: number, field: keyof UniformOrderItem, value: any) => {
    const updated = [...orderItems]
    updated[index] = { ...updated[index], [field]: value }

    // Recalculate price if size changed
    if (field === 'size') {
      const product = Array.isArray(uniforms) ? uniforms.find((u) => u.id === updated[index].productId) : undefined
      if (product && product.sizePriceMap) {
        try {
          const sizePriceMap = JSON.parse(product.sizePriceMap)
          if (sizePriceMap[value]) {
            updated[index].unitPriceCents = sizePriceMap[value]
          }
        } catch (e) {
          console.error('Error parsing sizePriceMap:', e)
        }
      }
    }

    // Recalculate line total
    updated[index].lineTotalCents = updated[index].unitPriceCents * updated[index].quantity

    setOrderItems(updated)
  }

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const getTotalCents = () => {
    return orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.storeId || !formData.managerName) {
      alert('Please fill in all required fields')
      return
    }

    if (orderItems.length === 0) {
      alert('Please add at least one item to your order')
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

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: formData.storeId,
          managerName: formData.managerName,
          orderDate: formData.orderDate,
          notes: formData.notes,
          orderType: 'SU',
          lineItems: orderItems.map((item) => ({
            productId: item.productId,
            orderQuantity: item.quantity,
            currentQuantity: 0,
            size: item.size,
            color: item.color,
            style: item.style,
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
    setFormData({
      storeId: '',
      managerName: '',
      orderDate: getTodayLocalDate(),
      notes: '',
    })
    setOrderItems([])
    setShowSuccessModal(false)
    setCreatedOrderId(null)
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

  const uniformsByCategory = Array.isArray(uniforms) ? uniforms.reduce((acc, uniform) => {
    if (!acc[uniform.category]) {
      acc[uniform.category] = []
    }
    acc[uniform.category].push(uniform)
    return acc
  }, {} as Record<string, UniformProduct[]>) : {}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-[#0066CC]">
              Staff Uniforms Order Form
            </h1>
            <a
              href="/GW-Apparel-Form.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-[#0066CC] text-white text-sm font-bold rounded-md hover:bg-[#0052A3] transition-colors shadow-md"
            >
              Print Deductions PDF
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Store <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id} className="text-gray-900">
                      {store.storeNumber} - {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Manager Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Order Date</label>
                <input
                  type="date"
                  value={getTodayLocalDate()}
                  readOnly
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-[#0066CC] mb-4">Available Uniforms</h2>
              {Object.keys(uniformsByCategory).length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p>No uniforms available. Please check back later or contact support.</p>
                  <p className="text-sm mt-2">If you just seeded the database, please refresh the page.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(uniformsByCategory).map(([category, categoryUniforms]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-bold text-lg text-[#0066CC] mb-3">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryUniforms.map((uniform) => {
                          const sizes = uniform.availableSizes ? JSON.parse(uniform.availableSizes) : []
                          const colors = uniform.availableColors ? JSON.parse(uniform.availableColors) : []
                          const style = uniform.style || 'Unisex'

                          return (
                            <button
                              key={uniform.id}
                              type="button"
                              onClick={() => addItemToOrder(uniform)}
                              className="text-left border-2 border-gray-300 rounded-lg p-3 hover:border-[#0066CC] hover:bg-blue-50 transition"
                            >
                              <div className="font-semibold text-gray-900">{uniform.name}</div>
                              <div className="text-sm text-gray-700 mt-1">
                                {style} • {colors.join(', ')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Sizes: {sizes.join(', ')}
                              </div>
                              <div className="text-sm font-bold text-[#0066CC] mt-2">
                                From {formatCurrency(uniform.unitPriceCents)}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {orderItems.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-bold text-[#0066CC] mb-4">Order Items</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-[#0066CC]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Size</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Color</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Style</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item, index) => {
                        const product = Array.isArray(uniforms) ? uniforms.find((u) => u.id === item.productId) : undefined
                        const sizes = product?.availableSizes ? JSON.parse(product.availableSizes) : []
                        const colors = product?.availableColors ? JSON.parse(product.availableColors) : []
                        const styles = product?.style ? [product.style] : ['Men', 'Women', 'Unisex']

                        return (
                          <tr key={index} className="hover:bg-blue-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.productName}</td>
                            <td className="px-4 py-2">
                              <select
                                value={item.size}
                                onChange={(e) => updateItem(index, 'size', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                              >
                                {sizes.map((size: string) => (
                                  <option key={size} value={size} className="text-gray-900">
                                    {size}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={item.color}
                                onChange={(e) => updateItem(index, 'color', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                              >
                                {colors.map((color: string) => (
                                  <option key={color} value={color} className="text-gray-900">
                                    {color}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={item.style}
                                onChange={(e) => updateItem(index, 'style', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                              >
                                {styles.map((s: string) => (
                                  <option key={s} value={s} className="text-gray-900">
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {formatCurrency(item.unitPriceCents)}
                            </td>
                            <td className="px-4 py-2 text-sm font-bold text-[#0066CC]">
                              {formatCurrency(item.lineTotalCents)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800 font-semibold"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-right font-bold text-gray-900">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-lg font-bold text-[#0066CC]">
                          {formatCurrency(getTotalCents())}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="px-6 py-2 border-2 border-gray-300 rounded-md text-gray-900 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || orderItems.length === 0}
                className="px-6 py-2 bg-[#0066CC] text-white font-bold rounded-md hover:bg-[#0052A3] disabled:opacity-50 transition-colors shadow-md"
              >
                {submitting ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </form>
        </div>
      </div>

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
                Your uniform order has been submitted successfully.
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
