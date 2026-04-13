import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client reads `url` from schema → env DATABASE_URL only at runtime.
// `directUrl` (DIRECT_URL) is not used for API route queries—only for migrate CLI.
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
