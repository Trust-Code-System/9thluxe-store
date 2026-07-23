import { prisma } from "@/lib/prisma"
import { CustomerManager } from "@/components/admin/customer-manager"
export const dynamic = "force-dynamic"
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; segment?: string }> }) {
  const { q = "", segment = "" } = await searchParams
  let users: any[] = []
  try { users = await prisma.user.findMany({ where: { role: "USER", ...(segment ? { customerSegment: segment } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { customerTags: { contains: q, mode: "insensitive" } }] } : {}) }, include: { orders: { select: { totalNGN: true } } }, orderBy: { createdAt: "desc" }, take: 200 }) } catch {}
  const customers = users.map((user) => ({ id: user.id, name: user.name, email: user.email, tags: user.customerTags, notes: user.customerNotes, segment: user.customerSegment, status: user.customerStatus, createdAt: user.createdAt, orderCount: user.orders.length, totalSpent: user.orders.reduce((sum: number, order: { totalNGN: number }) => sum + order.totalNGN, 0) }))
  return <CustomerManager customers={customers} query={q} segment={segment} />
}
