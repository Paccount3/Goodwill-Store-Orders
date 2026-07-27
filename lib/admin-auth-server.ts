import { cookies } from 'next/headers'

const ADMIN_COOKIE_NAME = 'admin_authed'

export function isAdminAuthed(): boolean {
  return cookies().get(ADMIN_COOKIE_NAME)?.value === '1'
}
