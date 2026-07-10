import { Star } from "lucide-react"

import { cn } from "@/lib/utils"



interface RatingStarsProps {

  rating: number

  reviewCount?: number

  size?: "sm" | "md" | "lg"

  showCount?: boolean

  className?: string

}



const sizeClasses = {

  sm: "h-3 w-3",

  md: "h-4 w-4",

  lg: "h-5 w-5",

}



export function RatingStars({ rating, reviewCount, size = "md", showCount = true, className }: RatingStarsProps) {

  return (

    <div className={cn("flex items-center gap-1.5", className)}>

      <div className="flex items-center gap-0.5">

        {Array.from({ length: 5 }).map((_, i) => (

          <Star

            key={i}

            className={cn(

              sizeClasses[size],

              i < Math.floor(rating) ? "fill-accent text-accent" : "fill-muted text-muted",

            )}

          />

        ))}

      </div>

      {showCount && reviewCount !== undefined && (

        <span className="text-sm text-muted-foreground">

          {rating.toFixed(1)} ({reviewCount})

        </span>

      )}

    </div>

  )

}





