'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-[#0066CC] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">Goodwill Store Orders</h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <Link
                href="/new-order"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/new-order')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                New Store Supplies Order
              </Link>
              <Link
                href="/orders"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/orders')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Orders Hub
              </Link>
              <Link
                href="/catalog"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/catalog')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Item Catalog
              </Link>
              <Link
                href="/staff-uniforms"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/staff-uniforms')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Staff Uniforms
              </Link>
              <Link
                href="/adc-supply"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/adc-supply')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                ADC Supply Orders
              </Link>
              <Link
                href="/adc-maintenance"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/adc-maintenance')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                ADC Maintenance
              </Link>
              <Link
                href="/housatonic-maintenance"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/housatonic-maintenance')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Housatonic Maintenance
              </Link>
              <div className="flex-1"></div>
              <Link
                href="/order-stats"
                className={`inline-flex items-center px-4 py-2 text-sm font-bold transition-all rounded-full ${
                  isActive('/order-stats')
                    ? 'bg-white text-[#0066CC] shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30 hover:shadow-lg border-2 border-white/30'
                }`}
              >
                📊 Order Stats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
