"use client";

import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div
      data-surface="fixed-dark"
      className="w-full border-b border-border/60 bg-background text-foreground/70"
      role="complementary"
      aria-label="Promotion"
    >
      <Link
        href="/shop"
        className="container mx-auto flex items-center justify-center gap-3 px-4 py-2 transition-colors hover:text-foreground"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
          Complimentary delivery on qualifying orders
        </span>
        <span className="hidden h-px w-6 bg-border sm:block" aria-hidden />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] sm:inline">
          Discover the collection
        </span>
      </Link>
    </div>
  );
}
