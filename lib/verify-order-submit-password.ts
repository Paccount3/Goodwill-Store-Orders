/** Calls server to validate order confirmation password (value from env ORDER_SUBMIT_PASSWORD). */
export async function verifyOrderSubmitPassword(password: string): Promise<boolean> {
  const res = await fetch('/api/order-submit/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) return false
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
  return data.ok === true
}
