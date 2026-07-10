import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Heart, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getUserById, getUserStats } from "@/lib/queries/users"
import { getOrdersByUserId } from "@/lib/queries/orders"
import { formatDate } from "@/lib/format"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AccountOverviewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const [user, stats, recentOrders] = await Promise.all([
    getUserById(session.user.id),
    getUserStats(session.user.id),
    getOrdersByUserId(session.user.id),
  ])

  if (!user) redirect("/auth/signin")

  const memberSince = formatDate(user.createdAt)

  const statsData = [
    { label: "Orders", value: stats.orders.toString(), icon: Package, href: "/account/orders" },
    { label: "Wishlist", value: stats.wishlists.toString(), icon: Heart, href: "/account/wishlist" },
    { label: "Addresses", value: stats.addresses.toString(), icon: MapPin, href: "/account/addresses" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-serif font-semibold text-primary">
                {(user.name || user.email)
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome back, {user.name?.split(" ")[0] || "User"}!</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsData.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <Link href={stat.href}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-semibold mt-1">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/account/orders">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders yet</p>
              <Button asChild variant="outline" className="mt-4 bg-transparent">
                <Link href="/">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(order.totalNGN)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
