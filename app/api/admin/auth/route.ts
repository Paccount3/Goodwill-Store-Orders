import { NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin_authed'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'BigBlueAdmin1!'

export async function POST(req: Request) {
  let body: any = null
  try {
    body = await req.json()
  } catch {
    // ignore
  }

  const password = typeof body?.password === 'string' ? body.password : ''

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '1',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    secure: process.env.NODE_ENV === 'production',
  })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

