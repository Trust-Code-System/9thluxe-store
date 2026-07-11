import { Badge } from "@/components/ui/badge";

const orders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    amount: "₦15,500,000",
    status: "delivered",
    date: "2 hours ago",
  },

  {
    id: "ORD-002",
    customer: "Sarah Johnson",
    amount: "₦485,000",
    status: "processing",
    date: "4 hours ago",
  },

  {
    id: "ORD-003",
    customer: "Michael Adeyemi",
    amount: "₦8,950,000",
    status: "shipped",
    date: "6 hours ago",
  },

  {
    id: "ORD-004",
    customer: "Aisha Mohammed",
    amount: "₦195,000",
    status: "pending",
    date: "8 hours ago",
  },

  {
    id: "ORD-005",
    customer: "Chidi Okonkwo",
    amount: "₦680,000",
    status: "delivered",
    date: "12 hours ago",
  },
];

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning",

  processing: "bg-info/15 text-info",

  shipped: "bg-accent/15 text-accent",

  delivered: "bg-success/15 text-success",

  cancelled: "bg-destructive/15 text-destructive",
};

export function AdminRecentOrders() {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between py-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{order.id}</span>

              <Badge className={statusColors[order.status]} variant="secondary">
                {order.status}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground truncate">
              {order.customer}
            </p>
          </div>

          <div className="text-right">
            <p className="font-medium text-sm">{order.amount}</p>

            <p className="text-xs text-muted-foreground">{order.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
