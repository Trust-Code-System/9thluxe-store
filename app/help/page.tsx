import Link from 'next/link'

export const metadata = {
  title: 'Help Center | Fàdè',
}

export default function HelpPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Help Center</h1>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back to home</span>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 leading-7 text-foreground">
        <p className="text-foreground">Delivery across Nigeria within 1-5 business days, depending on your state.</p>
        <p className="text-foreground">
          Chat / Email: <a href="mailto:Fàdè@gmail.com" className="underline text-foreground hover:text-muted-foreground">Fàdè@gmail.com</a>
        </p>
        <p className="text-foreground">
          Phone / WhatsApp: <a href="tel:+2348160591348" className="underline text-foreground hover:text-muted-foreground">+234 816 059 1348</a>
        </p>
        <p className="text-foreground">
          Hours: <span className="whitespace-nowrap">8am - 9pm</span> WAT, Mon - Sat; <span className="whitespace-nowrap">12pm - 9pm</span> Sun
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/faq" className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted">
          <div className="font-medium text-foreground">FAQ</div>
          <div className="text-sm text-muted-foreground">Common questions about orders, shipping, and returns.</div>
        </Link>

        <a
          href="https://wa.me/2348160591348"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
        >
          <div className="font-medium text-foreground">Message us on WhatsApp</div>
          <div className="text-sm text-muted-foreground">We usually reply within minutes during business hours.</div>
        </a>
      </div>
    </section>
  )
}
