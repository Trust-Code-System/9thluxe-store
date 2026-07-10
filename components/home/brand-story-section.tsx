import Image from "next/image"

import Link from "next/link"

import { Button } from "@/components/ui/button"

import { ArrowRight } from "lucide-react"



export function BrandStorySection() {

  return (

    <section className="py-16 lg:py-24">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Image */}

          <div className="relative aspect-[4/3] lg:aspect-square rounded-xl overflow-hidden">

            <Image

              src="/fade-brand-story-atelier.jpg"

              alt="The Fádé story"

              fill

              className="object-cover"

              sizes="(max-width: 1024px) 100vw, 50vw"

            />

          </div>



          {/* Content */}

          <div className="max-w-lg">

            <span className="eyebrow">Our House</span>

            <h2 className="mb-6 mt-3 font-serif text-3xl font-semibold tracking-tight md:text-4xl">The Fádé Story</h2>

            <div className="space-y-4 leading-relaxed text-muted-foreground">

              <p>

                Fádé is a Lagos house built on a simple belief — that a fragrance should feel

                composed, not chosen at random. We curate rare and coveted perfumes from houses

                we trust, and present them with the care they deserve.

              </p>

              <p>

                Our name draws from Yoruba, a nod to bringing something worthwhile to those who

                appreciate it: craftsmanship, provenance, and the quiet confidence of a scent that

                lasts.

              </p>

              <p>

                Every fragrance we carry is sourced deliberately and inspected on arrival, so what

                reaches you is exactly what you expect.

              </p>

            </div>

            <Button asChild variant="outline" className="mt-8 bg-transparent">

              <Link href="/about">

                Learn More About Us

                <ArrowRight className="ml-2 h-4 w-4" />

              </Link>

            </Button>

          </div>

        </div>

      </div>

    </section>

  )

}
