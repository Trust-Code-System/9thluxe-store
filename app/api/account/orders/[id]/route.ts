import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function getProductImage(images: unknown): string {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === "string") return images[0]
  return "/placeholder-flacon.svg"
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const { id } = await params
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                brand: true,
                images: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const items = order.items.map((oi) => ({
      product: {
        id: oi.product.id,
        name: oi.product.name,
        slug: oi.product.slug,
        brand: oi.product.brand,
        image: getProductImage(oi.product.images),
        price: oi.priceNGN,
      },
      quantity: oi.quantity,
    }))

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        totalNGN: order.totalNGN,
        createdAt: order.createdAt,
        items,
      },
    })
  } catch (e) {
    console.error("Order fetch error:", e)
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 })
  }
}
