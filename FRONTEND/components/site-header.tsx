"use client"

import Link from "next/link"
import { Search, ShoppingCart, User } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useCartStore } from "@/lib/cart-store"

export function SiteHeader() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-8 px-6">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          Fàdè
        </Link>

        {/* Center: Search Bar */}
        <div className="relative hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchDropdown(e.target.value.length >= 2)
              }}
              onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="h-10 rounded-full border-border pl-10 pr-4 text-sm"
            />
          </div>

          {/* Search Dropdown - will be populated later */}
          {showSearchDropdown && (
            <div className="absolute top-full mt-2 w-full rounded-xl border border-border bg-card p-2 shadow-lg">
              <p className="p-4 text-center text-sm text-muted-foreground">Start typing to search...</p>
            </div>
          )}
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground relative"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground"
          >
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">Account</span>
          </Link>
        </nav>
      </div>

      {/* Primary Navigation */}
      <div className="border-t border-border">
        <div className="container mx-auto max-w-[1200px] px-6">
          <nav className="flex items-center gap-8 py-3">
            <Link href="/watches" className="text-sm font-medium transition-colors hover:text-muted-foreground">
              Watches
            </Link>
            <Link href="/perfumes" className="text-sm font-medium transition-colors hover:text-muted-foreground">
              Perfumes
            </Link>
            <Link href="/eyeglasses" className="text-sm font-medium transition-colors hover:text-muted-foreground">
              Eye Glasses
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
