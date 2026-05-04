import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isOrderSubmitPasswordValid } from '@/lib/order-submit-password-server'

/** Server-side check for store order form confirmation modal (not Supabase). */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
  const password = typeof (body as { password?: unknown }).password === 'string'
    ? (body as { password: string }).password
    : ''
  const storeIdRaw = (body as { storeId?: unknown }).storeId
  const storeId =
    typeof storeIdRaw === 'string'
      ? parseInt(storeIdRaw, 10)
      : typeof storeIdRaw === 'number' && Number.isFinite(storeIdRaw)
        ? Math.trunc(storeIdRaw)
        : NaN
  if (!Number.isFinite(storeId) || storeId < 1) {
    return NextResponse.json({ ok: false, error: 'Missing store' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { storeNumber: true },
  })
  if (!store) {
    return NextResponse.json({ ok: false, error: 'Store not found' }, { status: 404 })
  }

  if (!isOrderSubmitPasswordValid(store.storeNumber, password)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
