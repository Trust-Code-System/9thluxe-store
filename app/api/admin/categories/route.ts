import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { ProductCategory } from "@prisma/client"

export const runtime = "nodejs"

// GET - List all categories
export async function GET() {
  try {
    await requireAdmin()

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    })

    const counts = await prisma.product.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { _all: true },
    })
    const countByCategory = new Map(
      counts.map((row) => [row.category, row._count._all]),
    )
    const results = categories.map((category) => ({
      ...category,
      productCount: category.enumKey
        ? (countByCategory.get(category.enumKey) ?? 0)
        : 0,
    }))

    return NextResponse.json({ categories: results })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

// POST - Create category
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { name, slug, description, enumKey } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        enumKey: enumKey ? (enumKey as ProductCategory) : null,
      },
    })

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("Create category error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
