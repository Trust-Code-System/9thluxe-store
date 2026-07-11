import { cn } from "@/lib/utils"
import { Flacon } from "@/components/home/flacon"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductCardSkeletonProps {
  className?: string
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary pedestal-light">
        <div className="absolute inset-0 flex items-end justify-center pb-[12%]">
          <Flacon className="h-[58%] w-auto opacity-[0.14]" aria-hidden="true" />
        </div>
        <div className="absolute inset-0 skeleton-shimmer opacity-30" aria-hidden="true" />
      </div>
      <div className="mt-3.5 flex flex-col gap-2.5 border-t border-border/70 pt-3.5">
        <Skeleton className="h-2.5 w-20 rounded-none" />
        <Skeleton className="h-4 w-full max-w-[88%] rounded-none" />
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <Skeleton className="h-3.5 w-24 rounded-none" />
          <Skeleton className="h-3 w-14 rounded-none" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
