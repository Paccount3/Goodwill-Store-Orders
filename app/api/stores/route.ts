import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: [{ sortOrder: 'asc' }, { storeNumber: 'asc' }],
    })
    return NextResponse.json(stores)
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeNumber, name } = body

    if (!storeNumber || typeof storeNumber !== 'string' || !storeNumber.trim()) {
      return NextResponse.json(
        { error: 'Store number is required' },
        { status: 400 }
      )
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
    }

    const trimmedNumber = storeNumber.trim()
    const trimmedName = name.trim()

    const existing = await prisma.store.findUnique({
      where: { storeNumber: trimmedNumber },
    })
    if (existing) {
      return NextResponse.json(
        { error: `A store with number "${trimmedNumber}" already exists` },
        { status: 409 }
      )
    }

    const maxSort = await prisma.store.aggregate({
      _max: { sortOrder: true },
    })
    const nextSort = (maxSort._max.sortOrder ?? -1) + 1

    const store = await prisma.store.create({
      data: {
        storeNumber: trimmedNumber,
        name: trimmedName,
        sortOrder: nextSort,
      },
    })
    return NextResponse.json(store)
  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
  }
}
