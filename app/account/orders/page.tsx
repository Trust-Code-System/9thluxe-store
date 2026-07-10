import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"
import { getOrdersByUserId } from "@/lib/queries/orders"
import { formatPrice, formatDate } from "@/lib/format"
import { getStatusColor } from "@/lib/mappers"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { mapProductToUI } from "@/lib/mappers"

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const orders = await getOrdersByUserId(session.user.id)

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-4">When you make a purchase, your orders will appear here.</p>
          <Button asChild>
            <Link href="/">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Order History</h2>
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{order.id}</span>
                  <Badge className={getStatusColor(order.status)}>{order.status.toLowerCase()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(order.totalNGN)}</p>
                <p className="text-sm text-muted-foreground">{order.items.length} item(s)</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {order.items.map((item) => {
                const product = mapProductToUI(item.product)
                const images = Array.isArray(item.product.images) 
                  ? item.product.images as string[]
                  : typeof item.product.images === 'string'
                  ? [item.product.images]
                  : []
                return (
                  <div key={item.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={images[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="bg-transparent">
                View Details
              </Button>
              {order.status === "DELIVERED" && (
                <Button variant="outline" size="sm" className="bg-transparent">
                  Leave Review
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
