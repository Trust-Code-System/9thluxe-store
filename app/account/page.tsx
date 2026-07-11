import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Package,
  Heart,
  MapPin,
  ArrowRight,
  Crown,
  Share2,
} from "lucide-react";

import Link from "next/link";

import { requireUser } from "@/lib/session";

import { prisma } from "@/lib/prisma";

import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  // Get authenticated user

  const user = await requireUser();

  // Fetch user's actual data from database

  const userData = await prisma.user.findUnique({
    where: { id: user.id },

    select: {
      name: true,

      email: true,

      createdAt: true,

      loyaltyTier: true,

      totalLifetimeSpend: true,

      referralCode: true,
    },
  });

  // Format member since date

  const memberSince = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-US", {
        month: "long",

        year: "numeric",
      })
    : "Recently";

  // Get actual stats from database

  const [orderCount, wishlistCount, addressCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),

    prisma.wishlist.count({ where: { userId: user.id } }),

    prisma.address.count({ where: { userId: user.id } }),
  ]);

  const stats = [
    {
      label: "Orders",
      value: orderCount.toString(),
      icon: Package,
      href: "/account/orders",
    },

    {
      label: "Wishlist",
      value: wishlistCount.toString(),
      icon: Heart,
      href: "/account/wishlist",
    },

    {
      label: "Addresses",
      value: addressCount.toString(),
      icon: MapPin,
      href: "/account/addresses",
    },
  ];

  const displayName = userData?.name || user.name || "User";

  const displayEmail = userData?.email || user.email;

  const tier = userData?.loyaltyTier || "STANDARD";

  const spend = userData?.totalLifetimeSpend || 0;

  const tierConfig: Record<
    string,
    { label: string; color: string; next: string; nextThreshold: number }
  > = {
    STANDARD: {
      label: "Standard",
      color: "bg-muted text-muted-foreground",
      next: "Obsidian",
      nextThreshold: 200_000,
    },

    OBSIDIAN: {
      label: "Obsidian",
      color: "bg-espresso text-[color:var(--primary-foreground)]",
      next: "Gold",
      nextThreshold: 1_000_000,
    },

    GOLD: {
      label: "Gold",
      color: "bg-warning text-warning-foreground",
      next: "Platinum",
      nextThreshold: 5_000_000,
    },

    PLATINUM: {
      label: "Platinum",
      color: "bg-gradient-to-r from-bronze to-walnut text-white",
      next: "",
      nextThreshold: 0,
    },
  };

  const tc = tierConfig[tier] || tierConfig.STANDARD;

  const toNextTier =
    tc.nextThreshold > 0 ? Math.max(0, tc.nextThreshold - spend) : 0;

  const tierProgress =
    tc.nextThreshold > 0
      ? Math.min(100, (spend / tc.nextThreshold) * 100)
      : 100;

  // Fetch recent orders

  const recentOrders = await prisma.order.findMany({
    where: { userId: user.id },

    take: 3,

    orderBy: { createdAt: "desc" },

    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome Card */}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/12 flex items-center justify-center">
              <span className="text-2xl font-serif font-semibold text-accent">
                {displayName

                  .split(" ")

                  .map((n) => n[0])

                  .join("")

                  .toUpperCase()

                  .slice(0, 2)}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Welcome back, {displayName.split(" ")[0]}!
              </h2>

              <p className="text-sm text-muted-foreground">{displayEmail}</p>

              <p className="text-xs text-muted-foreground mt-1">
                Member since {memberSince}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Tier */}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-accent" />

              <div>
                <p className="text-sm font-medium">Loyalty Status</p>

                <p className="text-xs text-muted-foreground">
                  Lifetime spend: {formatPrice(spend)}
                </p>
              </div>
            </div>

            <Badge className={tc.color}>{tc.label}</Badge>
          </div>

          {tc.nextThreshold > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {formatPrice(toNextTier)} to {tc.next}
                </span>

                <span>{Math.round(tierProgress)}%</span>
              </div>

              <progress
                className="w-full h-1.5 rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-primary"
                value={tierProgress}
                max={100}
              />
            </div>
          )}

          {userData?.referralCode && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border p-3 bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">
                  Your referral code
                </p>

                <p className="font-mono font-semibold tracking-widest text-sm mt-0.5">
                  {userData.referralCode}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Share2 className="h-3.5 w-3.5" />

                <span>Give ₦5k, Get ₦5k</span>
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Standard</p>

              <p>₦0+</p>
            </div>

            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Obsidian</p>

              <p>₦200k+</p>
            </div>

            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Gold</p>

              <p>₦1M+</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <Link href={stat.href}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>

                    <p className="text-3xl font-semibold mt-1">{stat.value}</p>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-accent/12 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-accent" />
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

          {orderCount > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {orderCount > 0 ? (
            <div className="space-y-4">
              {/* Show up to 3 most recent orders */}

              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Order {order.id.slice(0, 8)}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",

                          day: "numeric",

                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        ₦{order.totalNGN.toLocaleString()}
                      </p>

                      <p className="text-xs text-muted-foreground capitalize">
                        {order.status.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />

              <p>No orders yet</p>

              <Button asChild variant="outline" className="mt-4 bg-transparent">
                <Link href="/">Start Shopping</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
