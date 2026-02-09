import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Check if database is already seeded
  const storeCount = await prisma.store.count()
  const productCount = await prisma.product.count()

  // Only seed if database is empty
  if (storeCount > 0 || productCount > 0) {
    console.log(`Database already has data (${storeCount} stores, ${productCount} products). Skipping seed.`)
    return
  }

  console.log('Database is empty. Seeding initial data...')

  // Clear existing data (should be empty, but just in case)
  await prisma.orderLine.deleteMany().catch(() => {})
  await prisma.order.deleteMany().catch(() => {})
  await prisma.product.deleteMany().catch(() => {})
  await prisma.store.deleteMany().catch(() => {})

  // Seed Stores
  const stores = await prisma.store.createMany({
    data: [
      { storeNumber: '01', name: 'AVON' },
      { storeNumber: '02', name: 'BLOOMFIELD' },
      { storeNumber: '03', name: 'BROOKFIELD' },
      { storeNumber: '04', name: 'DANBURY' },
      { storeNumber: '05', name: 'ENFIELD' },
      { storeNumber: '06', name: 'FAIRFIELD' },
      { storeNumber: '07', name: 'GLASTONBURY' },
      { storeNumber: '08', name: 'MANCHESTER' },
      { storeNumber: '09', name: 'MILFORD' },
      { storeNumber: '10', name: 'MONROE' },
      { storeNumber: '11', name: 'NEW MILFORD' },
      { storeNumber: '12', name: 'NORWALK' },
      { storeNumber: '13', name: 'OT' },
      { storeNumber: '14', name: 'OXFORD' },
      { storeNumber: '15', name: 'SHELTON' },
      { storeNumber: '16', name: 'STAM. BROAD' },
      { storeNumber: '17', name: 'STAM. ELM' },
      { storeNumber: '18', name: 'TORRINGTON' },
      { storeNumber: '19', name: 'WATERBURY' },
      { storeNumber: '20', name: 'WESTPORT' },
    ],
  })

  console.log(`Created ${stores.count} stores`)

  // Seed Products with the new list
  const products = await prisma.product.createMany({
    data: [
      // General Supplies
      { name: 'Copy Paper', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 3, isActive: true },
      { name: 'Clear Barbs', category: 'General Supplies', unitPriceCents: 300, maxQuantity: 10, isActive: true },
      { name: 'Super Slices', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 3, isActive: true },
      { name: 'Garment Guns', category: 'General Supplies', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Garment Needles', category: 'General Supplies', unitPriceCents: 250, maxQuantity: 5, isActive: true },
      { name: 'Furniture Tags (book)', category: 'General Supplies', unitPriceCents: 600, maxQuantity: 6, isActive: true },
      { name: 'Sizing Rings (S–XL)', category: 'General Supplies', unitPriceCents: 350, maxQuantity: 10, isActive: true },
      { name: 'Sizing Ring Squares (S–XL)', category: 'General Supplies', unitPriceCents: 350, maxQuantity: 10, isActive: true },
      { name: "Men's Sizing Rings", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: "Women's Sizing Rings", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: "Women's Sizing Ring Squares", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: "Children's Sizing Rings", category: 'General Supplies', unitPriceCents: 300, maxQuantity: 4, isActive: true },
      { name: 'Large Rubberbands', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 5, isActive: true },
      { name: 'ECOMM Dymo Labels', category: 'General Supplies', unitPriceCents: 450, maxQuantity: 1, isActive: true },
      { name: 'ECOMM Jewelry Bags (bundle)', category: 'General Supplies', unitPriceCents: 300, maxQuantity: 3, isActive: true },
      { name: 'ECOMM Seals (bag of 100)', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 2, isActive: true },
      { name: 'ECOMM Tags (box of 1000)', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 2, isActive: true },
      { name: 'ECOMM Zip Ties (bag of 1000)', category: 'General Supplies', unitPriceCents: 600, maxQuantity: 2, isActive: true },
      { name: 'Clear 8" Zipties', category: 'General Supplies', unitPriceCents: 350, maxQuantity: 1, isActive: true },
      { name: '9 Volt Batteries', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'AA Batteries', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'AAA Batteries', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'C Batteries', category: 'General Supplies', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Shirt Hanger Grips', category: 'General Supplies', unitPriceCents: 200, maxQuantity: 2, isActive: true },
      { name: 'Window Squeegee', category: 'General Supplies', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Sterilization Tags (250)', category: 'General Supplies', unitPriceCents: 400, maxQuantity: 4, isActive: true },
      
      // Labels, Tape, & Office Supplies
      { name: 'Sterifab Dispenser', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Safety Labels (sheet of 15)', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 1, isActive: true },
      { name: 'Scotch Tape', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'Yellow Tape', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 500, maxQuantity: 4, isActive: true },
      { name: 'Dry Erase Black', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Dry Erase Green', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Dry Erase Red', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Ballpoint Pens', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 500, maxQuantity: 12, isActive: true },
      { name: 'Highlighters (pack of 6 colors)', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Silver Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 12, isActive: true },
      { name: 'Red Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 12, isActive: true },
      { name: 'Black Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 12, isActive: true },
      { name: 'Counterfeit Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1000, maxQuantity: 12, isActive: true },
      { name: 'Magnum Markers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Star Post-Its', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 400, maxQuantity: 2, isActive: true },
      { name: 'White Out', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 350, maxQuantity: 1, isActive: true },
      { name: 'Scissors', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Wire Cutters', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Staplers', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Staples', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'Safety Box Cutter', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 600, maxQuantity: 6, isActive: true },
      { name: 'Vacuum Belts', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 800, maxQuantity: 2, isActive: true },
      { name: 'Truck Seals', category: 'Labels, Tape, & Office Supplies', unitPriceCents: 500, maxQuantity: 45, isActive: true },
      
      // Gloves & PPE
      { name: 'Gloves Heavy Duty – M (one pair)', category: 'Gloves & PPE', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – L (one pair)', category: 'Gloves & PPE', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – XL (one pair)', category: 'Gloves & PPE', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – S (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – M (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – L (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – XL (pack of 12)', category: 'Gloves & PPE', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Disposable Masks', category: 'Gloves & PPE', unitPriceCents: 300, maxQuantity: 2, isActive: true },
      { name: 'Goggles', category: 'Gloves & PPE', unitPriceCents: 800, maxQuantity: 2, isActive: true },
      
      // Stickers & Tags
      { name: 'White Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'White Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Red Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Red Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Yellow Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Yellow Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Green Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Green Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Blue Tags (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Blue Stickers (case)', category: 'Stickers & Tags', unitPriceCents: 1200, maxQuantity: 3, isActive: true },
      { name: 'Orange Stickers (roll)', category: 'Stickers & Tags', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      
      // Bags & Paper
      { name: 'Reusable Bags – Large Design', category: 'Bags & Paper', unitPriceCents: 200, maxQuantity: 4, isActive: true },
      { name: 'Reusable Bags – Small Blue', category: 'Bags & Paper', unitPriceCents: 150, maxQuantity: 2, isActive: true },
      { name: 'Thermal Paper', category: 'Bags & Paper', unitPriceCents: 400, maxQuantity: 1, isActive: true },
      { name: 'Rubberbands', category: 'Bags & Paper', unitPriceCents: 500, maxQuantity: 4, isActive: true },
      
      // Nitrile Gloves (merged into Gloves & PPE)
      { name: 'Nitrile Gloves – S (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – M (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – L (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – XL (case of 1000)', category: 'Gloves & PPE', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      
      // Hangers
      { name: "Children's Hangers", category: 'Hangers', unitPriceCents: 200, maxQuantity: 6, isActive: true },
      { name: 'Shirt Hangers', category: 'Hangers', unitPriceCents: 250, maxQuantity: 10, isActive: true },
      { name: 'Pant Hangers', category: 'Hangers', unitPriceCents: 300, maxQuantity: 10, isActive: true },
      
      // Store Apparel
      { name: 'Aprons', category: 'Store Apparel', unitPriceCents: 800, maxQuantity: 10, isActive: true },
      { name: 'Baseball Caps', category: 'Store Apparel', unitPriceCents: 600, maxQuantity: 10, isActive: true },
      { name: 'Beanies', category: 'Store Apparel', unitPriceCents: 500, maxQuantity: 10, isActive: true },
      
      // Miscellaneous
      { name: 'Sterifab', category: 'Miscellaneous', unitPriceCents: 1200, maxQuantity: 6, isActive: true },
      { name: 'Sortkwik Fingertip Moistener', category: 'Miscellaneous', unitPriceCents: 400, maxQuantity: 2, isActive: true },
      { name: 'Sizing and Colorization Charts', category: 'Miscellaneous', unitPriceCents: 300, maxQuantity: 10, isActive: true },
    ],
  })

  console.log(`Created ${products.count} products`)

  // Seed Uniform Products
  const uniformSizes = JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'])
  const poloColors = JSON.stringify(['Navy Blue', 'Royal Blue', 'White'])
  const dressShirtColors = JSON.stringify(['Red', 'Black', 'White', 'Light Blue', 'Navy Blue', 'Royal Blue', 'Burgundy', 'Light Stone', 'Dark Green'])
  const fleeceColors = JSON.stringify(['Navy'])

  // Short-Sleeve GW Polo Shirt - Unisex
  const shortPoloSizes = JSON.stringify({ XS: 1600, S: 1600, M: 1600, L: 1600, XL: 1600, XXL: 1800, '3XL': 2000, '4XL': 2200 })
  await prisma.product.create({
    data: {
      name: 'Short-Sleeve GW Polo Shirt',
      category: 'Staff Uniforms',
      unitPriceCents: 1600,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: poloColors,
      style: 'Unisex',
      sizePriceMap: shortPoloSizes,
    },
  })

  // Long-Sleeve GW Polo Shirt - Unisex
  const longPoloSizes = JSON.stringify({ XS: 2100, S: 2100, M: 2100, L: 2100, XL: 2100, XXL: 2300, '3XL': 2500, '4XL': 2700 })
  await prisma.product.create({
    data: {
      name: 'Long-Sleeve GW Polo Shirt',
      category: 'Staff Uniforms',
      unitPriceCents: 2100,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: poloColors,
      style: 'Unisex',
      sizePriceMap: longPoloSizes,
    },
  })

  // Short-Sleeve GW Dress Shirt - Unisex
  const shortDressSizes = JSON.stringify({ XS: 2100, S: 2100, M: 2100, L: 2100, XL: 2100, XXL: 2300, '3XL': 2500, '4XL': 2700 })
  await prisma.product.create({
    data: {
      name: 'Short-Sleeve GW Dress Shirt',
      category: 'Staff Uniforms',
      unitPriceCents: 2100,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: dressShirtColors,
      style: 'Unisex',
      sizePriceMap: shortDressSizes,
    },
  })

  // Long-Sleeve GW Dress Shirt - Unisex
  const longDressSizes = JSON.stringify({ XS: 2200, S: 2200, M: 2200, L: 2200, XL: 2200, XXL: 2400, '3XL': 2600, '4XL': 2800 })
  await prisma.product.create({
    data: {
      name: 'Long-Sleeve GW Dress Shirt',
      category: 'Staff Uniforms',
      unitPriceCents: 2200,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: uniformSizes,
      availableColors: dressShirtColors,
      style: 'Unisex',
      sizePriceMap: longDressSizes,
    },
  })

  // GW Fleece Zip Up - Unisex
  const fleeceSizes = JSON.stringify(['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'])
  const fleeceSizePrices = JSON.stringify({ S: 2500, M: 2500, L: 2500, XL: 2500, XXL: 2700, '3XL': 3000, '4XL': 3300 })
  await prisma.product.create({
    data: {
      name: 'GW Fleece Zip Up',
      category: 'Staff Uniforms',
      unitPriceCents: 2500,
      maxQuantity: 10,
      isActive: true,
      isUniform: true,
      availableSizes: fleeceSizes,
      availableColors: fleeceColors,
      style: 'Unisex',
      sizePriceMap: fleeceSizePrices,
    },
  })

  console.log('Created uniform products')

  // Seed ADC Supply Products
  await prisma.product.createMany({
    data: [
      // General Supplies
      { name: 'Rubberbands (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 4, isActive: true },
      { name: 'Magnum Markers (ADC S)', category: 'ADC Supply', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Gloves Heavy Duty – M (one pair) (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – L (one pair) (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Gloves Heavy Duty – XL (one pair) (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 1, isActive: true },
      { name: 'Nitrile Gloves – S (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves – M (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves – L (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nitrile Gloves – XL (box of 100) (ADC S)', category: 'ADC Supply', unitPriceCents: 1500, maxQuantity: 2, isActive: true },
      { name: 'Nylon Gloves – S (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – M (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – L (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Nylon Gloves – XL (pack of 12) (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 1, isActive: true },
      { name: 'Disposable Masks (ADC S)', category: 'ADC Supply', unitPriceCents: 300, maxQuantity: 1, isActive: true },
      { name: 'Case of Water (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 5, isActive: true },
      // Store Apparel
      { name: 'Aprons (ADC S)', category: 'ADC Supply', unitPriceCents: 800, maxQuantity: 5, isActive: true },
      { name: 'Baseball Caps (ADC S)', category: 'ADC Supply', unitPriceCents: 600, maxQuantity: 5, isActive: true },
      { name: 'Beanies (ADC S)', category: 'ADC Supply', unitPriceCents: 500, maxQuantity: 5, isActive: true },
    ],
  })

  console.log('Created ADC Supply products')

  // Seed ADC Maintenance Products
  await prisma.product.createMany({
    data: [
      { name: 'Toilet Paper (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Toilet Paper Dispensers (single) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Toilet Brush (ADC M)', category: 'ADC Maintenance', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Urinal Block with Screen (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Paper Towels (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Paper Towel Dispensers (single) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Antibacterial Hand Foam Soap (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Soap Dispensers (single) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Disinfectant Foam Cleaner (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Lysol Disinfectant Spray (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 4500, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags – Large (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags – Small (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Bleach (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Quat 64 Concentrate Disinfectant (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 5000, maxQuantity: 1, isActive: true },
      { name: 'Masking Tape (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Sanitary Napkin Bags (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'OneShot Floor Cleaner (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Backbraces (each) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 2500, maxQuantity: 2, isActive: true },
      { name: 'Dustpan & Brush (normal length broom) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer Foaming Ref. (case) (ADC M)', category: 'ADC Maintenance', unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer – single pump bottle (ADC M)', category: 'ADC Maintenance', unitPriceCents: 800, maxQuantity: 1, isActive: true },
    ],
  })

  console.log('Created ADC Maintenance products')

  // Seed Housatonic Maintenance Products (50 items)
  await prisma.product.createMany({
    data: [
      { name: 'Toilet Paper (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2000, maxQuantity: 5, isActive: true },
      { name: 'Toilet Paper Dispensers (single) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Toilet Brush (HM)', category: 'Housatonic Maintenance', unitPriceCents: 800, maxQuantity: 1, isActive: true },
      { name: 'Urinal Block with Screen (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Paper Towels (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3000, maxQuantity: 4, isActive: true },
      { name: 'Paper Towel Dispensers (single) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Antibacterial Hand Foam Soap (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Soap Dispensers (single) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Disinfectant Foam Cleaner (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 4000, maxQuantity: 2, isActive: true },
      { name: 'Dust Mop Treatment (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Lysol Disinfectant Spray (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 4500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Cherry (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Citrus (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Refills - Clean Linen (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Time Mist Dispensers (single) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Goo Off (can) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1200, maxQuantity: 1, isActive: true },
      { name: 'Spray Bottle & Trigger (single) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 800, maxQuantity: 4, isActive: true },
      { name: 'Glass Cleaner (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Pine Kleen (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3000, maxQuantity: 1, isActive: true },
      { name: 'Clear Trash Bags – Large (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2500, maxQuantity: 2, isActive: true },
      { name: 'Clear Trash Bags – Small (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2000, maxQuantity: 2, isActive: true },
      { name: 'Bleach (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Quat 64 Concentrate Disinfectant (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 5000, maxQuantity: 1, isActive: true },
      { name: 'Twine (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Masking Tape (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1200, maxQuantity: 2, isActive: true },
      { name: 'Sanitary Napkin Bags (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1800, maxQuantity: 1, isActive: true },
      { name: 'Cotton Mop Heads 32oz (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Dust Mop Head (dry) 36" (each) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1500, maxQuantity: 12, isActive: true },
      { name: 'OneShot Floor Cleaner (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3500, maxQuantity: 1, isActive: true },
      { name: 'Backbraces (each) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2500, maxQuantity: 6, isActive: true },
      { name: 'Push Broom 24" - refill (single) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1200, maxQuantity: 0, isActive: true },
      { name: 'Floor Mop (complete) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2500, maxQuantity: 1, isActive: true },
      { name: 'Heavy Duty Street Broom (complete) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3500, maxQuantity: 2, isActive: true },
      { name: 'Long Handle Scraper (each) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2000, maxQuantity: 3, isActive: true },
      { name: 'Dust Mop (complete set) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 3000, maxQuantity: 3, isActive: true },
      { name: 'Dustpan & Brush (normal length broom) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1500, maxQuantity: 4, isActive: true },
      { name: 'Mop Bucket (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2000, maxQuantity: 2, isActive: true },
      { name: 'Plastic Cups (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1500, maxQuantity: 1, isActive: true },
      { name: 'Paper Plates (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 2000, maxQuantity: 1, isActive: true },
      { name: 'Spoons - plastic (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Forks - plastic (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Knives - plastic (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1000, maxQuantity: 1, isActive: true },
      { name: 'Blades for Long Handle Scraper (pack) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 1500, maxQuantity: 4, isActive: true },
      { name: 'Hand Sanitizer Foam Ref. (case) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 4000, maxQuantity: 1, isActive: true },
      { name: 'Hand Sanitizer – single pump bottle (HM)', category: 'Housatonic Maintenance', unitPriceCents: 800, maxQuantity: 4, isActive: true },
      { name: 'Newsprint (bundle) (HM)', category: 'Housatonic Maintenance', unitPriceCents: 500, maxQuantity: 6, isActive: true },
    ],
  })

  console.log('Created Housatonic Maintenance products')
  console.log('Seeding completed!')
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
