import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import Link from "next/link"
import { ProductGrid } from "@/components/ui/product-grid"
import { requireUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"

function getProductImage(images: unknown): string {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === "string") return images[0]
  return "/placeholder-flacon.svg"
}

export const dynamic = "force-dynamic"

export default async function WishlistPage() {
  const user = await requireUser()

  const wishlistRows = await prisma.wishlist.findMany({
    where: { userId: user.id },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          brand: true,
          priceNGN: true,
          oldPriceNGN: true,
          images: true,
          ratingAvg: true,
          ratingCount: true,
          isNew: true,
          isBestseller: true,
          isLimited: true,
          deletedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const products = wishlistRows
    .map((w) => w.product)
    .filter((p): p is NonNullable<typeof p> => p != null && !p.deletedAt)
    .map((p) => ({
      id: p!.id,
      slug: p!.slug,
      name: p!.name,
      brand: p!.brand ?? "",
      price: p!.priceNGN,
      originalPrice: p!.oldPriceNGN ?? undefined,
      image: getProductImage(p!.images),
      rating: p!.ratingAvg ?? 0,
      reviewCount: p!.ratingCount ?? 0,
      tags: [
        p!.isNew && "new",
        p!.isBestseller && "bestseller",
        p!.isLimited && "limited",
      ].filter(Boolean) as ("new" | "bestseller" | "limited")[],
      category: "perfumes" as const,
    }))

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-4">Save items you love to your wishlist for later.</p>
          <Button asChild>
            <Link href="/category/perfumes">Explore Perfumes</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Wishlist</h2>
        <p className="text-sm text-muted-foreground">{products.length} item(s)</p>
      </div>
      <ProductGrid products={products} columns={3} />
    </div>
  )
}
