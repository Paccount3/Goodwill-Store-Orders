import { Prisma } from '@prisma/client'

/** Serialize Prisma / unknown errors for logs and JSON `details` fields. */
export function formatPrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `${error.message} [code: ${error.code}]${error.meta ? ` meta: ${JSON.stringify(error.meta)}` : ''}`
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return `${error.message} [PrismaClientInitializationError]`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function logApiError(route: string, method: string, error: unknown): void {
  const details = formatPrismaError(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(`[${route}] ${method} failed`, details, stack ?? '')
}
