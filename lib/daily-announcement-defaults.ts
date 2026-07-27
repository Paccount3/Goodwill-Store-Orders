export const DAILY_ANNOUNCEMENT_ID = 1

export const DEFAULT_DAILY_ANNOUNCEMENT = {
  title: 'Are You Hiring?',
  body: `Goodwill's mission to support our participants depends on partnerships with our stores.

When your store has hiring needs, please contact your region's Business Engagement Specialist first. We can help connect you with participants in your area for open positions and coordinate valuable trial work evaluations.

**North Region Business Engagement Specialist**
Shawn Hillmann
Shillmann@gwct.org
203-610-0382

**West Region Business Engagement Specialist**
Ed Majersky
Emajersky@gwct.org
203-610-9705`,
  isEnabled: true,
} as const

export const DAILY_ANNOUNCEMENT_STORAGE_KEY = 'goodwill-daily-announcement-dismissed'

export function getTodayLocalDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shouldShowDailyAnnouncement(
  updatedAtIso: string,
  dismissed: { date: string; updatedAt: string } | null
): boolean {
  if (!dismissed) return true
  if (dismissed.updatedAt !== updatedAtIso) return true
  return dismissed.date !== getTodayLocalDateString()
}
