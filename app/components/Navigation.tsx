'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const adminLinks = useMemo(
    () => [
      { href: '/catalog', label: 'Item Catalog' },
      { href: '/orders', label: 'Orders Hub' },
      { href: '/order-stats', label: 'Order Stats' },
      { href: '/store-management', label: 'Store Management' },
      { href: '/vendor-management', label: 'Vendor Management' },
      { href: '/announcement-management', label: 'Daily Announcement' },
    ],
    []
  )

  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordError, setAdminPasswordError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/api/admin/status', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setAdminUnlocked(!!data?.authed)
      } catch {
        if (!cancelled) setAdminUnlocked(false)
      } finally {
        if (!cancelled) setCheckingAdmin(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const openAdminGate = () => {
    setAdminPasswordError('')
    setAdminPassword('')
    setShowAdminPasswordModal(true)
  }

  const handleAdminButtonClick = () => {
    if (checkingAdmin) return
    if (adminUnlocked) {
      setAdminMenuOpen((v) => !v)
      return
    }
    openAdminGate()
  }

  const submitAdminPassword = async () => {
    setAuthSubmitting(true)
    setAdminPasswordError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      })

      if (!res.ok) {
        setAdminPasswordError('Incorrect password.')
        setAuthSubmitting(false)
        return
      }

      setAdminUnlocked(true)
      setShowAdminPasswordModal(false)
      setAdminMenuOpen(true)
      setAuthSubmitting(false)
    } catch {
      setAdminPasswordError('Unable to verify password.')
      setAuthSubmitting(false)
    }
  }

  return (
    <nav className="bg-[#0066CC] shadow-lg w-full sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: logo + main nav */}
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">Goodwill Orders</h1>
            </div>
            <div className="hidden sm:flex sm:ml-8 sm:space-x-6 items-center">
              <div className="relative group">
                <button
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                    isActive('/new-order') || isActive('/store-maintenance-order')
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                  }`}
                >
                  Stores
                  <span className="ml-1 text-xs">▼</span>
                </button>
                <div className="absolute left-0 top-full mt-0 w-64 rounded-md shadow-lg bg-white text-gray-800 hidden group-hover:block z-[110]">
                  <Link
                    href="/new-order"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    Store Supply Order
                  </Link>
                  <Link
                    href="/store-maintenance-order"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    Store Maintenance Order
                  </Link>
                </div>
              </div>
              <Link
                href="/staff-uniforms"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/staff-uniforms')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Staff Apparel
              </Link>
              <div className="relative group">
                <button
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                    isActive('/adc-supply') || isActive('/adc-maintenance')
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                  }`}
                >
                  ADCs
                  <span className="ml-1 text-xs">▼</span>
                </button>
                <div className="absolute left-0 top-full mt-0 w-56 rounded-md shadow-lg bg-white text-gray-800 hidden group-hover:block z-[110]">
                  <Link
                    href="/adc-supply"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    ADC Supply Order
                  </Link>
                  <Link
                    href="/adc-maintenance"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    ADC Maintenance Order
                  </Link>
                </div>
              </div>
              <div className="relative group">
                <button
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                    isActive('/ecom-warehouse') ||
                    isActive('/ecom-ebooks') ||
                    isActive('/ecom-ebooks-maintenance') ||
                    isActive('/ecom-warehouse-maintenance')
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                  }`}
                >
                  E-commerce
                  <span className="ml-1 text-xs">▼</span>
                </button>
                <div className="absolute left-0 top-full mt-0 w-64 rounded-md shadow-lg bg-white text-gray-800 hidden group-hover:block z-[110]">
                  <Link
                    href="/ecom-ebooks"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    EBooks Supply Order
                  </Link>
                  <Link
                    href="/ecom-ebooks-maintenance"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    Ebooks Maintenance Order
                  </Link>
                  <Link
                    href="/ecom-warehouse"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    Ecomm Supply Order
                  </Link>
                  <Link
                    href="/ecom-warehouse-maintenance"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    Ecomm Maintenance Order
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Admin dropdown */}
          <div className="hidden sm:flex items-center">
            <div className="relative">
              <button
                className={`inline-flex items-center px-3 py-2 border-b-2 text-base font-bold transition-colors ${
                  isActive('/catalog') ||
                  isActive('/orders') ||
                  isActive('/order-stats') ||
                  isActive('/store-management') ||
                  isActive('/vendor-management')
                    ? 'border-white text-white'
                    : 'border-transparent text-white hover:text-gray-200 hover:border-blue-200'
                }`}
                onClick={handleAdminButtonClick}
                type="button"
              >
                Admin
                <span className="ml-1 text-xs">▼</span>
              </button>

              {adminMenuOpen && (
                <div className="absolute right-0 top-full mt-0 w-56 rounded-md shadow-lg bg-white text-gray-800 z-[110]">
                  {adminLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setAdminMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-blue-50"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAdminPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#0066CC] mb-3">Admin Password</h2>
              <p className="text-sm text-gray-600 mb-4">
                Enter the admin password to access admin pages.
              </p>

              <div className="text-left space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Password
                </label>
                <input
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  type="password"
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitAdminPassword()
                  }}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={authSubmitting}
                />
                {adminPasswordError && (
                  <p className="text-red-600 text-sm">{adminPasswordError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordModal(false)
                    setAdminPasswordError('')
                    setAdminPassword('')
                    setAuthSubmitting(false)
                  }}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
                  disabled={authSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAdminPassword}
                  disabled={authSubmitting}
                  className="flex-1 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {authSubmitting ? 'Checking...' : 'Unlock Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
