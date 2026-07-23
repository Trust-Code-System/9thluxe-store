import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  countAdminOrders,
  getAdminOrders,
} from "@/lib/services/order-service";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface AdminOrdersPageProps {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

const statusOptions: { label: string; value: "all" | OrderStatus }[] = [
  { label: "All status", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refund pending", value: "REFUND_PENDING" },
  { label: "Refunded", value: "REFUNDED" },
];

const statusClasses: Record<OrderStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  PAID: "bg-info/15 text-info",
  SHIPPED: "bg-accent/15 text-accent",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-destructive/15 text-destructive",
  REFUND_PENDING: "bg-warning/15 text-warning",
  REFUNDED: "bg-muted text-muted-foreground",
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const q = params?.q?.toString() ?? "";
  const statusParam = params?.status?.toString() ?? "all";
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const pageSize = 25;

  const selectedStatus =
    statusOptions.find((option) => option.value === statusParam)?.value ??
    "all";

  const query = { search: q || undefined, status: selectedStatus };
  const [orders, total] = await Promise.all([
    getAdminOrders({ ...query, page, pageSize }),
    countAdminOrders(query),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (selectedStatus !== "all") search.set("status", selectedStatus);
    search.set("page", String(nextPage));
    return `/admin/orders?${search.toString()}`;
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="text-muted-foreground">
          View and manage customer orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All orders</CardTitle>
            <form
              className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
              method="get"
            >
              <div className="relative w-full sm:min-w-[300px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search by reference or email..."
                  className="h-10 pl-10 pr-3"
                  defaultValue={q}
                />
              </div>
              <Select name="status" defaultValue={String(selectedStatus)}>
                <SelectTrigger
                  className="h-10 w-full sm:w-44"
                  aria-label="Filter by status"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-10 px-4"
              >
                Filter
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No orders found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const itemsCount = order.items.reduce(
                      (total, item) => total + item.quantity,
                      0,
                    );
                    const statusClass = statusClasses[order.status];

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.reference || order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {order.user?.name || order.user?.email || "Guest"}
                            </span>
                            {order.user?.email && (
                              <span className="text-xs text-muted-foreground">
                                {order.user.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{itemsCount}</TableCell>
                        <TableCell>{formatPrice(order.totalNGN)}</TableCell>
                        <TableCell>
                          <Badge className={statusClass}>
                            {order.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {order.createdAt.toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                          >
                            <Link href={`/admin/orders/${order.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {Math.min(page, totalPages)} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(page - 1)}>Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(page + 1)}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
