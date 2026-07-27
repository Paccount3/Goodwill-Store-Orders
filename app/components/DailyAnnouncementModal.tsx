'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnnouncementBody } from '@/app/components/AnnouncementBody'
import {
  DAILY_ANNOUNCEMENT_STORAGE_KEY,
  shouldShowDailyAnnouncement,
  getTodayLocalDateString,
} from '@/lib/daily-announcement-defaults'

interface DailyAnnouncement {
  id: number
  title: string
  body: string
  isEnabled: boolean
  updatedAt: string
}

function readDismissedState(): { date: string; updatedAt: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DAILY_ANNOUNCEMENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { date?: string; updatedAt?: string }
    if (!parsed.date || !parsed.updatedAt) return null
    return { date: parsed.date, updatedAt: parsed.updatedAt }
  } catch {
    return null
  }
}

function saveDismissedState(updatedAt: string) {
  localStorage.setItem(
    DAILY_ANNOUNCEMENT_STORAGE_KEY,
    JSON.stringify({
      date: getTodayLocalDateString(),
      updatedAt,
    })
  )
}

export default function DailyAnnouncementModal() {
  const pathname = usePathname()
  const [announcement, setAnnouncement] = useState<DailyAnnouncement | null>(null)
  const [visible, setVisible] = useState(false)

  const isHomeEntry = pathname === '/new-order' || pathname === '/'

  useEffect(() => {
    if (!isHomeEntry) return

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/announcements/daily', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as DailyAnnouncement
        if (cancelled) return

        if (!data.isEnabled) return

        const updatedAtIso = new Date(data.updatedAt).toISOString()
        const dismissed = readDismissedState()
        if (shouldShowDailyAnnouncement(updatedAtIso, dismissed)) {
          setAnnouncement({ ...data, updatedAt: updatedAtIso })
          setVisible(true)
        }
      } catch {
        // Non-critical — skip modal if fetch fails
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isHomeEntry])

  const close = () => {
    if (announcement) {
      saveDismissedState(announcement.updatedAt)
    }
    setVisible(false)
  }

  if (!visible || !announcement) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-announcement-title"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 bg-[#0066CC] px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
              Daily Announcement
            </p>
            <h2
              id="daily-announcement-title"
              className="mt-1 text-2xl font-bold text-white leading-tight"
            >
              {announcement.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-md p-1 text-2xl leading-none text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="Close announcement"
          >
            ×
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <AnnouncementBody body={announcement.body} />
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={close}
            className="rounded-lg bg-[#0066CC] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#0052A3]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
