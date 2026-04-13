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
  current: number | null
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

export default function ADCMaintenancePage() {
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
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [orderSubmitError, setOrderSubmitError] = useState('')

  const [formData, setFormData] = useState({
    storeId: '',
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
    // Intentionally only when stores load; adding formData.storeId would overwrite user selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          current: null,
          order: 0,
        }
      })
      setProductOrders(initial)
    }
  }, [products])

  const fetchStores = async () => {
    const { items, error } = await fetchJsonArrayFromApi<Store>('/api/stores')
    setStores(items)
    if (error) console.error('Error fetching stores:', error)
  }

  const fetchProducts = async () => {
    try {
      const { products, error } = await fetchProductsFromApi<Product>(
        '/api/products?activeOnly=true&category=ADC Maintenance'
      )
      setProducts(products)
      if (error) console.error('Error fetching products:', error)
    } catch (error: unknown) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const updateProductOrder = (productId: number, field: 'current', value: number | null) => {
    setProductOrders((prev) => {
      const existing = prev[productId]
      if (!existing) return prev

      const nextCurrent =
        value === null
          ? null
          : Math.min(Math.max(0, value), existing.maxQuantity)
      const autoOrder =
        nextCurrent === null ? 0 : Math.max(0, existing.maxQuantity - nextCurrent)

      return {
        ...prev,
        [productId]: {
          ...existing,
          current: nextCurrent,
          order: autoOrder,
        },
      }
    })
  }

  const getOrderedItems = () => {
    return Object.values(productOrders)
      .filter((po) => po.current !== null)
      .map((po) => {
        const current = po.current ?? 0
        const order = po.maxQuantity - current
        return { ...po, order }
      })
  }

  const getSubtotalCents = () => {
    return getOrderedItems().reduce((sum, item) => {
      return sum + item.unitPriceCents * item.order
    }, 0)
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
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
          orderType: 'ADC_M',
          lineItems: orderedItems.map((item) => ({
            productId: item.productId,
            currentQuantity: item.current,
            orderQuantity: item.order,
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
          current: null,
          order: 0,
        }
      })
    }
    setProductOrders(reset)

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
    return { storeDisplay: '', orderTypeLabel: 'ADC Maintenance Order' as const }
  }, [createdOrderId])

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
      <h1 className="text-2xl font-bold text-[#0066CC] mb-4">ADC Maintenance Order</h1>

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
                value="ADC_M"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-gray-100 cursor-not-allowed"
              >
                <option value="ADC_M">ADC M</option>
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
                              max={product.maxQuantity}
                              value={po.current ?? ''}
                              onChange={(e) =>
                                updateProductOrder(
                                  product.id,
                                  'current',
                                  e.target.value === '' ? null : parseInt(e.target.value) || 0
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
                            <div className="w-full text-center text-xs font-semibold text-gray-900">
                              {po.order}
                            </div>
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
            onClick={() => router.push('/')}
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
