import { TrustBadges } from '@/components/TrustBadges'

export function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/30 py-16">
      <div className="container mx-auto max-w-[1200px] px-6">
        <div className="mb-10 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-muted-foreground">Boutique confidence</p>
          <h2 className="text-3xl font-semibold text-foreground font-serif">What our clientele says</h2>
          <p className="text-sm text-muted-foreground">
            Curated collections, quiet luxuries, and thoughtful service keep Fàdè Essence feel intimate and timeless.
          </p>
        </div>
        <TrustBadges />
      </div>
    </section>
  )
}
