'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: number
  name: string
  category: string
  unitPriceCents: number
  maxQuantity: number
  isActive: boolean
  totalInStock?: number
}

// Explicit display order for Store Supplies items (by product name)
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

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [editingPrice, setEditingPrice] = useState<Record<number, number>>({})
  const [editingMaxQuantity, setEditingMaxQuantity] = useState<Record<number, number>>({})
  const [editingTotalInStock, setEditingTotalInStock] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    unitPriceCents: '',
    maxQuantity: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (search) params.append('search', search)
      params.append('activeOnly', 'false') // Show all products for management

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
  }

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

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.unitPriceCents || !newProduct.maxQuantity) {
      alert('Please fill in all fields')
      return
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          unitPriceCents: parseFloat(newProduct.unitPriceCents),
          maxQuantity: parseInt(newProduct.maxQuantity),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create product')
      }

      const createdProduct = await res.json()
      setProducts((prev) => [...prev, createdProduct].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category)
        return a.name.localeCompare(b.name)
      }))
      
      setNewProduct({ name: '', category: '', unitPriceCents: '', maxQuantity: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product. Please try again.')
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

  const categories = Array.from(new Set(products.map((p) => p.category)))

  // Store Supplies categories (these will be shown as a single flat list)
  const storeSupplyCategories = new Set<string>([
    'General Supplies',
    'Labels, Tape, & Office Supplies',
    'Gloves & PPE',
    'Stickers & Tags',
    'Bags & Paper',
    'Hangers',
    'Store Apparel',
    'Miscellaneous',
  ])

  const storeSupplyProducts = products
    .filter((p) => storeSupplyCategories.has(p.category))
    .sort((a, b) => {
      const orderA = STORE_SUPPLY_DISPLAY_ORDER[a.name] ?? 9999
      const orderB = STORE_SUPPLY_DISPLAY_ORDER[b.name] ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })

  // Keep ADC / Housatonic / Ecom Warehouse (and any other) categories grouped as before
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

  // Apply explicit ordering for Ecom Warehouse category to match Ecom Warehouse form
  if (productsByCategory['Ecom Warehouse']) {
    productsByCategory['Ecom Warehouse'] = [...productsByCategory['Ecom Warehouse']].sort((a, b) => {
      const orderA = ECOM_WAREHOUSE_DISPLAY_ORDER[a.name] ?? 9999
      const orderB = ECOM_WAREHOUSE_DISPLAY_ORDER[b.name] ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }

  // Apply explicit ordering for Ecom Books category to match Ecom Ebooks form
  if (productsByCategory['Ecom Books']) {
    productsByCategory['Ecom Books'] = [...productsByCategory['Ecom Books']].sort((a, b) => {
      const orderA = ECOM_EBOOKS_DISPLAY_ORDER[a.name] ?? 9999
      const orderB = ECOM_EBOOKS_DISPLAY_ORDER[b.name] ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0066CC]">Item Catalog</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
        >
          {showAddForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-[#0066CC] mb-4">Add New Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
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
          </div>
          <div className="mt-4">
            <button
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
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Store Supplies (flat list, no categories) */}
      {loading ? null : storeSupplyProducts.length > 0 && (
        <div className="mb-6">
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-[#0066CC] mb-4">
              Store Supplies
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                      Product Name
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
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-2 py-1 text-[#0066CC] hover:text-[#0052A3] text-xs font-bold transition"
                            title="Delete product"
                          >
                            🗑️
                          </button>
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

      {/* Products by Category (ADC, Housatonic, uniforms, etc.) */}
      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(productsByCategory).map(([category, prods]) => (
            <div key={category} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-[#0066CC] mb-4">
                {category}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#0066CC]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                        Product Name
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
                    {prods.map((product) => {
                      const isEditing = editingPrice.hasOwnProperty(product.id)
                      const currentPrice = isEditing
                        ? editingPrice[product.id]
                        : product.unitPriceCents / 100
                      
                      return (
                        <tr key={product.id} className="hover:bg-blue-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
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
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="px-2 py-1 text-[#0066CC] hover:text-[#0052A3] text-xs font-bold transition"
                              title="Delete product"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {Object.keys(productsByCategory).length === 0 && (
            <div className="text-center py-8 text-gray-900 font-medium">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
