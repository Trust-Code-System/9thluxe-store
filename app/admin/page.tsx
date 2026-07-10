import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Tag, Mail, TrendingUp, TrendingDown } from "lucide-react"
import { AdminRecentOrders } from "@/components/admin/admin-recent-orders"
import { AdminTopProducts } from "@/components/admin/admin-top-products"
import { getRecentOrders, getTopProducts } from "@/lib/queries/orders"
import { requireAdmin } from "@/lib/admin"
import { formatPrice } from "@/lib/format"

export default async function AdminDashboardPage() {
  await requireAdmin()

  const [recentOrders, topProducts] = await Promise.all([
    getRecentOrders(5),
    getTopProducts(5),
  ])

  // Calculate stats from orders
  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(0), // TODO: Calculate from orders
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: recentOrders.length.toString(),
      change: "+8.2%",
      trend: "up" as const,
      icon: ShoppingCart,
    },
    {
      title: "Active Coupons",
      value: "12",
      change: "-2",
      trend: "down" as const,
      icon: Tag,
    },
    {
      title: "Subscribers",
      value: "5,678",
      change: "+234",
      trend: "up" as const,
      icon: Mail,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening with your store.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminRecentOrders orders={recentOrders} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTopProducts products={topProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
