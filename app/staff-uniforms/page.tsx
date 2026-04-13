'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ConfirmOrderModal,
  OrderSubmitErrorModal,
  OrderSuccessModal,
  OrderLoadingModal,
} from '@/app/components/StoreOrderFlowModals'
import {
  isSuccessfulOrderResponse,
  orderSubmitErrorUserMessage,
} from '@/lib/order-flow'
import { fetchJsonArrayFromApi, fetchProductsFromApi } from '@/lib/fetch-products-client'

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
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [orderSubmitError, setOrderSubmitError] = useState('')

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
    const { items, error } = await fetchJsonArrayFromApi<Store>('/api/stores')
    setStores(items)
    if (error) console.error('Error fetching stores:', error)
  }

  const fetchUniforms = async () => {
    try {
      const { products, error } = await fetchProductsFromApi<UniformProduct>(
        '/api/products?activeOnly=true&uniformsOnly=true'
      )
      if (error) console.error('Error fetching uniforms:', error)
      setUniforms(products)
    } catch (error: unknown) {
      console.error('Error fetching uniforms:', error)
      setUniforms([])
    } finally {
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

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
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

      let payload: unknown
      try {
        payload = await res.json()
      } catch {
        throw new Error(`Invalid response from server (${res.status})`)
      }

      if (!res.ok) {
        const errObj = payload as { error?: string; details?: string }
        throw new Error(errObj.error || errObj.details || `Request failed (${res.status})`)
      }

      if (!isSuccessfulOrderResponse(payload)) {
        throw new Error('Order was not saved correctly. Please try again.')
      }

      setCreatedOrderId(payload.id)
      setSubmitting(false)
      setShowLoadingAnimation(true)
      setTimeout(() => {
        setShowLoadingAnimation(false)
        setShowSuccessModal(true)
      }, 1000)
    } catch (error: unknown) {
      const technical =
        error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)
      setOrderSubmitError(orderSubmitErrorUserMessage(technical))
      setShowErrorModal(true)
      setSubmitting(false)
      setShowLoadingAnimation(false)
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
    setShowErrorModal(false)
    setOrderSubmitError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrintOrder = () => {
    if (createdOrderId) {
      window.open(`${window.location.origin}/orders/${createdOrderId}/invoice`, '_blank', 'noopener,noreferrer')
    }
  }

  const orderSuccessMeta = useMemo(() => {
    if (!createdOrderId) return null
    const st = stores.find((s) => s.id === Number(formData.storeId))
    const storeDisplay = st ? `${st.storeNumber} - ${st.name}` : 'Unknown store'
    return { storeDisplay, orderTypeLabel: 'Staff Apparel' as const }
  }, [createdOrderId, stores, formData.storeId])

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
              Staff Apparel
            </h1>
            <a
              href="/Payroll-Deduction-Form.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-[#0066CC] text-white text-sm font-bold rounded-md hover:bg-[#0052A3] transition-colors shadow-md"
            >
              Print Payroll Deduction PDF
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

            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-gray-900">
              <p className="font-semibold">
                The payroll deduction form (found above on the right) must be filled out and emailed to Michael Segura (msegura@gwct.org) for your order to be packed and shipped. A payroll deduction form does not need to be filled out for the retail store management team annual free orders.
              </p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-[#0066CC] mb-4">Available Apparel</h2>
              {Object.keys(uniformsByCategory).length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p>No apparel available. Please check back later or contact support.</p>
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
                onClick={() => router.push('/')}
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

      <ConfirmOrderModal
        open={showConfirmModal}
        password={password}
        passwordError={passwordError}
        submitting={submitting}
        onPasswordChange={(v) => {
          setPassword(v)
          setPasswordError('')
        }}
        onCancel={handleCancelConfirm}
        onConfirm={handleConfirmSubmit}
      />

      <OrderSubmitErrorModal
        open={showErrorModal}
        message={orderSubmitError}
        onClose={() => {
          setShowErrorModal(false)
          setOrderSubmitError('')
        }}
      />

      <OrderLoadingModal open={showLoadingAnimation} />

      {showSuccessModal && createdOrderId && orderSuccessMeta && (
        <OrderSuccessModal
          open
          orderId={createdOrderId}
          storeDisplay={orderSuccessMeta.storeDisplay}
          orderTypeLabel={orderSuccessMeta.orderTypeLabel}
          onOrderAgain={handleOrderAgain}
          onPrintCopy={handlePrintOrder}
        />
      )}
    </div>
  )
}
