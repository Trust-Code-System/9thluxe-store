import Image from "next/image";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Package } from "lucide-react";

import { requireUser } from "@/lib/session";

import { prisma } from "@/lib/prisma";

import { formatPrice } from "@/lib/format";

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning",
  PAID: "bg-info/15 text-info",
  SHIPPED: "bg-accent/15 text-accent",
  DELIVERED: "bg-success/15 text-success",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  // Require authentication - will redirect if not signed in

  const user = await requireUser();
  const params = await searchParams;
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const pageSize = 10;

  // Fetch orders from database for the current user

  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      skip: (page - 1) * pageSize,
      take: pageSize,

    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true },
          },
        },
      },
    },

      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where: { userId: user.id } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));

  // Helper to get first product image
  const getProductImage = (product: any): string => {
    try {
      const images =
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images;
      return Array.isArray(images) && images.length > 0
        ? images[0]
        : "/placeholder.png";
    } catch {
      return "/placeholder.png";
    }
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />

          <h2 className="text-lg font-semibold mb-2">No orders yet</h2>

          <p className="text-muted-foreground mb-4">
            When you make a purchase, your orders will appear here.
          </p>

          <Button asChild>
            <Link href="/">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
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

                  <Badge
                    className={
                      statusColors[order.status] ||
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-NG", {
                    year: "numeric",

                    month: "long",

                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">{formatPrice(order.totalNGN)}</p>

                <p className="text-sm text-muted-foreground">
                  {order.items.length} item(s)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {order.items.map(
                (item: {
                  id: string;
                  product: { id: string; name: string; images: unknown };
                }) => (
                  <div
                    key={item.id}
                    className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted"
                  >
                    <Image
                      src={getProductImage(item.product)}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ),
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                asChild
              >
                <Link href={`/account/orders/${order.id}`}>View Details</Link>
              </Button>

              {order.status === "DELIVERED" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  asChild
                >
                  <Link href={`/account/orders/${order.id}/review`}>
                    Leave Review
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {Math.min(page, totalPages)} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/account/orders?page=${page - 1}`}>Previous</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/account/orders?page=${page + 1}`}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
