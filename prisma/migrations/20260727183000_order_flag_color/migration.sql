-- CreateEnum
CREATE TYPE "OrderFlagColor" AS ENUM ('RED', 'GREEN', 'ORANGE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "flagColor" "OrderFlagColor";

-- Migrate existing boolean flags to orange (previous default highlight color)
UPDATE "Order" SET "flagColor" = 'ORANGE' WHERE "isFlagged" = true;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "isFlagged";
