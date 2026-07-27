export const ORDER_FLAG_COLORS = ['GREEN', 'ORANGE', 'RED'] as const
export type OrderFlagColor = (typeof ORDER_FLAG_COLORS)[number]

export function isOrderFlagColor(value: unknown): value is OrderFlagColor {
  return typeof value === 'string' && ORDER_FLAG_COLORS.includes(value as OrderFlagColor)
}

export const FLAG_COLOR_STYLES: Record<
  OrderFlagColor,
  { hex: string; rowBg: string; label: string }
> = {
  GREEN: {
    hex: '#22c55e',
    rowBg: '#f0fdf4',
    label: 'Green',
  },
  ORANGE: {
    hex: '#f97316',
    rowBg: '#fff7ed',
    label: 'Orange',
  },
  RED: {
    hex: '#ef4444',
    rowBg: '#fef2f2',
    label: 'Red',
  },
}

export const FLAG_ICON_PATH =
  'M3 21v-4m0 0V5a2 2 0 012-2h6.586a1 1 0 01.707.293l6.414 6.414a1 1 0 01.293.707V17a2 2 0 01-2 2H5a2 2 0 01-2-2z'
