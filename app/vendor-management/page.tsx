'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DEFAULT_VENDOR_NAME } from '@/lib/default-vendors'
import VendorStatsSection from './VendorStatsSection'

interface Vendor {
  id: number
  name: string
  sortOrder?: number
}

export default function VendorManagementPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [adminGateLoading, setAdminGateLoading] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vendors')
      if (!res.ok) throw new Error('Failed to load vendors')
      const data = await res.json()
      setVendors(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      alert('Could not load vendors')
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
    if (!adminGateLoading) fetchVendors()
  }, [fetchVendors, adminGateLoading])

  const persistOrder = async (ordered: Vendor[]) => {
    setSaving(true)
    try {
      const res = await fetch('/api/vendors/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: ordered.map((v) => v.id) }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save order')
      }
      setVendors(ordered)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save order')
      await fetchVendors()
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
    const fromIdx = vendors.findIndex((v) => v.id === fromId)
    const toIdx = vendors.findIndex((v) => v.id === targetId)
    if (fromIdx < 0 || toIdx < 0) {
      setDragId(null)
      return
    }
    const next = [...vendors]
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
    if (!newName.trim()) {
      alert('Enter a vendor name')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add vendor')
      }
      setNewName('')
      await fetchVendors()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add vendor')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (vendor: Vendor) => {
    setEditingId(vendor.id)
    setEditName(vendor.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = async () => {
    if (editingId == null) return
    if (!editName.trim()) {
      alert('Vendor name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/vendors/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update vendor')
      }
      cancelEdit()
      await fetchVendors()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update vendor')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    setSaving(true)
    try {
      const res = await fetch(`/api/vendors/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete vendor')
      }
      setDeleteId(null)
      await fetchVendors()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete vendor')
    } finally {
      setSaving(false)
    }
  }

  if (adminGateLoading) {
    return null
  }

  const vendorIds = vendors.map((v) => v.id)
  const vendorNamesById = Object.fromEntries(vendors.map((v) => [v.id, v.name]))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 vendor-management-page">
      <h1 className="text-3xl font-bold text-[#0066CC] mb-2 print:hidden">Vendor Management</h1>
      <p className="text-sm text-gray-600 mb-6 print:hidden">
        Review vendor spend, then add, edit, or remove vendors. Drag the handle (⋮⋮) to change the
        order shown in Item Catalog vendor dropdowns. Products assigned to a removed vendor are
        reassigned to <strong>{DEFAULT_VENDOR_NAME}</strong>. The {DEFAULT_VENDOR_NAME} vendor
        cannot be removed.
      </p>

      <VendorStatsSection vendorIds={vendorIds} vendorNamesById={vendorNamesById} />

      <div className="print:hidden">
      <form
        onSubmit={handleAdd}
        className="bg-white shadow rounded-lg p-4 border border-gray-200 mb-6"
      >
        <h2 className="text-sm font-bold text-[#0066CC] mb-3">Add a vendor</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Vendor name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
              placeholder="e.g. Acme Supply Co."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#0066CC] text-white text-sm font-bold rounded-md hover:bg-[#0052A3] disabled:opacity-50"
          >
            Add vendor
          </button>
        </div>
      </form>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-[#E6F2FF] border-b border-gray-200">
          <h2 className="text-sm font-bold text-[#0066CC]">All vendors ({vendors.length})</h2>
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
                    Vendor name
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-white uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {vendors.map((vendor, index) => (
                  <tr
                    key={vendor.id}
                    draggable={editingId !== vendor.id}
                    onDragStart={(e) => handleDragStartRow(e, vendor.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, vendor.id)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-blue-50 ${
                      dragId === vendor.id ? 'opacity-60' : ''
                    } ${editingId === vendor.id ? '' : 'cursor-move'}`}
                  >
                    {editingId === vendor.id ? (
                      <>
                        <td className="px-2 py-2 text-center text-gray-400 text-sm">—</td>
                        <td className="px-2 py-2 text-center text-sm text-gray-700">{index + 1}</td>
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
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {vendor.name}
                          {vendor.name === DEFAULT_VENDOR_NAME ? (
                            <span className="ml-2 text-xs font-semibold text-gray-500">(default)</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => startEdit(vendor)}
                            className="text-sm font-semibold text-[#0066CC] hover:underline mr-3"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(vendor.id)}
                            disabled={vendor.name === DEFAULT_VENDOR_NAME}
                            className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
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
      </div>

      {deleteId != null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove vendor?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Products using this vendor will be reassigned to {DEFAULT_VENDOR_NAME}. This action
              cannot be undone.
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
