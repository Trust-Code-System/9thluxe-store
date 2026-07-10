import Link from "next/link"
import { Sparkles, ArrowRight, MessageCircle } from "lucide-react"

export function ConciergeInvitation() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-espresso px-6 py-14 text-center sm:px-12 lg:py-20">
          {/* Ambient amber glow */}
          <div className="amber-glow pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" aria-hidden />

          <div className="relative z-10 mx-auto max-w-xl text-[#f4efe7]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber/15 text-amber">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="mt-6 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
              Not sure where to start?
            </h2>
            <p className="mt-4 leading-relaxed text-[#e6ddcd]/85">
              Describe a mood, a memory or an occasion. The Scent Concierge listens and
              recommends real, in-stock fragrances from our house — no guesswork.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/concierge"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber px-7 text-sm font-medium text-[#1b140f] transition-colors hover:bg-amber/90"
              >
                <MessageCircle className="h-4 w-4" />
                Talk to the Concierge
              </Link>
              <Link
                href="/find-your-fragrance"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#e6ddcd]/25 px-7 text-sm font-medium text-[#f4efe7] transition-colors hover:bg-[#f4efe7]/10"
              >
                Take the quick guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
