import { NewsletterForm } from "@/components/ui/newsletter-form"



export function NewsletterSection() {

  return (

    <section className="border-y border-border bg-card py-16 lg:py-24">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-2xl text-center">

          <span className="eyebrow">The Fàdè Letter</span>

          <h2 className="mb-4 mt-3 font-serif text-2xl font-semibold tracking-tight md:text-3xl">Join the atelier list</h2>

          <p className="mb-8 text-muted-foreground">

            Early access to new arrivals and limited drops, plus quiet notes on scent — no noise, just fragrance worth your time.

          </p>

          <NewsletterForm />

          <p className="mt-4 text-xs text-muted-foreground">

            By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.

          </p>

        </div>

      </div>

    </section>

  )

}
