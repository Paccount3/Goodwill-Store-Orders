'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  STORE_MAINTENANCE_ORDER_CATEGORY,
  STAFF_APPAREL_CATEGORY,
  ADC_SUPPLY_ORDER_CATEGORY,
  ADC_MAINTENANCE_ORDER_CATEGORY,
  EBOOKS_SUPPLY_ORDER_CATEGORY,
  EBOOKS_MAINTENANCE_ORDER_CATEGORY,
  ECOMM_SUPPLY_ORDER_CATEGORY,
  ECOMM_MAINTENANCE_ORDER_CATEGORY,
  ORDER_STATS_STORE_SUPPLY_UI,
} from '@/lib/product-categories'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { fetchJsonArrayFromApi } from '@/lib/fetch-products-client'

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

// Explicit display order for Store Supply aggregate items (by product name)
const STORE_SUPPLY_DISPLAY_ORDER: Record<string, number> = {
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

// Explicit display order for Ecom Warehouse items (by product name, including suffix)
const ECOM_WAREHOUSE_DISPLAY_ORDER: Record<string, number> = {
  'Copy Paper (Ecom Warehouse)': 1,
  'Rubberbands (bag) (Ecom Warehouse)': 2,
  'E-COMM Tags (box of 1000) (Ecom Warehouse)': 3,
  'Black Pens (box of 36) (Ecom Warehouse)': 4,
  'Black Markers (box of 36) (Ecom Warehouse)': 5,
  'Highlighters (Ecom Warehouse)': 6,
  'Multi-Color Dry Erase (pack of 16) (Ecom Warehouse)': 7,
  'Multi-Color Post-Its (box of 24) (Ecom Warehouse)': 8,
  'AA Batteries (case) (Ecom Warehouse)': 9,
  'AAA Batteries (case) (Ecom Warehouse)': 10,
  'C Batteries (case) (Ecom Warehouse)': 11,
  '9 Volt Batteries (case) (Ecom Warehouse)': 12,
  'Nitrile Gloves – S (case of 1000) (Ecom Warehouse)': 13,
  'Nitrile Gloves – M (case of 1000) (Ecom Warehouse)': 14,
  'Nitrile Gloves – L (case of 1000) (Ecom Warehouse)': 15,
  'Nitrile Gloves – XL (case of 1000) (Ecom Warehouse)': 16,
  'Nylon Gloves – S (case) (Ecom Warehouse)': 17,
  'Nylon Gloves – M (case) (Ecom Warehouse)': 18,
  'Nylon Gloves – L (case) (Ecom Warehouse)': 19,
  'Nylon Gloves – XL (case) (Ecom Warehouse)': 20,
  'Fragile Labels (Ecom Warehouse)': 21,
  'MaxGear Thermal Labels (4x6) (Ecom Warehouse)': 22,
  'Betckey Thermal Labels (1 1/8 x 3 1/2) (Ecom Warehouse)': 23,
  '6x9 Bubble Mailers (Ecom Warehouse)': 24,
  '10.5X16 Bubble Mailers (Ecom Warehouse)': 25,
  '10x13 Poly Mailers (Ecom Warehouse)': 26,
  '14.5x19 Poly Mailers (Ecom Warehouse)': 27,
  '12x16 Morepack Bags (Ecom Warehouse)': 28,
  'Wireless Computer Mouse (Ecom Warehouse)': 29,
  'Tera Handheld Scanner (Ecom Warehouse)': 30,
  'Clear Plastic Handbags (Ecom Warehouse)': 31,
  'Safety Box Cutter (Ecom Warehouse)': 32,
  'Scissors (Ecom Warehouse)': 33,
  'Stapler (Ecom Warehouse)': 34,
  'Staples (box) (Ecom Warehouse)': 35,
  'Wire Cutters (Ecom Warehouse)': 36,
  'Tape Measures (Ecom Warehouse)': 37,
  'Safety Labels (sheet of 15 stickers) (Ecom Warehouse)': 38,
  'Disposable Masks (Ecom Warehouse)': 39,
  'Truck Seals (Ecom Warehouse)': 40,
}

// Explicit display order for Ecom Books items (by product name, including suffix)
const ECOM_EBOOKS_DISPLAY_ORDER: Record<string, number> = {
  'Copy Paper - White (case) (Ecom Books)': 1,
  'Copy Paper - Red (ream) (Ecom Books)': 2,
  'Copy Paper - Yellow (ream) (Ecom Books)': 3,
  'Copy Paper - Green (ream) (Ecom Books)': 4,
  'Copy Paper - Blue (ream) (Ecom Books)': 5,
  'Black Pens (box of 36) (Ecom Books)': 6,
  'Black Markers (box of 36) (Ecom Books)': 7,
  'Multi-Color Post-Its (box of 24) (Ecom Books)': 8,
  'Nylon Gloves - S (case) (Ecom Books)': 9,
  'Nylon Gloves - M (case) (Ecom Books)': 10,
  'Nylon Gloves - L (case) (Ecom Books)': 11,
  'Nylon Gloves - XL (case) (Ecom Books)': 12,
  'Disposable Masks (Ecom Books)': 13,
  'MaxGear Thermal Labels (4x6) (Ecom Books)': 14,
  'Thermal Receipt Paper (Ecom Books)': 15,
  '10x13 Poly Mailers (Ecom Books)': 16,
  '14.5x19 Poly Mailers (Ecom Books)': 17,
  'Tera Handheld Scanner (Ecom Books)': 18,
  'Safety Box Cutter (Ecom Books)': 19,
  'Scissors (Ecom Books)': 20,
  'Stapler (Ecom Books)': 21,
  'Staples (box) (Ecom Books)': 22,
  'Tape Measures (Ecom Books)': 23,
}

const EBOOKS_MAINTENANCE_DISPLAY_ORDER: Record<string, number> = {
  'Paper Towels (case) (Ebooks Maintenance)': 1,
  'Time Mist Refills - Clean Linen (case) (Ebooks Maintenance)': 2,
  'Clear Trash Bags - Small (case) (Ebooks Maintenance)': 3,
  'Fantastik Multi-Surface Disinfectant with triggers (Ebooks Maintenance)': 4,
  'Masking Tape (case) (Ebooks Maintenance)': 5,
  'Dust Mop Head (dry) 36" (each) (Ebooks Maintenance)': 6,
  'Backbraces (each) (Ebooks Maintenance)': 7,
  'Push Broom 24" - refill (single) - order as needed (Ebooks Maintenance)': 8,
  'Heavy Duty Street Broom (complete) (Ebooks Maintenance)': 9,
  'Dust Mop (complete set) (Ebooks Maintenance)': 10,
  'Dustpan & Brush (normal length broom) (Ebooks Maintenance)': 11,
  'Paper Plates (case) (Ebooks Maintenance)': 12,
  'Spoons - plastic (Ebooks Maintenance)': 13,
  'Forks - plastic (Ebooks Maintenance)': 14,
  'Knives - plastic (Ebooks Maintenance)': 15,
  'Hand Sanitizer - single pump bottle (Ebooks Maintenance)': 16,
  'Nitrile Gloves - Small (case of 1000) (Ebooks Maintenance)': 17,
  'Nitrile Gloves - Medium (case of 1000) (Ebooks Maintenance)': 18,
  'Nitrile Gloves - Large (case of 1000) (Ebooks Maintenance)': 19,
  'Nitrile Gloves - XL (case of 1000) (Ebooks Maintenance)': 20,
}

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

export default function OrderStatsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Admin cookie persists ~8h; no forced re-login on each refresh.
  const [adminGateLoading, setAdminGateLoading] = useState(true)

  const [data, setData] = useState<AggregatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>(ORDER_STATS_STORE_SUPPLY_UI)
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([])
  const [allStores, setAllStores] = useState<Store[]>([])
  const [showStoreFilter, setShowStoreFilter] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const getCategoryLabel = (category: string) => category

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
    if (!adminGateLoading) fetchStores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminGateLoading])

  useEffect(() => {
    if (!adminGateLoading) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedCategory, selectedStoreIds, adminGateLoading])

  const fetchStores = async () => {
    const { items, error } = await fetchJsonArrayFromApi<Store>('/api/stores')
    setAllStores(items)
    if (error) console.error('Error fetching stores:', error)
    if (items.length > 0) {
      setSelectedStoreIds(items.map((store) => store.id))
    }
  }

  const fetchData = async () => {
    if (selectedStoreIds.length === 0) {
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

  if (productsByCategory[ECOMM_SUPPLY_ORDER_CATEGORY]) {
    productsByCategory[ECOMM_SUPPLY_ORDER_CATEGORY] = [...productsByCategory[ECOMM_SUPPLY_ORDER_CATEGORY]].sort((a, b) => {
      const orderA = ECOM_WAREHOUSE_DISPLAY_ORDER[a.productName] ?? 9999
      const orderB = ECOM_WAREHOUSE_DISPLAY_ORDER[b.productName] ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.productName.localeCompare(b.productName)
    })
  }

  if (productsByCategory[EBOOKS_SUPPLY_ORDER_CATEGORY]) {
    productsByCategory[EBOOKS_SUPPLY_ORDER_CATEGORY] = [...productsByCategory[EBOOKS_SUPPLY_ORDER_CATEGORY]].sort((a, b) => {
      const orderA = ECOM_EBOOKS_DISPLAY_ORDER[a.productName] ?? 9999
      const orderB = ECOM_EBOOKS_DISPLAY_ORDER[b.productName] ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.productName.localeCompare(b.productName)
    })
  }

  if (productsByCategory[EBOOKS_MAINTENANCE_ORDER_CATEGORY]) {
    productsByCategory[EBOOKS_MAINTENANCE_ORDER_CATEGORY] = [...productsByCategory[EBOOKS_MAINTENANCE_ORDER_CATEGORY]].sort((a, b) => {
      const orderA = EBOOKS_MAINTENANCE_DISPLAY_ORDER[a.productName] ?? 9999
      const orderB = EBOOKS_MAINTENANCE_DISPLAY_ORDER[b.productName] ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.productName.localeCompare(b.productName)
    })
  }

  if (productsByCategory[ECOMM_MAINTENANCE_ORDER_CATEGORY]) {
    productsByCategory[ECOMM_MAINTENANCE_ORDER_CATEGORY] = [...productsByCategory[ECOMM_MAINTENANCE_ORDER_CATEGORY]].sort((a, b) => {
      const orderA = ECOMM_MAINTENANCE_DISPLAY_ORDER[a.productName] ?? 9999
      const orderB = ECOMM_MAINTENANCE_DISPLAY_ORDER[b.productName] ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.productName.localeCompare(b.productName)
    })
  }

  // Flattened, ordered list for Store Supply aggregate (no categories)
  const storeSupplyProducts: ProductStats[] =
    selectedCategory === ORDER_STATS_STORE_SUPPLY_UI && data
      ? [...data.products].sort((a, b) => {
          const orderA = STORE_SUPPLY_DISPLAY_ORDER[a.productName] ?? 9999
          const orderB = STORE_SUPPLY_DISPLAY_ORDER[b.productName] ?? 9999
          if (orderA !== orderB) return orderA - orderB
          return a.productName.localeCompare(b.productName)
        })
      : []

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

    if (selectedCategory === ORDER_STATS_STORE_SUPPLY_UI) {
      // Flat list for Store Supply aggregate, no categories
      storeSupplyProducts.forEach((product) => {
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
    } else {
      // Add category groups and products for non-store-supply categories
      Object.entries(productsByCategory).forEach(([category, prods]) => {
        // Add category header row
        const categoryRow = [getCategoryLabel(category), ...Array(data.stores.length + 1).fill('')]
        worksheetData.push(categoryRow)

        // Add product rows (with explicit ordering for Ecom Warehouse / Ecom Books)
        const sortedProds =
          category === ECOMM_SUPPLY_ORDER_CATEGORY
            ? [...prods].sort((a, b) => {
                const orderA = ECOM_WAREHOUSE_DISPLAY_ORDER[a.productName] ?? 9999
                const orderB = ECOM_WAREHOUSE_DISPLAY_ORDER[b.productName] ?? 9999
                if (orderA !== orderB) return orderA - orderB
                return a.productName.localeCompare(b.productName)
              })
            : category === EBOOKS_SUPPLY_ORDER_CATEGORY
            ? [...prods].sort((a, b) => {
                const orderA = ECOM_EBOOKS_DISPLAY_ORDER[a.productName] ?? 9999
                const orderB = ECOM_EBOOKS_DISPLAY_ORDER[b.productName] ?? 9999
                if (orderA !== orderB) return orderA - orderB
                return a.productName.localeCompare(b.productName)
              })
            : category === EBOOKS_MAINTENANCE_ORDER_CATEGORY
            ? [...prods].sort((a, b) => {
                const orderA = EBOOKS_MAINTENANCE_DISPLAY_ORDER[a.productName] ?? 9999
                const orderB = EBOOKS_MAINTENANCE_DISPLAY_ORDER[b.productName] ?? 9999
                if (orderA !== orderB) return orderA - orderB
                return a.productName.localeCompare(b.productName)
              })
            : category === ECOMM_MAINTENANCE_ORDER_CATEGORY
            ? [...prods].sort((a, b) => {
                const orderA = ECOMM_MAINTENANCE_DISPLAY_ORDER[a.productName] ?? 9999
                const orderB = ECOMM_MAINTENANCE_DISPLAY_ORDER[b.productName] ?? 9999
                if (orderA !== orderB) return orderA - orderB
                return a.productName.localeCompare(b.productName)
              })
            : prods

        sortedProds.forEach((product) => {
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
    }

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
    const filename = `Order_Stats_${getCategoryLabel(selectedCategory)}_${selectedYear}_${monthLabel.replace(/\s+/g, '_')}.xlsx`

    // Export file
    XLSX.writeFile(wb, filename)
  }

  if (adminGateLoading) {
    return null
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
                setSelectedStoreIds(allStores.map(store => store.id))
              }}
              className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              <option value={ORDER_STATS_STORE_SUPPLY_UI}>Store Supply</option>
              <option value={STORE_MAINTENANCE_ORDER_CATEGORY}>Store Maintenance Order</option>
              <option value={STAFF_APPAREL_CATEGORY}>Staff Apparel</option>
              <option value={ADC_SUPPLY_ORDER_CATEGORY}>ADC Supply Order</option>
              <option value={ADC_MAINTENANCE_ORDER_CATEGORY}>ADC Maintenance Order</option>
              <option value={EBOOKS_SUPPLY_ORDER_CATEGORY}>Ebooks Supply Order</option>
              <option value={EBOOKS_MAINTENANCE_ORDER_CATEGORY}>Ebooks Maintenance Order</option>
              <option value={ECOMM_SUPPLY_ORDER_CATEGORY}>Ecomm Supply Order</option>
              <option value={ECOMM_MAINTENANCE_ORDER_CATEGORY}>Ecomm Maintenance Order</option>
            </select>
          </div>
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
      ) : selectedStoreIds.length === 0 ? (
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
                {selectedCategory === ORDER_STATS_STORE_SUPPLY_UI
                  ? storeSupplyProducts.map((product) => (
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
                    ))
                  : Object.entries(productsByCategory).map(([category, prods]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-[#E6F2FF]">
                          <td
                            colSpan={data.stores.length + 2}
                            className="px-3 py-1 font-bold text-xs text-[#0066CC] sticky left-0 bg-[#E6F2FF] z-10"
                          >
                            {getCategoryLabel(category)}
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
                  <span className="font-semibold">Category:</span> {getCategoryLabel(selectedCategory)} |{' '}
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
