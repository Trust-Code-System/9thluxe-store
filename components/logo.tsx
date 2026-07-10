"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  href?: string
  /** Compact for mobile drawer */
  compact?: boolean
}

/** The bottle mark on its own — reusable as an icon/avatar (e.g. the Concierge AI). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      strokeWidth={1.6}
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
        "inline-flex items-center gap-2.5 font-serif font-bold tracking-tight text-foreground antialiased",
        compact ? "text-xl" : "text-2xl",
        className
      )}
      aria-label="Fádé – Luxury fragrances"
    >
      <span className="relative flex shrink-0" aria-hidden>
        <LogoMark className={cn(compact ? "h-6 w-[18px]" : "h-7 w-[21px]")} />
      </span>
      <span>Fádé</span>
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
      >
        {content}
      </Link>
    )
  }

  return content
}
