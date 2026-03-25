import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_COOKIE_NAME = 'admin_authed'

export async function GET() {
  const authed = cookies().get(ADMIN_COOKIE_NAME)?.value === '1'
  return NextResponse.json({ authed })
}

