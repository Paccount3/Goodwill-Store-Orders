'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: number
  name: string
  category: string
  unitPriceCents: number
  maxQuantity: number
  isActive: boolean
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [editingPrice, setEditingPrice] = useState<Record<number, number>>({})
  const [editingMaxQuantity, setEditingMaxQuantity] = useState<Record<number, number>>({})
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

  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

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

      {/* Products by Category */}
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                        Status
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
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
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
