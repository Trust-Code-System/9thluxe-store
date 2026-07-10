import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-[600px] px-6 py-24 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-semibold">Order Confirmed!</h1>
          <p className="mb-8 text-base text-muted-foreground">
            Thank you for your purchase. We've received your order and will begin processing it shortly. You'll receive
            a confirmation email with tracking details once your order ships.
          </p>

          <div className="space-y-3">
            <Link href="/" className="block">
              <Button size="lg" className="w-full rounded-xl">
                Continue shopping
              </Button>
            </Link>
            <Link href="/account/orders" className="block">
              <Button variant="outline" size="lg" className="w-full rounded-xl bg-transparent">
                View orders
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Need help? Contact us at{" "}
            <a href="mailto:Fàdè@gmail.com" className="underline hover:text-foreground">
              Fàdè@gmail.com
            </a>{" "}
            or WhatsApp{" "}
            <a href="https://wa.me/2348160591348" className="underline hover:text-foreground">
              +234 816 059 1348
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
