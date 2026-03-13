import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Ensure additional staff-apparel locations exist
    const extraLocations = [
      { storeNumber: '21', name: 'Bridgeport Headquarters' },
      { storeNumber: '22', name: 'Cheshire CR' },
      { storeNumber: '23', name: 'Greenwich ADC' },
      { storeNumber: '24', name: 'Hartford Campus' },
      { storeNumber: '25', name: 'Manchester CR' },
      { storeNumber: '26', name: 'Ridgefield ADC' },
      { storeNumber: '27', name: 'Riverside ADC' },
    ]

    await Promise.all(
      extraLocations.map((loc) =>
        prisma.store.upsert({
          where: { storeNumber: loc.storeNumber },
          update: { name: loc.name },
          create: loc,
        })
      )
    )

    const stores = await prisma.store.findMany({
      orderBy: {
        storeNumber: 'asc',
      },
    })
    return NextResponse.json(stores)
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}
