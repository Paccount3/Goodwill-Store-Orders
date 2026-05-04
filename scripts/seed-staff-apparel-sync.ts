import { PrismaClient } from '@prisma/client'
import { syncStaffApparelPriceSheetFromSeed } from '../lib/staff-apparel-price-sheet'

const prisma = new PrismaClient()

async function main() {
  await syncStaffApparelPriceSheetFromSeed(prisma)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
