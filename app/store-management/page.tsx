'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface Store {
  id: number
  storeNumber: string
  name: string
  sortOrder?: number
}

export default function StoreManagementPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Admin password must be entered on every page-open/refresh.
  const [adminGateLoading, setAdminGateLoading] = useState(true)

  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newStoreNumber, setNewStoreNumber] = useState('')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNumber, setEditNumber] = useState('')
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  const fetchStores = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stores')
      if (!res.ok) throw new Error('Failed to load stores')
      const data = await res.json()
      setStores(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      alert('Could not load stores')
    } finally {
      setLoading(false)
    }
  }, [])

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
        fetch('/api/admin/clear', { method: 'POST' }).catch(() => {})
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
  }, [fetchStores, adminGateLoading])

  const persistOrder = async (ordered: Store[]) => {
    setSaving(true)
    try {
      const res = await fetch('/api/stores/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: ordered.map((s) => s.id) }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save order')
      }
      setStores(ordered)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save order')
      await fetchStores()
    } finally {
      setSaving(false)
    }
  }

  const handleDragStartRow = (e: React.DragEvent, id: number) => {
    if (editingId != null) {
      e.preventDefault()
      return
    }
    setDragId(id)
    e.dataTransfer.setData('text/plain', String(id))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (editingId != null) return
    const raw = e.dataTransfer.getData('text/plain')
    const fromId = parseInt(raw, 10)
    if (!fromId || fromId === targetId) {
      setDragId(null)
      return
    }
    const fromIdx = stores.findIndex((s) => s.id === fromId)
    const toIdx = stores.findIndex((s) => s.id === targetId)
    if (fromIdx < 0 || toIdx < 0) {
      setDragId(null)
      return
    }
    const next = [...stores]
    const [removed] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, removed)
    setDragId(null)
    void persistOrder(next)
  }

  const handleDragEnd = () => {
    setDragId(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStoreNumber.trim() || !newName.trim()) {
      alert('Enter both store number and name')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeNumber: newStoreNumber.trim(),
          name: newName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add store')
      }
      setNewStoreNumber('')
      setNewName('')
      await fetchStores()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add store')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (store: Store) => {
    setEditingId(store.id)
    setEditNumber(store.storeNumber)
    setEditName(store.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditNumber('')
    setEditName('')
  }

  const saveEdit = async () => {
    if (editingId == null) return
    if (!editNumber.trim() || !editName.trim()) {
      alert('Store number and name are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeNumber: editNumber.trim(),
          name: editName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store')
      }
      cancelEdit()
      await fetchStores()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update store')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete store')
      }
      setDeleteId(null)
      await fetchStores()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete store')
    } finally {
      setSaving(false)
    }
  }

  if (adminGateLoading) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#0066CC] mb-2">Store Management</h1>
      <p className="text-sm text-gray-600 mb-6">
        Add, edit, or remove stores. Drag the handle (⋮⋮) to change the order shown in
        all store dropdowns. Order is 1, 2, 3… from top to bottom (not the internal database
        ID).
      </p>

      <form
        onSubmit={handleAdd}
        className="bg-white shadow rounded-lg p-4 border border-gray-200 mb-6"
      >
        <h2 className="text-sm font-bold text-[#0066CC] mb-3">Add a store</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Store number</label>
            <input
              type="text"
              value={newStoreNumber}
              onChange={(e) => setNewStoreNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
              placeholder="e.g. 29"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Store name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
              placeholder="Display name"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#0066CC] text-white text-sm font-bold rounded-md hover:bg-[#0052A3] disabled:opacity-50"
          >
            Add store
          </button>
        </div>
      </form>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-[#E6F2FF] border-b border-gray-200">
          <h2 className="text-sm font-bold text-[#0066CC]">All stores ({stores.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0066CC]">
                <tr>
                  <th className="px-2 py-2 text-center text-xs font-bold text-white uppercase w-12">
                    Drag
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-white uppercase w-14">
                    Order
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">
                    Store number
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-white uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {stores.map((store, index) => (
                  <tr
                    key={store.id}
                    draggable={editingId !== store.id}
                    onDragStart={(e) => handleDragStartRow(e, store.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, store.id)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-blue-50 ${
                      dragId === store.id ? 'opacity-60' : ''
                    } ${editingId === store.id ? '' : 'cursor-move'}`}
                  >
                    {editingId === store.id ? (
                      <>
                        <td className="px-2 py-2 text-center text-gray-400 text-sm">—</td>
                        <td className="px-2 py-2 text-center text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={saving}
                            className="text-sm font-semibold text-[#0066CC] hover:underline mr-3"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-sm font-semibold text-gray-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className="px-2 py-2 text-center text-gray-400 select-none text-lg leading-none"
                          title="Drag to reorder"
                        >
                          ⋮⋮
                        </td>
                        <td className="px-2 py-2 text-center text-sm font-medium text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{store.storeNumber}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{store.name}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => startEdit(store)}
                            className="text-sm font-semibold text-[#0066CC] hover:underline mr-3"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(store.id)}
                            className="text-sm font-semibold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId != null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove store?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Stores with existing orders cannot be removed. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-800 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
