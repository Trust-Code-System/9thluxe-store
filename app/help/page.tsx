import type { Metadata } from "next"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Clock, Truck, MessageCircle, HelpCircle, ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Help Center | Fádé",
  description: "Get help with your orders, shipping, and returns.",
}

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to home
              </Link>
            </Button>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-2">Help Center</h1>
            <p className="text-muted-foreground">We're here to help. Find answers or get in touch with our team.</p>
          </div>

          {/* Contact Information Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3 shrink-0">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Delivery Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Delivery across Nigeria within 1-5 business days, depending on your state.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <a
                        href="mailto:fadeessencee@gmail.com"
                        className="font-medium text-primary hover:underline"
                      >
                        fadeessencee@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone / WhatsApp</p>
                      <a
                        href="tel:+2348160591348"
                        className="font-medium text-primary hover:underline"
                      >
                        +234 8160591348
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Business Hours</p>
                      <p className="font-medium">
                        <span className="whitespace-nowrap">8:00 AM - 8:00 PM</span> WAT, Mon - Sat
                        <br />
                        <span className="whitespace-nowrap">12:00 PM - 9:00 PM</span> Sun
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Help Options */}
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card className="group hover:shadow-md transition-shadow">
              <Link href="/help/faq">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3 shrink-0 group-hover:bg-primary/20 transition-colors">
                      <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">FAQ</h3>
                      <p className="text-sm text-muted-foreground">
                        Common questions about orders, shipping, and returns.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="group hover:shadow-md transition-shadow">
              <a
                href="https://wa.me/2348160591348"
                target="_blank"
                rel="noopener noreferrer"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-500/10 p-3 shrink-0 group-hover:bg-green-500/20 transition-colors">
                      <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        Message us on WhatsApp
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We usually reply within minutes during business hours.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </a>
            </Card>
          </div>

          {/* Additional Help Links */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/help/contact">
                <Mail className="h-4 w-4 mr-2" />
                Contact Us
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/help/shipping">
                <Truck className="h-4 w-4 mr-2" />
                Shipping Info
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/help/returns">
                <HelpCircle className="h-4 w-4 mr-2" />
                Returns
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
