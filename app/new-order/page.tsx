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

// Explicit display order for store supply items (by product name)
const PRODUCT_DISPLAY_ORDER: Record<string, number> = {
  'Copy Paper': 1,
  'Clear Barbs': 2,
  'Super Slices': 3,
  'Garment Guns': 4,
  'Garment Needles': 5,
  'Furniture Tags (book)': 6,
  'Sizing Rings (S–XL)': 7,
  'Sizing Ring Squares (S–XL)': 8,
  "Men's Sizing Rings": 9,
  "Women's Sizing Rings": 10,
  "Women's Sizing Ring Squares": 11,
  "Children's Sizing Rings": 12,
  'Large Rubberbands': 13,
  'ECOMM Dymo Labels': 14,
  'ECOMM Jewelry Bags (bundle)': 15,
  'ECOMM Seals (bag of 100)': 16,
  'ECOMM Tags (box of 1000)': 17,
  'ECOMM Zip Ties (bag of 1000)': 18,
  'Clear 8" Zipties': 19,
  '9 Volt Batteries': 20,
  'AA Batteries': 21,
  'AAA Batteries': 22,
  'C Batteries': 23,
  'Shirt Hanger Grips': 24,
  'Window Squeegee': 25,
  'Sterilization Tags (250)': 26,
  'Sterifab Dispenser': 27,
  'Safety Labels (sheet of 15)': 28,
  'Scotch Tape': 29,
  'Yellow Tape': 30,
  'Dry Erase Black': 31,
  'Dry Erase Green': 32,
  'Dry Erase Red': 33,
  'Ballpoint Pens': 34,
  'Highlighters (pack of 6 colors)': 35,
  'Silver Markers': 36,
  'Red Markers': 37,
  'Black Markers': 38,
  'Counterfeit Markers': 39,
  'Magnum Markers': 40,
  'Star Post-Its': 41,
  'White Out': 42,
  'Scissors': 43,
  'Wire Cutters': 44,
  'Staplers': 45,
  'Staples': 46,
  'Safety Box Cutter': 47,
  'Vacuum Belts': 48,
  'Truck Seals': 49,
  'Gloves Heavy Duty – M (one pair)': 50,
  'Gloves Heavy Duty – L (one pair)': 51,
  'Gloves Heavy Duty – XL (one pair)': 52,
  'Nylon Gloves – S (pack of 12)': 53,
  'Nylon Gloves – M (pack of 12)': 54,
  'Nylon Gloves – L (pack of 12)': 55,
  'Nylon Gloves – XL (pack of 12)': 56,
  'Orange Stickers (roll)': 57,
  'Disposable Masks': 58,
  'Goggles': 59,
  'Sortkwik Fingertip Moistener': 60,
  'Sizing and Colorization Charts': 61,
  'White Tags (case)': 62,
  'White Stickers (case)': 63,
  'Red Tags (case)': 64,
  'Red Stickers (case)': 65,
  'Yellow Tags (case)': 66,
  'Yellow Stickers (case)': 67,
  'Green Tags (case)': 68,
  'Green Stickers (case)': 69,
  'Blue Tags (case)': 70,
  'Blue Stickers (case)': 71,
  'Reusable Bags – Large Design': 72,
  'Reusable Bags – Small Blue': 73,
  'Thermal Paper': 74,
  'Rubberbands': 75,
  'Nitrile Gloves – S (case of 1000)': 76,
  'Nitrile Gloves – M (case of 1000)': 77,
  'Nitrile Gloves – L (case of 1000)': 78,
  'Nitrile Gloves – XL (case of 1000)': 79,
  'Sterifab': 80,
  "Children's Hangers": 81,
  'Shirt Hangers': 82,
  'Pant Hangers': 83,
  'Aprons': 84,
  'Baseball Caps': 85,
  'Beanies': 86,
}

// Helper function to get today's date in local timezone (YYYY-MM-DD format)
const getTodayLocalDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function NewOrderPage() {
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
      const res = await fetch('/api/products?activeOnly=true&excludeUniforms=true')
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

  const calculateSubtotal = () => {
    return getOrderedItems().reduce(
      (sum, item) => sum + item.unitPriceCents * item.order,
      0
    )
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

    const orderedItems = getOrderedItems()

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: formData.storeId,
          managerName: formData.managerName,
          orderDate: formData.orderDate,
          notes: formData.notes,
          orderType: 'NSSO',
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
    // Reset form
    setFormData({
      storeId: '',
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
    const st = stores.find((s) => s.id === Number(formData.storeId))
    const storeDisplay = st ? `${st.storeNumber} - ${st.name}` : 'Unknown store'
    return { storeDisplay, orderTypeLabel: 'Store Supply Order' as const }
  }, [createdOrderId, stores, formData.storeId])

  const sortedProducts: Product[] = Array.isArray(products)
    ? [...products].sort((a, b) => {
        const orderA = PRODUCT_DISPLAY_ORDER[a.name] ?? 9999
        const orderB = PRODUCT_DISPLAY_ORDER[b.name] ?? 9999
        if (orderA !== orderB) return orderA - orderB
        // Fallback stable sort by name if not explicitly ordered or same index
        return a.name.localeCompare(b.name)
      })
    : []

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <h1 className="text-2xl font-bold text-[#0066CC] mb-4">Store Supply Order</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header Info - Condensed */}
        <div className="bg-white shadow rounded-lg p-3 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                Store Name <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={formData.storeId}
                onChange={(e) =>
                  setFormData({ ...formData, storeId: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
              >
                <option value="" className="text-gray-600">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id} className="text-gray-900">
                    {store.storeNumber} - {store.name}
                  </option>
                ))}
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
                onChange={(e) =>
                  setFormData({ ...formData, managerName: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
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
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC]"
                placeholder="Add any notes..."
              />
            </div>
          </div>
        </div>

        {/* Products List - Condensed */}
        <div className="bg-white shadow rounded-lg p-3 border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-xs">
              <thead className="bg-[#0066CC]">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-bold text-white uppercase border-r border-blue-400">
                    Item
                  </th>
                  <th className="px-2 py-1.5 text-center text-xs font-bold text-white uppercase border-r border-blue-400 w-20">
                    Current
                  </th>
                  <th className="px-2 py-1.5 text-center text-xs font-bold text-white uppercase border-r border-blue-400 w-16">
                    Max
                  </th>
                  <th className="px-2 py-1.5 text-center text-xs font-bold text-white uppercase w-20">
                    Order
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.map((product) => {
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
                          value={po.current ?? ''}
                          onChange={(e) =>
                            updateProductOrder(product.id, 'current', e.target.value === '' ? null : parseInt(e.target.value) || 0)
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
                  {formatCurrency(calculateSubtotal())}
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
