// emails/sendReceipt.ts
type OrderLike = {
  id: string
  totalNGN: number
  discountNGN: number
  subtotalNGN: number
  createdAt: Date
  user: { email: string; name: string | null }
  items: { quantity: number; product: { name: string } }[]
}

export async function sendReceipt(order: OrderLike) {
  // If you have RESEND_API_KEY set up, plug actual email here.
  // For now, just log a “sent email” to the console.
  console.log('[EMAIL] Receipt =>', {
    to: order.user.email,
    subject: `Fàdè Order #${order.id.slice(-6)} receipt`,
    summary: {
      subtotal: order.subtotalNGN,
      discount: order.discountNGN,
      total: order.totalNGN,
      items: order.items.map(i => `${i.quantity} × ${i.product.name}`)
    }
  })
}
