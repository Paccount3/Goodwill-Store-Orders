'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AnnouncementBodyEditor } from '@/app/components/AnnouncementBodyEditor'
import { AnnouncementBody } from '@/app/components/AnnouncementBody'

interface DailyAnnouncement {
  id: number
  title: string
  body: string
  isEnabled: boolean
  updatedAt: string
}

export default function AnnouncementManagementPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [adminGateLoading, setAdminGateLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/status', { cache: 'no-store' })
        const data = await res.json()

        if (cancelled) return

        if (!data?.authed) {
          const searchString = searchParams?.toString() ? `?${searchParams.toString()}` : ''
          router.replace(`/admin-lock?redirectTo=${encodeURIComponent(`${pathname}${searchString}`)}`)
          return
        }

        setAdminGateLoading(false)
      } catch {
        if (cancelled) return
        const searchString = searchParams?.toString() ? `?${searchParams.toString()}` : ''
        router.replace(`/admin-lock?redirectTo=${encodeURIComponent(`${pathname}${searchString}`)}`)
      }
    }

    checkAdmin()
    return () => {
      cancelled = true
    }
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!adminGateLoading) {
      fetchAnnouncement()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminGateLoading])

  const fetchAnnouncement = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/announcements/daily', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load announcement')
      const data = (await res.json()) as DailyAnnouncement
      setTitle(data.title)
      setBody(data.body)
      setIsEnabled(data.isEnabled)
    } catch {
      setError('Unable to load the daily announcement.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSavedMessage('')
    setError('')

    try {
      const res = await fetch('/api/announcements/daily', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), isEnabled }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save announcement')
      }

      const data = (await res.json()) as DailyAnnouncement
      setTitle(data.title)
      setBody(data.body)
      setIsEnabled(data.isEnabled)
      setSavedMessage('Announcement saved. Users will see the updated message on their next visit today.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  if (adminGateLoading) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0066CC]">Daily Announcement</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update the popup message shown once per day on the homepage. Changing the message will
          show it again to users who already dismissed it today.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-900 font-medium">Loading...</div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="text-[#0066CC] focus:ring-[#0066CC]"
              />
              Show announcement popup
            </label>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                placeholder="Announcement headline"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Message body
              </label>
              <AnnouncementBodyEditor body={body} onChange={setBody} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Popup preview</p>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#0066CC] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
                    Daily Announcement
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white">{title || 'Headline'}</h3>
                </div>
                <div className="p-4 bg-white">
                  <AnnouncementBody body={body} />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {savedMessage && <p className="text-sm text-green-700">{savedMessage}</p>}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim() || !body.trim()}
                className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-5 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
