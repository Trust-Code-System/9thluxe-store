"use client"

import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "muted" | "primary" | "pill"
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  muted: "bg-white/10 text-white",
  primary: "bg-primary/10 text-primary",
  pill: "rounded-full bg-muted/50 text-muted-foreground",
}

export function Badge({ variant = "muted", className, ...props }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em]", variantClasses[variant], className)} {...props} />
  )
}
