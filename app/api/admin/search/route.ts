import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthorizedUser } from "@/lib/authz"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const authz = await getAuthorizedUser("dashboard:view")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q")?.trim() || ""

    if (q.length < 2) {
      return NextResponse.json({ products: [], orders: [], customers: [] })
    }

    // Search products
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { brand: { contains: q } },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        priceNGN: true,
        images: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    })

    // Search orders
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { reference: { contains: q } },
          { user: { email: { contains: q } } },
          { user: { name: { contains: q } } },
        ],
      },
      select: {
        id: true,
        reference: true,
        status: true,
        totalNGN: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    })

    // Search customers (users)
    const customers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      products,
      orders: orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      })),
      customers: customers.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Admin search error:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}

