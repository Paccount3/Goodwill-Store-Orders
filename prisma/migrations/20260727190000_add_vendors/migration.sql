-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- Seed vendors (sortOrder matches list order; "Other" last)
INSERT INTO "Vendor" ("name", "sortOrder") VALUES
  ('Arbel Group', 0),
  ('Amazon', 1),
  ('Freedom Distribution', 2),
  ('Fixture Zone', 3),
  ('Home Depot', 4),
  ('Housatonic Paper & Supply Company', 5),
  ('Quill', 6),
  ('Packsize', 7),
  ('PLI Card Marketing Solutions', 8),
  ('Solutions Pest & Lawn Care', 9),
  ('Southern Label Company', 10),
  ('Staples', 11),
  ('Store Supply Warehouse', 12),
  ('Tee It Up', 13),
  ('Sourcing Edge', 14),
  ('Uline', 15),
  ('Other', 16);

-- Add vendorId column (nullable during backfill)
ALTER TABLE "Product" ADD COLUMN "vendorId" INTEGER;

-- Assign all existing products to "Other"
UPDATE "Product"
SET "vendorId" = (SELECT "id" FROM "Vendor" WHERE "name" = 'Other' LIMIT 1)
WHERE "vendorId" IS NULL;

-- Enforce NOT NULL + FK
ALTER TABLE "Product" ALTER COLUMN "vendorId" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
