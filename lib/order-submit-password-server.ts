/**
 * Order confirmation passwords (Vercel / local env). Not stored in the database.
 *
 * Per store: ORDER_SUBMIT_PASSWORD_STORE_<storeNumber> matches Store.storeNumber
 * (e.g. 01, 13 for OT, 21). If unset or empty, falls back to ORDER_SUBMIT_PASSWORD, then BIGBLUE.
 */
export function orderSubmitPasswordEnvKey(storeNumber: string): string {
  return `ORDER_SUBMIT_PASSWORD_STORE_${storeNumber}`
}

export function resolveExpectedOrderSubmitPassword(storeNumber: string): string {
  const perStore = process.env[orderSubmitPasswordEnvKey(storeNumber)]
  if (perStore !== undefined && perStore !== '') {
    return perStore
  }
  return process.env.ORDER_SUBMIT_PASSWORD ?? 'BIGBLUE'
}

function resolveOrderSubmitBackupPassword(): string | undefined {
  const backup = process.env.ORDER_SUBMIT_PASSWORD
  return backup !== undefined && backup !== '' ? backup : undefined
}

function resolveAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? 'BigBlueAdmin1!'
}

/** Per-store password, plus universal backup (`ORDER_SUBMIT_PASSWORD`) and admin password. */
export function isOrderSubmitPasswordValid(storeNumber: string, password: string): boolean {
  if (password === resolveExpectedOrderSubmitPassword(storeNumber)) return true
  const backup = resolveOrderSubmitBackupPassword()
  if (backup && password === backup) return true
  if (password === resolveAdminPassword()) return true
  return false
}
