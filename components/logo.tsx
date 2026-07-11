"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  href?: string
  /** Compact for mobile drawer */
  compact?: boolean
}

/** The bottle mark on its own, reusable as an icon/avatar (e.g. the Concierge AI). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      strokeWidth={1.4}
      aria-hidden
    >
      <path
        d="M12 2v4c0 4 2 7 4 11s2 9 2 13c0 3-1 5-4 5s-4-2-4-5c0-4 0-8 2-12s4-7 4-11V2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 8v10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="opacity-60"
      />
    </svg>
  )
}

export function Logo({ className, href = "/", compact }: LogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-baseline gap-2.5 font-serif font-light uppercase text-foreground antialiased",
        compact ? "text-base tracking-[0.28em]" : "text-lg tracking-[0.32em]",
        className
      )}
      aria-label="Fádé – Luxury fragrances"
    >
      <span className="relative flex shrink-0 self-center" aria-hidden>
        <LogoMark className={cn(compact ? "h-5 w-[15px]" : "h-6 w-[18px]")} />
      </span>
      <span className="translate-y-px">Fádé</span>
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-sm transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {content}
      </Link>
    )
  }

  return content
}
