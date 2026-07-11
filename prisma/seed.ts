// prisma/seed.ts
// DEVELOPMENT FIXTURES ONLY: these are not real production products or prices. They exist so the
// app and tests run against a populated perfume catalogue. Do not treat as business data.
import { PrismaClient, ProductCategory, PublishStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = [
    {
      name: 'Nocturne Eau de Parfum 100ml',
      slug: 'nocturne-eau-de-parfum',
      description: 'Amber, oud and vanilla. Long lasting.',
      images: ['/nocturne-eau-de-parfum.jpg'],
      priceNGN: 95000,
      category: ProductCategory.PERFUMES,
      brand: 'Fádé',
      concentration: 'EDP',
      fragranceFamily: 'ORIENTAL',
      notesTop: 'bergamot',
      notesHeart: 'oud',
      notesBase: 'amber, vanilla',
      publishStatus: PublishStatus.PUBLISHED,
      stock: 50,
    },
    {
      name: 'Aurelius Noir Eau de Toilette 75ml',
      slug: 'aurelius-noir-eau-de-toilette',
      description: 'Fresh citrus top notes with woody base. Elegant and versatile.',
      images: ['/aurelius-noir-eau-de-toilette.jpg'],
      priceNGN: 75000,
      category: ProductCategory.PERFUMES,
      brand: 'Aurelius',
      concentration: 'EDT',
      fragranceFamily: 'WOODY',
      notesTop: 'lemon, bergamot',
      notesHeart: 'cedar',
      notesBase: 'vetiver',
      publishStatus: PublishStatus.PUBLISHED,
      stock: 30,
    },
    {
      name: 'Vesper Velvet Eau de Parfum 50ml',
      slug: 'vesper-velvet-eau-de-parfum',
      description: 'Rose and patchouli. Bold and memorable.',
      images: ['/vesper-velvet-eau-de-parfum.jpg'],
      priceNGN: 85000,
      category: ProductCategory.PERFUMES,
      brand: 'Vesper',
      concentration: 'EDP',
      fragranceFamily: 'FLORAL',
      notesTop: 'pink pepper',
      notesHeart: 'rose',
      notesBase: 'patchouli',
      publishStatus: PublishStatus.PUBLISHED,
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
