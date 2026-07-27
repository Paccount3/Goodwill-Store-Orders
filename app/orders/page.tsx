'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fetchJsonArrayFromApi, fetchProductsFromApi } from '@/lib/fetch-products-client'
import {
  ORDER_FLAG_COLORS,
  OrderFlagColor,
  FLAG_COLOR_STYLES,
  FLAG_ICON_PATH,
} from '@/lib/order-flag-colors'

interface Store {
  id: number
  storeNumber: string
  name: string
}

interface Product {
  id: number
  name: string
  category: string
}

interface OrderLine {
  id: number
  productId: number
  quantity: number
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
  orderType?: string
  flagColor?: OrderFlagColor | null
  orderLines: OrderLine[]
}

interface Stats {
  totalSpendCents: number
  topStores: (Store & { spendCents: number })[]
  allStores?: (Store & { spendCents: number })[] // All stores sorted by spend
  topProducts: (Product & { quantity: number })[]
  orderTypeCounts?: Record<string, number>
}

export default function OrdersHubPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Admin cookie persists ~8h after login; no forced re-prompt on every navigation/refresh.
  const [adminGateLoading, setAdminGateLoading] = useState(true)

  const [orders, setOrders] = useState<Order[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [flaggingOrderId, setFlaggingOrderId] = useState<number | null>(null)
  const [flagPickerOrderId, setFlagPickerOrderId] = useState<number | null>(null)
  const [flagPickerPos, setFlagPickerPos] = useState<{ top: number; left: number } | null>(null)

  const [filters, setFilters] = useState({
    search: '',
    storeId: '',
    productId: '',
    dateFrom: '',
    dateTo: '',
    orderType: '',
    flaggedOnly: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  useEffect(() => {
    let cancelled = false

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/status', { cache: 'no-store' })
        const data = await res.json()

        if (cancelled) return

        if (!data?.authed) {
          const searchString = searchParams?.toString() ? `?${searchParams.toString()}` : ''
          const redirectTo = `${pathname}${searchString}`
          router.replace(`/admin-lock?redirectTo=${encodeURIComponent(redirectTo)}`)
          return
        }

        // Verified: allow this page load (admin cookie persists for 8 hours).
        setAdminGateLoading(false)
      } catch {
        if (cancelled) return
        const searchString = searchParams?.toString() ? `?${searchParams.toString()}` : ''
        const redirectTo = `${pathname}${searchString}`
        router.replace(`/admin-lock?redirectTo=${encodeURIComponent(redirectTo)}`)
      }
    }

    checkAdmin()
    return () => {
      cancelled = true
    }
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!adminGateLoading) {
      fetchStores()
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminGateLoading])

  useEffect(() => {
    if (!adminGateLoading) {
      fetchOrders()
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, adminGateLoading])

  useEffect(() => {
    if (flagPickerOrderId === null) return

    const closePicker = () => {
      setFlagPickerOrderId(null)
      setFlagPickerPos(null)
    }
    const timer = window.setTimeout(() => {
      document.addEventListener('click', closePicker)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('click', closePicker)
    }
  }, [flagPickerOrderId])

  if (adminGateLoading) {
    return null
  }

  const fetchStores = async () => {
    const { items, error } = await fetchJsonArrayFromApi<Store>('/api/stores')
    setStores(items)
    if (error) console.error('Error fetching stores:', error)
  }

  const fetchProducts = async () => {
    const { products, error } = await fetchProductsFromApi<Product>('/api/products')
    setProducts(products)
    if (error) console.error('Error fetching products:', error)
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.storeId) params.append('storeId', filters.storeId)
      if (filters.productId) params.append('productId', filters.productId)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.orderType) params.append('orderType', filters.orderType)
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)

      const { items, error } = await fetchJsonArrayFromApi<Order>(`/api/orders?${params.toString()}`)
      setOrders(items)
      if (error) console.error('Error fetching orders:', error)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.storeId) params.append('storeId', filters.storeId)
      if (filters.productId) params.append('productId', filters.productId)
      if (filters.orderType) {
        // Map display values to database values for stats API
        const orderTypeMap: Record<string, string> = {
          NSSO: 'NSSO',
          SU: 'SU',
          'ADC S': 'ADC_S',
          'ADC M': 'ADC_M',
          HM: 'HM',
          EWH: 'EWH',
          EEB: 'EEB',
          EBM: 'EBM',
          ECM: 'ECM',
        }
        params.append('orderType', orderTypeMap[filters.orderType] || filters.orderType)
      }

      const res = await fetch(`/api/orders/stats?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await res.json()
      setStats({
        totalSpendCents: data.totalSpendCents || 0,
        topStores: data.topStores || [],
        allStores: data.allStores || [],
        topProducts: data.topProducts || [],
        orderTypeCounts: data.orderTypeCounts || {},
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        totalSpendCents: 0,
        topStores: [],
        allStores: [],
        topProducts: [],
        orderTypeCounts: {},
      })
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getOrderTypeAcronym = (orderType: string | null | undefined): string => {
    if (!orderType) return 'SSO' // Default for old orders without type (stored as NSSO)
    switch (orderType) {
      case 'NSSO':
        return 'SSO'
      case 'SU':
        return 'SA'
      case 'ADC_S':
        return 'ADC S'
      case 'ADC_M':
        return 'ADC M'
      case 'HM':
        return 'Store Maintenance'
      case 'EWH':
        return 'Ecomm Supply'
      case 'EEB':
        return 'EBooks Supply'
      case 'EBM':
        return 'Ebooks Maintenance Order'
      case 'ECM':
        return 'Ecomm Maintenance Order'
      default:
        return orderType
    }
  }

  const handleDeleteClick = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingOrderId(orderId)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOrderId) return

    try {
      const res = await fetch(`/api/orders/${deletingOrderId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete order')
      }

      // Refresh orders and stats
      await fetchOrders()
      await fetchStats()
      
      setShowDeleteConfirm(false)
      setDeletingOrderId(null)
    } catch (error: any) {
      alert(error.message || 'Failed to delete order')
      setShowDeleteConfirm(false)
      setDeletingOrderId(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeletingOrderId(null)
  }

  const handleFlagButtonClick = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (flagPickerOrderId === orderId) {
      setFlagPickerOrderId(null)
      setFlagPickerPos(null)
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setFlagPickerPos({ top: rect.bottom + 4, left: rect.left })
    setFlagPickerOrderId(orderId)
  }

  const handleSetFlag = async (
    orderId: number,
    flagColor: OrderFlagColor | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setFlagPickerOrderId(null)
    setFlagPickerPos(null)
    setFlaggingOrderId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagColor }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update flag')
      }
      const updated = await res.json()
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, flagColor: updated.flagColor } : o))
      )
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to update flag')
    } finally {
      setFlaggingOrderId(null)
    }
  }

  const orderList = Array.isArray(orders) ? orders : []
  const flagPickerOrder = flagPickerOrderId
    ? orderList.find((o) => o.id === flagPickerOrderId) ?? null
    : null
  const displayedOrders = filters.flaggedOnly
    ? orderList.filter((o) => o.flagColor)
    : [...orderList].sort((a, b) => {
        if (!!a.flagColor === !!b.flagColor) return 0
        return a.flagColor ? -1 : 1
      })

  const formatDate = (dateString: string) => {
    // Parse the ISO date string directly to avoid timezone conversion
    // Dates are stored as UTC, so we extract the date part from the ISO string
    // Format: "2026-02-09T00:00:00.000Z" -> extract "2026-02-09"
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      const year = parseInt(dateMatch[1])
      const month = parseInt(dateMatch[2])
      const day = parseInt(dateMatch[3])
      return `${month}/${day}/${year}`
    }
    // Fallback to UTC parsing if format doesn't match
    const date = new Date(dateString)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()
    return `${month}/${day}/${year}`
  }

  const handleSort = (field: string) => {
    setFilters({
      ...filters,
      sortBy: field,
      sortOrder:
        filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc',
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0066CC]">Orders Hub</h1>
        <Link
          href="/new-order"
          className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
        >
          New Order
        </Link>
      </div>

      {/* Insights Section */}
      {stats && (
        <div className="bg-white shadow-lg rounded-lg mb-6 border border-gray-200 overflow-hidden">
          <div className="px-5 py-2.5 bg-[#0066CC] border-b border-[#0052A3] flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white">Insights for Selection</h2>
            <Link
              href="/order-stats"
              className="text-xs font-semibold text-blue-100 hover:text-white hover:underline whitespace-nowrap"
            >
              Full insights →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-gray-200">
            {/* Total Spend */}
            <div className="p-4 md:py-4 flex items-center">
              <div className="w-full rounded-lg bg-white border-2 border-[#0066CC] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  Total Spend
                </p>
                <p className="text-2xl font-bold text-[#0066CC] tabular-nums leading-none">
                  {formatCurrency(stats.totalSpendCents)}
                </p>
              </div>
            </div>

            {/* Top Spending Stores */}
            <div className="p-4 md:py-4 border-t md:border-t-0 border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Top Spending Stores
                </p>
                {stats.allStores && stats.allStores.length > 0 ? (
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                    {stats.allStores.length}
                  </span>
                ) : null}
              </div>
              <div className="max-h-32 overflow-y-auto pr-1 -mr-1 space-y-0.5">
                {stats.allStores && stats.allStores.length > 0 ? (
                  stats.allStores.map((store, index) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-gray-50"
                    >
                      <span className="text-xs text-gray-800 truncate min-w-0">
                        <span className="text-gray-400 font-medium tabular-nums mr-1.5">
                          {index + 1}.
                        </span>
                        <span className="font-semibold">{store.storeNumber}</span>
                        <span className="text-gray-500 font-normal"> · {store.name}</span>
                      </span>
                      <span className="text-xs font-semibold text-[#0066CC] tabular-nums shrink-0">
                        {formatCurrency(store.spendCents)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-1">No data for current filters</p>
                )}
              </div>
            </div>

            {/* Order Type Count */}
            <div className="p-4 md:py-4 border-t md:border-t-0 border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Order Type Count
                </p>
                {stats.orderTypeCounts && Object.keys(stats.orderTypeCounts).length > 0 ? (
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                    {Object.keys(stats.orderTypeCounts).length}
                  </span>
                ) : null}
              </div>
              <div className="max-h-32 overflow-y-auto pr-1 -mr-1 space-y-0.5">
                {stats.orderTypeCounts && Object.keys(stats.orderTypeCounts).length > 0 ? (
                  Object.entries(stats.orderTypeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-gray-50"
                      >
                        <span className="text-xs font-semibold text-gray-800 truncate">{type}</span>
                        <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-[#0066CC] px-2 py-0.5 text-[11px] font-bold text-white tabular-nums shrink-0">
                          {count}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-1">No data for current filters</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-bold text-[#0066CC] mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Store, manager, order ID..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Store
            </label>
            <select
              value={filters.storeId}
              onChange={(e) =>
                setFilters({ ...filters, storeId: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              <option value="" className="text-gray-600">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id} className="text-gray-900">
                  {store.storeNumber} - {store.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Includes Product
            </label>
            <select
              value={filters.productId}
              onChange={(e) =>
                setFilters({ ...filters, productId: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              <option value="" className="text-gray-600">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id} className="text-gray-900">
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Order Type
            </label>
            <select
              value={filters.orderType}
              onChange={(e) =>
                setFilters({ ...filters, orderType: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              <option value="" className="text-gray-600">All Types</option>
              <option value="NSSO" className="text-gray-900">SSO</option>
              <option value="SU" className="text-gray-900">SA</option>
              <option value="ADC S" className="text-gray-900">ADC S</option>
              <option value="ADC M" className="text-gray-900">ADC M</option>
              <option value="HM" className="text-gray-900">Store Maintenance</option>
              <option value="EWH" className="text-gray-900">Ecomm Supply</option>
              <option value="EEB" className="text-gray-900">EBooks Supply</option>
              <option value="EBM" className="text-gray-900">Ebooks Maintenance</option>
              <option value="ECM" className="text-gray-900">Ecomm Maintenance</option>
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={filters.flaggedOnly}
                onChange={(e) =>
                  setFilters({ ...filters, flaggedOnly: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
              />
              <span className="text-sm font-semibold text-gray-900">Flagged only</span>
            </label>
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  storeId: '',
                  productId: '',
                  dateFrom: '',
                  dateTo: '',
                  orderType: '',
                  flaggedOnly: false,
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })
              }
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-900 font-medium">Loading orders...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-800 font-medium">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0066CC]">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase w-12">
                    Flag
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold text-white uppercase cursor-pointer hover:bg-[#0052A3] transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    Order ID {filters.sortBy === 'id' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                    Manager
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold text-white uppercase cursor-pointer hover:bg-[#0052A3] transition-colors"
                    onClick={() => handleSort('orderDate')}
                  >
                    Order Date {filters.sortBy === 'orderDate' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                    Items
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold text-white uppercase cursor-pointer hover:bg-[#0052A3] transition-colors"
                    onClick={() => handleSort('subtotalCents')}
                  >
                    Subtotal {filters.sortBy === 'subtotalCents' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedOrders.map((order) => {
                  const flagHex = order.flagColor ? FLAG_COLOR_STYLES[order.flagColor].hex : null
                  return (
                  <tr
                    key={order.id}
                    className={`cursor-pointer transition-colors ${
                      !order.flagColor ? 'hover:bg-blue-50' : ''
                    }`}
                    style={
                      order.flagColor
                        ? { backgroundColor: FLAG_COLOR_STYLES[order.flagColor].rowBg }
                        : undefined
                    }
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={(e) => handleFlagButtonClick(order.id, e)}
                        disabled={flaggingOrderId === order.id}
                        title={
                          order.flagColor
                            ? `Flagged ${FLAG_COLOR_STYLES[order.flagColor].label}`
                            : 'Set flag color'
                        }
                        className="p-1 rounded transition-colors disabled:opacity-50 hover:opacity-80"
                        aria-label={
                          order.flagColor
                            ? `Change ${FLAG_COLOR_STYLES[order.flagColor].label} flag`
                            : 'Set flag color'
                        }
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill={flagHex ?? 'none'}
                          stroke={flagHex ?? '#d1d5db'}
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={FLAG_ICON_PATH}
                          />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0066CC]">
                      {getOrderTypeAcronym(order.orderType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.store.storeNumber} - {order.store.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.managerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderLines.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#0066CC]">
                      {formatCurrency(order.subtotalCents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/orders/${order.id}`)
                          }}
                          className="text-[#0066CC] hover:text-[#0052A3] font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(order.id, e)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                          title="Delete order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flag color picker — fixed position to avoid table overflow clipping */}
      {flagPickerOrder && flagPickerPos && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
          style={{ top: flagPickerPos.top, left: flagPickerPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-semibold text-gray-500 px-1 pb-1.5 whitespace-nowrap">
            Flag color
          </div>
          <div className="flex items-center gap-2">
            {ORDER_FLAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={(e) => handleSetFlag(flagPickerOrder.id, color, e)}
                disabled={flaggingOrderId === flagPickerOrder.id}
                title={FLAG_COLOR_STYLES[color].label}
                className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 disabled:opacity-50 ${
                  flagPickerOrder.flagColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                }`}
                aria-label={`Flag ${FLAG_COLOR_STYLES[color].label}`}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill={FLAG_COLOR_STYLES[color].hex}
                  stroke={FLAG_COLOR_STYLES[color].hex}
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={FLAG_ICON_PATH}
                  />
                </svg>
              </button>
            ))}
          </div>
          {flagPickerOrder.flagColor && (
            <button
              type="button"
              onClick={(e) => handleSetFlag(flagPickerOrder.id, null, e)}
              disabled={flaggingOrderId === flagPickerOrder.id}
              className="mt-2 w-full text-xs font-semibold text-gray-600 hover:text-gray-900 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Clear flag
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Delete Order?
              </h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete order #{deletingOrderId}? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
