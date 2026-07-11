import Link from "next/link"

import Image from "next/image"

import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"



interface CategoryCardProps {

  title: string

  subtitle: string

  image: string

  href: string

  className?: string

}



export function CategoryCard({ title, subtitle, image, href, className }: CategoryCardProps) {

  return (

    <Link

      href={href}

      className={cn(

        "group relative flex flex-col justify-end overflow-hidden rounded-xl aspect-[3/4] md:aspect-[4/5]",

        className,

      )}

    >

      {/* Background Image */}

      <Image

        src={image || "/placeholder-flacon.svg"}

        alt={title}

        fill

        className="object-cover transition-transform duration-700 group-hover:scale-105"

        sizes="(max-width: 768px) 100vw, 33vw"

      />



      {/* Gradient Overlay */}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />



      {/* Content */}

      <div className="relative z-10 p-6 md:p-8">

        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-2">{title}</h3>

        <p className="text-white/80 text-sm mb-4">{subtitle}</p>

        <span className="inline-flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">

          Shop now

          <ArrowRight className="h-4 w-4" />

        </span>

      </div>

    </Link>

  )

}
