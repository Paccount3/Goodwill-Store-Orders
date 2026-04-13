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

/** Same unit price (cents) for every size — matches staff-uniforms order form behavior. */
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
