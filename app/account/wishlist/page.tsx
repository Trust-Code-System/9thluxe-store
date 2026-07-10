import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import Link from "next/link"
import { ProductGrid } from "@/components/ui/product-grid"
import { getWishlistByUserId } from "@/lib/queries/wishlist"
import { mapProductToUI } from "@/lib/mappers"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const wishlistItems = await getWishlistByUserId(session.user.id)
  const products = wishlistItems.map(item => mapProductToUI(item.product))

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-4">Save items you love to your wishlist for later.</p>
          <Button asChild>
            <Link href="/">Explore Products</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Wishlist</h2>
        <p className="text-sm text-muted-foreground">{products.length} items</p>
      </div>
      <ProductGrid products={products} columns={3} />
    </div>
  )
}
