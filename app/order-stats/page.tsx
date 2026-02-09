'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

interface Store {
  id: number
  storeNumber: string
  name: string
}

interface StoreQuantity {
  storeId: number
  storeNumber: string
  storeName: string
  quantity: number
}

interface ProductStats {
  productId: number
  productName: string
  category: string
  stores: StoreQuantity[]
  total: number
}

interface AggregatedData {
  products: ProductStats[]
  stores: Store[]
}

interface InsightsData {
  totalSpendCents: number
  spendPerStore: Array<{
    storeId: number
    storeName: string
    spendCents: number
    orderCount: number
  }>
  spendPerItem: Array<{
    productId: number
    productName: string
    spendCents: number
    orderCount: number
  }>
}

export default function OrderStatsPage() {
  const [data, setData] = useState<AggregatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Store Supplies')
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([])
  const [allStores, setAllStores] = useState<Store[]>([])
  const [showStoreFilter, setShowStoreFilter] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedYear, selectedMonth, selectedCategory, selectedStoreIds])

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setAllStores(data)
      // Initialize with all stores selected only if not a non-store category
      if (selectedCategory !== 'ADC Supply' && selectedCategory !== 'ADC Maintenance' && selectedCategory !== 'Housatonic Maintenance') {
        setSelectedStoreIds(data.map((store: Store) => store.id))
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchData = async () => {
    // Check if this is a non-store category
    const isNonStoreCat = selectedCategory === 'ADC Supply' || selectedCategory === 'ADC Maintenance' || selectedCategory === 'Housatonic Maintenance'
    
    // Don't fetch if no stores are selected for non-store categories
    if (!isNonStoreCat && selectedStoreIds.length === 0) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth) params.append('month', selectedMonth)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStoreIds.length > 0) {
        params.append('storeIds', selectedStoreIds.join(','))
      }

      const res = await fetch(`/api/orders/aggregate?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const isNonStoreCategory = selectedCategory === 'ADC Supply' || selectedCategory === 'ADC Maintenance' || selectedCategory === 'Housatonic Maintenance'

  const handleStoreToggle = (storeId: number) => {
    setSelectedStoreIds(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId)
      } else {
        return [...prev, storeId]
      }
    })
  }

  const handleSelectAllStores = () => {
    setSelectedStoreIds(allStores.map(store => store.id))
  }

  const handleDeselectAllStores = () => {
    setSelectedStoreIds([])
  }

  // Get available years from orders
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i.toString())
    }
    return years
  }

  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const productsByCategory = data?.products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, ProductStats[]>) || {}

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const fetchInsights = async () => {
    setLoadingInsights(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth) params.append('month', selectedMonth)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStoreIds.length > 0) {
        params.append('storeIds', selectedStoreIds.join(','))
      }

      const res = await fetch(`/api/orders/insights?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch insights')
      }
      const result = await res.json()
      setInsights(result)
      setShowInsights(true)
    } catch (error) {
      console.error('Error fetching insights:', error)
      alert('Failed to load insights')
    } finally {
      setLoadingInsights(false)
    }
  }

  // Close store filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.store-filter-container')) {
        setShowStoreFilter(false)
      }
    }
    if (showStoreFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStoreFilter])

  const exportToExcel = () => {
    if (!data || data.products.length === 0) {
      alert('No data to export')
      return
    }

    // Create worksheet data
    const worksheetData: any[] = []

    // Add header row
    const headerRow = ['Item', ...data.stores.map(store => store.name), 'TOTAL']
    worksheetData.push(headerRow)

    // Add category groups and products
    Object.entries(productsByCategory).forEach(([category, prods]) => {
      // Add category header row
      const categoryRow = [category, ...Array(data.stores.length + 1).fill('')]
      worksheetData.push(categoryRow)

      // Add product rows
      prods.forEach((product) => {
        const productRow = [
          product.productName,
          ...data.stores.map((store) => {
            const storeData = product.stores.find((s) => s.storeId === store.id)
            return storeData?.quantity || 0
          }),
          product.total,
        ]
        worksheetData.push(productRow)
      })
    })

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const colWidths = [
      { wch: 40 }, // Item column
      ...data.stores.map(() => ({ wch: 12 })), // Store columns
      { wch: 10 }, // Total column
    ]
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Order Stats')

    // Generate filename with category, year, and month
    const monthLabel = selectedMonth
      ? months.find((m) => m.value === selectedMonth)?.label || ''
      : 'All Months'
    const filename = `Order_Stats_${selectedCategory}_${selectedYear}_${monthLabel.replace(/\s+/g, '_')}.xlsx`

    // Export file
    XLSX.writeFile(wb, filename)
  }

  return (
    <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0066CC]">Order Stats</h1>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                // Reset store filter when category changes
                if (e.target.value === 'ADC Supply' || e.target.value === 'ADC Maintenance' || e.target.value === 'Housatonic Maintenance') {
                  setSelectedStoreIds([])
                } else {
                  setSelectedStoreIds(allStores.map(store => store.id))
                }
              }}
              className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              <option value="Store Supplies">Store Supplies</option>
              <option value="Staff Uniforms">Staff Uniforms</option>
              <option value="ADC Supply">ADC Supply</option>
              <option value="ADC Maintenance">ADC Maintenance</option>
              <option value="Housatonic Maintenance">Housatonic Maintenance</option>
            </select>
          </div>
          {!isNonStoreCategory && (
            <div className="relative store-filter-container">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Stores ({selectedStoreIds.length} selected)
              </label>
              <button
                onClick={() => setShowStoreFilter(!showStoreFilter)}
                className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] min-w-[200px] text-left"
              >
                {selectedStoreIds.length === allStores.length 
                  ? 'All Stores' 
                  : `${selectedStoreIds.length} Store${selectedStoreIds.length !== 1 ? 's' : ''} Selected`}
              </button>
              {showStoreFilter && (
                <div className="absolute z-50 mt-1 bg-white border-2 border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto min-w-[200px]">
                  <div className="p-2 border-b border-gray-200 flex gap-2">
                    <button
                      onClick={handleSelectAllStores}
                      className="text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllStores}
                      className="text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="p-2">
                    {allStores.map((store) => (
                      <label
                        key={store.id}
                        className="flex items-center py-1 px-2 hover:bg-blue-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStoreIds.includes(store.id)}
                          onChange={() => handleStoreToggle(store.id)}
                          className="mr-2 text-[#0066CC] focus:ring-[#0066CC]"
                        />
                        <span className="text-sm text-gray-900">
                          {store.storeNumber} - {store.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              {getAvailableYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loadingInsights || !data || data.products.length === 0}
            className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingInsights ? 'Loading...' : 'Quick Insights'}
          </button>
          <button
            onClick={exportToExcel}
            disabled={!data || data.products.length === 0}
            className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export to Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-900 font-medium">Loading stats...</div>
      ) : !isNonStoreCategory && selectedStoreIds.length === 0 ? (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-8 w-8 text-yellow-600"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No stores selected
            </h3>
            <p className="text-gray-600">
              Please select at least one store to view order statistics.
            </p>
          </div>
        </div>
      ) : !data || data.products.length === 0 ? (
        <div className="text-center py-8 text-gray-900 font-medium">No order data found</div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="overflow-x-auto max-h-[80vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0066CC] sticky top-0 z-20">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase border-r border-blue-400 sticky left-0 bg-[#0066CC] z-30 min-w-[200px]">
                    Item
                  </th>
                  {data.stores.map((store) => (
                    <th
                      key={store.id}
                      className="px-2 py-2 text-center text-xs font-bold text-white uppercase border-r border-blue-400 min-w-[100px]"
                      title={`${store.storeNumber} - ${store.name}`}
                    >
                      {store.name}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase bg-[#0052A3] sticky right-0 z-30 min-w-[70px]">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(productsByCategory).map(([category, prods]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-[#E6F2FF]">
                      <td
                        colSpan={data.stores.length + 2}
                        className="px-3 py-1 font-bold text-xs text-[#0066CC] sticky left-0 bg-[#E6F2FF] z-10"
                      >
                        {category}
                      </td>
                    </tr>
                    {prods.map((product) => {
                      // Product names already have acronyms in the database, so just display as-is
                      return (
                      <tr key={product.productId} className="hover:bg-blue-50">
                        <td className="px-3 py-1 text-xs font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-white z-10 min-w-[200px]">
                          {product.productName}
                        </td>
                        {data.stores.map((store) => {
                          const storeData = product.stores.find((s) => s.storeId === store.id)
                          const quantity = storeData?.quantity || 0
                          return (
                            <td
                              key={store.id}
                              className="px-2 py-1 text-xs text-center text-gray-900 border-r border-gray-200 font-medium"
                            >
                              {quantity > 0 ? quantity : ''}
                            </td>
                          )
                        })}
                        <td className="px-3 py-1 text-xs font-bold text-center text-[#0066CC] bg-[#E6F2FF] sticky right-0 z-10 min-w-[70px]">
                          {product.total}
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
      )}

      {/* Quick Insights Modal */}
      {showInsights && insights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:bg-white print:inset-0 print:relative print:z-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-full print:max-h-none">
            {/* Header */}
            <div className="bg-[#0066CC] text-white px-6 py-4 flex justify-between items-center print:bg-[#0066CC]">
              <h2 className="text-2xl font-bold">Quick Insights</h2>
              <button
                onClick={() => setShowInsights(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold print:hidden"
              >
                ×
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6 print:overflow-visible">
              {/* Period Info */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Category:</span> {selectedCategory} |{' '}
                  <span className="font-semibold">Year:</span> {selectedYear} |{' '}
                  <span className="font-semibold">Month:</span>{' '}
                  {selectedMonth
                    ? months.find((m) => m.value === selectedMonth)?.label || 'All Months'
                    : 'All Months'}
                </p>
              </div>

              {/* Total Spent */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0066CC] mb-3">Total Spent This Period</h3>
                <div className="bg-[#E6F2FF] p-4 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(insights.totalSpendCents)}
                  </p>
                </div>
              </div>

              {/* Spent Per Store */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0066CC] mb-3">
                  Total Spent per Store / Type ({insights.spendPerStore.length} {insights.spendPerStore.length === 1 ? 'entry' : 'entries'})
                </h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto print:max-h-none">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#0066CC] sticky top-0 print:sticky">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase">
                          Store / Type
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase">
                          Quantity
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {insights.spendPerStore.map((store) => (
                        <tr key={store.storeId} className="hover:bg-blue-50 print:hover:bg-white">
                          <td className="px-3 py-2 text-xs font-medium text-gray-900">
                            {store.storeName}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 text-right">
                            {store.orderCount || 0}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 text-right">
                            {formatCurrency(store.spendCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spent Per Item */}
              <div>
                <h3 className="text-lg font-bold text-[#0066CC] mb-3">
                  Total Spent Per Item ({insights.spendPerItem.length} items)
                </h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto print:max-h-none">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#0066CC] sticky top-0 print:sticky">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase">
                          Item
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase">
                          Total Items
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {insights.spendPerItem.map((item) => (
                        <tr key={item.productId} className="hover:bg-blue-50 print:hover:bg-white">
                          <td className="px-3 py-2 text-xs font-medium text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 text-right">
                            {item.orderCount || 0}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 text-right">
                            {formatCurrency(item.spendCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-white border-2 border-[#0066CC] text-[#0066CC] hover:bg-[#E6F2FF] font-bold py-2 px-6 rounded-lg transition"
              >
                Print / Save as PDF
              </button>
              <button
                onClick={() => setShowInsights(false)}
                className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
