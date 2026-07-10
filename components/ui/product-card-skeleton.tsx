import { cn } from "@/lib/utils"

import { Skeleton } from "@/components/ui/skeleton"



interface ProductCardSkeletonProps {

  className?: string

}



export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {

  return (

    <div className={cn("flex flex-col rounded-xl bg-card border border-border overflow-hidden", className)}>

      <Skeleton className="aspect-square w-full" />

      <div className="flex flex-col gap-2 p-4">

        <Skeleton className="h-3 w-16" />

        <Skeleton className="h-4 w-full" />

        <Skeleton className="h-3 w-24" />

        <Skeleton className="h-5 w-20 mt-1" />

      </div>

    </div>

  )

}



export function ProductGridSkeleton({ count = 8 }: { count?: number }) {

  return (

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

      {Array.from({ length: count }).map((_, i) => (

        <ProductCardSkeleton key={i} />

      ))}

    </div>

  )

}





