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
import { verifyOrderSubmitPassword } from '@/lib/verify-order-submit-password'

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

// Display order: first image (top to bottom), then second image (top to bottom)
const ECOMM_MAINTENANCE_DISPLAY_ORDER: Record<string, number> = {
  'Toilet Paper (case) (Ecomm Maintenance)': 1,
  'Toilet Paper Dispensers (single) (Ecomm Maintenance)': 2,
  'Toilet Brush (Ecomm Maintenance)': 3,
  'Urinal Block with Screen (case) (Ecomm Maintenance)': 4,
  'Paper Towels (case) (Ecomm Maintenance)': 5,
  'Paper Towel Dispensers (single) (Ecomm Maintenance)': 6,
  'Antibacterial Hand Foam Soap (case) (Ecomm Maintenance)': 7,
  'Soap Dispensers (single) (Ecomm Maintenance)': 8,
  'Disinfectant Foam Cleaner (case) (Ecomm Maintenance)': 9,
  'Dust Mop Treatment (case) (Ecomm Maintenance)': 10,
  'Bowl Cleaner (Ecomm Maintenance)': 11,
  'Time Mist Refills - Cherry (case) (Ecomm Maintenance)': 12,
  'Time Mist Refills - Citrus (case) (Ecomm Maintenance)': 13,
  'Time Mist Refills - Clean Linen (case) (Ecomm Maintenance)': 14,
  'Time Mist Dispensers (single) (Ecomm Maintenance)': 15,
  'Goo Off (can) (Ecomm Maintenance)': 16,
  'Spray Bottle & Trigger (single) (Ecomm Maintenance)': 17,
  'Glass Cleaner (case) (Ecomm Maintenance)': 18,
  'Pine Kleen (case) (Ecomm Maintenance)': 19,
  'Clear Trash Bags - Large (case) (Ecomm Maintenance)': 20,
  'Clear Trash Bags - Small (case) (Ecomm Maintenance)': 21,
  'Comet Cleaner with bleach 3-30 with triggers (Ecomm Maintenance)': 22,
  'Fantastik Multi-Surface Disinfectant with triggers (Ecomm Maintenance)': 23,
  'One Shot (case) (Ecomm Maintenance)': 24,
  'Twine (case) (Ecomm Maintenance)': 25,
  'Masking Tape (case) (Ecomm Maintenance)': 26,
  'Sanitary Napkin Bags (case) (Ecomm Maintenance)': 27,
  'Cotton Mop Heads 32oz (case) (Ecomm Maintenance)': 28,
  'Dust Mop Head (dry) 36" (each) (Ecomm Maintenance)': 29,
  'Backbraces (each) (Ecomm Maintenance)': 30,
  'Push Broom 24" - refill (single) - order as needed (Ecomm Maintenance)': 31,
  'Floor Mop (complete) (Ecomm Maintenance)': 32,
  'Heavy Duty Street Broom (complete) (Ecomm Maintenance)': 33,
  'Long Handle Scraper (each) (Ecomm Maintenance)': 34,
  'Dust Mop (complete set) (Ecomm Maintenance)': 35,
  'Dustpan & Brush (normal length broom) (Ecomm Maintenance)': 36,
  'Mop Bucket (Ecomm Maintenance)': 37,
  'Plastic Cups (case) (Ecomm Maintenance)': 38,
  'Paper Plates (case) (Ecomm Maintenance)': 39,
  'Spoons - plastic (Ecomm Maintenance)': 40,
  'Forks - plastic (Ecomm Maintenance)': 41,
  'Knives - plastic (Ecomm Maintenance)': 42,
  'Blades for Long Handle Scraper (pack) (Ecomm Maintenance)': 43,
  'Hand Sanitizer Foam Ref. (case) (Ecomm Maintenance)': 44,
  'Hand Sanitizer - single pump bottle (Ecomm Maintenance)': 45,
  'Nitrile Gloves - Small (case of 1000) (Ecomm Maintenance)': 46,
  'Nitrile Gloves - Medium (case of 1000) (Ecomm Maintenance)': 47,
  'Nitrile Gloves - Large (case of 1000) (Ecomm Maintenance)': 48,
  'Nitrile Gloves - XL (case of 1000) (Ecomm Maintenance)': 49,
  'Newsprint (bundle) (Ecomm Maintenance)': 50,
}

// Helper function to get today's date in local timezone (YYYY-MM-DD format)
const getTodayLocalDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function EcomWarehouseMaintenancePage() {
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

  useEffect(() => {
    if (stores.length > 0 && !formData.storeId) {
      setFormData((prev) => ({ ...prev, storeId: stores[0].id.toString() }))
    }
  }, [stores, formData.storeId])

  const fetchStores = async () => {
    const { items, error } = await fetchJsonArrayFromApi<Store>('/api/stores')
    setStores(items)
    if (error) console.error('Error fetching stores:', error)
  }

  const fetchProducts = async () => {
    try {
      const { products, error } = await fetchProductsFromApi<Product>(
        `/api/products?activeOnly=true&category=${encodeURIComponent('Ecomm Maintenance Order')}`
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
        value === null ? null : Math.min(Math.max(0, value), existing.maxQuantity)

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

  const calculateSubtotal = () => {
    return getOrderedItems().reduce((sum, item) => sum + item.unitPriceCents * item.order, 0)
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.managerName.trim()) {
      alert('Please enter the manager name')
      return
    }

    const orderedItems = getOrderedItems()
    if (orderedItems.length === 0) {
      alert('Please enter order quantities for at least one product')
      return
    }

    setShowConfirmModal(true)
    setPassword('')
    setPasswordError('')
  }

  const handleConfirmSubmit = async () => {
    const storeIdToUse = formData.storeId || (stores.length > 0 ? stores[0].id.toString() : '')
    if (!storeIdToUse) {
      alert('No stores available')
      return
    }

    const ok = await verifyOrderSubmitPassword(password, storeIdToUse)
    if (!ok) {
      setPasswordError('Incorrect password')
      return
    }

    setPasswordError('')
    setShowConfirmModal(false)
    setSubmitting(true)

    const orderedItems = getOrderedItems()

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeIdToUse,
          orderSubmitPassword: password,
          managerName: formData.managerName.trim(),
          orderDate: formData.orderDate,
          notes: formData.notes,
          orderType: 'ECM',
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
    const defaultStoreId = stores.length > 0 ? stores[0].id.toString() : ''
    setFormData({
      storeId: defaultStoreId,
      managerName: '',
      orderDate: getTodayLocalDate(),
      notes: '',
    })

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
    return { storeDisplay: '', orderTypeLabel: 'Ecomm Maintenance Order' as const }
  }, [createdOrderId])

  const sortedProducts = Array.isArray(products)
    ? [...products].sort((a, b) => {
        const orderA = ECOMM_MAINTENANCE_DISPLAY_ORDER[a.name] ?? 9999
        const orderB = ECOMM_MAINTENANCE_DISPLAY_ORDER[b.name] ?? 9999
        return orderA - orderB
      })
    : []

  const productsByCategory = sortedProducts.length > 0
    ? sortedProducts.reduce((acc, product) => {
        if (!acc[product.category]) acc[product.category] = []
        acc[product.category].push(product)
        return acc
      }, {} as Record<string, Product[]>)
    : {}

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <h1 className="text-2xl font-bold text-[#0066CC] mb-4">Ecomm Maintenance Order</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white shadow rounded-lg p-3 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Order Type</label>
              <select
                disabled
                value="ECM"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-gray-100 cursor-not-allowed"
              >
                <option value="ECM">Ecomm Maintenance</option>
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
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                placeholder="Required"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Order Date</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-900 mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                placeholder="Optional notes for this order"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-3 border border-gray-200">
          {Object.keys(productsByCategory).length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No Ecomm Maintenance products found.</p>
              <p className="text-xs mt-1">Run the database seed to load products.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(productsByCategory).map(([category, prods]) => (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <div className="px-3 py-2 bg-[#E6F2FF] border-b border-gray-200">
                    <h2 className="text-sm font-bold text-[#0066CC]">{category}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-xs">
                      <thead className="bg-[#0066CC]">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-xs font-bold text-white uppercase border-r border-blue-400">Item</th>
                          <th className="px-2 py-1.5 text-center text-xs font-bold text-white uppercase border-r border-blue-400 w-20">Current</th>
                          <th className="px-2 py-1.5 text-center text-xs font-bold text-white uppercase border-r border-blue-400 w-16">Max.</th>
                          <th className="px-2 py-1.5 text-center text-xs font-bold text-white uppercase w-20">Order</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prods.map((product) => {
                          const po = productOrders[product.id]
                          const current = po?.current ?? ''
                          const orderQty = po?.order ?? 0

                          return (
                            <tr key={product.id} className="hover:bg-blue-50">
                              <td className="px-2 py-1 text-xs font-medium text-gray-900 border-r border-gray-200">{product.name}</td>
                              <td className="px-2 py-1 border-r border-gray-200">
                                <input
                                  type="number"
                                  min="0"
                                  max={product.maxQuantity}
                                  value={current}
                                  onChange={(e) =>
                                    updateProductOrder(
                                      product.id,
                                      'current',
                                      e.target.value === '' ? null : parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-full text-center border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                                />
                              </td>
                              <td className="px-2 py-1 text-center text-xs font-medium text-gray-900 border-r border-gray-200">{product.maxQuantity}</td>
                              <td className="px-2 py-1">
                                <div className="w-full text-center text-xs font-semibold text-gray-900">{orderQty > 0 ? orderQty : ''}</div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                <span className="font-bold text-[#0066CC]">{formatCurrency(calculateSubtotal())}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 border-2 border-gray-300 rounded-md text-gray-900 text-sm font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#0066CC] text-white text-sm font-bold rounded-md hover:bg-[#0052A3] disabled:opacity-50 transition-colors shadow-md"
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

