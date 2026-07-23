// emails/sendReceipt.ts
import { Resend } from "resend"
import { escapeHtml } from "@/lib/security/html"
import { logger } from "@/lib/observability/logger"
import { resolveEmailTemplate } from "@/lib/email-templates/service"

type OrderLike = {
  id: string
  reference: string | null
  totalNGN: number
  discountNGN: number
  subtotalNGN: number
  createdAt: Date
  user: { email: string; name: string | null }
  items: { quantity: number; product: { name: string; priceNGN: number } }[]
  coupon?: { code: string } | null
}

export async function sendReceipt(order: OrderLike, idempotencyKey?: string) {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.ALLOW_TEST_EMAIL_DELIVERY !== "true"
  ) {
    logger.warn("receipt_email_skipped", {
      orderId: order.id,
      reason: "email delivery disabled in tests",
    })
    return
  }
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    logger.warn("receipt_email_skipped", {
      orderId: order.id,
      reason: "RESEND_API_KEY missing",
    })
    return
  }
  const resend = new Resend(resendKey)

  const orderRef = order.reference || order.id.slice(0, 8)
  const safeOrderRef = escapeHtml(orderRef)
  const safeCustomerName = escapeHtml(order.user.name || "Customer")
  const safeCouponCode = order.coupon ? escapeHtml(order.coupon.code) : null
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity} × ${escapeHtml(item.product.name)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${item.product.priceNGN.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.quantity * item.product.priceNGN).toLocaleString()}</td>
      </tr>
    `
    )
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2f3e33; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-family: serif;">Fádé Essence</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #2f3e33; margin-top: 0;">Order Confirmation</h2>
          <p>Hello ${safeCustomerName},</p>
          <p>Thank you for your order! We've received your payment and your order is being processed.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Order Reference:</strong> ${safeOrderRef}</p>
            <p style="margin: 0 0 10px 0;"><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
            
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal:</span>
                <span>₦${order.subtotalNGN.toLocaleString()}</span>
              </div>
              ${order.discountNGN > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #28a745;">
                <span>Discount${safeCouponCode ? ` (${safeCouponCode})` : ""}:</span>
                <span>-₦${order.discountNGN.toLocaleString()}</span>
              </div>
              ` : ""}
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                <span>Total:</span>
                <span>₦${order.totalNGN.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p>You can track your order status in your account dashboard.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
            <p>Thank you for shopping with Fádé Essence</p>
            <p>If you have any questions, contact us at fadeessencee@gmail.com or +234 8160591348</p>
          </div>
        </div>
      </body>
    </html>
  `

  const resolved = await resolveEmailTemplate("order_receipt", { customerName: order.user.name || "Customer", orderRef, total: `₦${order.totalNGN.toLocaleString()}` }, `Order Confirmation - Order #${orderRef}`, html)
  try {
    const result = await resend.emails.send({
      from: process.env.NEWSLETTER_FROM_EMAIL || "Fádé Essence <onboarding@resend.dev>",
      to: order.user.email,
      subject: resolved.subject,
      html: resolved.html,
    }, idempotencyKey ? { idempotencyKey } : undefined)
    if (result.error) {
      throw new Error(`Resend rejected receipt delivery: ${result.error.name}`)
    }
    logger.info("receipt_email_sent", { orderId: order.id })
  } catch (error) {
    logger.error("receipt_email_failed", {
      orderId: order.id,
      internal: String(error),
    })
    throw error
  }
}
