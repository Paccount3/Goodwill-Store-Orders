import { NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin_authed'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0, // Clear immediately
    secure: process.env.NODE_ENV === 'production',
  })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

