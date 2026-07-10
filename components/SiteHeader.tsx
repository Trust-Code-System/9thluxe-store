import Link from 'next/link'
import dynamic from 'next/dynamic'
import { User, Phone } from 'lucide-react'

import { UserMenu } from '@/components/UserMenu'
import { getCart } from '@/components/cartActions'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CartDrawerTrigger } from '@/components/CartDrawerTrigger'

const SearchBar = dynamic(() => import('@/components/SearchBar'), { ssr: false })

export async function SiteHeader() {
  const cartItems = await getCart()
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-8 px-6">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          Fádé
        </Link>

        {/* Center: Search Bar */}
        <div className="hidden flex-1 max-w-md md:block">
          <SearchBar />
        </div>

        {/* Right: Navigation */}
          <nav className="flex items-center gap-4">
            <a
              href="tel:+2348160591348"
              className="hidden md:flex items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden lg:inline">+234 816 059 1348</span>
            </a>
            <ThemeToggle />
            <CartDrawerTrigger cartCount={cartCount} />
            <UserMenu />
          </nav>
      </div>

      {/* Primary Navigation */}
      <div className="border-t border-border">
        <div className="container mx-auto max-w-[1200px] px-6">
          <nav className="flex items-center gap-8 py-3">
            <Link href="/category/perfumes" className="text-sm font-medium transition-colors hover:text-muted-foreground">
              Perfumes
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
