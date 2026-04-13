import { NextResponse } from 'next/server'

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
  const expected = process.env.ORDER_SUBMIT_PASSWORD ?? 'BIGBLUE'
  if (password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
