"use client"



import * as React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"

import { Heart, User, ShoppingBag, Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

import { ThemeToggle } from "@/components/ui/theme-toggle"

import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"

import { SearchDialog } from "@/components/search/search-dialog"

import { useCartStore } from "@/lib/stores/cart-store"



const navigation = [
  { name: "Perfumes", href: "/category/perfumes" },
  { name: "Collections", href: "/collections" },
  { name: "Concierge", href: "/concierge" },
  { name: "Drops", href: "/drops" },
  { name: "Journal", href: "/journal" },
  { name: "About", href: "/about" },
]



interface HeaderProps {}

export function Header(_props: HeaderProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const cartItemCount = useCartStore((state) => state.getUniqueItemsCount())



  React.useEffect(() => {

    const handleScroll = () => {

      setIsScrolled(window.scrollY > 10)

    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)

  }, [])



  return (

    <header

      className={cn(

        "sticky top-0 z-50 w-full transition-all duration-300",

        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border" : "bg-background border-b border-border/60",

      )}

    >

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex h-14 sm:h-16 items-center justify-between gap-6">

          {/* Brand */}
          <Logo href="/" />



          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative py-1 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors",
                    "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300",
                    isActive
                      ? "text-foreground after:w-full"
                      : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full",
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>



          {/* Right Actions */}
          <div className="flex items-center gap-0.5">
            <ThemeToggle />

            <div className="hidden sm:flex">
              <SearchDialog />
            </div>

            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hidden sm:flex" asChild>
              <Link href="/account/wishlist" className="text-foreground/80 hover:text-foreground">
                <Heart className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hidden sm:flex" asChild>
              <Link href="/account" className="text-foreground/80 hover:text-foreground">
                <User className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                <span className="sr-only">Account</span>
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg relative" asChild>
              <Link href="/cart" className="text-foreground/80 hover:text-foreground">
                <ShoppingBag className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground flex items-center justify-center">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Link>
            </Button>



            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg lg:hidden">
                  <Menu className="h-5 w-5 shrink-0" strokeWidth={2.25} />

                  <span className="sr-only">Open menu</span>

                </Button>

              </SheetTrigger>

              <SheetContent side="right" className="w-80">

                <div className="flex flex-col h-full">

                  <div className="flex items-center justify-between mb-8">

                    <Logo href="/" compact />

                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
                        <X className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                      </Button>

                    </SheetClose>

                  </div>



                  <nav className="flex flex-col gap-0.5" aria-label="Main">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <SheetClose key={item.name} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "px-4 py-3.5 text-[15px] font-semibold rounded-lg transition-colors",
                              isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {item.name}
                          </Link>
                        </SheetClose>
                      )
                    })}
                  </nav>



                  <div className="mt-auto pt-8 border-t border-border">
                    <div className="flex items-center gap-1">
                      <SheetClose asChild>
                        <div className="h-11 w-11 flex items-center justify-center rounded-lg">
                          <SearchDialog />
                        </div>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-lg" asChild>
                          <Link href="/account/wishlist">
                            <Heart className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-lg" asChild>
                          <Link href="/account">
                            <User className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                          </Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </div>

                </div>

              </SheetContent>

            </Sheet>

          </div>

        </div>

      </div>

    </header>

  )

}
