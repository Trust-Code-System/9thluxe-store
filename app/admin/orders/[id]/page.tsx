import { notFound, redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminOrderById,
  updateOrderStatus,
} from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusOptions: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

const statusClasses: Record<OrderStatus, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PAID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SHIPPED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  DELIVERED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  async function updateStatusAction(formData: FormData) {
    "use server";

    const { id: orderId } = await params;
    const status = formData.get("status") as OrderStatus;
    await updateOrderStatus(orderId, status);

    redirect(`/admin/orders/${orderId}`);
  }

  const itemsTotal = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Order {order.reference || order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Placed on{" "}
            {order.createdAt.toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <form action={updateStatusAction} className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select name="status" defaultValue={order.status}>
            <SelectTrigger
              className="h-9 w-[180px] text-xs"
              aria-label="Order status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm">
            Update
          </Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Items ({itemsTotal})</CardTitle>
            <Badge className={statusClasses[order.status]}>
              {order.status.toLowerCase()}
            </Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-32 text-right">Unit price</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {item.product?.name ?? "Deleted product"}
                        </span>
                        {item.product && (
                          <span className="text-xs text-muted-foreground">
                            {item.product.slug} ·{" "}
                            {formatPrice(item.product.priceNGN)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPrice(item.priceNGN)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPrice(item.priceNGN * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary & shipping */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span
                  className={`font-medium ${order.paymentMethod === "BANK_TRANSFER" ? "text-amber-600 dark:text-amber-400" : ""}`}
                >
                  {order.paymentMethod === "BANK_TRANSFER"
                    ? "Bank Transfer"
                    : "Card / Paystack"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotalNGN)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatPrice(order.discountNGN)}</span>
              </div>
              <div className="flex items-center justify-between font-medium pt-1 border-t border-border mt-2">
                <span>Total</span>
                <span>{formatPrice(order.totalNGN)}</span>
              </div>
              {order.coupon && (
                <div className="pt-2 text-xs text-muted-foreground">
                  Coupon applied:{" "}
                  <span className="font-mono">{order.coupon.code}</span>
                </div>
              )}
              {order.paymentMethod === "BANK_TRANSFER" &&
                order.status === "PENDING" && (
                  <form
                    action={updateStatusAction}
                    className="pt-3 border-t border-border mt-2"
                  >
                    <input type="hidden" name="status" value="PAID" />
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-success text-success-foreground hover:bg-success/90"
                    >
                      ✓ Mark as Paid (Bank Transfer Received)
                    </Button>
                  </form>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{order.addressLine1}</p>
              <p>
                {order.city}, {order.state}
              </p>
              <p className="text-muted-foreground">{order.phone}</p>
              {order.user && (
                <p className="text-muted-foreground pt-2 text-xs">
                  {order.user.name || "Customer"} · {order.user.email}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
