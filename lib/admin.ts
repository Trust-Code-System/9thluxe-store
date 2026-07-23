// lib/admin.ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

function isBootstrapAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS || ""
  if (!raw) return false
  const allowed = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase())
}

/**
 * API-route admin check (does NOT redirect). Returns the admin user or null. Auto-promotes a
 * bootstrap admin email to ADMIN on first use, matching requireAdmin().
 */
export async function getAdminUser() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return null
  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, adminRole: true },
  })
  if (user && user.role !== "ADMIN" && isBootstrapAdminEmail(email)) {
    user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true, adminRole: true },
    })
  }
  return user && user.role === "ADMIN" ? user : null
}

export async function requireAdmin() {
  const session = await auth()
  const email = session?.user?.email

  // Unauthenticated: send to signin with callback back to admin
  if (!email) {
    redirect("/auth/signin?callbackUrl=/admin")
  }

  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      adminRole: true,
    },
  })

  if (user && user.role !== "ADMIN" && isBootstrapAdminEmail(email)) {
    user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminRole: true,
      },
    })
  }

  // Non-admin: redirect to storefront with an error flag
  if (!user || user.role !== "ADMIN") {
    redirect("/?error=not-authorized")
  }

  return user
}
