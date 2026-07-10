// prisma/seed.ts
import { PrismaClient, Category } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = [
    {
      name: 'Aurelius Black Chrono Watch',
      slug: 'aurelius-black-chrono-watch',
      description: 'Stainless steel chronograph, sapphire glass, 5ATM.',
      images: ['/placeholder.png'], // JSON array, safe for SQLite
      priceNGN: 175000,
      category: Category.WATCHES,
      brand: 'Aurelius',
      stock: 20,
    },
    {
      name: 'Nocturne Eau de Parfum 100ml',
      slug: 'nocturne-eau-de-parfum',
      description: 'Amber, oud and vanilla. Long lasting.',
      images: ['/placeholder.png'],
      priceNGN: 95000,
      category: Category.PERFUMES,
      brand: 'Fàdè',
      stock: 50,
    },
    {
      name: 'Vesper Classic Sunglasses',
      slug: 'vesper-classic-sunglasses',
      description: 'UV400 polarized lenses, unisex.',
      images: ['/placeholder.png'],
      priceNGN: 45000,
      category: Category.GLASSES,
      brand: 'Vesper',
      stock: 35,
    },
  ]

  await prisma.$transaction(
    products.map((p) =>
      prisma.product.upsert({
        where: { slug: p.slug },
        update: {},
        create: p,
      })
    )
  )

  console.log('✅ Seeded products.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
