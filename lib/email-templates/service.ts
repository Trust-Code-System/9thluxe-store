import { prisma } from "@/lib/prisma"

export const EMAIL_TEMPLATE_CATALOGUE = [
  { key: "order_receipt", name: "Order receipt", variables: ["customerName", "orderRef", "total"] },
  { key: "order_status_PENDING", name: "Order received", variables: ["customerName", "orderRef", "total"] },
  { key: "order_status_PAID", name: "Payment confirmed", variables: ["customerName", "orderRef", "total"] },
  { key: "order_status_SHIPPED", name: "Order shipped", variables: ["customerName", "orderRef", "total"] },
  { key: "order_status_DELIVERED", name: "Order delivered", variables: ["customerName", "orderRef", "total"] },
  { key: "price_drop", name: "Price drop alert", variables: ["customerName", "productName", "oldPrice", "newPrice", "productUrl"] },
] as const

function render(template: string, variables: Record<string, string>) { return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => variables[key] ?? "") }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char) }

export async function resolveEmailTemplate(key: string, variables: Record<string, string>, fallbackSubject: string, fallbackHtml: string) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { key } })
    if (!template?.enabled) return { subject: fallbackSubject, html: fallbackHtml }
    const subject = render(template.subject, variables).replace(/[\r\n]/g, " ").slice(0, 200)
    const body = escapeHtml(render(template.bodyText, variables)).replace(/\n/g, "<br>")
    return { subject, html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;line-height:1.6">${body}</div>` }
  } catch { return { subject: fallbackSubject, html: fallbackHtml } }
}
