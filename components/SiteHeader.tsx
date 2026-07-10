import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Search, Heart, User, ShoppingBag } from 'lucide-react'

import { UserMenu } from '@/components/UserMenu'
import { getCart } from '@/components/cartActions'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SearchBar = dynamic(() => import('@/components/SearchBar'), { ssr: false })

export async function SiteHeader() {
  const cartItems = await getCart()
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
          Fàdè
        </Link>

        {/* Center: Main Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link 
            href="/category/watches" 
            className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            Watches
          </Link>
          <Link 
            href="/category/perfumes" 
            className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            Perfumes
          </Link>
          <Link 
            href="/category/eyeglasses" 
            className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            Eyeglasses
          </Link>
          <Link 
            href="/collections" 
            className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            Collections
          </Link>
          <Link 
            href="/about" 
            className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            About
          </Link>
          <Link 
            href="/help" 
            className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            Help
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/search">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/account/wishlist">
              <Heart className="h-4 w-4" />
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>
          <UserMenu />
          <Button variant="ghost" size="icon" className="relative h-9 w-9" asChild>
            <Link href="/cart">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Shopping cart</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
