/**
 * Client-side helpers for GET /api/products — normalizes errors and ensures an array
 * so UI never calls .map on a non-array when the API returns JSON errors.
 */
export type FetchProductsResult<T = unknown> = {
  products: T[]
  error: string | null
}

export async function fetchProductsFromApi<T = unknown>(url: string): Promise<FetchProductsResult<T>> {
  try {
    const res = await fetch(url)
    let payload: unknown
    try {
      payload = await res.json()
    } catch {
      payload = {}
    }

    if (!res.ok) {
      const body = payload as { error?: string; details?: string }
      const msg =
        (typeof body.error === 'string' && body.error) ||
        (typeof body.details === 'string' && body.details) ||
        `Failed to load products (${res.status})`
      return { products: [], error: msg }
    }

    const products = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { products?: unknown }).products)
        ? (payload as { products: T[] }).products
        : []

    return { products, error: null }
  } catch (e) {
    return {
      products: [],
      error: e instanceof Error ? e.message : 'Network error while loading products',
    }
  }
}

/** Generic GET that expects a top-level JSON array (e.g. `/api/stores`). */
export async function fetchJsonArrayFromApi<T = unknown>(url: string): Promise<{ items: T[]; error: string | null }> {
  try {
    const res = await fetch(url)
    let payload: unknown
    try {
      payload = await res.json()
    } catch {
      payload = {}
    }
    if (!res.ok) {
      const body = payload as { error?: string; details?: string }
      const msg =
        (typeof body.error === 'string' && body.error) ||
        (typeof body.details === 'string' && body.details) ||
        `Request failed (${res.status})`
      return { items: [], error: msg }
    }
    const items = Array.isArray(payload) ? payload : []
    return { items: items as T[], error: null }
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : 'Network error',
    }
  }
}
