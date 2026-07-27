import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin_authed'

function isProtectedAdminPath(pathname: string): boolean {
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return true

  if (pathname === '/order-stats' || pathname.startsWith('/order-stats/')) return true

  if (pathname === '/store-management' || pathname.startsWith('/store-management/')) return true

  if (pathname === '/vendor-management' || pathname.startsWith('/vendor-management/')) return true

  if (pathname === '/announcement-management' || pathname.startsWith('/announcement-management/')) return true

  // Protect Orders Hub + Order detail pages, but do NOT protect the invoice view,
  // because the order success flow opens `/orders/:id/invoice` for printing.
  if (pathname === '/orders' || pathname.startsWith('/orders/')) {
    const invoiceRegex = /^\/orders\/\d+\/invoice(\/vendor)?\/?$/
    if (invoiceRegex.test(pathname)) return false
    return true
  }

  return false
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (!isProtectedAdminPath(pathname)) {
    return NextResponse.next()
  }

  const authed = req.cookies.get(ADMIN_COOKIE_NAME)?.value === '1'
  if (authed) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/admin-lock'
  url.searchParams.set('redirectTo', `${pathname}${search}`)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/catalog/:path*', '/orders/:path*', '/order-stats/:path*', '/store-management/:path*', '/vendor-management/:path*', '/announcement-management/:path*'],
}

