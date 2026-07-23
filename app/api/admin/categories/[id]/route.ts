import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthorizedUser } from "@/lib/authz"
import { ProductCategory } from "@prisma/client"

export const runtime = "nodejs"

// PATCH - Update category
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await getAuthorizedUser("products:manage")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
    const { id } = await params

    const { name, slug, description, enumKey } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        enumKey: enumKey ? (enumKey as ProductCategory) : null,
      },
    })

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("Update category error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 400 })
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await getAuthorizedUser("products:manage")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    if (category.enumKey) {
      const count = await prisma.product.count({
        where: { category: category.enumKey },
      })

      if (count > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete category with ${count} product${count === 1 ? "" : "s"}.`,
          },
          { status: 400 }
        )
      }
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}

