"use client"

import Link from "next/link"

export function AnnouncementBar() {
  return (
    <div
      className="w-full bg-espresso text-[13px] text-[color:var(--primary-foreground)]"
      role="complementary"
      aria-label="Promotion"
    >
      <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-2.5">
        <span className="hidden sm:inline text-[color:var(--amber)]" aria-hidden>
          ✦
        </span>
        <Link
          href="/shop"
          className="font-sans tracking-wide text-center transition-opacity hover:opacity-80"
        >
          Complimentary delivery on qualifying orders
          <span className="mx-2 text-[color:var(--amber)]" aria-hidden>·</span>
          <span className="underline underline-offset-4 decoration-[color:var(--amber)]/60">
            Discover the collection
          </span>
        </Link>
      </div>
    </div>
  )
}
