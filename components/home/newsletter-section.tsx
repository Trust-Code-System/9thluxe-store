import { NewsletterForm } from '@/components/newsletter/newsletter-form'

export function NewsletterSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Stay in the Know
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Subscribe to receive exclusive offers, early access to new arrivals, and curated style inspiration.
          </p>
        </div>
        <NewsletterForm />
        <p className="text-center text-xs text-muted-foreground mt-4">
          By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}
