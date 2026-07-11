"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, User, ShoppingBag, Menu } from "lucide-react";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchDialog } from "@/components/search/search-dialog";
import { useCartStore } from "@/lib/stores/cart-store";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const primaryNav = [
  { name: "Shop", href: "/shop" },
  { name: "Collections", href: "/collections" },
  { name: "Discover", href: "/find-your-fragrance" },
];

const secondaryNav = [
  { name: "Drops", href: "/drops" },
  { name: "Journal", href: "/journal" },
  { name: "Concierge", href: "/concierge" },
];

const allNav = [...primaryNav, ...secondaryNav];

function NavLink({
  item,
  active,
}: {
  item: { name: string; href: string };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative py-1 font-mono text-[11px] uppercase tracking-[0.24em] transition-colors duration-200",
        "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300",
        active
          ? "text-foreground after:w-full"
          : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full",
      )}
    >
      {item.name}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const cartItemCount = useCartStore((state) => state.getUniqueItemsCount());

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      data-surface="night"
      className={cn(
        "sticky top-0 z-[var(--z-nav)] w-full bg-background text-foreground transition-all duration-300",
        isScrolled
          ? "border-b border-border/80 bg-background/85 backdrop-blur-md"
          : "border-b border-border/40",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between gap-4 sm:h-[70px]">
          {/* Left: mobile menu + desktop primary nav */}
          <div className="flex flex-1 items-center gap-6">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-sm lg:hidden"
                >
                  <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="grain !fixed flex w-full max-w-sm flex-col overflow-y-auto overscroll-contain border-border bg-background p-0"
              >
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Browse the store and open account links.
                </SheetDescription>
                <div className="relative z-10 flex h-full flex-col px-7 pb-8 pt-6">
                  <div className="mb-10 flex items-center justify-between">
                    <SheetClose asChild>
                      <span>
                        <Logo href="/" compact />
                      </span>
                    </SheetClose>
                  </div>

                  <nav className="flex flex-col" aria-label="Main">
                    {allNav.map((item, i) => (
                      <SheetClose key={item.name} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-baseline justify-between border-b border-border/60 py-4 transition-colors",
                            isActive(item.href)
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className="font-serif text-2xl font-light">
                            {item.name}
                          </span>
                          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>

                  <div className="mt-auto space-y-4 pt-10">
                    <div className="rule-fade" />
                    <div className="flex items-center justify-between">
                      <SheetClose asChild>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <User className="h-4 w-4" strokeWidth={1.75} />
                          Account
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/account/wishlist"
                          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Heart className="h-4 w-4" strokeWidth={1.75} />
                          Wishlist
                        </Link>
                      </SheetClose>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop nav */}
            <nav
              className="hidden items-center gap-7 lg:flex"
              aria-label="Main"
            >
              {primaryNav.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  active={isActive(item.href)}
                />
              ))}
            </nav>
          </div>

          {/* Center: wordmark */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Logo href="/" />
          </div>

          {/* Right: secondary nav + actions */}
          <div className="flex flex-1 items-center justify-end gap-6">
            <nav
              className="hidden items-center gap-7 xl:flex"
              aria-label="Secondary"
            >
              {secondaryNav.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  active={isActive(item.href)}
                />
              ))}
            </nav>

            <div className="flex items-center gap-0.5">
              <div className="hidden sm:flex">
                <SearchDialog />
              </div>

              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                className="hidden h-11 w-11 rounded-sm sm:flex"
                asChild
              >
                <Link
                  href="/account"
                  className="text-foreground/80 hover:text-foreground"
                >
                  <User
                    className="h-[18px] w-[18px] shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="sr-only">Account</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 rounded-sm"
                asChild
              >
                <Link
                  href="/cart"
                  className="text-foreground/80 hover:text-foreground"
                >
                  <ShoppingBag
                    className="h-[18px] w-[18px] shrink-0"
                    strokeWidth={1.75}
                  />
                  {cartItemCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-accent-foreground">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                  <span className="sr-only">Cart</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
