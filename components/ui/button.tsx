"use client"

"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-white",
        secondary: "border border-white/40 text-white hover:border-white hover:text-white focus-visible:ring-white",
        ghost: "bg-transparent text-white hover:text-primary focus-visible:ring-white",
        muted: "bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-primary",
      },
      size: {
        default: "text-xs py-3 px-6",
        lg: "text-sm py-3 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
}
