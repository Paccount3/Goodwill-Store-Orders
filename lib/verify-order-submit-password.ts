/** Calls server to validate order confirmation password for the selected store (per-store Vercel env). */
export async function verifyOrderSubmitPassword(
  password: string,
  storeId: string
): Promise<boolean> {
  const res = await fetch('/api/order-submit/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, storeId }),
  })
  if (!res.ok) return false
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
  return data.ok === true
}
