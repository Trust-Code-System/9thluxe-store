"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Search, Package, ShoppingCart, User, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AdminHeaderProps {
  user?: {
    id: string
    name: string | null
    email: string
  }
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  orderId: string | null
  read: boolean
  createdAt: string
  readAt: string | null
}

interface SearchResult {
  products: Array<{
    id: string
    name: string
    slug: string
    brand: string | null
    priceNGN: number
    images: any
  }>
  orders: Array<{
    id: string
    reference: string | null
    status: string
    totalNGN: number
    createdAt: string
    user: { name: string | null; email: string }
  }>
  customers: Array<{
    id: string
    name: string | null
    email: string
    createdAt: string
  }>
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<SearchResult | null>(null)
  const [searchLoading, setSearchLoading] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  
  const displayName = user?.name || "Admin User"
  const displayEmail = user?.email || "admin@example.com"
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD"

  const performSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null)
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (response.ok) {
        setSearchResults(data)
        setSearchOpen(true)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery)
      }, 300)
    } else {
      setSearchResults(null)
      if (searchQuery.length === 0) {
        setSearchOpen(false)
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, performSearch])

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-search-container]')) {
        setSearchOpen(false)
      }
    }

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchOpen])

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/notifications?unreadOnly=false")
      const data = await response.json()
      if (response.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Fetch notifications error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("Mark all as read error:", error)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("Mark as read error:", error)
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-6 lg:px-8">
        {/* Brand + search */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="hidden md:flex flex-col">
            <span className="font-serif text-lg font-semibold leading-tight">Fádé Admin</span>
            <span className="text-xs text-muted-foreground">Storefront management</span>
          </div>

          <div className="flex-1 max-w-md hidden sm:block" data-search-container>
            <Popover open={searchOpen && (searchResults !== null || searchLoading)} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search products, orders, customers..."
                    className="pl-9 bg-muted/50"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value.length >= 2) {
                        setSearchOpen(true)
                      } else {
                        setSearchOpen(false)
                        setSearchResults(null)
                      }
                    }}
                    onFocus={() => {
                      if (searchResults && searchQuery.length >= 2) {
                        setSearchOpen(true)
                      }
                    }}
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                    </div>
                  ) : searchResults ? (
                    <>
                      {/* Products */}
                      {searchResults.products.length > 0 && (
                      <div className="p-4 border-b">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                          <Package className="h-3 w-3" />
                          Products ({searchResults.products.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.products.map((product) => (
                            <Link
                              key={product.id}
                              href={`/admin/products/${product.id}`}
                              className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors"
                              onClick={() => {
                                setSearchOpen(false)
                                setSearchQuery("")
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                {product.brand && (
                                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                                )}
                              </div>
                              <p className="text-sm font-medium">
                                ₦{product.priceNGN.toLocaleString()}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Orders */}
                    {searchResults.orders.length > 0 && (
                      <div className="p-4 border-b">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                          <ShoppingCart className="h-3 w-3" />
                          Orders ({searchResults.orders.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.orders.map((order) => (
                            <Link
                              key={order.id}
                              href={`/admin/orders/${order.id}`}
                              className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                              onClick={() => {
                                setSearchOpen(false)
                                setSearchQuery("")
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {order.reference || order.id.slice(0, 8)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {order.user.email} • {order.status}
                                </p>
                              </div>
                              <p className="text-sm font-medium">
                                ₦{order.totalNGN.toLocaleString()}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customers */}
                    {searchResults.customers.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Customers ({searchResults.customers.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.customers.map((customer) => (
                            <Link
                              key={customer.id}
                              href={`/admin/customers?email=${encodeURIComponent(customer.email)}`}
                              className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors"
                              onClick={() => {
                                setSearchOpen(false)
                                setSearchQuery("")
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {customer.name || "No name"}
                                </p>
                                <p className="text-xs text-muted-foreground">{customer.email}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                      {searchResults.products.length === 0 &&
                        searchResults.orders.length === 0 &&
                        searchResults.customers.length === 0 && (
                          <div className="p-8 text-center text-sm text-muted-foreground">
                            <p>No results found</p>
                          </div>
                        )}
                    </>
                  ) : searchQuery.length >= 2 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <p>Type at least 2 characters to search</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <p>Start typing to search...</p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden sm:inline-flex">
            <Button variant="outline" size="sm" className="text-xs">
              View Storefront
            </Button>
          </Link>

          <ThemeToggle />

          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <p>Loading...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notification.read
                              ? "bg-muted/30 border-border"
                              : "bg-primary/5 border-primary/20"
                          }`}
                          onClick={() => {
                            if (!notification.read) {
                              handleMarkAsRead(notification.id)
                            }
                            if (notification.orderId) {
                              window.location.href = `/admin/orders/${notification.orderId}`
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account/settings">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/">View Storefront</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
