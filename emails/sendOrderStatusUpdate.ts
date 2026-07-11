import { Resend } from "resend"
import { OrderStatus } from "@prisma/client"

const resend = new Resend(process.env.RESEND_API_KEY)

type OrderLike = {
  id: string
  reference: string | null
  status: OrderStatus
  totalNGN: number
  user: { email: string; name: string | null }
  items: Array<{
    quantity: number
    product: { name: string; priceNGN: number; slug?: string }
  }>
}

const BRAND_COLOR = "#1a1a1a"
const ACCENT_COLOR = "#c9a96e"

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f1ed; margin: 0; padding: 20px;">
    <div style="max-width: 580px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background: ${BRAND_COLOR}; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: 400; color: ${ACCENT_COLOR}; letter-spacing: 0.1em;">Fádé</h1>
        <p style="margin: 4px 0 0; font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 0.3em; text-transform: uppercase;">Essence</p>
      </div>
      <!-- Content -->
      <div style="padding: 36px 32px;">
        ${content}
      </div>
      <!-- Footer -->
      <div style="padding: 20px 32px; border-top: 1px solid #f0ebe3; text-align: center; background: #faf8f5;">
        <p style="margin: 0; font-size: 12px; color: #999;">Thank you for choosing Fádé Essence</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #bbb;">Questions? <a href="mailto:fadeessencee@gmail.com" style="color: ${ACCENT_COLOR}; text-decoration: none;">fadeessencee@gmail.com</a></p>
      </div>
    </div>
  </body>
</html>`
}

function orderBox(orderRef: string, totalNGN: number) {
  return `<div style="background: #faf8f5; border: 1px solid #e8e2d9; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
    <p style="margin: 0 0 6px; font-size: 13px; color: #888;">Order Reference</p>
    <p style="margin: 0; font-size: 18px; font-family: monospace; font-weight: 600; color: ${BRAND_COLOR};">#${orderRef}</p>
    <p style="margin: 8px 0 0; font-size: 14px; color: #555;">Total: <strong>₦${totalNGN.toLocaleString()}</strong></p>
  </div>`
}

function ctaButton(text: string, href: string) {
  return `<div style="text-align: center; margin: 28px 0 8px;">
    <a href="${href}" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; text-decoration: none;">${text}</a>
  </div>`
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fade.ng"

const statusContent: Record<OrderStatus, (order: OrderLike, orderRef: string) => { subject: string; html: string }> = {
  PENDING: (order, orderRef) => ({
    subject: `Order Received: #${orderRef}`,
    html: baseLayout(`
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: ${BRAND_COLOR};">Order Received</h2>
      <p style="margin: 0 0 12px; color: #555;">Hello ${order.user.name || "there"},</p>
      <p style="color: #555;">Thank you for your order. We've received it and will begin processing shortly.</p>
      ${orderBox(orderRef, order.totalNGN)}
      ${ctaButton("View Order", `${siteUrl}/account/orders/${order.id}`)}
    `),
  }),

  PAID: (order, orderRef) => ({
    subject: `Payment Confirmed: Your Fádé Order is Being Prepared`,
    html: baseLayout(`
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: ${BRAND_COLOR};">Payment Confirmed ✓</h2>
      <p style="margin: 0 0 12px; color: #555;">Hello ${order.user.name || "there"},</p>
      <p style="color: #555;">Your payment has been received. Your order is now being carefully prepared for dispatch.</p>
      ${orderBox(orderRef, order.totalNGN)}

      <!-- Fragrance Care Guide -->
      <div style="margin: 24px 0; padding: 20px; border-left: 3px solid ${ACCENT_COLOR}; background: #fdfbf7;">
        <h3 style="margin: 0 0 12px; font-size: 15px; font-family: Georgia, serif; color: ${BRAND_COLOR};">How to Get the Most from Your Fragrance</h3>
        <ul style="margin: 0; padding: 0 0 0 18px; color: #666; font-size: 13px; line-height: 1.8;">
          <li>Apply to pulse points (wrists, neck, inner elbows) for best projection</li>
          <li>Do not rub; let the fragrance settle naturally on your skin</li>
          <li>Store away from direct sunlight and heat to preserve the composition</li>
          <li>Moisturized skin holds fragrance significantly longer</li>
          <li>For layering, apply heavier scents first, lighter scents last</li>
        </ul>
      </div>

      ${ctaButton("Track My Order", `${siteUrl}/account/orders/${order.id}`)}
    `),
  }),

  SHIPPED: (order, orderRef) => ({
    subject: `Your Fádé Order is On Its Way: #${orderRef}`,
    html: baseLayout(`
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: ${BRAND_COLOR};">Your Order Has Shipped 🚚</h2>
      <p style="margin: 0 0 12px; color: #555;">Hello ${order.user.name || "there"},</p>
      <p style="color: #555;">Wonderful news: your Fádé order is on its way to you. Estimated delivery is within <strong>2–5 business days</strong> depending on your location.</p>
      ${orderBox(orderRef, order.totalNGN)}

      <!-- Delivery info -->
      <div style="margin: 24px 0; padding: 20px; background: #f0f9f4; border-radius: 8px; border: 1px solid #c3e6cb;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #2d6a4f; font-size: 14px;">Estimated Delivery</p>
        <p style="margin: 0; color: #555; font-size: 14px;">Lagos & Abuja: <strong>1–3 business days</strong></p>
        <p style="margin: 4px 0 0; color: #555; font-size: 14px;">Other states: <strong>3–5 business days</strong></p>
        <p style="margin: 12px 0 0; font-size: 12px; color: #888;">
          If you have not received your order after 5 business days, please contact us at
          <a href="mailto:fadeessencee@gmail.com" style="color: ${ACCENT_COLOR}; text-decoration: none;">fadeessencee@gmail.com</a>
        </p>
      </div>

      ${ctaButton("Track Order Status", `${siteUrl}/account/orders/${order.id}`)}
    `),
  }),

  DELIVERED: (order, orderRef) => {
    const firstProductName = order.items[0]?.product?.name || "your fragrance"
    const firstProductSlug = order.items[0]?.product?.slug
    const reviewLink = firstProductSlug
      ? `${siteUrl}/product/${firstProductSlug}#write-review`
      : `${siteUrl}/account/orders/${order.id}`

    return {
      subject: `Your Fádé Order Has Arrived: How Are You Wearing It?`,
      html: baseLayout(`
        <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: ${BRAND_COLOR};">It's Arrived. Enjoy ✨</h2>
        <p style="margin: 0 0 12px; color: #555;">Hello ${order.user.name || "there"},</p>
        <p style="color: #555;">Your order has been delivered. We hope your first experience with <strong>${firstProductName}</strong> is everything you imagined.</p>
        ${orderBox(orderRef, order.totalNGN)}

        <!-- How to wear section -->
        <div style="margin: 24px 0; padding: 20px; border-left: 3px solid ${ACCENT_COLOR}; background: #fdfbf7;">
          <h3 style="margin: 0 0 12px; font-size: 15px; font-family: Georgia, serif; color: ${BRAND_COLOR};">How to Wear This</h3>
          <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.8;">
            Wear it close to the skin on your warmest pulse points. In Nigerian heat, one or two sprays is enough. The warmth of your body does the rest.
            Let it breathe for 10 minutes before forming your full impression of the scent.
          </p>
        </div>

        <!-- Review request -->
        <div style="margin: 24px 0; text-align: center;">
          <p style="color: #555; font-size: 14px; margin: 0 0 4px;">How would you rate your experience?</p>
          <p style="color: #888; font-size: 12px; margin: 0 0 16px;">Your review helps other fragrance lovers find the right scent.</p>
          ${ctaButton("Leave a Review", reviewLink)}
        </div>

        <!-- Social share -->
        <div style="margin-top: 24px; padding: 16px; background: #faf8f5; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #666;">Sharing your new fragrance? Tag us.</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${BRAND_COLOR}; letter-spacing: 0.05em;">#FádéEssence &nbsp;@fadeeessence</p>
        </div>
      `),
    }
  },
}

export async function sendOrderStatusUpdate(order: OrderLike, newStatus: OrderStatus) {
  const orderRef = order.reference || order.id.slice(0, 8).toUpperCase()

  if (!process.env.RESEND_API_KEY) {
    console.log("[EMAIL] Order status update (no API key):", {
      to: order.user.email,
      status: newStatus,
      orderId: orderRef,
    })
    return
  }

  const { subject, html } = statusContent[newStatus](order, orderRef)

  try {
    await resend.emails.send({
      from: process.env.NEWSLETTER_FROM_EMAIL || "Fádé Essence <onboarding@resend.dev>",
      to: order.user.email,
      subject,
      html,
    })
    console.log("[EMAIL] Order status update sent:", order.user.email, newStatus)
  } catch (error) {
    console.error("[EMAIL] Failed to send order status update:", error)
    throw error
  }
}
