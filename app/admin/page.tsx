import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, ShoppingCart, CheckCircle2 } from "lucide-react"

import { getAdminStats } from "@/lib/queries/stats"
import { getProductStats } from "@/lib/services/product-service"
import { getAdminOrders } from "@/lib/services/order-service"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [productStats, adminStats, recentOrders] = await Promise.all([
    getProductStats(),
    getAdminStats(),
    getAdminOrders().then((orders) => orders.slice(0, 5)),
  ])

  const stats = [
    {
      title: "Total Products",
      value: productStats.totalProducts.toString(),
      icon: Package,
    },
    {
      title: "Active Products",
      value: productStats.totalActive.toString(),
      icon: CheckCircle2,
    },
    {
      title: "Total Orders",
      value: adminStats.totalOrders.toString(),
      icon: ShoppingCart,
    },
    {
      title: "Revenue (paid)",
      value: new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(adminStats.totalRevenue),
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your Fádé storefront performance.</p>
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
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 text-left">Order</th>
                      <th className="py-2 px-4 text-left">Customer</th>
                      <th className="py-2 px-4 text-left">Total</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-4 font-medium">{order.reference || order.id.slice(0, 8)}</td>
                        <td className="py-2 px-4">
                          <div className="flex flex-col">
                            <span>{order.user?.name || order.user?.email || "Guest"}</span>
                            {order.user?.email && (
                              <span className="text-xs text-muted-foreground">{order.user.email}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                            maximumFractionDigits: 0,
                          }).format(order.totalNGN)}
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted capitalize">
                            {order.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right text-muted-foreground">
                          {order.createdAt.toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
