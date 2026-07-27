import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthed } from '@/lib/admin-auth-server'
import {
  DAILY_ANNOUNCEMENT_ID,
  DEFAULT_DAILY_ANNOUNCEMENT,
} from '@/lib/daily-announcement-defaults'

export const dynamic = 'force-dynamic'

async function getOrCreateAnnouncement() {
  const existing = await prisma.dailyAnnouncement.findUnique({
    where: { id: DAILY_ANNOUNCEMENT_ID },
  })

  if (existing) return existing

  return prisma.dailyAnnouncement.create({
    data: {
      id: DAILY_ANNOUNCEMENT_ID,
      title: DEFAULT_DAILY_ANNOUNCEMENT.title,
      body: DEFAULT_DAILY_ANNOUNCEMENT.body,
      isEnabled: DEFAULT_DAILY_ANNOUNCEMENT.isEnabled,
    },
  })
}

export async function GET() {
  try {
    const announcement = await getOrCreateAnnouncement()
    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error fetching daily announcement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily announcement' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, body: announcementBody, isEnabled } = body

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (
      announcementBody !== undefined &&
      (typeof announcementBody !== 'string' || !announcementBody.trim())
    ) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 })
    }

    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'isEnabled must be a boolean' }, { status: 400 })
    }

    const data: {
      title?: string
      body?: string
      isEnabled?: boolean
    } = {}

    if (title !== undefined) data.title = title.trim()
    if (announcementBody !== undefined) data.body = announcementBody.trim()
    if (isEnabled !== undefined) data.isEnabled = isEnabled

    const announcement = await prisma.dailyAnnouncement.upsert({
      where: { id: DAILY_ANNOUNCEMENT_ID },
      create: {
        id: DAILY_ANNOUNCEMENT_ID,
        title: data.title ?? DEFAULT_DAILY_ANNOUNCEMENT.title,
        body: data.body ?? DEFAULT_DAILY_ANNOUNCEMENT.body,
        isEnabled: data.isEnabled ?? DEFAULT_DAILY_ANNOUNCEMENT.isEnabled,
      },
      update: data,
    })

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error updating daily announcement:', error)
    return NextResponse.json(
      { error: 'Failed to update daily announcement' },
      { status: 500 }
    )
  }
}
