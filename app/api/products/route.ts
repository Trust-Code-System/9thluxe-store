import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort')
    const brand = searchParams.get('brand')
    const pageSize = 12

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {
      deletedAt: null, // Exclude soft-deleted products
    }
    if (category) {
      where.category = category
    }
    if (brand) {
      where.brand = { contains: brand }
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'price-low':
        orderBy = { priceNGN: 'asc' }
        break
      case 'price-high':
        orderBy = { priceNGN: 'desc' }
        break
      case 'rating':
        orderBy = { ratingAvg: 'desc' }
        break
      case 'name':
        orderBy = { name: 'asc' }
        break
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceNGN: true,
        images: true,
        brand: true,
        stock: true,
        ratingAvg: true,
        ratingCount: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        productType: true,
        notesTop: true,
        notesHeart: true,
        notesBase: true,
        longevity: true,
        occasion: true,
        fragranceFamily: true,
        concentration: true,
        sillage: true,
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}



