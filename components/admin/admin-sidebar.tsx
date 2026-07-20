"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, ShoppingCart, Tags, Folder, ChevronLeft, Menu, LogOut, Mail, Warehouse, Bot, BookOpen, Users, Settings, Navigation as NavigationIcon, Home, ImageIcon, Shield, Flag, ScrollText, MessageSquare, FileText, Inbox, Megaphone, Route } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { signOutAction } from "@/app/auth/signout/actions"

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, capability: "dashboard:view" },
  { name: "Homepage", href: "/admin/homepage", icon: Home, capability: "content:manage" },
  { name: "Products", href: "/admin/products", icon: Package, capability: "products:manage" },
  { name: "Categories", href: "/admin/categories", icon: Tags, capability: "products:manage" },
  { name: "Collections", href: "/admin/collections", icon: Folder, capability: "products:manage" },
  { name: "Journal", href: "/admin/stories", icon: BookOpen, capability: "content:manage" },
  { name: "Pages", href: "/admin/pages", icon: FileText, capability: "content:manage" },
  { name: "Media", href: "/admin/media", icon: ImageIcon, capability: "content:manage" },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquare, capability: "content:manage" },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart, capability: "orders:manage" },
  { name: "Inventory", href: "/admin/inventory", icon: Warehouse, capability: "products:manage" },
  { name: "Customers", href: "/admin/customers", icon: Users, capability: "customers:view" },
  { name: "Enquiries", href: "/admin/enquiries", icon: Inbox, capability: "support:manage" },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail, capability: "marketing:manage" },
  { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone, capability: "marketing:manage" },
  { name: "Concierge V2", href: "/admin/concierge", icon: Bot, capability: "content:manage" },
  { name: "Navigation", href: "/admin/navigation", icon: NavigationIcon, capability: "settings:manage" },
  { name: "Settings", href: "/admin/settings", icon: Settings, capability: "settings:manage" },
  { name: "Redirects", href: "/admin/redirects", icon: Route, capability: "settings:manage" },
  { name: "Email templates", href: "/admin/email-templates", icon: Mail, capability: "settings:manage" },
  { name: "Feature flags", href: "/admin/feature-flags", icon: Flag, capability: "settings:manage" },
  { name: "Audit log", href: "/admin/audit", icon: ScrollText, capability: "audit:view" },
  { name: "Users & roles", href: "/admin/users", icon: Shield, capability: "users:manage" },
]

function SidebarContent({ capabilities }: { capabilities: string[] }) {
  const pathname = usePathname()
  const [isSigningOut, startSignOutTransition] = React.useTransition()
  const visibleItems = navItems.filter((item) => capabilities.includes(item.capability))

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <Link href="/admin" className="font-serif text-xl font-semibold">
          Fádé
        </Link>
        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
      </div>

      {/* Navigation — scrolls independently when items exceed the viewport */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-1 border-t border-border p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          View Storefront
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 text-muted-foreground"
          disabled={isSigningOut}
          onClick={() => {
            startSignOutTransition(async () => {
              const home = typeof window !== "undefined" ? `${window.location.origin}/` : "/"
              await signOutAction(home)
            })
          }}
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  )
}

export function AdminSidebar({ capabilities = [] }: { capabilities?: string[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-border bg-card lg:flex">
        <SidebarContent capabilities={capabilities} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-[var(--z-nav)]">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex h-full w-64 flex-col overflow-hidden p-0">
          <SidebarContent capabilities={capabilities} />
        </SheetContent>
      </Sheet>
    </>
  )
}
