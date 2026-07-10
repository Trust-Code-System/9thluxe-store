import Link from "next/link"
import { Instagram, MessageCircle } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Help */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Help</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="transition-colors hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-foreground">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Shop</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/watches" className="transition-colors hover:text-foreground">
                  Watches
                </Link>
              </li>
              <li>
                <Link href="/perfumes" className="transition-colors hover:text-foreground">
                  Perfumes
                </Link>
              </li>
              <li>
                <Link href="/eyeglasses" className="transition-colors hover:text-foreground">
                  Eye Glasses
                </Link>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Business Hours</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Mon–Sat: 8am–9pm</li>
              <li>Sun: 12pm–9pm</li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Connect</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://wa.me/2348160591348"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>+234 816 059 1348</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@Fàdè"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  TikTok: @Fàdè
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/Fàdè"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Instagram className="h-4 w-4" />
                  <span>@Fàdè</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Fàdè. All rights reserved.</p>
          <p className="mt-2">Nigeria-wide delivery. We ship to all 36 states and the FCT.</p>
        </div>
      </div>
    </footer>
  )
}
