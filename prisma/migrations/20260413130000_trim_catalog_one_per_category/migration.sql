-- Keep a single catalog row per canonical order-form category (lowest id wins).
-- Rows referenced by OrderLine cannot be deleted; those duplicates are deactivated instead.

WITH canonical AS (
  SELECT unnest(ARRAY[
    'Store Supply Order',
    'Store Maintenance Order',
    'Staff Apparel',
    'ADC Supply Order',
    'ADC Maintenance Order',
    'Ebooks Supply Order',
    'Ebooks Maintenance Order',
    'Ecomm Supply Order',
    'Ecomm Maintenance Order'
  ]::text[]) AS cat
),
keepers AS (
  SELECT DISTINCT ON (p."category") p.id
  FROM "Product" p
  INNER JOIN canonical c ON p."category" = c.cat
  ORDER BY p."category", p.id ASC
)
DELETE FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "OrderLine" ol WHERE ol."productId" = p.id
)
AND NOT EXISTS (
  SELECT 1 FROM keepers k WHERE k.id = p.id
);

WITH canonical AS (
  SELECT unnest(ARRAY[
    'Store Supply Order',
    'Store Maintenance Order',
    'Staff Apparel',
    'ADC Supply Order',
    'ADC Maintenance Order',
    'Ebooks Supply Order',
    'Ebooks Maintenance Order',
    'Ecomm Supply Order',
    'Ecomm Maintenance Order'
  ]::text[]) AS cat
),
keepers AS (
  SELECT DISTINCT ON (p."category") p.id
  FROM "Product" p
  INNER JOIN canonical c ON p."category" = c.cat
  ORDER BY p."category", p.id ASC
)
UPDATE "Product" p
SET "isActive" = false
WHERE EXISTS (
  SELECT 1 FROM "OrderLine" ol WHERE ol."productId" = p.id
)
AND NOT EXISTS (
  SELECT 1 FROM keepers k WHERE k.id = p.id
);
