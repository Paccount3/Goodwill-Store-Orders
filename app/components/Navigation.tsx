'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-[#0066CC] shadow-lg w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: logo + main nav */}
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">Goodwill Store Orders</h1>
            </div>
            <div className="hidden sm:flex sm:ml-8 sm:space-x-6 items-center">
              <Link
                href="/new-order"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/new-order')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Store Supplies
              </Link>
              <Link
                href="/staff-uniforms"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/staff-uniforms')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Staff Apparel
              </Link>
              <div className="relative group">
                <button
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                    isActive('/adc-supply') || isActive('/adc-maintenance')
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                  }`}
                >
                  ADC
                  <span className="ml-1 text-xs">▼</span>
                </button>
                <div className="absolute left-0 top-full mt-0 w-56 rounded-md shadow-lg bg-white text-gray-800 hidden group-hover:block z-20">
                  <Link
                    href="/adc-supply"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    ADC Supply Orders
                  </Link>
                  <Link
                    href="/adc-maintenance"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    ADC Maintenance
                  </Link>
                </div>
              </div>
              <Link
                href="/housatonic-maintenance"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                  isActive('/housatonic-maintenance')
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                Housatonic
              </Link>
              <div className="relative group">
                <button
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors ${
                    isActive('/ecom-warehouse') || isActive('/ecom-ebooks')
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                  }`}
                >
                  E-commerce
                  <span className="ml-1 text-xs">▼</span>
                </button>
                <div className="absolute left-0 top-full mt-0 w-56 rounded-md shadow-lg bg-white text-gray-800 hidden group-hover:block z-20">
                  <Link
                    href="/ecom-warehouse"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    Ecom Warehouse
                  </Link>
                  <Link
                    href="/ecom-ebooks"
                    className="block px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    Ecom Ebooks
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Admin dropdown */}
          <div className="hidden sm:flex items-center">
            <div className="relative group">
              <button
                className={`inline-flex items-center px-3 py-2 border-b-2 text-base font-bold transition-colors ${
                  isActive('/catalog') || isActive('/orders') || isActive('/order-stats')
                    ? 'border-white text-white'
                    : 'border-transparent text-white hover:text-gray-200 hover:border-blue-200'
                }`}
              >
                Admin
                <span className="ml-1 text-xs">▼</span>
              </button>
              <div className="absolute right-0 top-full mt-0 w-56 rounded-md shadow-lg bg-white text-gray-800 hidden group-hover:block z-20">
                <Link
                  href="/catalog"
                  className="block px-4 py-2 text-sm hover:bg-blue-50"
                >
                  Item Catalog
                </Link>
                <Link
                  href="/orders"
                  className="block px-4 py-2 text-sm hover:bg-blue-50"
                >
                  Orders Hub
                </Link>
                <Link
                  href="/order-stats"
                  className="block px-4 py-2 text-sm hover:bg-blue-50"
                >
                  Order Stats
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
