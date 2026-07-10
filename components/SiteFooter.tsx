import Link from 'next/link'
import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react'
import { NewsletterForm } from '@/components/newsletter/newsletter-form'

const shopLinks = [
  { href: '/category/watches', label: 'Watches' },
  { href: '/category/perfumes', label: 'Perfumes' },
  { href: '/category/eyeglasses', label: 'Eyeglasses' },
  { href: '/collections', label: 'Collections' },
]

const helpLinks = [
  { href: '/help/faq', label: 'FAQ' },
  { href: '/help/contact', label: 'Contact Us' },
  { href: '/help/returns', label: 'Returns & Exchanges' },
  { href: '/help/shipping', label: 'Shipping Info' },
]

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <Link href="/" className="font-serif text-2xl font-semibold tracking-tight mb-4 inline-block">
              Fàdè
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Curated luxury in watches, perfumes & eyewear. We bring you the finest selection of premium accessories for the discerning individual.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/fade"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/fade"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/fade"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/fade"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* SHOP Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">SHOP</h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* HELP Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">HELP</h3>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* NEWSLETTER Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">NEWSLETTER</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe for exclusive offers and new arrivals.
            </p>
            <NewsletterForm variant="inline" />
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {year} Fàdè. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
