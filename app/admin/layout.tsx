import type React from "react";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/admin";
import {
  capabilityForPath,
  capabilitiesFor,
  hasCapability,
  resolveRole,
  ROLE_LABELS,
} from "@/lib/authz";

export const metadata: Metadata = {
  title: "Fádé Admin Dashboard",
  description: "Manage your Fádé storefront.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Restrict all admin routes to authenticated ADMIN users.
  const user = await requireAdmin();
  const role = resolveRole(user);

  // Enforce the capability required by the page being viewed (single choke point for every admin
  // page). The pathname is supplied by middleware via the x-pathname header.
  const pathname = (await headers()).get("x-pathname") || "/admin";
  const requiredCapability = capabilityForPath(pathname);
  if (!role || !hasCapability(role, requiredCapability)) {
    redirect("/admin?error=forbidden");
  }

  const capabilities = capabilitiesFor(role);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar capabilities={capabilities} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <AdminHeader user={{ ...user, roleLabel: role ? ROLE_LABELS[role] : null }} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
