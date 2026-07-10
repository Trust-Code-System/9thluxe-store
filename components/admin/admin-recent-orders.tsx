import { Badge } from "@/components/ui/badge"
import { formatPrice, formatShortDate } from "@/lib/format"
import { getStatusColor } from "@/lib/mappers"
import { Order } from "@prisma/client"

interface AdminRecentOrdersProps {
  orders: Array<Order & {
    user: {
      name: string | null
    }
  }>
}

export function AdminRecentOrders({ orders }: AdminRecentOrdersProps) {
  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between py-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{order.id}</span>
                <Badge className={getStatusColor(order.status)} variant="secondary">
                  {order.status.toLowerCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{order.user.name || "Unknown"}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">{formatPrice(order.totalNGN)}</p>
              <p className="text-xs text-muted-foreground">{formatShortDate(order.createdAt)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}





