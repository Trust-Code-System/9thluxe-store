import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  viewAllHref?: string
  viewAllLabel?: string
  className?: string
  align?: "left" | "center"
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  viewAllHref,
  viewAllLabel = "View all",
  className,
  align = "left",
}: SectionHeaderProps) {
  const viewAll = viewAllHref && (
    <Link
      href={viewAllHref}
      className="group flex items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-accent"
    >
      {viewAllLabel}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )

  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-2 lg:mb-14",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex w-full flex-wrap items-end gap-x-4 gap-y-2",
          align === "left" ? "justify-between" : "flex-col items-center"
        )}
      >
        <div>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="text-balance font-serif text-3xl font-light tracking-[-0.01em] md:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {align === "left" && viewAll}
      </div>
      {align === "center" && viewAllHref && <div className="mt-3">{viewAll}</div>}
    </div>
  )
}
