import { prisma } from "@/lib/prisma"
import { OrderStatus, Prisma } from "@prisma/client"
import { writeAudit } from "@/lib/audit"
import { AppError } from "@/lib/http/errors"
import { canAdminTransitionOrder } from "@/lib/orders/state-machine"

export type AdminOrder = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    items: {
      include: {
        product: {
          select: {
            id: true
            name: true
            slug: true
            images: true
            priceNGN: true
          }
        }
      }
    }
    coupon: {
      select: {
        code: true
      }
    }
  }
}>

export async function getAdminOrders(params: {
  search?: string
  status?: OrderStatus | "all"
  page?: number
  pageSize?: number
} = {}): Promise<AdminOrder[]> {
  const { search, status } = params
  const page = Math.max(params.page ?? 1, 1)
  const pageSize = Math.min(Math.max(params.pageSize ?? 50, 1), 100)

  const where: Prisma.OrderWhereInput = {
    AND: [
      status && status !== "all" ? { status } : {},
      search
        ? {
            OR: [
              { reference: { contains: search } },
              { user: { email: { contains: search } } },
            ],
          }
        : {},
    ],
  }

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true, priceNGN: true },
          },
        },
      },
      coupon: {
        select: { code: true },
      },
    },
  })
}

export async function countAdminOrders(params: {
  search?: string
  status?: OrderStatus | "all"
} = {}) {
  const { search, status } = params
  return prisma.order.count({
    where: {
      AND: [
        status && status !== "all" ? { status } : {},
        search
          ? {
              OR: [
                { reference: { contains: search } },
                { user: { email: { contains: search } } },
              ],
            }
          : {},
      ],
    },
  })
}

export async function getAdminOrderById(id: string): Promise<AdminOrder | null> {
  if (!id) {
    return null
  }

  return prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true, priceNGN: true },
          },
        },
      },
      coupon: {
        select: { code: true },
      },
    },
  })
}

export async function updateOrderStatus(input: {
  orderId: string
  status: OrderStatus
  actorId: string
  reason: string
}) {
  const reason = input.reason.trim()
  if (reason.length < 3 || reason.length > 500) {
    throw new AppError("VALIDATION_ERROR", {
      message: "A reason between 3 and 500 characters is required.",
    })
  }

  const existing = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { status: true },
  })
  if (!existing) throw new AppError("NOT_FOUND")
  if (!canAdminTransitionOrder(existing.status, input.status)) {
    throw new AppError("VALIDATION_ERROR", {
      message: `Order cannot move from ${existing.status} to ${input.status}.`,
    })
  }

  const order = await prisma.$transaction(async (tx) => {
    const transitioned = await tx.order.updateMany({
      where: { id: input.orderId, status: existing.status },
      data: { status: input.status },
    })
    if (transitioned.count !== 1) {
      throw new AppError("VALIDATION_ERROR", {
        message: "The order changed while this update was being processed.",
      })
    }

    if (existing.status === "PENDING" && input.status === "CANCELLED") {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId: input.orderId, status: "RESERVED" },
        select: { id: true, productId: true, quantity: true },
      })
      for (const reservation of reservations) {
        const released = await tx.inventoryReservation.updateMany({
          where: { id: reservation.id, status: "RESERVED" },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
          },
        })
        if (released.count !== 1) {
          throw new AppError("VALIDATION_ERROR", {
            message: "Inventory changed while cancellation was processing.",
          })
        }
        await tx.product.update({
          where: { id: reservation.productId },
          data: { stock: { increment: reservation.quantity } },
        })
        await tx.inventoryMovement.create({
          data: {
            productId: reservation.productId,
            delta: reservation.quantity,
            reason: "RESERVATION_CANCELLED",
            sourceType: "ORDER",
            sourceId: input.orderId,
          },
        })
      }
      await tx.paymentAttempt.updateMany({
        where: {
          orderId: input.orderId,
          status: { in: ["INITIALIZED", "PENDING"] },
        },
        data: {
          status: "ABANDONED",
          failureCode: "ORDER_CANCELLED",
        },
      })
    }

    await tx.notification.create({
      data: {
        type: `ORDER_${input.status}`,
        title: `Order ${input.status.toLowerCase()}`,
        message: `Order status changed from ${existing.status.toLowerCase()} to ${input.status.toLowerCase()}`,
        orderId: input.orderId,
        dedupeKey: `order-status:${input.orderId}:${existing.status}:${input.status}`,
      },
    })

    return tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            product: {
              select: { name: true, priceNGN: true, slug: true },
            },
          },
        },
      },
    })
  })

  await writeAudit({
    actorId: input.actorId,
    actorRole: "ADMIN",
    action: "order.status.transition",
    targetType: "Order",
    targetId: input.orderId,
    metadata: {
      from: existing.status,
      to: input.status,
      reason,
    },
  })

  // Send email notification (best-effort, don't fail if email fails)
  try {
    const { sendOrderStatusUpdate } = await import("@/emails/sendOrderStatusUpdate")
    await sendOrderStatusUpdate(order, input.status)
  } catch (error) {
    console.error("Failed to send order status update email:", error)
  }

  return order
}
