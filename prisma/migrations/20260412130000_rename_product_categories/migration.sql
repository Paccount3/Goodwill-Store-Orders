-- Align Product.category with order-form labels (single canonical string per form).

UPDATE "Product" SET category = 'Store Supply Order' WHERE category IN (
  'General Supplies',
  'Labels, Tape, & Office Supplies',
  'Gloves & PPE',
  'Stickers & Tags',
  'Bags & Paper',
  'Hangers',
  'Store Apparel',
  'Miscellaneous'
);

UPDATE "Product" SET category = 'ADC Supply Order' WHERE category = 'ADC Supply';
UPDATE "Product" SET category = 'ADC Maintenance Order' WHERE category = 'ADC Maintenance';
UPDATE "Product" SET category = 'Ebooks Supply Order' WHERE category = 'Ecom Books';
UPDATE "Product" SET category = 'Ecomm Supply Order' WHERE category = 'Ecom Warehouse';
UPDATE "Product" SET category = 'Ebooks Maintenance Order' WHERE category = 'Ebooks Maintenance';
UPDATE "Product" SET category = 'Ecomm Maintenance Order' WHERE category = 'Ecomm Maintenance';
