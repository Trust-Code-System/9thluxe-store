import type React from "react";

import type { Metadata } from "next";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Fádé Admin Dashboard",
  description: "Manage your Fádé storefront.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Restrict all admin routes to authenticated ADMIN users
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="flex flex-1 flex-col lg:ml-64">
        <AdminHeader user={user} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
