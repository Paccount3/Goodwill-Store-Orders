import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // If you created products before `sortOrder` existed, they will all be 0.
  // Backfill to a stable, non-alphabetical order (creation/id order) so UI/forms
  // can respect a deterministic order immediately, and admins can fine-tune it
  // via the Item Catalog reorder controls.
  const products = await prisma.product.findMany({
    select: { id: true, sortOrder: true },
    orderBy: { id: 'asc' },
  })

  const needs = products.filter((p) => (p.sortOrder ?? 0) === 0)
  if (needs.length === 0) {
    console.log('No backfill needed (all products have non-zero sortOrder).')
    return
  }

  console.log(`Backfilling sortOrder for ${needs.length} product(s)...`)
  await prisma.$transaction(
    needs.map((p) =>
      prisma.product.update({
        where: { id: p.id },
        data: { sortOrder: p.id },
      })
    )
  )
  console.log('Backfill completed.')
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

