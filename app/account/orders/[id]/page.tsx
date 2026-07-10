import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, PackageCheck, Truck, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ReviewStatus } from "@/components/orders/review-status"
import { requireUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/format"

const STATUS_ORDER = ["PENDING", "PAID", "SHIPPED", "DELIVERED"] as const
type OrderStatus = (typeof STATUS_ORDER)[number]

const STATUS_META: Record<OrderStatus, { label: string; description: string; icon: React.ElementType }> = {
  PENDING:   { label: "Order Confirmed",  description: "We've received your order and are processing it.", icon: CheckCircle2 },
  PAID:      { label: "Being Prepared",   description: "Your fragrance is being carefully prepared with love.", icon: PackageCheck },
  SHIPPED:   { label: "On Its Way",       description: "Your order has been dispatched and is en route to you.", icon: Truck },
  DELIVERED: { label: "Delivered",        description: "Enjoy your fragrance!", icon: Star },
}

const statusColors: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PAID:      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SHIPPED:   "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

function getProductImage(images: unknown): string {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === "string") return images[0]
  return "/placeholder.svg"
}

import React from "react"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await requireUser()
  const { id } = await params

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, brand: true, images: true },
          },
        },
      },
    },
  })

  if (!order) notFound()

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status as OrderStatus)
  const items = order.items.map((oi) => ({
    product: {
      id: oi.product.id,
      name: oi.product.name,
      slug: oi.product.slug,
      brand: oi.product.brand,
      image: getProductImage(oi.product.images),
      price: oi.priceNGN,
    },
    quantity: oi.quantity,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/account/orders">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-semibold">Order Details</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {order.reference ? `Order ${order.reference}` : `Order ${order.id.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
        <Badge className={`ml-auto ${statusColors[order.status] || "bg-muted"}`}>{order.status}</Badge>
      </div>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" aria-hidden="true" />
            <ol className="relative flex justify-between">
              {STATUS_ORDER.map((status, index) => {
                const meta = STATUS_META[status]
                const Icon = meta.icon
                const isDone = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                return (
                  <li key={status} className="flex flex-col items-center gap-2 flex-1 first:items-start last:items-end">
                    <span
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`text-xs font-medium text-center hidden sm:block ${
                        isDone ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {meta.label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-6">
            {STATUS_META[order.status as OrderStatus]?.description}
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {order.status === "DELIVERED" && (
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-primary">Your order has arrived!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Share your unboxing on Instagram or TikTok with{" "}
                <span className="font-medium">#Fádé</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={order.items[index].id}>
                  <div className="flex gap-4">
                    <Link href={`/product/${item.product.slug}`} className="shrink-0">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product.slug}`}>
                        <h3 className="font-medium hover:text-primary transition-colors">{item.product.name}</h3>
                      </Link>
                      {item.product.brand && (
                        <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      <p className="font-semibold mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                  {index < items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-0.5 text-muted-foreground">
                <p>{order.addressLine1}</p>
                <p>
                  {order.city}, {order.state}
                </p>
                <p>{order.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Gift info */}
          {order.isGift && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-primary mb-1">This is a gift order</p>
                {order.giftMessage && (
                  <p className="text-sm text-muted-foreground italic">"{order.giftMessage}"</p>
                )}
                {order.giftWrapping && (
                  <p className="text-xs text-muted-foreground mt-2">Luxury gift wrapping included</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotalNGN)}</span>
              </div>
              {order.discountNGN > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountNGN)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shippingNGN === 0 ? "Free" : formatPrice(order.shippingNGN)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatPrice(order.totalNGN)}</span>
              </div>
              {order.reference && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Payment reference</p>
                    <p className="text-xs font-mono break-all">{order.reference}</p>
                  </div>
                </>
              )}
              {order.status === "DELIVERED" && <ReviewStatus orderId={order.id} items={items} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
