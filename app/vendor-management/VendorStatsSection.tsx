'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

export type VendorStatRow = {
  vendorId: number
  vendorName: string
  spendCents: number
  itemCount: number
  lineCount: number
  percentOfTotal: number
}

type VendorStatsResponse = {
  totalSpendCents: number
  orderCount: number
  vendors: VendorStatRow[]
}

/** Evenly spaced hues so every vendor gets a distinct color, regardless of count. */
function buildVendorColorMap(vendorIds: number[]): Record<number, string> {
  const map: Record<number, string> = {}
  const count = vendorIds.length
  vendorIds.forEach((id, index) => {
    const hue = Math.round((index * 360) / Math.max(count, 1))
    const saturation = 58 + (index % 2) * 8
    const lightness = 38 + (index % 3) * 6
    map[id] = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  })
  return map
}

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(String(y))
  }
  return years
}

type Props = {
  vendorIds: number[]
  vendorNamesById: Record<number, string>
}

export default function VendorStatsSection({ vendorIds, vendorNamesById }: Props) {
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [stats, setStats] = useState<VendorStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showVendorFilter, setShowVendorFilter] = useState(false)

  const yearOptions = useMemo(() => buildYearOptions(), [])

  const vendorColorMap = useMemo(() => buildVendorColorMap(vendorIds), [vendorIds])

  useEffect(() => {
    if (vendorIds.length > 0) {
      setSelectedVendorIds(vendorIds)
    }
  }, [vendorIds])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth) params.append('month', selectedMonth)

      const res = await fetch(`/api/vendors/stats?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load vendor stats')
      }
      setStats(data)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load vendor stats')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.vendor-stats-filter')) {
        setShowVendorFilter(false)
      }
    }
    if (showVendorFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVendorFilter])

  const filteredRows = useMemo(() => {
    if (!stats) return []
    const selected = new Set(selectedVendorIds)
    return stats.vendors.filter((row) => selected.has(row.vendorId))
  }, [stats, selectedVendorIds])

  const filteredTotalCents = useMemo(
    () => filteredRows.reduce((sum, row) => sum + row.spendCents, 0),
    [filteredRows]
  )

  const rowsWithFilteredPercent = useMemo(
    () =>
      filteredRows.map((row) => ({
        ...row,
        percentOfTotal:
          filteredTotalCents > 0
            ? Math.round((row.spendCents / filteredTotalCents) * 1000) / 10
            : 0,
      })),
    [filteredRows, filteredTotalCents]
  )

  const chartRows = useMemo(
    () => rowsWithFilteredPercent.filter((row) => row.spendCents > 0),
    [rowsWithFilteredPercent]
  )

  const maxChartSpend = useMemo(
    () => Math.max(...chartRows.map((row) => row.spendCents), 1),
    [chartRows]
  )

  const periodLabel = useMemo(() => {
    const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label ?? 'All Months'
    return `${monthLabel} ${selectedYear}`
  }, [selectedMonth, selectedYear])

  const toggleVendor = (id: number) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const selectAllVendors = () => setSelectedVendorIds(vendorIds)
  const deselectAllVendors = () => setSelectedVendorIds([])

  const exportToExcel = () => {
    if (rowsWithFilteredPercent.length === 0) {
      alert('No data to export')
      return
    }

    const worksheetData = [
      ['Vendor Stats', periodLabel],
      [],
      ['Vendor', 'Total Spend', 'Items Ordered', 'Line Items', '% of Selected Total'],
      ...rowsWithFilteredPercent.map((row) => [
        row.vendorName,
        row.spendCents / 100,
        row.itemCount,
        row.lineCount,
        row.percentOfTotal / 100,
      ]),
      [],
      ['Selected Total', filteredTotalCents / 100],
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)
    ws['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor Stats')

    const monthSlug =
      MONTHS.find((m) => m.value === selectedMonth)?.label.replace(/\s+/g, '_') ?? 'All_Months'
    XLSX.writeFile(wb, `Vendor_Stats_${selectedYear}_${monthSlug}.xlsx`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <section className="vendor-stats-section bg-white shadow rounded-lg border border-gray-200 mb-6 overflow-hidden">
      <div className="px-4 py-3 bg-[#E6F2FF] border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0066CC]">Vendor Stats</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Spend totals grouped by vendor for the selected period.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${
              viewMode === 'table'
                ? 'bg-[#0066CC] text-white'
                : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${
              viewMode === 'chart'
                ? 'bg-[#0066CC] text-white'
                : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Chart
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 print:hidden">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
            >
              {MONTHS.map((month) => (
                <option key={month.value || 'all'} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative vendor-stats-filter">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Vendors ({selectedVendorIds.length} selected)
            </label>
            <button
              type="button"
              onClick={() => setShowVendorFilter((v) => !v)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white min-w-[200px] text-left"
            >
              {selectedVendorIds.length === vendorIds.length
                ? 'All Vendors'
                : `${selectedVendorIds.length} Vendor${selectedVendorIds.length !== 1 ? 's' : ''} Selected`}
            </button>
            {showVendorFilter && (
              <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto min-w-[240px]">
                <div className="p-2 border-b border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={selectAllVendors}
                    className="text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllVendors}
                    className="text-xs text-[#0066CC] hover:text-[#0052A3] font-semibold"
                  >
                    Deselect All
                  </button>
                </div>
                <div className="p-2">
                  {vendorIds.map((id) => (
                    <label
                      key={id}
                      className="flex items-center py-1 px-2 hover:bg-blue-50 cursor-pointer gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(id)}
                        onChange={() => toggleVendor(id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#0066CC]"
                      />
                      <span className="text-sm text-gray-900">
                        {vendorNamesById[id] ?? `Vendor #${id}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={exportToExcel}
              disabled={loading || rowsWithFilteredPercent.length === 0}
              className="px-4 py-2 bg-[#0066CC] text-white text-sm font-bold rounded-md hover:bg-[#0052A3] disabled:opacity-50"
            >
              Export to Excel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || rowsWithFilteredPercent.length === 0}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-bold rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 print:p-0">
        <div className="hidden print:block mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Vendor Stats — {periodLabel}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Selected total: {formatCurrency(filteredTotalCents)}
            {stats ? ` · ${stats.orderCount} orders in period` : ''}
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-600">Loading vendor stats…</div>
        ) : error ? (
          <div className="py-6 rounded-md border border-red-200 bg-red-50 px-4 text-sm text-red-800">
            {error}
          </div>
        ) : rowsWithFilteredPercent.length === 0 ? (
          <div className="py-10 text-center text-gray-600">
            Select at least one vendor to view stats.
          </div>
        ) : viewMode === 'table' ? (
          <>
            <div className="mb-4 flex flex-wrap gap-4 text-sm print:mb-2">
              <div>
                <span className="font-semibold text-gray-700">Period:</span>{' '}
                <span className="text-gray-900">{periodLabel}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Selected total:</span>{' '}
                <span className="text-[#0066CC] font-bold">{formatCurrency(filteredTotalCents)}</span>
              </div>
              {stats ? (
                <div>
                  <span className="font-semibold text-gray-700">Orders in period:</span>{' '}
                  <span className="text-gray-900">{stats.orderCount}</span>
                </div>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">
                      Vendor
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-white uppercase">
                      Total Spend
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-white uppercase">
                      Items Ordered
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-white uppercase">
                      Line Items
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-white uppercase">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rowsWithFilteredPercent.map((row) => (
                    <tr key={row.vendorId} className="hover:bg-blue-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.vendorName}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-[#0066CC]">
                        {formatCurrency(row.spendCents)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {row.itemCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {row.lineCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {row.percentOfTotal.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">Selected Total</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatCurrency(filteredTotalCents)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="mb-2 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Period:</span>{' '}
                <span className="text-gray-900">{periodLabel}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Selected total:</span>{' '}
                <span className="text-[#0066CC] font-bold">{formatCurrency(filteredTotalCents)}</span>
              </div>
            </div>
            {chartRows.length === 0 ? (
              <div className="py-8 text-center text-gray-600">
                No spend recorded for the selected vendors in this period.
              </div>
            ) : (
              <div className="space-y-3">
                {chartRows.map((row) => {
                  const widthPct = Math.max(4, (row.spendCents / maxChartSpend) * 100)
                  const color = vendorColorMap[row.vendorId] ?? 'hsl(210, 58%, 42%)'
                  return (
                    <div key={row.vendorId}>
                      <div className="flex justify-between items-baseline gap-4 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {row.vendorName}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(row.spendCents)}{' '}
                          <span className="text-gray-500 font-normal">
                            ({row.percentOfTotal.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-7 bg-gray-100 rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md transition-all duration-300"
                          style={{ width: `${widthPct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .vendor-stats-section,
          .vendor-stats-section * {
            visibility: visible;
          }
          .vendor-stats-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border: none;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
