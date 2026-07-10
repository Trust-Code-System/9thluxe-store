import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"



interface SectionHeaderProps {

  title: string

  subtitle?: string

  viewAllHref?: string

  viewAllLabel?: string

  className?: string

  align?: "left" | "center"

}



export function SectionHeader({

  title,

  subtitle,

  viewAllHref,

  viewAllLabel = "View all",

  className,

  align = "left",

}: SectionHeaderProps) {

  return (

    <div className={cn("flex flex-col gap-2 mb-8", align === "center" && "items-center text-center", className)}>

      <div className={cn("flex items-end gap-4", align === "left" ? "justify-between" : "flex-col items-center")}>

        <div>

          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-balance">{title}</h2>

          {subtitle && <p className="mt-2 text-muted-foreground text-sm md:text-base max-w-2xl">{subtitle}</p>}

        </div>

        {viewAllHref && align === "left" && (

          <Link

            href={viewAllHref}

            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap group"

          >

            {viewAllLabel}

            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />

          </Link>

        )}

      </div>

      {viewAllHref && align === "center" && (

        <Link

          href={viewAllHref}

          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mt-2 group"

        >

          {viewAllLabel}

          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />

        </Link>

      )}

    </div>

  )

}





