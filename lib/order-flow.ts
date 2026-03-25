/** Shared copy and helpers for store-facing order forms (not admin). */

export const CONFIRM_ORDER_MODAL_BODY =
  'Are you ready to submit this order? Please verify all current and requested amounts are accurate.'

export function orderSubmitErrorUserMessage(technical: string): string {
  return `Order failed. Please refresh the page and try again. If the issue persists, please contact your administrators with the following error information:\n\n${technical}`
}

export function isSuccessfulOrderResponse(data: unknown): data is { id: number } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as { id: unknown }).id === 'number' &&
    Number.isFinite((data as { id: number }).id)
  )
}
