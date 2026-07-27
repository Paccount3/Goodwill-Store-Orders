'use client'

import React, { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLockPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectToRaw = searchParams.get('redirectTo') || ''

  const redirectTo = useMemo(() => {
    const allowedPrefixes = ['/catalog', '/orders', '/order-stats', '/store-management', '/vendor-management']
    const ok =
      redirectToRaw && allowedPrefixes.some((prefix) => redirectToRaw === prefix || redirectToRaw.startsWith(`${prefix}/`))
    return ok ? redirectToRaw : '/catalog'
  }, [redirectToRaw])

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // Send only what user typed; server validates against the fixed password.
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setError('Incorrect password.')
        setSubmitting(false)
        return
      }

      router.replace(redirectTo)
    } catch {
      setError('Unable to verify password.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-[#0066CC]">Admin Access Required</h1>
          <p className="text-sm text-gray-600 mt-2">
            Enter the admin password to access admin pages.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              placeholder="Enter admin password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.replace('/')}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Unlock Admin'}
            </button>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            (Password is managed by the server.)
          </p>
        </form>
      </div>
    </div>
  )
}

