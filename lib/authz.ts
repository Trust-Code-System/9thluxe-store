// lib/authz.ts
// Server-side authorization guards for the admin panel. Pure capability logic is in authz-core.ts
// (re-exported here); this file adds the guards that touch the session/DB. A user must be ADMIN to
// reach the panel (see lib/admin.ts); their AdminRole then scopes capabilities. Enforcement is
// server-side (pages via requireCapability, APIs via getAuthorizedUser), never button-hiding alone.

import { redirect } from "next/navigation"
import type { AdminRole } from "@prisma/client"
import { getAdminUser } from "@/lib/admin"
import { resolveRole, hasCapability, type Capability } from "@/lib/authz-core"

export * from "@/lib/authz-core"

export type AuthorizeResult =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getAdminUser>>>; role: AdminRole }
  | { ok: false; status: 401 | 403 }

/** API guard: returns the admin user if they hold the capability, else a 401/403 signal. */
export async function getAuthorizedUser(capability: Capability): Promise<AuthorizeResult> {
  const user = await getAdminUser()
  if (!user) return { ok: false, status: 401 }
  const role = resolveRole(user)
  if (!role || !hasCapability(role, capability)) return { ok: false, status: 403 }
  return { ok: true, user, role }
}

/** Page guard: redirects unauthenticated users to sign-in and forbidden admins to the dashboard. */
export async function requireCapability(capability: Capability) {
  const user = await getAdminUser()
  if (!user) redirect("/auth/signin?callbackUrl=/admin")
  const role = resolveRole(user)
  if (!role || !hasCapability(role, capability)) {
    redirect("/admin?error=forbidden")
  }
  return { user, role }
}
