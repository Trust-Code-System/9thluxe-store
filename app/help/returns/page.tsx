import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Returns & Exchanges | Fádé",
  description: "Learn about our return and exchange policy.",
}

export default function ReturnsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-4">Returns & Exchanges</h1>
          <p className="text-muted-foreground mb-8">
            We want you to be completely satisfied with your purchase. Learn about our return and exchange policy below.
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Return Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We offer a 14-day return policy for unused items in their original packaging. Items must be in the same
                  condition as when received, with all tags and labels attached.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">To be eligible for a return:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Item must be unused and in original condition</li>
                    <li>Original packaging and tags must be included</li>
                    <li>Return request must be made within 14 days of delivery</li>
                    <li>Proof of purchase is required</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  How to Return an Item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                  <li>Contact our customer service team within 14 days of delivery</li>
                  <li>Provide your order number and reason for return</li>
                  <li>We'll send you a return authorization and shipping label</li>
                  <li>Package the item securely in its original packaging</li>
                  <li>Ship the item back using the provided label</li>
                  <li>Once received and inspected, we'll process your refund</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Eligible Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Unopened perfumes with original seals and packaging</li>
                  <li>Items with manufacturing defects</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Non-Returnable Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Items used or worn</li>
                  <li>Items without original packaging</li>
                  <li>Personalized or customized items</li>
                  <li>Items damaged due to misuse</li>
                  <li>Items returned after 14 days</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Refunds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Refunds will be processed to the original payment method within 5-10 business days after we receive and
                  inspect the returned item. Shipping costs are non-refundable unless the item was defective or incorrect.
                </p>
                <p className="text-sm text-muted-foreground">
                  For exchanges, we'll ship the replacement item once we receive your return. If the replacement item is of
                  higher value, you'll be charged the difference.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button asChild>
                <Link href="/help/contact">Contact Customer Service</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/account/orders">View My Orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

