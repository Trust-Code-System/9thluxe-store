import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const BRAND_COLOR = "#1a1a1a"
const ACCENT_COLOR = "#c9a96e"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fade.ng"

interface PriceDropAlertParams {
  to: string
  customerName: string | null
  productName: string
  productSlug: string
  productImage?: string
  oldPriceNGN: number
  newPriceNGN: number
}

export async function sendPriceDropAlert(params: PriceDropAlertParams) {
  const { to, customerName, productName, productSlug, oldPriceNGN, newPriceNGN } = params
  const savings = oldPriceNGN - newPriceNGN
  const savingsPct = Math.round((savings / oldPriceNGN) * 100)
  const productUrl = `${siteUrl}/product/${productSlug}`

  if (!process.env.RESEND_API_KEY) {
    console.log("[EMAIL] Price drop alert (no API key):", { to, productName, oldPriceNGN, newPriceNGN })
    return
  }

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f1ed; margin: 0; padding: 20px;">
    <div style="max-width: 580px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: ${BRAND_COLOR}; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: 400; color: ${ACCENT_COLOR}; letter-spacing: 0.1em;">Fádé</h1>
        <p style="margin: 4px 0 0; font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 0.3em; text-transform: uppercase;">Essence</p>
      </div>
      <div style="padding: 36px 32px;">
        <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: ${ACCENT_COLOR};">Price Drop Alert</p>
        <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: ${BRAND_COLOR}; line-height: 1.3;">
          A fragrance on your wishlist just got more accessible
        </h2>
        <p style="margin: 0 0 12px; color: #555;">Hello ${customerName || "there"},</p>
        <p style="color: #555;">The price of <strong>${productName}</strong> has dropped. Now is the perfect time to make it yours.</p>

        <!-- Price comparison -->
        <div style="margin: 24px 0; padding: 24px; background: #faf8f5; border-radius: 12px; border: 1px solid #e8e2d9; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #999;">Was</p>
          <p style="margin: 0 0 12px; font-size: 20px; color: #aaa; text-decoration: line-through;">₦${oldPriceNGN.toLocaleString()}</p>
          <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: ${ACCENT_COLOR}; font-weight: 700;">Now</p>
          <p style="margin: 0 0 16px; font-size: 32px; font-weight: 700; color: ${BRAND_COLOR};">₦${newPriceNGN.toLocaleString()}</p>
          <div style="display: inline-block; background: #2d6a4f; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">
            Save ₦${savings.toLocaleString()} (${savingsPct}% off)
          </div>
        </div>

        <p style="font-size: 13px; color: #888; margin: 0 0 24px;">
          Wishlist prices can change without notice. Shop now to lock in this price.
        </p>

        <div style="text-align: center;">
          <a href="${productUrl}" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 14px 36px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; text-decoration: none;">
            Shop Now →
          </a>
        </div>
      </div>
      <div style="padding: 20px 32px; border-top: 1px solid #f0ebe3; text-align: center; background: #faf8f5;">
        <p style="margin: 0; font-size: 12px; color: #999;">Thank you for choosing Fádé Essence</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #bbb;">
          <a href="${siteUrl}/account/wishlist" style="color: #bbb; text-decoration: none;">Manage your wishlist</a>
        </p>
      </div>
    </div>
  </body>
</html>`

  try {
    await resend.emails.send({
      from: process.env.NEWSLETTER_FROM_EMAIL || "Fádé Essence <onboarding@resend.dev>",
      to,
      subject: `Price Drop: ${productName} is now ₦${newPriceNGN.toLocaleString()} (save ${savingsPct}%)`,
      html,
    })
    console.log("[EMAIL] Price drop alert sent:", to, productName)
  } catch (error) {
    console.error("[EMAIL] Failed to send price drop alert:", error)
  }
}
