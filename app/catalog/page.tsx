'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  CATALOG_GROUP_OPTIONS,
  ADD_PRODUCT_DB_CATEGORY_OPTIONS,
  STORE_SUPPLY_DB_CATEGORIES,
  ORDER_FORM_DB_CATEGORY_ORDER,
  DB_CATEGORY_SECTION_LABEL,
} from '@/lib/catalog-order-forms'
import { STAFF_APPAREL_CATEGORY } from '@/lib/product-categories'
import {
  parseCommaSeparatedLabels,
  parseSizePriceMapDollarsJson,
  sizePriceMapCentsToDollarsJsonText,
  uniformJsonArrayToCommaText,
} from '@/lib/uniform-helpers'
import { fetchProductsFromApi } from '@/lib/fetch-products-client'
import { DEFAULT_VENDOR_NAME } from '@/lib/default-vendors'

type UniformStyle = 'Unisex' | 'Men' | 'Women'

interface Vendor {
  id: number
  name: string
  sortOrder?: number
}

const NEW_PRODUCT_INITIAL = {
  name: '',
  category: '',
  unitPriceCents: '',
  maxQuantity: '',
  vendorId: '',
  sizesText: 'XS, S, M, L, XL, XXL, 3XL, 4XL',
  colorsText: 'Navy Blue, Royal Blue, White',
  uniformStyle: 'Unisex' as UniformStyle,
  /** JSON object: size → dollars (e.g. {"XS":16,"XXL":18}). Optional; if empty, unit price applies to all sizes. */
  staffSizePriceMapJson: '',
}

function parseUniformStyle(raw: string | null | undefined): UniformStyle {
  if (raw === 'Men' || raw === 'Women' || raw === 'Unisex') return raw
  return 'Unisex'
}

interface Product {
  id: number
  name: string
  category: string
  unitPriceCents: number
  sortOrder?: number
  maxQuantity: number
  isActive: boolean
  totalInStock?: number
  isUniform?: boolean
  availableSizes?: string | null
  availableColors?: string | null
  style?: string | null
  sizePriceMap?: string | null
  vendorId: number
  vendor?: { id: number; name: string }
}

function formatUniformListField(raw: string | null | undefined): string {
  if (!raw?.trim()) return '—'
  try {
    const v = JSON.parse(raw)
    if (Array.isArray(v)) return v.join(', ')
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v as Record<string, unknown>).join(', ')
    }
    return String(v)
  } catch {
    return raw
  }
}

function getCategoryCatalogLabel(dbCategory: string): string {
  return DB_CATEGORY_SECTION_LABEL[dbCategory] ?? dbCategory
}

export default function CatalogPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Admin password: cookie lasts 8h after /admin-lock; no forced re-login on every refresh.
  const [adminGateLoading, setAdminGateLoading] = useState(true)

  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [defaultVendorId, setDefaultVendorId] = useState<number | null>(null)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCatalogGroup, setSelectedCatalogGroup] = useState('')
  const [search, setSearch] = useState('')
  const [editingPrice, setEditingPrice] = useState<Record<number, number>>({})
  const [editingMaxQuantity, setEditingMaxQuantity] = useState<Record<number, number>>({})
  const [editingTotalInStock, setEditingTotalInStock] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ ...NEW_PRODUCT_INITIAL })
  const [uniformEditingId, setUniformEditingId] = useState<number | null>(null)
  const [uniformDraft, setUniformDraft] = useState({
    sizesText: '',
    colorsText: '',
    style: 'Unisex' as UniformStyle,
    unitPriceDollars: '',
    sizePriceMapJson: '',
  })
  const [savingUniform, setSavingUniform] = useState(false)

  const moveIdInList = (ids: number[], id: number, delta: -1 | 1): number[] => {
    const idx = ids.indexOf(id)
    if (idx < 0) return ids
    const next = idx + delta
    if (next < 0 || next >= ids.length) return ids
    const copy = [...ids]
    const [removed] = copy.splice(idx, 1)
    copy.splice(next, 0, removed)
    return copy
  }

  const saveOrder = async (orderedIds: number[]) => {
    const res = await fetch('/api/products/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error ?? 'Failed to reorder products')
    }
  }

  /** Ignore stale responses when filters change or multiple GETs overlap. */
  const productsFetchSeq = useRef(0)

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
    if (!adminGateLoading) {
      fetchProducts()
      fetchVendors()
    }
  }, [selectedCatalogGroup, search, adminGateLoading])

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors')
      if (!res.ok) throw new Error('Failed to load vendors')
      const data = await res.json()
      const list: Vendor[] = Array.isArray(data) ? data : []
      setVendors(list)
      const other = list.find((v) => v.name === DEFAULT_VENDOR_NAME)
      if (other) {
        setDefaultVendorId(other.id)
        setNewProduct((prev) =>
          prev.vendorId ? prev : { ...prev, vendorId: String(other.id) }
        )
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const fetchProducts = async () => {
    const seq = ++productsFetchSeq.current
    setLoading(true)
    setProductsError(null)
    try {
      const params = new URLSearchParams()
      if (selectedCatalogGroup) params.append('catalogGroup', selectedCatalogGroup)
      if (search) params.append('search', search)
      params.append('activeOnly', 'false') // Show all products for management

      const { products: list, error } = await fetchProductsFromApi<Product>(
        `/api/products?${params.toString()}`
      )
      if (seq !== productsFetchSeq.current) return

      if (error) {
        setProductsError(error)
        console.error('Error fetching products:', error)
        return
      }

      setProducts(list)
      setProductsError(null)
    } catch (error) {
      console.error('Error fetching products:', error)
      if (seq !== productsFetchSeq.current) return
      setProductsError('Failed to load products')
    } finally {
      if (seq === productsFetchSeq.current) {
        setLoading(false)
      }
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
  }

  const handleVendorChange = async (productId: number, vendorId: number) => {
    setSaving((prev) => ({ ...prev, [productId]: true }))
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Failed to update vendor')
      }
      const updated = (await res.json()) as Product
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, vendorId: updated.vendorId, vendor: updated.vendor }
            : p
        )
      )
    } catch (error) {
      console.error('Error updating vendor:', error)
      alert(error instanceof Error ? error.message : 'Failed to update vendor')
    } finally {
      setSaving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const renderVendorSelect = (product: Product) => (
    <select
      value={product.vendorId ?? defaultVendorId ?? ''}
      onChange={(e) => handleVendorChange(product.id, parseInt(e.target.value, 10))}
      disabled={saving[product.id] || vendors.length === 0}
      className="w-full min-w-[10rem] max-w-[16rem] border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] disabled:opacity-50"
      onClick={(e) => e.stopPropagation()}
    >
      {vendors.map((vendor) => (
        <option key={vendor.id} value={vendor.id}>
          {vendor.name}
        </option>
      ))}
    </select>
  )

  const handlePriceChange = (productId: number, value: string) => {
    const price = parseCurrency(value)
    setEditingPrice({
      ...editingPrice,
      [productId]: price,
    })
  }

  const handlePriceSave = async (productId: number) => {
    const newPrice = editingPrice[productId]
    if (newPrice === undefined || newPrice < 0) {
      return
    }

    setSaving({ ...saving, [productId]: true })

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitPriceCents: newPrice }),
      })

      if (!res.ok) {
        throw new Error('Failed to update price')
      }

      const updatedProduct = await res.json()
      
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updatedProduct : p))
      )

      const newEditing = { ...editingPrice }
      delete newEditing[productId]
      setEditingPrice(newEditing)
    } catch (error) {
      console.error('Error saving price:', error)
      alert('Failed to update price. Please try again.')
    } finally {
      setSaving({ ...saving, [productId]: false })
    }
  }

  const handlePriceCancel = (productId: number) => {
    const newEditing = { ...editingPrice }
    delete newEditing[productId]
    setEditingPrice(newEditing)
  }

  const handleMaxQuantityChange = (productId: number, value: string) => {
    const quantity = parseInt(value) || 0
    setEditingMaxQuantity({
      ...editingMaxQuantity,
      [productId]: quantity,
    })
  }

  const handleMaxQuantitySave = async (productId: number) => {
    const newMaxQuantity = editingMaxQuantity[productId]
    if (newMaxQuantity === undefined || newMaxQuantity < 1) {
      return
    }

    setSaving({ ...saving, [productId]: true })

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxQuantity: newMaxQuantity }),
      })

      if (!res.ok) {
        throw new Error('Failed to update max quantity')
      }

      const updatedProduct = await res.json()
      
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updatedProduct : p))
      )

      const newEditing = { ...editingMaxQuantity }
      delete newEditing[productId]
      setEditingMaxQuantity(newEditing)
    } catch (error) {
      console.error('Error saving max quantity:', error)
      alert('Failed to update max quantity. Please try again.')
    } finally {
      setSaving({ ...saving, [productId]: false })
    }
  }

  const handleMaxQuantityCancel = (productId: number) => {
    const newEditing = { ...editingMaxQuantity }
    delete newEditing[productId]
    setEditingMaxQuantity(newEditing)
  }

  const handleTotalInStockChange = (productId: number, value: string) => {
    const total = parseInt(value) || 0
    setEditingTotalInStock({
      ...editingTotalInStock,
      [productId]: total,
    })
  }

  const handleTotalInStockSave = async (productId: number) => {
    const newTotal = editingTotalInStock[productId]
    if (newTotal === undefined || newTotal < 0) {
      return
    }

    setSaving({ ...saving, [productId]: true })

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalInStock: newTotal }),
      })

      if (!res.ok) {
        throw new Error('Failed to update total in stock')
      }

      const updatedProduct = await res.json()

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updatedProduct : p))
      )

      const newEditing = { ...editingTotalInStock }
      delete newEditing[productId]
      setEditingTotalInStock(newEditing)
    } catch (error) {
      console.error('Error saving total in stock:', error)
      alert('Failed to update total in stock. Please try again.')
    } finally {
      setSaving({ ...saving, [productId]: false })
    }
  }

  const handleTotalInStockCancel = (productId: number) => {
    const newEditing = { ...editingTotalInStock }
    delete newEditing[productId]
    setEditingTotalInStock(newEditing)
  }

  const openUniformEdit = (product: Product) => {
    setUniformEditingId(product.id)
    setUniformDraft({
      sizesText: uniformJsonArrayToCommaText(product.availableSizes ?? null),
      colorsText: uniformJsonArrayToCommaText(product.availableColors ?? null),
      style: parseUniformStyle(product.style),
      unitPriceDollars: (product.unitPriceCents / 100).toFixed(2),
      sizePriceMapJson: sizePriceMapCentsToDollarsJsonText(product.sizePriceMap ?? null),
    })
  }

  const handleSaveUniform = async (productId: number) => {
    const sizes = parseCommaSeparatedLabels(uniformDraft.sizesText)
    const colors = parseCommaSeparatedLabels(uniformDraft.colorsText)
    if (!sizes.length || !colors.length) {
      alert('Staff Apparel requires at least one size and one color.')
      return
    }

    const product = products.find((p) => p.id === productId)
    const priceDollars = parseCurrency(uniformDraft.unitPriceDollars)
    const priceChanged =
      product !== undefined &&
      Math.round(priceDollars * 100) !== product.unitPriceCents

    const trimmedMap = uniformDraft.sizePriceMapJson.trim()
    let mapCents: Record<string, number> | null = null
    if (trimmedMap) {
      const parsed = parseSizePriceMapDollarsJson(trimmedMap, sizes)
      if (parsed.error) {
        alert(parsed.error)
        return
      }
      mapCents = parsed.mapCents
    }

    setSavingUniform(true)
    try {
      const body: Record<string, unknown> = {
        availableSizes: sizes,
        availableColors: colors,
        style: uniformDraft.style,
      }
      if (mapCents && Object.keys(mapCents).length) {
        body.sizePriceMap = mapCents
        body.unitPriceCents = Math.min(...Object.values(mapCents)) / 100
      } else if (priceChanged) {
        body.unitPriceCents = priceDollars
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Failed to update uniform')
      }

      const updated = await res.json()
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)))
      setUniformEditingId(null)
    } catch (error) {
      console.error('Error saving uniform:', error)
      alert(error instanceof Error ? error.message : 'Failed to save uniform details.')
    } finally {
      setSavingUniform(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.unitPriceCents || !newProduct.maxQuantity) {
      alert('Please fill in all fields')
      return
    }

    const isStaff = newProduct.category === STAFF_APPAREL_CATEGORY
    let staffSizes: string[] = []
    if (isStaff) {
      staffSizes = parseCommaSeparatedLabels(newProduct.sizesText)
      const colors = parseCommaSeparatedLabels(newProduct.colorsText)
      if (!staffSizes.length || !colors.length) {
        alert('Staff Apparel requires at least one size and one color (comma-separated).')
        return
      }
      const trimmedMap = newProduct.staffSizePriceMapJson.trim()
      if (trimmedMap) {
        const parsed = parseSizePriceMapDollarsJson(trimmedMap, staffSizes)
        if (parsed.error) {
          alert(parsed.error)
          return
        }
      }
    }

    try {
      const payload: Record<string, unknown> = {
        name: newProduct.name,
        category: newProduct.category,
        unitPriceCents: parseFloat(newProduct.unitPriceCents),
        maxQuantity: parseInt(newProduct.maxQuantity, 10),
        vendorId: newProduct.vendorId
          ? parseInt(newProduct.vendorId, 10)
          : defaultVendorId,
      }
      if (isStaff) {
        const sizes = staffSizes
        const colors = parseCommaSeparatedLabels(newProduct.colorsText)
        payload.isUniform = true
        payload.availableSizes = sizes
        payload.availableColors = colors
        payload.style = newProduct.uniformStyle
        const trimmedMap = newProduct.staffSizePriceMapJson.trim()
        if (trimmedMap) {
          const parsed = parseSizePriceMapDollarsJson(trimmedMap, sizes)
          if (parsed.mapCents) {
            payload.sizePriceMap = parsed.mapCents
            payload.unitPriceCents = Math.min(...Object.values(parsed.mapCents)) / 100
          }
        }
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Failed to create product')
      }

      await res.json()

      setNewProduct({ ...NEW_PRODUCT_INITIAL })
      setShowAddForm(false)

      // Reload from server so the list always matches the DB and races can’t leave a partial UI.
      await fetchProducts()
    } catch (error) {
      console.error('Error creating product:', error)
      alert(error instanceof Error ? error.message : 'Failed to create product. Please try again.')
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product? If it has been used in orders, it will be deactivated instead.')) {
      return
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete product')
      }

      const result = await res.json()
      
      if (result.success) {
        // Product was deleted
        setProducts((prev) => prev.filter((p) => p.id !== productId))
      } else {
        // Product was deactivated
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: false } : p))
        )
        alert('Product has been used in orders, so it was deactivated instead of deleted.')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  // Store Supply aggregate categories (shown as a single flat list)
  const storeSupplyCategories = new Set<string>(STORE_SUPPLY_DB_CATEGORIES)

  const storeSupplyProducts = products
    .filter((p) => storeSupplyCategories.has(p.category))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))

  // Keep ADC / Store Maintenance / Ecom Warehouse (and any other) categories grouped as before
  const productsByCategory = products.reduce((acc, product) => {
    if (storeSupplyCategories.has(product.category)) {
      return acc
    }
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  // Ensure every category section is sorted by DB order (sortOrder) instead of alphabet.
  for (const key of Object.keys(productsByCategory)) {
    productsByCategory[key] = [...productsByCategory[key]].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
    )
  }

  const formCategoryOrderMap = new Map<string, number>(
    ORDER_FORM_DB_CATEGORY_ORDER.map((k, i) => [k, i])
  )
  const orderedNonStoreCategoryKeys = Object.keys(productsByCategory).sort(
    (a, b) =>
      (formCategoryOrderMap.get(a) ?? 999) - (formCategoryOrderMap.get(b) ?? 999)
  )

  if (adminGateLoading) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0066CC]">Item Catalog</h1>
        <button
          type="button"
          onClick={() => {
            if (showAddForm) {
              setNewProduct({ ...NEW_PRODUCT_INITIAL })
            }
            setShowAddForm(!showAddForm)
          }}
          className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
        >
          {showAddForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-[#0066CC] mb-4">Add New Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Category *
              </label>
              <input
                type="text"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                placeholder="Enter category"
                list="categories"
              />
              <datalist id="categories">
                {ADD_PRODUCT_DB_CATEGORY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Unit Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newProduct.unitPriceCents}
                onChange={(e) => setNewProduct({ ...newProduct, unitPriceCents: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                placeholder="0.00"
              />
              {newProduct.category === STAFF_APPAREL_CATEGORY ? (
                <p className="mt-1 text-xs text-gray-600">
                  Use <strong>Unit Price</strong> as a single price for every size, or fill{' '}
                  <strong>Price by size (JSON)</strong> below to set different prices per size (dollars).
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Max Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={newProduct.maxQuantity}
                onChange={(e) => setNewProduct({ ...newProduct, maxQuantity: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Vendor
              </label>
              <select
                value={newProduct.vendorId || (defaultVendorId != null ? String(defaultVendorId) : '')}
                onChange={(e) => setNewProduct({ ...newProduct, vendorId: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
              >
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {newProduct.category === STAFF_APPAREL_CATEGORY && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Sizes * <span className="font-normal text-gray-600">(comma-separated)</span>
                </label>
                <textarea
                  rows={3}
                  value={newProduct.sizesText}
                  onChange={(e) => setNewProduct({ ...newProduct, sizesText: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                  placeholder="XS, S, M, L, XL"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Style *</label>
                <select
                  value={newProduct.uniformStyle}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      uniformStyle: e.target.value as UniformStyle,
                    })
                  }
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                >
                  <option value="Unisex">Unisex</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Colors * <span className="font-normal text-gray-600">(comma-separated)</span>
                </label>
                <textarea
                  rows={2}
                  value={newProduct.colorsText}
                  onChange={(e) => setNewProduct({ ...newProduct, colorsText: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                  placeholder="Navy Blue, Royal Blue, White"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Price by size (optional JSON, dollars){' '}
                  <span className="font-normal text-gray-600">
                    — must include every size listed above, e.g.{' '}
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {`{"XS":16,"S":16,"M":16,"L":16,"XL":16,"XXL":18,"3XL":20,"4XL":22}`}
                    </code>
                  </span>
                </label>
                <textarea
                  rows={5}
                  value={newProduct.staffSizePriceMapJson}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, staffSizePriceMapJson: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                  placeholder='{"XS":16,"S":16,"M":16,"L":16,"XL":16,"XXL":18,"3XL":20,"4XL":22}'
                />
              </div>
            </div>
          )}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddProduct}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
            >
              Add Product
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Order form
            </label>
            <select
              value={selectedCatalogGroup}
              onChange={(e) => setSelectedCatalogGroup(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              <option value="">All order forms</option>
              {CATALOG_GROUP_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {productsError ? (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Could not load products</p>
          <p className="mt-1">{productsError}</p>
          <p className="mt-2 text-xs text-amber-800">
            If this is production, confirm Vercel uses the Supabase <strong>transaction pooler</strong>{' '}
            (port 6543) for <code className="rounded bg-amber-100 px-1">DATABASE_URL</code>, not the
            direct <code className="rounded bg-amber-100 px-1">db.…:5432</code> host.
          </p>
        </div>
      ) : null}

      {/* Store Supply aggregate (flat list, no categories) */}
      {loading ? null : storeSupplyProducts.length > 0 && (
        <div className="mb-6">
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-[#0066CC] mb-4">
              Store Supply Order
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">
                      Max Qty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">
                      Total In Stock
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {storeSupplyProducts.map((product) => {
                    const isEditing = editingPrice.hasOwnProperty(product.id)
                    const currentPrice = isEditing
                      ? editingPrice[product.id]
                      : product.unitPriceCents / 100

                    return (
                      <tr key={product.id} className="hover:bg-blue-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-sm">{renderVendorSelect(product)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-gray-900 font-medium">$</span>
                              <input
                                type="text"
                                value={currentPrice.toFixed(2)}
                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                className="w-24 text-right border-2 border-[#0066CC] rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                autoFocus
                              />
                              <button
                                onClick={() => handlePriceSave(product.id)}
                                disabled={saving[product.id]}
                                className="px-2 py-1 bg-[#0066CC] text-white text-xs font-bold rounded hover:bg-[#0052A3] disabled:opacity-50"
                              >
                                {saving[product.id] ? '...' : '✓'}
                              </button>
                              <button
                                onClick={() => handlePriceCancel(product.id)}
                                className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded hover:bg-gray-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(product.unitPriceCents)}
                              </span>
                              <button
                                onClick={() =>
                                  setEditingPrice({
                                    ...editingPrice,
                                    [product.id]: product.unitPriceCents / 100,
                                  })
                                }
                                className="px-2 py-1 text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                                title="Edit price"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {editingMaxQuantity.hasOwnProperty(product.id) ? (
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={editingMaxQuantity[product.id]}
                                onChange={(e) => handleMaxQuantityChange(product.id, e.target.value)}
                                className="w-20 text-center border-2 border-[#0066CC] rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                autoFocus
                              />
                              <button
                                onClick={() => handleMaxQuantitySave(product.id)}
                                disabled={saving[product.id]}
                                className="px-2 py-1 bg-[#0066CC] text-white text-xs font-bold rounded hover:bg-[#0052A3] disabled:opacity-50"
                              >
                                {saving[product.id] ? '...' : '✓'}
                              </button>
                              <button
                                onClick={() => handleMaxQuantityCancel(product.id)}
                                className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded hover:bg-gray-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {product.maxQuantity}
                              </span>
                              <button
                                onClick={() =>
                                  setEditingMaxQuantity({
                                    ...editingMaxQuantity,
                                    [product.id]: product.maxQuantity,
                                  })
                                }
                                className="px-2 py-1 text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                                title="Edit max quantity"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {editingTotalInStock.hasOwnProperty(product.id) ? (
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={editingTotalInStock[product.id]}
                                onChange={(e) => handleTotalInStockChange(product.id, e.target.value)}
                                className="w-24 text-center border-2 border-[#0066CC] rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                autoFocus
                              />
                              <button
                                onClick={() => handleTotalInStockSave(product.id)}
                                disabled={saving[product.id]}
                                className="px-2 py-1 bg-[#0066CC] text-white text-xs font-bold rounded hover:bg-[#0052A3] disabled:opacity-50"
                              >
                                {saving[product.id] ? '...' : '✓'}
                              </button>
                              <button
                                onClick={() => handleTotalInStockCancel(product.id)}
                                className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded hover:bg-gray-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {product.totalInStock ?? 0}
                              </span>
                              <button
                                onClick={() =>
                                  setEditingTotalInStock({
                                    ...editingTotalInStock,
                                    [product.id]: product.totalInStock ?? 0,
                                  })
                                }
                                className="px-2 py-1 text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                                title="Edit total in stock"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="px-2 py-1 text-xs font-bold text-[#0066CC] hover:text-[#0052A3]"
                              title="Move up"
                              onClick={async () => {
                                try {
                                  const ids = storeSupplyProducts.map((p) => p.id)
                                  const next = moveIdInList(ids, product.id, -1)
                                  if (next === ids) return
                                  await saveOrder(next)
                                  await fetchProducts()
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : 'Failed to reorder products')
                                }
                              }}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 text-xs font-bold text-[#0066CC] hover:text-[#0052A3]"
                              title="Move down"
                              onClick={async () => {
                                try {
                                  const ids = storeSupplyProducts.map((p) => p.id)
                                  const next = moveIdInList(ids, product.id, 1)
                                  if (next === ids) return
                                  await saveOrder(next)
                                  await fetchProducts()
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : 'Failed to reorder products')
                                }
                              }}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="px-2 py-1 text-[#0066CC] hover:text-[#0052A3] text-xs font-bold transition"
                              title="Delete product"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Products by Category (ADC, Store Maintenance, Staff Apparel, e‑com, etc.) */}
      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <div className="space-y-6">
          {orderedNonStoreCategoryKeys.map((category) => {
            const prods = productsByCategory[category]
            const isStaffApparelSection = category === 'Staff Apparel'
            return (
            <div key={category} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-[#0066CC] mb-4">
                {getCategoryCatalogLabel(category)}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#0066CC]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                        Vendor
                      </th>
                      {isStaffApparelSection && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                            Sizes
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                            Colors
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                            Style
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase">
                        Unit Price
                      </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">
                      Max Qty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">
                      Total In Stock
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prods.map((product) => {
                      const isEditing = editingPrice.hasOwnProperty(product.id)
                      const currentPrice = isEditing
                        ? editingPrice[product.id]
                        : product.unitPriceCents / 100
                      const staffColSpan = isStaffApparelSection ? 9 : 6

                      return (
                        <Fragment key={product.id}>
                        <tr className="hover:bg-blue-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 text-sm">{renderVendorSelect(product)}</td>
                          {isStaffApparelSection && (
                            <>
                              <td className="px-4 py-3 text-sm text-gray-800 max-w-[14rem]">
                                {formatUniformListField(product.availableSizes)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800 max-w-[14rem]">
                                {formatUniformListField(product.availableColors)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                {product.style?.trim() ? product.style : '—'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-gray-900 font-medium">$</span>
                                <input
                                  type="text"
                                  value={currentPrice.toFixed(2)}
                                  onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                  className="w-24 text-right border-2 border-[#0066CC] rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handlePriceSave(product.id)}
                                  disabled={saving[product.id]}
                                  className="px-2 py-1 bg-[#0066CC] text-white text-xs font-bold rounded hover:bg-[#0052A3] disabled:opacity-50"
                                >
                                  {saving[product.id] ? '...' : '✓'}
                                </button>
                                <button
                                  onClick={() => handlePriceCancel(product.id)}
                                  className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded hover:bg-gray-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(product.unitPriceCents)}
                                </span>
                                <button
                                  onClick={() =>
                                    setEditingPrice({
                                      ...editingPrice,
                                      [product.id]: product.unitPriceCents / 100,
                                    })
                                  }
                                  className="px-2 py-1 text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                                  title="Edit price"
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {editingMaxQuantity.hasOwnProperty(product.id) ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={editingMaxQuantity[product.id]}
                                  onChange={(e) => handleMaxQuantityChange(product.id, e.target.value)}
                                  className="w-20 text-center border-2 border-[#0066CC] rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleMaxQuantitySave(product.id)}
                                  disabled={saving[product.id]}
                                  className="px-2 py-1 bg-[#0066CC] text-white text-xs font-bold rounded hover:bg-[#0052A3] disabled:opacity-50"
                                >
                                  {saving[product.id] ? '...' : '✓'}
                                </button>
                                <button
                                  onClick={() => handleMaxQuantityCancel(product.id)}
                                  className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded hover:bg-gray-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {product.maxQuantity}
                                </span>
                                <button
                                  onClick={() =>
                                    setEditingMaxQuantity({
                                      ...editingMaxQuantity,
                                      [product.id]: product.maxQuantity,
                                    })
                                  }
                                  className="px-2 py-1 text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                                  title="Edit max quantity"
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {editingTotalInStock.hasOwnProperty(product.id) ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTotalInStock[product.id]}
                                  onChange={(e) => handleTotalInStockChange(product.id, e.target.value)}
                                  className="w-24 text-center border-2 border-[#0066CC] rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleTotalInStockSave(product.id)}
                                  disabled={saving[product.id]}
                                  className="px-2 py-1 bg-[#0066CC] text-white text-xs font-bold rounded hover:bg-[#0052A3] disabled:opacity-50"
                                >
                                  {saving[product.id] ? '...' : '✓'}
                                </button>
                                <button
                                  onClick={() => handleTotalInStockCancel(product.id)}
                                  className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded hover:bg-gray-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {product.totalInStock ?? 0}
                                </span>
                                <button
                                  onClick={() =>
                                    setEditingTotalInStock({
                                      ...editingTotalInStock,
                                      [product.id]: product.totalInStock ?? 0,
                                    })
                                  }
                                  className="px-2 py-1 text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                                  title="Edit total in stock"
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                type="button"
                                className="px-2 py-1 text-xs font-bold text-[#0066CC] hover:text-[#0052A3]"
                                title="Move up"
                                onClick={async () => {
                                  try {
                                    const ids = prods.map((p) => p.id)
                                    const next = moveIdInList(ids, product.id, -1)
                                    if (next === ids) return
                                    await saveOrder(next)
                                    await fetchProducts()
                                  } catch (e) {
                                    alert(e instanceof Error ? e.message : 'Failed to reorder products')
                                  }
                                }}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="px-2 py-1 text-xs font-bold text-[#0066CC] hover:text-[#0052A3]"
                                title="Move down"
                                onClick={async () => {
                                  try {
                                    const ids = prods.map((p) => p.id)
                                    const next = moveIdInList(ids, product.id, 1)
                                    if (next === ids) return
                                    await saveOrder(next)
                                    await fetchProducts()
                                  } catch (e) {
                                    alert(e instanceof Error ? e.message : 'Failed to reorder products')
                                  }
                                }}
                              >
                                ↓
                              </button>
                              {isStaffApparelSection ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    uniformEditingId === product.id
                                      ? setUniformEditingId(null)
                                      : openUniformEdit(product)
                                  }
                                  className="px-2 py-1 text-[#0066CC] hover:text-[#0052A3] text-xs font-bold transition"
                                  title="Edit sizes, colors, and style"
                                >
                                  {uniformEditingId === product.id ? 'Close' : 'Edit uniform'}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="px-2 py-1 text-[#0066CC] hover:text-[#0052A3] text-xs font-bold transition"
                                title="Delete product"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isStaffApparelSection && uniformEditingId === product.id ? (
                          <tr className="bg-blue-50 border-t border-blue-100">
                            <td colSpan={staffColSpan} className="px-4 py-4">
                              <p className="text-sm font-semibold text-[#0066CC] mb-3">
                                Edit uniform options
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                                    Sizes (comma-separated) *
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={uniformDraft.sizesText}
                                    onChange={(e) =>
                                      setUniformDraft({ ...uniformDraft, sizesText: e.target.value })
                                    }
                                    className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                                    Style *
                                  </label>
                                  <select
                                    value={uniformDraft.style}
                                    onChange={(e) =>
                                      setUniformDraft({
                                        ...uniformDraft,
                                        style: e.target.value as UniformStyle,
                                      })
                                    }
                                    className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                  >
                                    <option value="Unisex">Unisex</option>
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                                    Base unit price ($) *
                                  </label>
                                  <input
                                    type="text"
                                    value={uniformDraft.unitPriceDollars}
                                    onChange={(e) =>
                                      setUniformDraft({
                                        ...uniformDraft,
                                        unitPriceDollars: e.target.value,
                                      })
                                    }
                                    className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                  />
                                  <p className="mt-1 text-xs text-gray-600">
                                    Used when <strong>Price by size (JSON)</strong> is empty (same price for
                                    every size). If JSON is filled, each size has its own price in dollars.
                                  </p>
                                </div>
                                <div className="md:col-span-2 lg:col-span-4">
                                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                                    Colors (comma-separated) *
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={uniformDraft.colorsText}
                                    onChange={(e) =>
                                      setUniformDraft({ ...uniformDraft, colorsText: e.target.value })
                                    }
                                    className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                  />
                                </div>
                                <div className="md:col-span-2 lg:col-span-4">
                                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                                    Price by size (JSON, dollars) — optional
                                  </label>
                                  <textarea
                                    rows={6}
                                    value={uniformDraft.sizePriceMapJson}
                                    onChange={(e) =>
                                      setUniformDraft({
                                        ...uniformDraft,
                                        sizePriceMapJson: e.target.value,
                                      })
                                    }
                                    className="w-full border-2 border-gray-300 rounded-md px-3 py-2 font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                    placeholder='{"XS":16,"S":16,"M":16,"L":16,"XL":16,"XXL":18,"3XL":20,"4XL":22}'
                                  />
                                  <p className="mt-1 text-xs text-gray-600">
                                    Must include every size in the Sizes field. Clear this field to fall back
                                    to the base unit price for all sizes.
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveUniform(product.id)}
                                  disabled={savingUniform}
                                  className="bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg text-sm transition"
                                >
                                  {savingUniform ? 'Saving…' : 'Save uniform'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUniformEditingId(null)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded-lg text-sm transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )
          })}
          {!loading &&
            storeSupplyProducts.length === 0 &&
            orderedNonStoreCategoryKeys.length === 0 && (
            <div className="text-center py-8 text-gray-900 font-medium">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
