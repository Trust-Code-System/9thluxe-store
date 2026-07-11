import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"

export const metadata: Metadata = {
  title: "Help Center | Fádé",
  description: "Get help with your orders, shipping, and returns.",
}

const helpTopics = [
  {
    title: "FAQ",
    note: "Common questions about orders, delivery and returns.",
    href: "/help/faq",
    external: false,
  },
  {
    title: "Contact us",
    note: "Send a message. We reply within a business day.",
    href: "/help/contact",
    external: false,
  },
  {
    title: "WhatsApp",
    note: "Usually minutes during business hours.",
    href: "https://wa.me/2348160591348",
    external: true,
  },
  {
    title: "Shipping",
    note: "Nationwide delivery, 1–5 business days by state.",
    href: "/help/shipping",
    external: false,
  },
  {
    title: "Returns & exchanges",
    note: "7-day policy for sealed, unused items.",
    href: "/help/returns",
    external: false,
  },
]

export default function HelpPage() {
  return (
    <MainLayout>
      <section
        data-surface="night"
        className="grain relative bg-background py-14 text-foreground lg:py-20"
      >
        <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <span className="eyebrow">Help center</span>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-5xl">
            How can we <em className="text-accent">help</em>?
          </h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Find answers, or reach a person quickly, whichever you prefer.
          </p>

          {/* Topics ledger */}
          <div className="mt-12 border-t border-border">
            {helpTopics.map((topic, i) => (
              <Link
                key={topic.title}
                href={topic.href}
                target={topic.external ? "_blank" : undefined}
                rel={topic.external ? "noopener noreferrer" : undefined}
                className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-5 border-b border-border py-6 transition-colors hover:bg-secondary/40 sm:gap-x-8"
              >
                <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-serif text-2xl font-light transition-all duration-300 group-hover:italic group-hover:text-accent">
                    {topic.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{topic.note}</p>
                </div>
                <ArrowUpRight
                  className="h-5 w-5 self-center text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>
            ))}
          </div>

          {/* Direct lines */}
          <div className="mt-12 grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Email
              </p>
              <a
                href="mailto:fadeessencee@gmail.com"
                className="mt-2 block text-sm text-foreground transition-colors hover:text-accent"
              >
                fadeessencee@gmail.com
              </a>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Phone / WhatsApp
              </p>
              <a
                href="tel:+2348160591348"
                className="mt-2 block text-sm text-foreground transition-colors hover:text-accent"
              >
                +234 816 059 1348
              </a>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Hours (WAT)
              </p>
              <p className="mt-2 text-sm text-foreground">
                Mon–Sat · 8:00–20:00
                <br />
                Sun · 12:00–21:00
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
