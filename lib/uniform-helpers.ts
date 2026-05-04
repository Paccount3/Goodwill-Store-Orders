/** Parse comma- or newline-separated labels for catalog forms (sizes, colors). */
export function parseCommaSeparatedLabels(raw: string): string[] {
  return raw
    .split(/[,|\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** JSON array stored on Product → human-readable for textareas */
export function uniformJsonArrayToCommaText(json: string | null | undefined): string {
  if (!json?.trim()) return ''
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v.join(', ') : ''
  } catch {
    return ''
  }
}

/** Same unit price (cents) for every size (fallback when no per-size map is provided). */
export function buildUniformSizePriceMap(
  sizes: string[],
  priceCents: number
): Record<string, number> {
  const m: Record<string, number> = {}
  for (const s of sizes) {
    m[s] = priceCents
  }
  return m
}

/** Minimum unit price in cents from a size→cents map (empty → null). */
export function minCentsFromSizePriceMap(map: Record<string, number> | null | undefined): number | null {
  if (!map || typeof map !== 'object') return null
  const vals = Object.values(map).map((v) => Number(v)).filter((v) => Number.isFinite(v))
  if (!vals.length) return null
  return Math.min(...vals)
}

/**
 * Parse JSON object of size → price in dollars (e.g. {"XS":16,"XXL":18}).
 * Returns cents per size. Validates that every expected size has a numeric entry.
 */
export function parseSizePriceMapDollarsJson(
  text: string,
  expectedSizes: string[]
): { mapCents: Record<string, number> | null; error: string | null } {
  const trimmed = text.trim()
  if (!trimmed) return { mapCents: null, error: null }
  let raw: unknown
  try {
    raw = JSON.parse(trimmed)
  } catch {
    return { mapCents: null, error: 'Size prices must be valid JSON (object of size → dollars).' }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { mapCents: null, error: 'Size prices JSON must be an object like {"XS": 16, "XXL": 18}.' }
  }
  const obj = raw as Record<string, unknown>
  const mapCents: Record<string, number> = {}
  for (const size of expectedSizes) {
    const v = obj[size]
    if (v === undefined || v === null) {
      return { mapCents: null, error: `Missing price for size "${size}" in JSON.` }
    }
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0) {
      return { mapCents: null, error: `Invalid price for size "${size}".` }
    }
    mapCents[size] = Math.round(n * 100)
  }
  return { mapCents, error: null }
}

/** Pretty-print stored cents map as dollars JSON for editing in forms. */
export function sizePriceMapCentsToDollarsJsonText(json: string | null | undefined): string {
  if (!json?.trim()) return ''
  try {
    const cents = JSON.parse(json) as Record<string, unknown>
    const dollars: Record<string, number> = {}
    for (const [k, v] of Object.entries(cents)) {
      const n = Number(v)
      if (Number.isFinite(n)) dollars[k] = n / 100
    }
    return JSON.stringify(dollars, null, 2)
  } catch {
    return ''
  }
}
